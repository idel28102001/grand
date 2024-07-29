import { MyContext, Texts } from 'src/common/utils';

export const menuKeyboard = () => {
	const allMeets = [
		[{ text: Texts.ADD_REQUEST }, { text: Texts.DELETE_REQUEST }],
		[{ text: Texts.INFO_REQUEST }],
	];
	return {
		reply_markup: {
			keyboard: allMeets,
			resize_keyboard: true,
		},
	};
};

export const telegramMenuUtility = async (ctx: MyContext) => {
	await ctx.reply('Выбери действие', menuKeyboard()).catch(() => undefined);
};
