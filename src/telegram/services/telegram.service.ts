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
		const allItems = await item.fetchParsed();
		// Site did not answer: "no tickets" would be wrong, try next time.
		if (allItems === null) return;

		// The search snapshot is shared by all requests on this route/date.
		// It is not what decides a notification any more; it keeps the
		// side-seat checks (sideSpots/noSideSpots) between runs.
		const items = allItems.map(
			(e) => new TrainInfoStore(e, this.trainInfoStore),
		);
		await Promise.all(items.map((e) => e.load()));
		const snapshots = await Promise.all(
			items.map((e) => e.saveIfDifferent()),
		);

		const result = await item.getAllRightsDetailed(
			allItems,
			new SideCacheStore(snapshots, this.trainInfoStore),
		);

		// Notify each request about its own fitting tickets: only when they
		// differ from what this request was last notified about.
		const signature = item.getSignature(result);
		const changed = isFirstTime || signature !== (item.lastNotified ?? '');
		console.log(
			`Запрос ${item.id}: подходит ${result.length}, изменилось ${changed}`,
			format(new Date(), 'HH:mm'),
		);
		if (!changed) return;

		if (result.length) {
			await this.bot.api.sendMessage(
				item.entity.user.telegramId,
				some.formatItemNotify(item),
			);
		}
		// Remember also "nothing fits", so tickets that come back are reported.
		if (item.id > 0) {
			await this.trainRequestStore.setLastNotified(item.id, signature);
			item.lastNotified = signature;
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
