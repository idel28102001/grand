import { HTMLElement } from 'node-html-parser';
import { parse, addMinutes, addSeconds } from 'date-fns';
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

/** Times on grandtrain.ru are Moscow time (UTC+3, no DST). */
const MSK_OFFSET_SECONDS = 3 * 60 * 60;

/**
 * Parses the train.select ajax.php response.
 *
 * Two kinds of results come in `#trainsForward`, each wrapped in `.train-sort`:
 *  - direct train: the wrapper itself is `.train.train_seats` with
 *    `.train_row_middle`, `.train_timing_dur` and `.seats_item` blocks;
 *  - route with a transfer (`data-flights="bus"` etc.): the wrapper contains
 *    `.route.train__route` with several legs, each a `.train.train_seats`.
 *    A bus leg has only a fixed price (`.train_cost.only_cost`), train legs
 *    have `.seats_item` blocks.
 *
 * For a transfer route the result is a single item from the first departure
 * to the last arrival; seats are what is available on every train leg, price
 * is the sum of all legs (the site's own `data-travel-cost` is computed
 * the same way).
 */
export class HTMLParser {
	parse(data: HTMLElement, props: Props): ItemType[] {
		return this.getItems(data)
			.map((e) => {
				try {
					return this.parseItem(e, props);
				} catch (err) {
					console.warn(
						'HTMLParser: skipped train item:',
						err instanceof Error ? err.message : err,
					);
					return null;
				}
			})
			.filter((e): e is ItemType => e !== null);
	}

	private getItems(data: HTMLElement): HTMLElement[] {
		const list =
			data.querySelector('#trainsForward') ??
			data.querySelector('.form-trains-list .trains__list');
		if (!list) return [];
		return list.childNodes.filter(
			(e): e is HTMLElement =>
				e instanceof HTMLElement && e.classList.contains('train-sort'),
		);
	}

	private parseItem(item: HTMLElement, props: Props): ItemType {
		const legs = this.getLegs(item);
		if (!legs.length) throw new Error('no train legs found');

		const startDate = this.getStartDate(item, legs[0], props.date);
		const endDate = this.getEndDate(item, legs, startDate);

		return {
			from: props.from,
			to: props.to,
			startDate,
			endDate,
			info: this.getInfo(legs),
		};
	}

	/** Direct train → [itself]; route with transfers → every leg in order. */
	private getLegs(item: HTMLElement): HTMLElement[] {
		if (
			item.classList.contains('train_seats') &&
			this.hasChildWithClass(item, 'train_row_middle')
		) {
			return [item];
		}
		return item.querySelectorAll('.train__route .train_seats');
	}

	// ---------- dates ----------

	private getStartDate(
		item: HTMLElement,
		firstLeg: HTMLElement,
		dateString: string,
	): Date {
		const timestamp = Number(item.getAttribute('data-departure-time'));
		if (timestamp) return this.fromMskTimestamp(timestamp);

		const time = this.text(firstLeg.querySelector('.item.dep .time'));
		if (!time) throw new Error('departure time not found');
		const date = parse(
			`${dateString} ${time}`,
			'dd.MM.yyyy HH:mm',
			new Date(),
		);
		if (isNaN(date.getTime())) throw new Error(`bad departure: ${time}`);
		return date;
	}

	private getEndDate(
		item: HTMLElement,
		legs: HTMLElement[],
		startDate: Date,
	): Date {
		const travelTime = Number(item.getAttribute('data-travel-time'));
		if (travelTime) return addSeconds(startDate, travelTime);

		const departure = Number(item.getAttribute('data-departure-time'));
		const arrival = Number(item.getAttribute('data-arrival'));
		if (departure && arrival && arrival > departure) {
			return addSeconds(startDate, arrival - departure);
		}

		// Fallback: sum leg durations from the text ("1 д. 5 ч. 45 м.").
		// Transfer waiting time is not in the text, so this is a lower bound.
		const minutes = legs
			.map((leg) =>
				this.text(
					leg.querySelector('.train_timing_dur .dur') ??
						leg.querySelector('.item.dep .dur'),
				),
			)
			.reduce((acc, dur) => acc + this.toMinutes(dur), 0);
		return addMinutes(startDate, minutes);
	}

	/**
	 * Unix timestamp → Date whose local wall-clock equals Moscow time,
	 * the same thing `parse('dd.MM.yyyy HH:mm')` of the page text gives.
	 */
	private fromMskTimestamp(timestamp: number): Date {
		const msk = new Date((timestamp + MSK_OFFSET_SECONDS) * 1000);
		return new Date(
			msk.getUTCFullYear(),
			msk.getUTCMonth(),
			msk.getUTCDate(),
			msk.getUTCHours(),
			msk.getUTCMinutes(),
		);
	}

