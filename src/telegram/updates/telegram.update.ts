import { Ctx, Start, Update } from '@grammyjs/nestjs';
import { InjectBot } from 'nestjs-telegraf';
import { Inject } from '@nestjs/common';
import { TelegramTokenEnum } from '../enums/tokens/telegram.token.enum';
import { TelegramService } from '../services/telegram.service';
import { composer } from '../composers/telegram.composer';
import { UsersCenterTokenEnum } from 'src/users-center/enums/tokens/users-center.token.enum';
import { UsersCenterService } from 'src/users-center/services/users-center.service';
import { TrainRequestTokenEnum } from 'src/train-request/enums/tokens/train-request.token.enum';
import { TrainRequestService } from 'src/train-request/services/train-request.service';
import { TrainInfoTokenEnum } from 'src/train-info/enums/tokens/train-info.token.enum';
import { TrainInfoService } from 'src/train-info/services/train-request.service';
import { Bot } from 'grammy';
import { MyContext, SessionData } from 'src/common/utils';
import { Context } from 'grammy';
import { ConversationFlavor } from '@grammyjs/conversations';
import { SessionFlavor } from '@grammyjs/conversations/out/deps.node';

@Update()
export class TelegramUpdate {
	constructor(
		@InjectBot()
		readonly bot: Bot<
			Context & SessionFlavor<SessionData | any> & ConversationFlavor
		>,
		@Inject(TelegramTokenEnum.TELEGRAM_SERVICES_TOKEN)
		readonly telegramService: TelegramService,
		@Inject(UsersCenterTokenEnum.USERS_CENTER_SERVICES_TOKEN)
		readonly usersCenterService: UsersCenterService,
		@Inject(TrainRequestTokenEnum.TRAIN_REQUEST_SERVICES_TOKEN)
		readonly trainRequestStore: TrainRequestService,
		@Inject(TrainInfoTokenEnum.TRAIN_INFO_SERVICES_TOKEN)
		readonly trainInfoStore: TrainInfoService,
	) {
		bot.use(composer(this));
	}

	@Start()
	async onStart(@Ctx() ctx: MyContext): Promise<void> {
		ctx.reply('чё нах');
	}
}
