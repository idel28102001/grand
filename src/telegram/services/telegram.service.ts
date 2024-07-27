import {  Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Bot } from 'grammy';

@Injectable()
export class TelegramService { 

	constructor(
		@InjectBot() private readonly bot: Bot,
	) {}

}
 