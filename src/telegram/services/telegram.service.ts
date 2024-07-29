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
			const result = item.getAllRights(allItems);
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
			await this.telegramService.checkOnTickets.call(this, item);

			await new Promise((res) => setTimeout(res, 500));
		}
	}
}
