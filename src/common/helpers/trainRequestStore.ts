import { TrainRequestEntity } from 'src/train-request/entities/train-request.entity';
import { UsersCenterEntity } from 'src/users-center/entities/users.entity';
import { KeyboardOptionsStore } from './keyboardOptionsStore';
import { parse as htmlParser } from 'node-html-parser';
import { compareAsc, format, parse } from 'date-fns';
import { DateStore } from './dateStore';
import { Cities } from './cities';
import { RequestStore } from './requestStore';
import { KeyboardStore } from './keyboardStore';
import { HTMLParser, PlaceTypeItem, ItemType } from './html-parser';
import { MyContext, MyConversation } from '../utils';
import { Item, ReplyStore } from './replyStore';
import { ConfirmStore } from './confirmStore';
import { SeatCache, SeatDetailsStore, SeatFilter } from './seatDetailsStore';
import { SECTIONS_COUNT } from './place-normalize';
import { TelegramUpdate } from 'src/telegram/updates/telegram.update';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import { PlacePosition } from 'src/train-info/enums/place-position.enum';

enum Options {
	ANY = 'Любое',
}

export class TrainRequestStore implements TrainRequestEntity {
	private getInfo() {
		return this.requestStore.get(this);
	}

	getParsedInfo(data: ItemType[]) {
		if (!this.specificTime) return data;
		return data.filter(
			(e) => !compareAsc(e.startDate, new Date(this.specificTime)),
		);
	}

	getAllRights(data: ItemType[]) {
		const result = this.getParsedInfo(data);
		const items = result.filter((e) => this.filterItem(e));
		return items;
	}

	get seatFilter(): SeatFilter {
		return {
			excludeSide: this.excludeSide,
			sectionFrom: this.sectionFrom,
			sectionTo: this.sectionTo,
		};
	}

	/**
	 * Like getAllRights, but also checks the train pages when the request
	 * excludes side seats or limits sections: the search only says
	 * "48 низ", not which seats these are. Train pages are loaded only for
	 * results that passed the cheap filter and only fit through a class
	 * that needs the check.
	 */
	async getAllRightsDetailed(
		data: ItemType[],
		cache?: SeatCache,
	): Promise<ItemType[]> {
		const items = this.getAllRights(data);
		const filter = this.seatFilter;
		const needsDetails = (type: PlaceType) =>
			SeatDetailsStore.needsDetails(type, filter);
		if (!this.placeTypes.some(needsDetails)) return items;

		const result: ItemType[] = [];
		for (const item of items) {
			// Already fits by a class that needs no check → no need to load
			// a ~2 MB train page.
			const fitsWithoutDetails = item.info.some(
				(e) => !needsDetails(e.type) && this.filterInfoItem(e),
			);
			if (fitsWithoutDetails) {
				// The other classes are not checked: leave them out instead
				// of reporting seats that may not fit the filter.
				result.push({
					...item,
					info: item.info.filter((e) => !needsDetails(e.type)),
				});
				continue;
			}
			const detailed = await this.seatDetailsStore.apply(
				item,
				filter,
				cache,
			);
			if (detailed && this.filterItem(detailed)) result.push(detailed);
		}
		return result;
	}

	private filterTypes(data: PlaceTypeItem) {
		return this.placeTypes.includes(data.type as PlaceType);
	}

	private filterInfoItem(data: PlaceTypeItem) {
		const first = this.filterTypes(data);
		const second = this.filterPositions(data);
		return first && second;
	}

	private filterPositions(data: PlaceTypeItem) {
		return (
			data.places
				.filter((item) => this.placePositions.includes(item.position))
				.reduce((acc, curr) => acc + curr.count, 0) >= this.minSpots
		);
	}

	private filterItem(data: ItemType) {
		return data.info.some((e) => this.filterInfoItem(e));
	}

	/**
	 * What fits this request, as a stable string: departure, class and the
	 * seat counts of the chosen positions. Prices and classes that do not
	 * fit are left out, so they do not trigger a notification.
	 */
	getSignature(data: ItemType[]): string {
		return data
			.map((item) => {
				const options = item.info
					.filter((e) => this.filterInfoItem(e))
					.map((option) => {
						const places = option.places
							.filter((e) =>
								this.placePositions.includes(e.position),
							)
							.map((e) => `${e.position}=${e.count}`)
							.sort()
							.join(',');
						return `${option.type}:${places}`;
					})
					.sort()
					.join('|');
				return `${new Date(item.startDate).toISOString()}#${options}`;
			})
			.sort()
			.join(';');
	}

	async getParsed() {
		return (await this.fetchParsed()) ?? [];
	}

	/** Parsed search results; null when the site did not answer. */
	async fetchParsed(): Promise<ItemType[] | null> {
		const data = await this.getInfo();
		if (!data) return null;
		const root = htmlParser(data);
		return this.htmlParser.parse(root, {
			date: this.formatttedDate,
			from: this.from,
			to: this.to,
		});
	}

