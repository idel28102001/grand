import { PlacePosition } from 'src/train-info/enums/place-position.enum';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import {
	ItemType,
	PlacePositionItem,
	PlaceTypeItem,
	TrainLeg,
} from './html-parser';
import { intersectPlaces, sectionOf } from './place-normalize';
import { RequestStore } from './requestStore';
import { FreeSeat, SeatDetailsParser, TrainSeats } from './seat-details-parser';

/** What a request wants from the seats beyond the search numbers. */
export type SeatFilter = {
	/** Side seats (боковые) do not count. Plackart only. */
	excludeSide: boolean;
	/** Section range, both inclusive; null = all sections. */
	sectionFrom: number | null;
	sectionTo: number | null;
};

/**
 * Free seats of a search result per car class, one list per train leg.
 * Does not depend on a request, so it can be cached on the shared snapshot.
 */
export type RouteSeats = Partial<Record<PlaceType, FreeSeat[][]>>;

/** Where already loaded seats are kept (see SeatCacheStore). */
export interface SeatCache {
	get(item: ItemType, types: PlaceType[]): RouteSeats | null;
	set(item: ItemType, seats: RouteSeats): Promise<void>;
}

/** Classes whose seats the train page lets us filter by section. */
const SECTION_TYPES = [PlaceType.SEAT, PlaceType.COUPE, PlaceType.SV];

/**
 * Recalculates seat counts from the train page(s): without side seats
 * and/or only in a section range.
 *
 * The search page only says "48 низ"; the train page lists every free seat
 * with its number and type ("ниж.бок"). Each train page is ~2 MB, so callers
 * should use this only for results that already passed the cheap filter,
 * and pass a cache so an unchanged result is not loaded twice.
 */
export class SeatDetailsStore {
	private requestStore = new RequestStore();
	private parser = new SeatDetailsParser();

	static hasRange(filter: SeatFilter): boolean {
		return filter.sectionFrom != null || filter.sectionTo != null;
	}

	/** Does this class need the train page for this filter? */
	static needsDetails(type: PlaceType, filter: SeatFilter): boolean {
		if (type === PlaceType.SEAT && filter.excludeSide) return true;
		return (
			SeatDetailsStore.hasRange(filter) && SECTION_TYPES.includes(type)
		);
	}

	/**
	 * Same item with the affected classes recalculated.
	 * Returns null when the train page cannot be loaded: the caller then
	 * cannot check the filter and should not notify.
	 */
	async apply(
		item: ItemType,
		filter: SeatFilter,
		cache?: SeatCache,
	): Promise<ItemType | null> {
		const types = item.info
			.map((e) => e.type)
			.filter((type) => SeatDetailsStore.needsDetails(type, filter));
		if (!types.length) return item;

		let seats = cache?.get(item, types) ?? null;
		if (!seats) {
			seats = await this.load(item);
			if (!seats) return null;
			await cache
				?.set(item, seats)
				.catch((e) =>
					console.warn(
						'SeatDetailsStore: cannot cache seats:',
						e instanceof Error ? e.message : e,
					),
				);
		}

		const info = item.info
			.map((option): PlaceTypeItem => {
				if (!SeatDetailsStore.needsDetails(option.type, filter)) {
					return option;
				}
				const legs = seats[option.type] ?? [];
				const places = legs.length
					? intersectPlaces(
							legs.map((leg) =>
								this.count(leg, option.type, filter),
							),
					  )
					: [];
				return { ...option, places };
			})
			.filter((e) => e.places.some((place) => place.count > 0));
		return { ...item, info };
	}

	/** Free seats per position that pass the filter. */
	count(
		seats: FreeSeat[],
		type: PlaceType,
		filter: SeatFilter,
	): PlacePositionItem[] {
		const from = filter.sectionFrom ?? 1;
		const to = filter.sectionTo ?? Infinity;
		const range = SeatDetailsStore.hasRange(filter);

		const result = new Map<PlacePosition, number>();
		for (const seat of seats) {
			if (filter.excludeSide && type === PlaceType.SEAT && seat.side) {
				continue;
			}
			if (range) {
				const section = sectionOf(type, seat.n);
				if (section == null || section < from || section > to) continue;
			}
			result.set(seat.position, (result.get(seat.position) ?? 0) + 1);
		}
		return [...result].map(([position, count]) => ({ position, count }));
	}

	/** Loads the train page of every train leg. */
	async load(item: ItemType): Promise<RouteSeats | null> {
		if (!item.trainLegs?.length) return null;

		const legs: TrainSeats[] = [];
		for (const leg of item.trainLegs) {
			const seats = await this.loadLeg(leg);
			if (!seats) return null;
			legs.push(seats);
		}

		const result: RouteSeats = {};
		const types = new Set(
			legs.flatMap((e) => Object.keys(e)),
		) as Set<PlaceType>;
		for (const type of types) {
			result[type] = legs.map((leg) => leg[type] ?? []);
		}
		return result;
	}

	private async loadLeg(leg: TrainLeg): Promise<TrainSeats | null> {
		const html = await this.requestStore.getTrainPage(leg);
		if (!html) return null;
		const seats = this.parser.parse(html);
		if (!seats) {
			console.warn(
				`SeatDetailsStore: no seat data for ${leg.train} ${leg.date} ${leg.from}-${leg.to}`,
			);
		}
		return seats;
	}
}
