import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersCenterModule } from './users-center/users-center.module';
import { TrainRequestModule } from './train-request/train-request.module';
import { TrainInfoModule } from './train-info/train-info.module';

@Module({
	imports: [
		DatabaseModule,
		ConfigModule.forRoot({ isGlobal: true }),
		TelegramModule,
		UsersCenterModule,
		TrainRequestModule,
		TrainInfoModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
