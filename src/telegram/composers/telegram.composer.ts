import { TelegramUpdate } from '../updates/telegram.update';
import { Composer, Context, session } from 'grammy';
import {
	ConversationFlavor,
	conversations,
	createConversation,
} from '@grammyjs/conversations';
import { SessionFlavor } from '@grammyjs/conversations/out/deps.node';
import { MyContext, SessionData, Texts } from 'src/common/utils';
import { telegramMenuUtility } from '../utility/telegramMenu.utility';
import { Keys } from 'src/common/helpers/keyboardStore';

export const composer = (thisv2: TelegramUpdate) => {
	const composer = new Composer<
		Context & SessionFlavor<SessionData | any> & ConversationFlavor
	>();
	composer.use(
		session({
			initial: () => ({ user: null }),
		}),
	);
	composer.use(async (ctx: MyContext, next) => {
		switch (ctx.chat.type) {
			case 'channel':
			case 'supergroup':
			case 'group': {
				if (!ctx.update.callback_query) {
					return;
				}
			}
		}

		if (!ctx.session.user) {
			const user = await thisv2.usersCenterService.repo.findOne({
				where: { telegramId: ctx.from.id.toString() },
				select: ['id', 'telegramId'],
			});
			if (user) {
				ctx.session.user = user;
			} else {
				const user = await thisv2.usersCenterService.saveToDBUser(
					ctx.from,
				);
				ctx.session.user = user;
			}
		}
		await next();
	});
	composer.use(conversations());
	composer.hears(Keys.CANCEL, async (ctx) => {
		await ctx.conversation.exit();
		await telegramMenuUtility(ctx);
	});
	composer.use(
		createConversation(
			thisv2.telegramService.createTrainRequest.bind(thisv2),
			'create-train-request',
		),
	);

	composer.use(
		createConversation(
			thisv2.telegramService.deleteTrainRequest.bind(thisv2),
			'delete-train-request',
		),
	);

	composer.use(
		createConversation(
			thisv2.telegramService.infoTrainRequest.bind(thisv2),
			'info-train-request',
		),
	);

	setInterval(thisv2.telegramService.startJob.bind(thisv2), 1000 * 60 * 2);

	composer.hears(Texts.INFO_REQUEST, async (ctx) => {
		try {
			await ctx.conversation.enter('info-train-request');
		} catch (e) {
			ctx.reply('Ошибка');
		}
	});

	composer.hears(Texts.ADD_REQUEST, async (ctx) => {
		try {
			await ctx.conversation.enter('create-train-request');
		} catch (e) {
			ctx.reply('Ошибка');
		}
	});

	composer.hears(Texts.DELETE_REQUEST, async (ctx) => {
		try {
			await ctx.conversation.enter('delete-train-request');
		} catch (e) {
			ctx.reply('Ошибка');
		}
	});

	composer.on('message', async (ctx) => {
		if (!ctx.session.conversation) {
			await telegramMenuUtility(ctx);
		}
	});

	return composer;
};
