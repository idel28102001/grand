import { TrainInfoEntity } from 'src/train-info/entities/train-info.entity';
import { PlacePositionItem, PlaceTypeItem } from './html-parser';
import { Cities } from './cities';
import { TrainTypeInfoEntity } from 'src/train-info/entities/train-type-info.entity';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import { TrainPositionInfoStore } from './trainPositionInfoStore';

export class TrainTypeInfoStore implements TrainTypeInfoEntity {
	id: number;
	info: TrainInfoEntity;
	positions: TrainPositionInfoStore[];
	price: number;
	type: PlaceType;

	citiesStore = new Cities();

	constructor(data?: PlaceTypeItem) {
		if (!data) return;
		this.updateData(data);
	}

	private updateData(data: PlaceTypeItem) {
		this.updatePositions(data.places);
		this.setPrice(Number(data.price));
		this.setType(data.type);
	}

	private updatePositions(data: PlacePositionItem[]) {
		this.setPositions(data.map((e) => new TrainPositionInfoStore(e)));
	}

	private setPositions(data: TrainPositionInfoStore[]) {
		this.positions = data;
	}

	private setPrice(data: number) {
		this.price = data;
	}
	private setType(data: PlaceType) {
		this.type = data;
	}
}
