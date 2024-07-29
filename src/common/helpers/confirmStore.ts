import { KeyboardOptionsStore } from './keyboardOptionsStore';

enum Answer {
	YES = 'Да',
	NO = 'Нет',
}

export class ConfirmStore {
	isYes(data: string): data is Answer.YES {
		return data === Answer.YES;
	}
	private keyboardOptinos = new KeyboardOptionsStore();

	private get answerValues() {
		return Object.values(Answer);
	}

	get answerOptions() {
		return this.keyboardOptinos.convert(this.answerValues);
	}
}