	private toMinutes(duration: string): number {
		const days = /(\d+)\s*д\./i.exec(duration)?.[1] ?? 0;
		const hours = /(\d+)\s*ч\./i.exec(duration)?.[1] ?? 0;
		const minutes = /(\d+)\s*м\./i.exec(duration)?.[1] ?? 0;
		return Number(days) * 24 * 60 + Number(hours) * 60 + Number(minutes);
	}

	// ---------- seats & prices ----------

	private getInfo(legs: HTMLElement[]): PlaceTypeItem[] {
		const seated = legs.map((leg) => this.getOptions(leg));
		const trainLegs = seated.filter((options) => options.length);

		// Legs without seat classes (bus) only add their fixed price.
		const fixedCost = legs
			.filter((_, idx) => !seated[idx].length)
			.reduce((acc, leg) => acc + this.getFixedCost(leg), 0);

		if (!trainLegs.length) return [];

		const [first, ...rest] = trainLegs;
		return first
			.map((option) => {
				const sameType = rest.map((options) =>
					options.find((e) => e.type === option.type),
				);
				// Type has to exist on every train leg to be bookable end to end.
				if (sameType.some((e) => !e)) return null;

				const all = [option, ...sameType];
				return {
					type: option.type,
					price: this.round(
						all.reduce((acc, e) => acc + e.price, 0) + fixedCost,
					),
					places: this.intersectPlaces(all.map((e) => e.places)),
				};
			})
			.filter(
				(e): e is PlaceTypeItem => e !== null && e.places.length > 0,
			);
	}

	/** Seats free on every leg: per position, the minimum over legs. */
	private intersectPlaces(legs: PlacePositionItem[][]): PlacePositionItem[] {
		const [first, ...rest] = legs;
		return first
			.map(({ position, count }) => {
				const counts = rest.map(
					(places) =>
						places.find((e) => e.position === position)?.count,
				);
				if (counts.some((e) => e === undefined)) return null;
				return { position, count: Math.min(count, ...counts) };
			})
			.filter((e): e is PlacePositionItem => e !== null);
	}

	private getOptions(leg: HTMLElement): PlaceTypeItem[] {
		return leg
			.querySelectorAll('.seats_item')
			.map((option) => this.getOption(option))
			.filter((e): e is PlaceTypeItem => e !== null);
	}

	private getOption(option: HTMLElement): PlaceTypeItem | null {
		// The first .train_places_name is the full name ("Плацкарт"),
		// the second one is the mobile short name ("Плац").
		const type = this.text(option.querySelector('.train_places_name'));
		const price = this.toPrice(
			this.text(option.querySelector('.train_cost')),
		);
		if (!type || price === null) return null;

		return {
			type: type as PlaceType,
			price,
			places: this.toPlaces(
				this.text(option.querySelector('.train_seats_count')),
			),
		};
	}

	private getFixedCost(leg: HTMLElement): number {
		return this.toPrice(this.text(leg.querySelector('.train_cost'))) ?? 0;
	}

	/** "6 низ, 51 верх" / "6&nbsp;низ, 51&nbsp;верх" → [{6, низ}, {51, верх}] */
	private toPlaces(data: string): PlacePositionItem[] {
		return data
			.split(',')
			.map((e) => /(\d+)\s*(\S+)/.exec(e.trim()))
			.filter((match) => match !== null)
			.map(([, count, position]) => ({
				count: Number(count),
				position: position as PlacePosition,
			}));
	}

	/** "от 4 381,00 ₽" → 4381 */
	private toPrice(data: string): number | null {
		const digits = data.replace(/[^\d,.]/g, '').replace(',', '.');
		if (!digits) return null;
		const value = Number(digits);
		return isNaN(value) ? null : value;
	}

	// ---------- helpers ----------

	private round(value: number): number {
		return Math.round(value * 100) / 100;
	}

	/** Decoded, whitespace-normalised text (handles &nbsp; and raw U+00A0). */
	private text(e: HTMLElement | null | undefined): string {
		if (!e) return '';
		return e.text
			.replace(/&nbsp;/g, ' ')
			.replace(/ /g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	private hasChildWithClass(e: HTMLElement, className: string): boolean {
		return e.childNodes.some(
			(child) =>
				child instanceof HTMLElement &&
				child.classList.contains(className),
		);
	}
}
