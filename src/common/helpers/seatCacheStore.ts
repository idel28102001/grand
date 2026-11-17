import { TrainInfoService } from 'src/train-info/services/train-request.service';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import { ItemType } from './html-parser';
import { RouteSeats, SeatCache } from './seatDetailsStore';
import { TrainInfoStore } from './trainInfoStore';

type Snapshot = {
	/** true = the search numbers changed and a new snapshot was saved. */
	result: boolean;
	data: TrainInfoStore;
};

/**
 * Free seats from the train pages, kept on the search snapshots
 * (train-type-info.freeSeats).
 *
 * They are reused while the search numbers of that train stay the same:
 * then the snapshot is not rewritten and its seats are still valid. When the
 * numbers change, a new snapshot is saved without seats, so the train page
 * is loaded again. The seats do not depend on a request, so every request
 * on the route uses the same cache with its own filter.
 */
export class SeatCacheStore implements SeatCache {
	constructor(
		private readonly snapshots: Snapshot[],
		private readonly service: TrainInfoService,
	) {}

	get(item: ItemType, types: PlaceType[]): RouteSeats | null {
		const snapshot = this.find(item);
		if (!snapshot || snapshot.result) return null;

		const rows = snapshot.data.loaded?.types ?? [];
		const result: RouteSeats = {};
		for (const type of types) {
			const seats = rows.find((e) => e.type === type)?.freeSeats;
			if (!seats) return null;
			result[type] = seats;
		}
		return result;
	}

	async set(item: ItemType, seats: RouteSeats): Promise<void> {
		const snapshot = this.find(item);
		if (!snapshot) return;
		await this.service.saveFreeSeats(snapshot.data, seats);
	}

	private find(item: ItemType): Snapshot | undefined {
		const time = new Date(item.startDate).getTime();
		return this.snapshots.find(
			({ data }) =>
				data.from === item.from &&
				data.to === item.to &&
				data.date.getTime() === time,
		);
	}
}
