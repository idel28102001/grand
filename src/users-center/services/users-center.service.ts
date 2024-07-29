import { Inject, Injectable } from '@nestjs/common';
import { UsersCenterTokenEnum } from '../enums/tokens/users-center.token.enum';
import { Repository } from 'typeorm';
import { UsersCenterEntity } from '../entities/users.entity';
import { User } from '@grammyjs/types';

@Injectable()
export class UsersCenterService {
	constructor(
		@Inject(UsersCenterTokenEnum.USERS_CENTER_REPOSITORY_TOKEN)
		private readonly usersCenterRepo: Repository<UsersCenterEntity>,
	) {}

	get repo() {
		return this.usersCenterRepo;
	}

	async getUser(obj: UsersCenterEntity) {
		return this.repo.findOneBy({ id: obj.id });
	}

	async saveToDBUser(obj: User) {
		const telegramId = obj.id.toString();
		await this.usersCenterRepo
			.createQueryBuilder('U')
			.insert()
			.into(UsersCenterEntity)
			.values({
				telegramId: telegramId,
				firstname: obj.first_name,
				lastname: obj.last_name,
				username: obj.username,
			})
			.orIgnore()
			.execute();
		return this.getByTelegramId(telegramId);
	}

	private getByTelegramId(telegramId: string) {
		return this.usersCenterRepo.findOneBy({ telegramId });
	}
}
