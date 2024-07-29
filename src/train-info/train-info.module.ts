import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TrainInfoTokenEnum } from './enums/tokens/train-info.token.enum';
import { TrainInfoProvider } from './train-info.provider';

@Module({
	imports: [DatabaseModule],
	providers: TrainInfoProvider,
	exports: [TrainInfoTokenEnum.TRAIN_INFO_SERVICES_TOKEN],
})
export class TrainInfoModule {}
