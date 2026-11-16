import { PlaceType } from 'src/train-info/enums/place-type.enum';
import {
	ItemType,
	PlacePositionItem,
	PlaceTypeItem,
	TrainLeg,
} from './html-parser';
import { intersectPlaces } from './place-normalize';
import { RequestStore } from './requestStore';
import { SeatDetailsParser, SeatDetails } from './seat-details-parser';

/**
 * Plackart seats of one search result, split by the train page(s).
 * For a route with several train legs: `noSide` is what is free on every
 * leg, `side` is the largest count over the legs.
 */
export type SideCheck = {
	noSide: PlacePositionItem[];
	side: PlacePositionItem[];
};

/** Where already known side checks are kept (see SideCacheStore). */
export interface SideCache {
	get(item: ItemType): SideCheck | null;
	set(item: ItemType, check: SideCheck): Promise<void>;
}

/**
 * Tells regular plackart seats from side ones (боковые).
 *
 * The search page only says "48 низ"; the train page says whether these are
 * regular or side seats ("ниж.бок"). Each train page is ~2 MB, so callers
 * should use this only for results that already passed the cheap filter,
 * and pass a cache so an unchanged result is not loaded twice.
 */
export class SeatDetailsStore {
	private requestStore = new RequestStore();
	private parser = new SeatDetailsParser();

	/**
	 * Same item with plackart recalculated without side seats.
	 * Returns null when the seat details cannot be loaded: the caller then
	 * cannot tell side seats apart and should not notify.
	 */
	async withoutSide(
		item: ItemType,
		cache?: SideCache,
	): Promise<ItemType | null> {
		// Nothing to check: no plackart → no side seats.
		if (!item.info.some((e) => e.type === PlaceType.SEAT)) return item;

		let check = cache?.get(item) ?? null;
		if (!check) {
			check = await this.check(item);
			if (!check) return null;
			await cache
				?.set(item, check)
				.catch((e) =>
					console.warn(
						'SeatDetailsStore: cannot cache side check:',
						e instanceof Error ? e.message : e,
					),
				);
		}
		return this.apply(item, check);
	}

	/** Loads the train page of every train leg and splits plackart seats. */
	async check(item: ItemType): Promise<SideCheck | null> {
		if (!item.trainLegs?.length) return null;

		const legs: SeatDetails[] = [];
		for (const leg of item.trainLegs) {
			const details = await this.load(leg);
			if (!details) return null;
			legs.push(details);
		}

		const noSide = legs.map(
			(leg) =>
				leg.noSide.find((e) => e.type === PlaceType.SEAT)?.places ?? [],
		);
		const side = legs.map(
			(leg) =>
				leg.side.find((e) => e.type === PlaceType.SEAT)?.places ?? [],
		);
		return {
			noSide: intersectPlaces(noSide),
			side: this.maxPlaces(side),
		};
	}

	/**
	 * Plackart gets the regular seats only. Other classes keep the search
	 * numbers: side seats exist only in plackart, and their train-page labels
	 * differ ("Купе" for a whole lux compartment).
	 */
	apply(item: ItemType, check: SideCheck): ItemType {
		const info = item.info
			.map(
				(option): PlaceTypeItem =>
					option.type === PlaceType.SEAT
						? { ...option, places: check.noSide }
						: option,
			)
			.filter((e) => e.places.some((place) => place.count > 0));
		return { ...item, info };
	}

	private maxPlaces(legs: PlacePositionItem[][]): PlacePositionItem[] {
		const result = new Map<PlacePositionItem['position'], number>();
		for (const places of legs) {
			for (const { position, count } of places) {
				result.set(
					position,
					Math.max(result.get(position) ?? 0, count),
				);
			}
		}
		return [...result].map(([position, count]) => ({ position, count }));
	}

	private async load(leg: TrainLeg): Promise<SeatDetails | null> {
		const html = await this.requestStore.getTrainPage(leg);
		if (!html) return null;
		const details = this.parser.parse(html);
		if (!details) {
			console.warn(
				`SeatDetailsStore: no seat data for ${leg.train} ${leg.date} ${leg.from}-${leg.to}`,
			);
		}
		return details;
	}
}
