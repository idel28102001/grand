import { Node, HTMLElement } from 'node-html-parser';
import { parse, addMinutes } from 'date-fns';
import { PlacePosition } from 'src/train-info/enums/place-position.enum';
import { PlaceType } from 'src/train-info/enums/place-type.enum';

type Props = {
	date: string;
	from: number;
	to: number;
};

export type PlacePositionItem = {
	count: number;
	position: PlacePosition;
};

export type PlaceTypeItem = {
	price: number;
	places: PlacePositionItem[];
	type: PlaceType;
};

export type ItemType = {
	info: PlaceTypeItem[];
	startDate: Date;
	endDate: Date;
	from: number;
	to: number;
};

export class HTMLParser {
	parse(data: HTMLElement, props: Props): ItemType[] {
		const items = this.getItems(data);
		return items.map((e) => this.parseItem(e, props));
	}

	private getText(data: Node): string {
		return data.childNodes[0].rawText;
	}

	private getChild(e: Node, data: string) {
		return e.childNodes.find((e) => this.isInlcudes(e, data));
	}

	private getDate(data: Node): string {
		return data.childNodes
			.find((e) => this.isInlcudes(e, 'train_timing_row'))
			.childNodes.filter((e) => this.isInlcudes(e, 'item'))
			.find((e) => this.isInlcudes(e, 'dep'))
			.childNodes.find((e) => this.isInlcudes(e, 'date_time'))
			.childNodes.find((e) => this.isInlcudes(e, 'time')).rawText;
	}

	private getDateBody(data: Node) {
		return this.getChild(data, 'train_timing');
	}

	private toMinutes(duration: string) {
		const getTime = new RegExp(
			/((?<days>\d{0,2}) д\. )?((?<hours>\d{0,2}) ч\. )?((?<minutes>\d{0,2}) м\.)?/gim,
		).exec(duration);

		const newGetTime = {
			days: Number(getTime.groups.days ?? 0),
			hours: Number(getTime.groups.hours ?? 0),
			minutes: Number(getTime.groups.minutes ?? 0),
		};
		return (
			newGetTime.days * 24 * 60 +
			newGetTime.hours * 60 +
			newGetTime.minutes
		);
	}

	private getDuration(data: Node) {
		return this.getChild(
			this.getChild(data, 'train_timing_dur'),
			'dur',
		).rawText.trim();
	}

	private getDateInfo(data: Node, dateString: string) {
		const dateBody = this.getDateBody(data);
		const date = this.getDate(dateBody);
		const duration = this.getDuration(dateBody);
		const minutes = this.toMinutes(duration);

		const startDate = parse(
			`${dateString} ${date}`,
			'dd.MM.yyyy HH:mm',
			new Date(),
		);
		const endDate = addMinutes(startDate, minutes);
		return {
			startDate,
			endDate,
		};
	}

	private getOption(data: Node) {
		const places = this.getChild(data, 'train_places');
		const price = this.getChild(data, 'train_cost');
		const priceSum = Number(
			this.getText(price).slice(3, -2).replace(' ', '').replace(',', '.'),
		);

		const type = this.getText(
			this.getChild(places, 'train_places_name'),
		) as PlaceType;
		const counts = this.getText(this.getChild(places, 'train_seats_count'))
			.trim()
			.split(',');

		const countRed: PlacePositionItem[] = counts
			.map((e) => e.split('&nbsp;'))
			.map(([count, position]) => ({
				count: Number(count),
				position: position as PlacePosition,
			}));

		return { price: priceSum, places: countRed, type };
	}

	private getOptions(data: Node): PlaceTypeItem[] {
		const options = this.getChild(data, 'seats').childNodes.filter((e) =>
			this.isInlcudes(e, 'seats_item'),
		);
		return options.map((option) => this.getOption(this.getChild(option, 'seats_item')));
	}

	private parseItem(data: Node, props: Props): ItemType {
		const item = data.childNodes.find((e) =>
			this.isInlcudes(e, 'train_row_middle'),
		);
		const info = this.getOptions(item);
		const infoDate = this.getDateInfo(item, props.date);

		return {
			from: props.from,
			to: props.to,
			...infoDate,
			info,
		};
	}

	private addRawAttrs(e: Node): Node & { rawAttrs: string } {
		return Object.assign(e, { rawAttrs: (e as any).rawAttrs ?? '' });
	}

	private isInlcudes(e: Node, attr: string): boolean {
		return this.addRawAttrs(e).rawAttrs?.includes?.(attr);
	}

	private getItems(data: HTMLElement): Node[] {
		const result = this.getChild(data, 'form-trains-list');
		if (!result) return [];

		return this.getChild(result, 'trains-list')
			.childNodes.find((e) =>
				e.childNodes.some((e) => this.isInlcudes(e, 'trains__acting')),
			)
			.childNodes.find((e) => this.isInlcudes(e, 'trains__acting'))
			.childNodes.find((e) => this.isInlcudes(e, 'trains__list'))
			.childNodes.filter((e) => this.isInlcudes(e, 'train'));
	}
}
