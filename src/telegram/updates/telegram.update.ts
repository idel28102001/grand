import { Context } from 'grammy';
import { Ctx, Start, Update } from '@grammyjs/nestjs';
import { ConversationFlavor } from '@grammyjs/conversations';
import { InjectBot } from 'nestjs-telegraf';
import { composer } from '../composers/telegram.composer';

type MyContext = Context & ConversationFlavor;

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot() private readonly bot,
	) {
		bot.use(composer(this));
	}

	@Start()
	async onStart(@Ctx() ctx: MyContext): Promise<void> {
		console.log(123);
		ctx.reply('привет, нах');
	}
}
