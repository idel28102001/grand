import { MyContext, MyConversation, prepareReply } from '../utils';

export type Item = {
	text: (preprocess: any) => string;
	preprocess?: () => Promise<any>;
	keyboard?: (data?: any) => { text: string }[][];
	middleProcess?: () => Promise<any>;
	callback?: (data: { answer: any; preprocess: any }) => any;
	children?: Item[];
	justText?: boolean;
	showCondition?: (data: { answer: any; preprocess: any }) => boolean;
};

export class ReplyStore {
	async runItems(
		conversation: MyConversation,
		ctx: MyContext,
		items: Item[] = [],
		lastResult?: any,
	) {
		for (const item of items) {
			const result = await this.runItem(
				conversation,
				ctx,
				item,
				lastResult,
			);
			if (!result) return result;
		}
		return true;
	}

	async runItem(
		conversation: MyConversation,
		ctx: MyContext,
		item: Item,
		lastAnswer?: any,
	) {
		let preprocess: any = undefined;
		if (item.preprocess) {
			preprocess = await item.preprocess();
		}
		if (preprocess === false) return false;

		const show = item.showCondition
			? item.showCondition({ answer: lastAnswer, preprocess })
			: true;
		if (!show) return true;
		if (item.middleProcess) {
			await item.middleProcess();
		}
		let answer = '';
		if (item.justText) {
			await ctx.reply(item.text(preprocess));
		} else {
			answer = await prepareReply({
				conversation,
				ctx,
				text: item.text(preprocess),
				keyboard: item.keyboard?.(preprocess) ?? [],
			});
			item.callback?.({ answer, preprocess });
		}

		return this.runItems(conversation, ctx, item.children, answer);
	}
}
