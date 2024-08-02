import { RequestStore } from './requestStore';
import { KeyboardStore } from './keyboardStore';
import { HTMLParser } from './html-parser';
import { MyContext, MyConversation } from '../utils';
import { Item, ReplyStore } from './replyStore';
import { TrainRequestEntity } from 'src/train-request/entities/train-request.entity';
import { UsersCenterEntity } from 'src/users-center/entities/users.entity';
import { TelegramUpdate } from 'src/telegram/updates/telegram.update';
import { format } from 'date-fns';
import { Cities } from './cities';
import { ru } from 'date-fns/locale';
import { KeyboardOptionsStore } from './keyboardOptionsStore';
import { ConfirmStore } from './confirmStore';

type ItemWithIdx = {
	idx: number;
	data: TrainRequestEntity;
};

export class TrainDeleteStore {
	user: UsersCenterEntity;

	constructor(data?: Partial<TrainRequestEntity>) {
		if (!data) return;
		Object.assign(this, data);
	}

	private firstItems(
		conversation: MyConversation,
		ctx: MyContext,
		telegramStore: TelegramUpdate,
	): Item[] {
		return [
			{
				text: () => 'У вас нет запросов',
				keyboard: () => [],
				justText: true,
				showCondition: (data: { preprocess: TrainRequestEntity[] }) =>
					!data.preprocess.length,
				preprocess: () =>
					conversation.external(() =>
						telegramStore.trainRequestStore.getItemsByUserId(
							ctx.session.user.id,
						),
					),
			},
			{
				text: (data: ItemWithIdx[]) => this.formatText(data, false),
				showCondition: (data: { preprocess: ItemWithIdx[] }) =>
					Boolean(data.preprocess.length),
				callback: (data) => this.setIdToDelete(Number(data.answer)),
				justText: true,
				preprocess: () =>
					conversation
						.external(() =>
							telegramStore.trainRequestStore.getItemsByUserId(
								ctx.session.user.id,
							),
						)
						.then((data) =>
							data.map((data, idx) => ({ data, idx: idx + 1 })),
						)
						.then((data) => {
							this.setTemp(data);
							return data;
						}),
			},
		];
	}

	items(
		conversation: MyConversation,
		ctx: MyContext,
		telegramStore: TelegramUpdate,
	): Item[] {
		return [
			{
				text: () => 'У вас нет запросов',
				keyboard: () => [],
				justText: true,
				showCondition: (data: { preprocess: TrainRequestEntity[] }) =>
					!data.preprocess.length,
				preprocess: () =>
					conversation.external(() =>
						telegramStore.trainRequestStore.getItemsByUserId(
							ctx.session.user.id,
						),
					),
			},
			{
				text: (data: ItemWithIdx[]) => this.getText(data),
				keyboard: (data: ItemWithIdx[]) => this.getIdxOptions(data),
				showCondition: (data: { preprocess: ItemWithIdx[] }) =>
					Boolean(data.preprocess.length),
				callback: (data) => this.setIdToDelete(Number(data.answer)),
				preprocess: () =>
					conversation
						.external(() =>
							telegramStore.trainRequestStore.getItemsByUserId(
								ctx.session.user.id,
							),
						)
						.then((data) =>
							data.map((data, idx) => ({ data, idx: idx + 1 })),
						)
						.then((data) => {
							this.setTemp(data);
							return data;
						}),
			},
			{
				text: () => 'Вы уверены?',
				keyboard: () => this.confirmStore.answerOptions,
			},
			{
				text: () => 'Удаление произошло успешно',
				justText: true,
				middleProcess: () =>
					conversation.external(() => {
						const item = this.getItem();
						return telegramStore.trainRequestStore.delete(
							item.data.id,
						);
					}),
			},
		];
	}

	private idToDelete = -1;
	private temp: ItemWithIdx[] = [];

	getItem() {
		return this.getItemById(this.idToDelete);
	}

	private getItemById(idx: number) {
		return this.temp.find((e) => e.idx === idx);
	}

