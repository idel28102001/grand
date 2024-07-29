import { PlacePositionItem } from './html-parser';
import { Cities } from './cities';
import { TrainPositionInfoEntity } from 'src/train-info/entities/train-position-info.entity';
import { PlacePosition } from 'src/train-info/enums/place-position.enum';

export class TrainPositionInfoStore implements TrainPositionInfoEntity {
	id = -1;
	position = PlacePosition.BOTTOM;
	spots = 0;
	type: TrainPositionInfoEntity;

	citiesStore = new Cities();

	constructor(data?: PlacePositionItem) {
		if (!data) return;
		this.updateData(data);
	}

	private updateData(data: PlacePositionItem) {
		this.setSpots(data.count);
		this.setPosition(data.position);
	}

	private setSpots(data: number) {
		this.spots = data;
	}
	private setPosition(data: PlacePosition) {
		this.position = data;
	}
}
