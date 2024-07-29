import { Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TrainRequestEntity } from '../entities/train-request.entity';
import { TrainRequestTokenEnum } from '../enums/tokens/train-request.token.enum';
import { TrainRequestStore } from 'src/common/helpers/trainRequestStore';

@Injectable()
export class TrainRequestService {
	constructor(
		@Inject(TrainRequestTokenEnum.TRAIN_REQUEST_REPOSITORY_TOKEN)
		private readonly trainRequestRepo: Repository<TrainRequestEntity>,
	) {}

	get repo() {
		return this.trainRequestRepo;
	}

	delete(id: number) {
		return this.repo.delete(id);
	}

	async getItemsByUserId(id: number) {
		return this.repo.findBy({ user: { id } });
	}

	async getAll() {
		return await this.repo.find();
	}

	private create(data: TrainRequestStore): TrainRequestEntity {
		return this.repo.create({
			date: data.date,
			from: data.from,
			to: data.to,
			minSpots: data.minSpots,
			placePositions: data.placePositions,
			placeTypes: data.placeTypes,
			specificTime: data.specificTime,
			user: data.user,
		});
	}

	save(data: TrainRequestStore) {
		const result = this.create(data);
		return this.repo.save(result);
	}
}
