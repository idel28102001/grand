import { Context, SessionFlavor } from 'grammy';
import { Conversation, ConversationFlavor } from '@grammyjs/conversations';
import { KeyboardButton } from '@grammyjs/types/markup';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { UsersCenterEntity } from 'src/users-center/entities/users.entity';

export interface SessionData {
	user: UsersCenterEntity;
}
export type MyConversation = Conversation<MyContext>;
export type MyContext = Context &
	ConversationFlavor &
	SessionFlavor<SessionData>;

export const cities = [
	{ city: 'Москва', code: 19, linkId: 2000000 },
	{ city: 'Симферополь', code: 34, linkId: 2078001 },
	{ city: 'Бахчисарай', code: 1, linkId: 2078895 },
	{ city: 'Уфа', code: 89024, linkId: 2024600 },
];

const chooseV2 = async (other, ctx: MyContext) => {
	await ctx
		.reply('Выберите пункт из предложенных вариантов', other)
		.catch(() => undefined);
};

export const sliceIntoChunks = <T>(
	arr: Array<T>,
	chunkSize: number,
): Array<Array<T>> => {
	const res = [];
	for (let i = 0; i < arr.length; i += chunkSize) {
		const chunk = arr.slice(i, i + chunkSize);
		res.push(chunk);
	}
	return res;
};

const parseKeyboard = (
	keyboard: Array<
		Array<KeyboardButton.CommonButton | KeyboardButton.RequestContactButton>
	>,
) => {
	const words: Array<string> = [];
	keyboard.forEach((keyLvl2) => {
		words.push(...keyLvl2.map((e) => e.text));
	});
	return words;
};

export const prepareNDaysForOther = (allDays: Array<string>) => {
	const withTimes = allDays.map((e) => ({
		text: format(new Date(e), 'd MMMM (cccc)', { locale: ru }),
		date: new Date(e),
	}));
	const words = withTimes.map((e) => e.text);
	return {
		daysForKeyboard: sliceIntoChunks<{ text: string }>(withTimes, 3),
		words,
		withTimes,
	};
};

export const prepareReply = async ({
	ctx,
	conversation,
	text,
	keyboard,
	addToOther = {},
}: {
	ctx: MyContext;
	conversation: MyConversation;
	keyboard: Array<
		Array<KeyboardButton.CommonButton | KeyboardButton.RequestContactButton>
	>;
	text: string;
	addToOther?: Record<any, any>;
}) => {
	const other = {
		...addToOther,
		...{
			reply_markup: {
				keyboard,
				resize_keyboard: true,
				one_time_keyboard: true,
			},
		},
	};
	await ctx.reply(text, other).catch(() => undefined);
	const words = parseKeyboard(keyboard);
	return await conversation.form.select(words, chooseV2.bind(null, other));
};

export enum Texts {
	ADD_REQUEST = 'Добавить запрос',
	DELETE_REQUEST = 'Удалить запрос',
	INFO_REQUEST = 'Посмотреть запросы',
}
