import { addDays } from 'date-fns';
import { prepareNDaysForOther } from '../utils';
import { KeyboardStore } from './keyboardStore';

export class DateStore {
	private keyboardStore = new KeyboardStore();

	private get dates() {
		return new Array(14)
			.fill('')
			.map((_, idx) => addDays(new Date(), idx).toDateString());
	}

	private get getKeyboradsInfo() {
		return prepareNDaysForOther(this.dates);
	}

	get forKeyobard() {
		return this.keyboardStore.addCancel(
			this.getKeyboradsInfo.daysForKeyboard,
		);
	}

	private get getTimes() {
		return this.getKeyboradsInfo.withTimes;
	}

	getDate(data: string) {
		return this.getTimes.find((e) => e.text === data);
	}

	getDateField(data: string) {
		return this.getDate(data).date;
	}
}
