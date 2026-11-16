import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { TelegramUpdate } from '../updates/telegram.update';
import { MyContext, MyConversation } from '../../common/utils';
import { Bot } from 'grammy';
import { TrainRequestStore } from 'src/common/helpers/trainRequestStore';
import { TrainDeleteStore } from 'src/common/helpers/trainDeleteStore';
import { telegramMenuUtility } from '../utility/telegramMenu.utility';
import { TrainInfoStore } from 'src/common/helpers/trainInfoStore';
import { format } from 'date-fns';
import { SideCacheStore } from 'src/common/helpers/sideCacheStore';

@Injectable()
export class TelegramService {
	constructor(@InjectBot() private readonly bot: Bot) {}

	async createTrainRequest(
		this: TelegramUpdate,
		conversation: MyConversation,
		ctx: MyContext,
	) {
		const trainRequest = new TrainRequestStore({ user: ctx.session.user });
		await trainRequest.run(conversation, ctx, this);
		await this.telegramService.checkOnTickets.call(
			this,
			trainRequest,
			true,
		);

		await telegramMenuUtility(ctx);
	}

	async deleteAll(
		this: TelegramUpdate,
		conversation: MyConversation,
		ctx: MyContext,
	) {
		await conversation.external(() => this.trainRequestStore.deleteAll());
	}

	async deleteTrainRequest(
		this: TelegramUpdate,
		conversation: MyConversation,
		ctx: MyContext,
	) {
		const store = new TrainDeleteStore({ user: ctx.session.user });
		await store.run(conversation, ctx, this);
		await telegramMenuUtility(ctx);
	}

	async infoTrainRequest(
		this: TelegramUpdate,
		conversation: MyConversation,
		ctx: MyContext,
	) {
		const store = new TrainDeleteStore({ user: ctx.session.user });
		await store.runInfo(conversation, ctx, this);
		await telegramMenuUtility(ctx);
	}

	private async checkOnTickets(
		this: TelegramUpdate,
		item: TrainRequestStore,
		isFirstTime = false,
	) {
		const some = new TrainDeleteStore();
		const allItems = await item.getParsed();
		const items = allItems.map(
			(e) => new TrainInfoStore(e, this.trainInfoStore),
		);
		await Promise.all(items.map((e) => e.load()));
		const gettedItems = await Promise.all(
			items.map((e) => e.saveIfDifferent()),
		);

		const withDiffernce = gettedItems.filter((e) => e.result);
		console.log(
			'Есть изменения?',
			Boolean(withDiffernce.length),
			// withDiffernce,
			format(new Date(), 'HH:mm'),
		);

		if (withDiffernce.length || isFirstTime) {
			const result = await item.getAllRightsDetailed(
				allItems,
				new SideCacheStore(gettedItems, this.trainInfoStore),
			);
			console.log('Есть билеты?', Boolean(result.length));
			if (!result.length) return;
			this.bot.api.sendMessage(
				item.entity.user.telegramId,
				some.formatItemNotify(item),
			);
		}
	}

	async startJob(this: TelegramUpdate) {
		const items = await this.trainRequestStore.getAll();
		const converted = items.map((e) => new TrainRequestStore(e));
		for (const item of converted) {
			// One failing request must not stop the others or crash the app.
			try {
				await this.telegramService.checkOnTickets.call(this, item);
			} catch (e) {
				console.error(
					`checkOnTickets failed for request ${item.id}:`,
					e instanceof Error ? e.message : e,
				);
			}

			await new Promise((res) => setTimeout(res, 500));
		}
	}
}