	items(
		conversation: MyConversation,
		ctx: MyContext,
		store: TelegramUpdate,
	): Item[] {
		return [
			{
				text: () => 'Откуда поедете',
				keyboard: () => this.citiesStore.keyboardOptions,
				callback: (data) => this.updateFrom(data.answer),
			},
			{
				text: () => 'Куда поедете',
				keyboard: () =>
					this.citiesStore.remainsKeyboardOptions(this.from),
				callback: (data) => this.updateTo(data.answer),
			},
			{
				text: () => 'Выберите период даты',
				keyboard: () => this.dateStore.forRange,
				callback: (data) => this.updateRange(data.answer),
			},
			{
				text: () => 'Выберите дату',
				keyboard: () => this.dateStore.forKeyobard(this.range),
				callback: (data) => this.updateDate(data.answer),
			},
			{
				text: () => 'Выберите тип места',
				keyboard: () => this.placeTypeOptions,
				callback: (data) => this.updatePlaceType(data.answer),
			},
			{
				text: () => 'Выберите место',
				keyboard: () => this.placePositionOptions,
				callback: (data) => this.updatePlacePosition(data.answer),
			},
			{
				text: () => 'Боковые места подходят?',
				keyboard: () => this.confirmStore.answerOptions,
				// Side seats exist only in plackart cars.
				showCondition: () => this.placeTypes.includes(PlaceType.SEAT),
				callback: (data) =>
					this.setExcludeSide(!this.confirmStore.isYes(data.answer)),
			},
			{
				text: () =>
					`Искать во всех секциях вагона (1–${SECTIONS_COUNT})?\n` +
					'Секции 1 и 9 — у туалетов.',
				keyboard: () => this.confirmStore.answerOptions,
				// Sections are known for plackart, coupe and SV cars.
				showCondition: () =>
					[PlaceType.SEAT, PlaceType.COUPE, PlaceType.SV].some((e) =>
						this.placeTypes.includes(e),
					),
				callback: (data) => {
					if (this.confirmStore.isYes(data.answer)) {
						this.setSections(null, null);
					}
				},
				children: [
					{
						text: () => 'С какой секции искать?',
						keyboard: () => this.sectionOptions(1),
						showCondition: ({ answer }) =>
							!this.confirmStore.isYes(answer),
						callback: (data) =>
							this.setSections(this.toSection(data.answer), null),
					},
					{
						text: () => 'По какую секцию искать?',
						keyboard: () =>
							this.sectionOptions(this.sectionFrom ?? 1),
						showCondition: ({ answer }) =>
							!this.confirmStore.isYes(answer),
						callback: (data) =>
							this.setSections(
								this.sectionFrom,
								this.toSection(data.answer),
							),
					},
				],
			},
			{
				text: () => 'Укажите кол-во пассажиров',
				keyboard: () => this.minSpotsOptions,
				callback: (data) => this.updateMinSpot(data.answer),
			},
			{
				text: () => 'Выбрать на определённое время?',
				keyboard: () => this.confirmStore.answerOptions,
				callback: () => undefined,
				children: [
					{
						text: () => 'Выберете время',
						keyboard: (data) =>
							this.getTimeOptions(data.map((e) => e.startDate)),
						preprocess: async () => {
							const result = await conversation.external(() =>
								this.getParsed(),
							);
							if (!result.length) {
								ctx.reply('Рейсов не найдено');
								return false;
							}
							return result;
						},
						showCondition: ({ answer }) =>
							this.confirmStore.isYes(answer),
						callback: (data) =>
							this.updateSpecificTime(data.answer),
					},
				],
			},
			{
				text: () => 'Запрос добавлен',
				justText: true,
				middleProcess: async () => {
					const id = await conversation.external(() =>
						store.trainRequestStore.save(this).then((e) => e.id),
					);
					// Needed to store what the first check notified about.
					this.id = id;
				},
			},
		];
	}

	keyboardStore = new KeyboardStore();
	htmlParser = new HTMLParser();
	seatDetailsStore = new SeatDetailsStore();

	requestStore = new RequestStore();
	replyStore = new ReplyStore();

	run(conversation: MyConversation, ctx: MyContext, store: TelegramUpdate) {
		return this.replyStore.runItems(
			conversation,
			ctx,
			this.items(conversation, ctx, store),
		);
	}

	constructor(data?: Partial<TrainRequestEntity>) {
		if (!data) return;
		Object.assign(this, data);
		this.entity = data as TrainRequestEntity;
	}

	entity = new TrainRequestEntity();

	setUser(user: UsersCenterEntity) {
		this.user = user;
	}

	keyboardOptinos = new KeyboardOptionsStore();

	getTimeOptions(data: Date[]) {
		return this.keyboardOptinos.convert(this.getTimes(data), 4);
	}

