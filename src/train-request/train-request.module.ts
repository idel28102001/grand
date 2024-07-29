import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { TrainRequestProvider } from './train-request.provider';
import { TrainRequestTokenEnum } from './enums/tokens/train-request.token.enum';

@Module({
	imports: [DatabaseModule],
	providers: TrainRequestProvider,
	exports: [TrainRequestTokenEnum.TRAIN_REQUEST_SERVICES_TOKEN],
})
export class TrainRequestModule {}
