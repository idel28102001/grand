import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from '../common/config';
import { NestjsGrammyModule } from '@grammyjs/nestjs';
import { TelegramProvider } from './telegram.provider';
import { TelegramTokenEnum } from './enums/tokens/telegram.token.enum';
import { UsersCenterModule } from 'src/users-center/users-center.module';
import { TrainRequestModule } from 'src/train-request/train-request.module';
import { TrainInfoModule } from 'src/train-info/train-info.module';

@Module({
	imports: [
		ConfigModule.forRoot(),
		DatabaseModule,
		UsersCenterModule,
		TrainRequestModule,
		TrainInfoModule,
		NestjsGrammyModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async () => ({
				token: config.get<string>('TOKEN'),
			}),
			inject: [ConfigService],
		}),
	],
	providers: TelegramProvider,
	exports: [TelegramTokenEnum.TELEGRAM_SERVICES_TOKEN],
})
export class TelegramModule {}
