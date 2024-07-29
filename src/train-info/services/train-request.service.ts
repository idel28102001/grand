import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TrainInfoTokenEnum } from '../enums/tokens/train-info.token.enum';
import { TrainInfoEntity } from '../entities/train-info.entity';
import { TrainPositionInfoEntity } from '../entities/train-position-info.entity';
import { TrainTypeInfoEntity } from '../entities/train-type-info.entity';
import { TrainInfoStore } from 'src/common/helpers/trainInfoStore';
import { TrainTypeInfoStore } from 'src/common/helpers/trainTypeInfoStore';
import { TrainPositionInfoStore } from 'src/common/helpers/trainPositionInfoStore';

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
