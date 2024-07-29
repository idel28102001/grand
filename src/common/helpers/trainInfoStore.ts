import { TrainInfoEntity } from 'src/train-info/entities/train-info.entity';
import { ItemType, PlaceTypeItem } from './html-parser';
import { Cities } from './cities';
import { TrainTypeInfoStore } from './trainTypeInfoStore';
import { TrainInfoService } from 'src/train-info/services/train-request.service';
import { TrainTypeInfoEntity } from 'src/train-info/entities/train-type-info.entity';
import { TrainPositionInfoEntity } from 'src/train-info/entities/train-position-info.entity';
import { compareAsc, format } from 'date-fns';
import { ru } from 'date-fns/locale';

export class TrainInfoStore implements TrainInfoEntity {
	to = 0;
	from = 0;
	date = new Date();
	types: TrainTypeInfoStore[] = [];
	createdAt = new Date();
	id = -1;

	citiesStore = new Cities();

	private store: TrainInfoService;

	loaded: TrainInfoEntity | null = null;

	setLoaded(data: TrainInfoEntity | null) {
		this.loaded = data;
	}

	async load() {
		await this.store.getByDate(this).then((e) => {
			this.setLoaded(e ?? null);
		});
	}
	private get isEqual() {
		if (this.loaded == null) return false;
		const isDate = this.dateEqual(this.loaded);
		const isFrom = this.fromEqual(this.loaded);
		const isTo = this.toEqual(this.loaded);
		const isTypes = this.typesEqual(this.loaded);
		return isDate && isFrom && isTo && isTypes;
	}
	private dateEqual(data: TrainInfoEntity) {
		return !compareAsc(this.date, data.date);
	}

	private fromEqual(data: TrainInfoEntity) {
		return this.from === data.from;
	}

	private typesEqual(data: TrainInfoEntity) {
		if (data.types.length !== this.types.length) return false;
		const values = Array.from(
			new Set([...data.types, ...this.types].map((e) => e.type)),
		);

		const result = values.every((type) => {
			const first = this.getType(type, data.types);
			const second = this.getType(type, this.types);
			if (first && second) return this.typeEqual(first, second);
			return false;
		});
		return result;
	}

	private typeEqual(left: TrainTypeInfoEntity, right: TrainTypeInfoEntity) {
		if (left.positions.length !== right.positions.length) return false;
		const values = Array.from(
			new Set(
				[...left.positions, ...right.positions].map((e) => e.position),
			),
		);
		return values.every((position) => {
			const first = this.getPosition(position, left.positions);
			const second = this.getPosition(position, right.positions);
			if (first && second) return this.positionEqual(first, second);
			return false;
		});
	}

	private positionEqual(
		left: TrainPositionInfoEntity,
		right: TrainPositionInfoEntity,
	) {
		return left.spots === right.spots;
	}

	private getType(type: string, data: TrainTypeInfoEntity[]) {
		return data.find((e) => e.type === type);
	}

	private getPosition(position: string, data: TrainPositionInfoEntity[]) {
		return data.find((e) => e.position === position);
	}

	private toEqual(data: TrainInfoEntity) {
		return this.to === data.to;
	}

	async saveIfDifferent(): Promise<{
		result: boolean;
		data: TrainInfoStore;
	}> {
		const result = !this.isEqual;
		if (result) {
			await this.save();
		}
		return { result, data: this };
	}

	private async save() {
		return await this.store.saveByDate(this);
	}

	constructor(data: ItemType, store) {
		this.store = store;
		if (!data) return;
		this.updateData(data);
	}

	private updateData(data: ItemType) {
		this.setTo(data.to);
		this.setFrom(data.from);
		this.updateTypes(data.info);
		this.setDate(new Date(data.startDate));
	}

	private updateTypes(data: PlaceTypeItem[]) {
		this.setTypes(data.map((e) => new TrainTypeInfoStore(e)));
	}

	private setTypes(data: TrainTypeInfoStore[]) {
		this.types = data;
	}

	private setTo(data: number) {
		this.to = data;
	}
	private setFrom(data: number) {
		this.from = data;
	}

	private setDate(data: Date) {
		this.date = data;
	}
}