	setTemp(data: ItemWithIdx[]) {
		this.temp = data;
	}
	setIdToDelete(data: number) {
		this.idToDelete = data;
	}

	getIdxOptions(data: ItemWithIdx[]) {
		return this.keyboardOptinos.convert(
			data.map((e) => e.idx.toString()),
			6,
		);
	}

	private getText(data: ItemWithIdx[]) {
		return `Выберите, что удалить\n\n` + this.formatText(data, true);
	}

	private formatText(data: ItemWithIdx[], isDelete = false) {
		return data.map((e) => this.formatItem(e, isDelete)).join('\n\n');
	}
	private route(data: TrainRequestEntity) {
		const from = this.citiesStore.getCity(data.from);
		const to = this.citiesStore.getCity(data.to);
		return `${from} - ${to}`;
	}

	private getDate(data: TrainRequestEntity) {
		if (!data.specificTime) return this.getCommonDate(data);
		return this.getSpecificDate(data);
	}

	private getCommonDate(data: TrainRequestEntity) {
		return format(data.date, 'd MMMM (cccc)', { locale: ru });
	}

	private getSpecificDate(data: TrainRequestEntity) {
		return format(data.specificTime, 'd MMMM (cccc) HH:mm', { locale: ru });
	}

	private formatParts(
		data: TrainRequestEntity,
		index: number,
		isDelete = false,
		isSended = false,
	) {
		const result = [
			{
				text: 'Маршрут',
				value: this.route(data),
			},
			{
				text: 'Дата',
				value: this.getDate(data),
			},
			{
				text: 'Кол-во пассажиров',
				value: data.minSpots,
			},
			{
				text: 'Типы места',
				value: this.getPlaceType(data),
			},
			{
				text: 'Позиции места',
				value: this.getPlacePosition(data),
			},
		];
		if (isSended) {
			return [
				{ text: 'Появились билеты по вашему запросу', value: '\n' },
				...result,
				{ text: 'Ссылка', value: this.getLink(data) },
			];
		}
		if (isDelete)
			return [
				{
					text: 'Номер',
					value: index,
				},
				...result,
			];
		return result;
	}

	private toBasicDate(data: TrainRequestEntity) {
		return format(data.date, 'dd.MM.yyyy');
	}

	private getLink(data: TrainRequestEntity) {
		const date = this.toBasicDate(data);
		const from = this.citiesStore.getLinkIdByCode(data.from);
		const to = this.citiesStore.getLinkIdByCode(data.to);
		return `https://grandtrain.ru/tickets/${from}-${to}/${date}/`;
	}

	private getPlaceType(data: TrainRequestEntity) {
		return data.placeTypes.join(', ');
	}
	private getPlacePosition(data: TrainRequestEntity) {
		return data.placePositions.join(', ');
	}

	private formatItem(data: ItemWithIdx, isDelete = false): string {
		return this.formatParts(data.data, data.idx, isDelete)
			.map((e) => `${e.text}: ${e.value}`)
			.join('\n');
	}

	formatItemNotify(data: TrainRequestEntity): string {
		return this.formatParts(data, -1, false, true)
			.map((e) => `${e.text}: ${e.value}`)
			.join('\n');
	}

	confirmStore = new ConfirmStore();

	keyboardOptinos = new KeyboardOptionsStore();
	keyboardStore = new KeyboardStore();
	htmlParser = new HTMLParser();
	citiesStore = new Cities();

	requestStore = new RequestStore();
	replyStore = new ReplyStore();

	run(
		conversation: MyConversation,
		ctx: MyContext,
		telegramStore: TelegramUpdate,
	) {
		return this.replyStore.runItems(
			conversation,
			ctx,
			this.items(conversation, ctx, telegramStore),
		);
	}

	runInfo(
		conversation: MyConversation,
		ctx: MyContext,
		telegramStore: TelegramUpdate,
	) {
		return this.replyStore.runItems(
			conversation,
			ctx,
			this.firstItems(conversation, ctx, telegramStore),
		);
	}
}
