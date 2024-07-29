import { Provider } from '@nestjs/common';

import { TrainInfoTokenEnum } from './enums/tokens/train-info.token.enum';
import { DATABASE_SOURCE_TOKEN } from '../database/databse.constant';
import { DataSource } from 'typeorm';
import { TrainInfoService } from './services/train-request.service';
import { TrainInfoEntity } from './entities/train-info.entity';
import { TrainPositionInfoEntity } from './entities/train-position-info.entity';
import { TrainTypeInfoEntity } from './entities/train-type-info.entity';

export const TrainInfoProvider: Provider[] = [
	{
		provide: TrainInfoTokenEnum.TRAIN_INFO_SERVICES_TOKEN,
		useClass: TrainInfoService,
	},
	{
		provide: TrainInfoTokenEnum.TRAIN_INFO_REPOSITORY_TOKEN,
		inject: [DATABASE_SOURCE_TOKEN],
		useFactory: (dataSource: DataSource) =>
			dataSource.getRepository(TrainInfoEntity),
	},
	{
		provide: TrainInfoTokenEnum.TRAIN_POSITION_INFO_REPOSITORY_TOKEN,
		inject: [DATABASE_SOURCE_TOKEN],
		useFactory: (dataSource: DataSource) =>
			dataSource.getRepository(TrainPositionInfoEntity),
	},
	{
		provide: TrainInfoTokenEnum.TRAIN_TYPE_INFO_REPOSITORY_TOKEN,
		inject: [DATABASE_SOURCE_TOKEN],
		useFactory: (dataSource: DataSource) =>
			dataSource.getRepository(TrainTypeInfoEntity),
	},
];
