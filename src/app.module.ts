import { Module } from '@nestjs/common';
import { TelegramModule } from './telegram/telegram.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
	imports: [
		DatabaseModule,
		ConfigModule.forRoot({ isGlobal: true }),
		TelegramModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
