import { TelegramUpdate } from '../updates/telegram.update';
import { Composer, Context, session } from 'grammy';
import {
	ConversationFlavor,
	conversations,
	createConversation, 
} from '@grammyjs/conversations'; 

export const composer = (thisv2: TelegramUpdate) => {
	const composer = new Composer<
		Context  & ConversationFlavor
	>();
	composer.use(
		session(),
	);
	composer.use(conversations());
	// composer.use(
	// 	createConversation( 
	// 		()=>console.log('321321'),
	// 		'start',
	// 	),
	// );
	// composer.hears('start', async (ctx) => {
	// 	try { 
	// 		await ctx.conversation.enter('start');
	// 	} catch (e) {}
	// });

	return composer;
};