	private getTimes(data: Date[]) {
		return data.map(this.getTime);
	}

	private getTime(data: Date) {
		return format(data, 'HH:mm');
	}

	createdAt = new Date();
	id = -1;
	date = new Date();
	from = -1;
	to = -1;
	minSpots = 1;
	placePositions = [PlacePosition.TOP, PlacePosition.BOTTOM];
	placeTypes = [PlaceType.COUPE, PlaceType.SEAT];
	specificTime = null;
	excludeSide = false;
	lastNotified: string | null = null;
	user: UsersCenterEntity;

	private setExcludeSide(data: boolean) {
		this.excludeSide = data;
	}

	sectionFrom: number | null = null;
	sectionTo: number | null = null;

	/** null, null = all sections. "По какую" below "с какой" is swapped. */
	private setSections(from: number | null, to: number | null) {
		if (from != null && to != null && to < from) [from, to] = [to, from];
		this.sectionFrom = from;
		this.sectionTo = to;
	}

	private toSection(answer: string): number | null {
		const value = Number(answer);
		if (!Number.isInteger(value)) return null;
		if (value < 1 || value > SECTIONS_COUNT) return null;
		return value;
	}

	private sectionOptions(from: number) {
		const values = [];
		for (let i = from; i <= SECTIONS_COUNT; i++) values.push(String(i));
		return this.keyboardOptinos.convert(values, 5);
	}

	private range = '';

	get minSpotValues() {
		return new Array(4).fill('').map((_, idx) => (idx + 1).toString());
	}

	updateMinSpot(data: string) {
		this.setMinSpots(Number(data));
	}

	get minSpotsOptions() {
		return this.keyboardOptinos.convert(
			this.preprocess(this.minSpotValues, false),
			4,
		);
	}

	private setMinSpots(data: number) {
		this.minSpots = data;
	}

	get formatttedDate() {
		return format(this.date, 'dd.MM.yyyy');
	}

	private get placePositionsValues() {
		return Object.values(PlacePosition);
	}

	private get placeTypeValues() {
		return [PlaceType.COUPE, PlaceType.SEAT];
	}

	private get allOptinos() {
		return Options.ANY;
	}

	private addAllOptions(data: string[]) {
		return data.concat(this.allOptinos);
	}

	private isAllOptions(data: string): data is Options.ANY {
		return data === Options.ANY;
	}

	private preprocess(data: string[], addExtra = true) {
		if (!addExtra) return data;
		return this.addAllOptions(data);
	}

	get placePositionOptions() {
		return this.keyboardOptinos.convert(
			this.preprocess(this.placePositionsValues),
		);
	}

	get placeTypeOptions() {
		return this.keyboardOptinos.convert(
			this.preprocess(this.placeTypeValues),
		);
	}

	confirmStore = new ConfirmStore();

	dateStore = new DateStore();

	citiesStore = new Cities();

	updateFrom(data: string) {
		this.setFrom(this.citiesStore.getCode(data));
	}
	updateTo(data: string) {
		this.setTo(this.citiesStore.getCode(data));
	}

	private setFrom(data: number) {
		this.from = data;
	}
	private setTo(data: number) {
		this.to = data;
	}
	private setDate(data: Date) {
		this.date = data;
	}
	private setRange(data: string) {
		this.range = data;
	}

	updateDate(data: string) {
		this.setDate(this.dateStore.getDateField(data));
	}

	private updateRange(data: string) {
		this.setRange(data);
	}

	private setAllPlacePositions() {
		this.setPlacePositions(this.placePositionsValues);
	}

	private setAllPlaceTypes() {
		this.setPlaceTypes(this.placeTypeValues);
	}

	updatePlacePosition(data: string) {
		this.updatePlacePositions(data as PlacePosition);
	}

	private updatePlacePositions(data: PlacePosition | Options.ANY) {
		if (this.isAllOptions(data)) return this.setAllPlacePositions();
		return this.setPlacePosition(data);
	}

	updatePlaceType(data: string) {
		this.updatePlaceTypes(data as PlaceType);
	}

	private updatePlaceTypes(data: PlaceType | Options.ANY) {
		if (this.isAllOptions(data)) return this.setAllPlaceTypes();
		return this.setPlaceType(data);
	}

	private setPlacePosition(data: PlacePosition) {
		this.setPlacePositions([data]);
	}

	private setPlaceType(data: PlaceType) {
		this.setPlaceTypes([data]);
	}

	setPlacePositions(data: PlacePosition[]) {
		this.placePositions = data;
	}
	setPlaceTypes(data: PlaceType[]) {
		this.placeTypes = data;
	}

	updateSpecificTime(data: string) {
		const date = parse(data, 'HH:mm', new Date(this.date));
		this.setSpecificTime(date);
	}

	private setSpecificTime(data: Date) {
		this.specificTime = data;
	}
}
