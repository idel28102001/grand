import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TrainInfoTokenEnum } from '../enums/tokens/train-info.token.enum';
import { TrainInfoEntity } from '../entities/train-info.entity';
import { TrainPositionInfoEntity } from '../entities/train-position-info.entity';
import { TrainTypeInfoEntity } from '../entities/train-type-info.entity';
import { TrainInfoStore } from 'src/common/helpers/trainInfoStore';
import { TrainTypeInfoStore } from 'src/common/helpers/trainTypeInfoStore';
import { TrainPositionInfoStore } from 'src/common/helpers/trainPositionInfoStore';
import type { SideCheck } from 'src/common/helpers/seatDetailsStore';
import { PlaceType } from '../enums/place-type.enum';
import { PlacePosition } from '../enums/place-position.enum';

@Injectable()
export class TrainInfoService {
	constructor(
		@Inject(TrainInfoTokenEnum.TRAIN_INFO_REPOSITORY_TOKEN)
		private readonly trainInfoRepo: Repository<TrainInfoEntity>,
		@Inject(TrainInfoTokenEnum.TRAIN_TYPE_INFO_REPOSITORY_TOKEN)
		private readonly trainTypeRepo: Repository<TrainTypeInfoEntity>,
		@Inject(TrainInfoTokenEnum.TRAIN_POSITION_INFO_REPOSITORY_TOKEN)
		private readonly trainPositionInfoRepo: Repository<TrainPositionInfoEntity>,
	) {}

	get repo() {
		return this.trainInfoRepo;
	}

	delete(id: number) {
		return this.repo.delete(id);
	}

	getAll() {
		return this.repo.find();
	}
	private createTypes(data: TrainTypeInfoStore[]): TrainTypeInfoEntity[] {
		return data.map((e) => this.createType(e));
	}

	private createType(data: TrainTypeInfoStore): TrainTypeInfoEntity {
		return this.trainTypeRepo.create({
			type: data.type,
			price: data.price,
			positions: this.createPositions(data.positions),
		});
	}

	private createPositions(
		data: TrainPositionInfoStore[],
	): TrainPositionInfoEntity[] {
		return data.map((e) => this.createPosition(e));
	}

	private createPosition(
		data: TrainPositionInfoStore,
	): TrainPositionInfoEntity {
		return this.trainPositionInfoRepo.create({
			position: data.position,
			spots: data.spots,
		});
	}

	getByDates(data: TrainInfoStore[]) {
		return Promise.all(data.map((e) => this.getByDate(e))).then((e) =>
			e.filter((e) => e),
		);
	}

	async getByDate(data: TrainInfoStore): Promise<TrainInfoEntity> {
		return await this.repo.findOneBy({
			date: data.date,
			from: data.from,
			to: data.to,
		});
	}

	async getBody(data: TrainInfoStore) {
		const result = await this.getByDate(data);
		if (result) return result;
		return this.create(data);
	}

	async saveByDate(data: TrainInfoStore): Promise<void> {
		const result = await this.getBody(data);
		Object.assign(result, { types: this.createTypes(data.types) });
		await this.repo.save(result);
	}

	/**
	 * Stores the side-seat check on the plackart rows of the current snapshot.
	 * Only positions the search reported are kept.
	 */
	async saveSideCheck(data: TrainInfoStore, check: SideCheck): Promise<void> {
		const info = await this.getByDate(data);
		const seat = info?.types.find((e) => e.type === PlaceType.SEAT);
		if (!seat?.positions.length) return;

		const count = (places: SideCheck['side'], position: PlacePosition) =>
			places.find((e) => e.position === position)?.count ?? 0;
		for (const row of seat.positions) {
			row.sideSpots = count(check.side, row.position);
			row.noSideSpots = count(check.noSide, row.position);
		}
		await this.trainPositionInfoRepo.save(seat.positions);
	}

	create(data: TrainInfoStore): TrainInfoEntity {
		return this.repo.create({
			types: this.createTypes(data.types),
			date: data.date,
			from: data.from,
			to: data.to,
		});
	}

	save(data: TrainInfoStore) {
		const result = this.create(data);
		return this.repo.save(result);
	}
}
