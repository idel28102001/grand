import { TrainInfoService } from 'src/train-info/services/train-request.service';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import { ItemType } from './html-parser';
import { SideCache, SideCheck } from './seatDetailsStore';
import { TrainInfoStore } from './trainInfoStore';

type Snapshot = {
	/** true = the search numbers changed and a new snapshot was saved. */
	result: boolean;
	data: TrainInfoStore;
};

/**
 * Side-seat checks kept on the search snapshots (train-position-info).
 *
 * A check is reused while the search numbers of that train stay the same:
 * then the snapshot is not rewritten and its sideSpots/noSideSpots are
 * still valid. When the numbers change, a new snapshot is saved without
 * them, so the train page is loaded again.
 */
export class SideCacheStore implements SideCache {
	constructor(
		private readonly snapshots: Snapshot[],
		private readonly service: TrainInfoService,
	) {}

	get(item: ItemType): SideCheck | null {
		const snapshot = this.find(item);
		if (!snapshot || snapshot.result) return null;

		const seat = snapshot.data.loaded?.types.find(
			(e) => e.type === PlaceType.SEAT,
		);
		if (!seat?.positions.length) return null;

		const rows = seat.positions;
		if (rows.some((e) => e.sideSpots == null || e.noSideSpots == null)) {
			return null;
		}
		return {
			noSide: rows.map((e) => ({
				position: e.position,
				count: e.noSideSpots,
			})),
			side: rows.map((e) => ({
				position: e.position,
				count: e.sideSpots,
			})),
		};
	}

	async set(item: ItemType, check: SideCheck): Promise<void> {
		const snapshot = this.find(item);
		if (!snapshot) return;
		await this.service.saveSideCheck(snapshot.data, check);
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
