import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from '../common/config';
import { NestjsGrammyModule } from '@grammyjs/nestjs';
import { TelegramProvider } from './telegram.provider';
import { TelegramTokenEnum } from './enums/tokens/telegram.token.enum';

@Module({
	imports: [
		ConfigModule.forRoot(), 
		DatabaseModule,
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
