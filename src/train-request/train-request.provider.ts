import { Provider } from '@nestjs/common';
import { TrainRequestService } from './services/train-request.service';
import { TrainRequestTokenEnum } from './enums/tokens/train-request.token.enum';
import { TrainRequestEntity } from './entities/train-request.entity';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';

export const TrainRequestProvider: Provider[] = [
	{
		provide: TrainRequestTokenEnum.TRAIN_REQUEST_SERVICES_TOKEN,
		useClass: TrainRequestService,
	},
	{
		provide: TrainRequestTokenEnum.TRAIN_REQUEST_REPOSITORY_TOKEN,
		inject: [DATABASE_SOURCE_TOKEN],
		useFactory: (dataSource: DataSource) =>
			dataSource.getRepository(TrainRequestEntity),
	},
];
