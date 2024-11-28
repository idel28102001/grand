import { addDays, addYears, compareAsc, differenceInDays, parse } from 'date-fns';
import { prepareNDaysForOther, prepareNRangeForOther } from '../utils';
import { KeyboardStore } from './keyboardStore';
import { ru } from 'date-fns/locale';

export class DateStore {
	private keyboardStore = new KeyboardStore();

	private dates(dateInfo:string) {
		const [start, end] = dateInfo.split(' - ');
		const startDate = parse(start, 'd MMMM', new Date(),{ locale: ru });
		let endDate = parse(end, 'd MMMM', new Date(),{ locale: ru });
		if (compareAsc(startDate, endDate)===1) {
			endDate = addYears(endDate, 1);
		}
		const diff = differenceInDays(endDate, startDate)+1;
		return new Array(diff)
			.fill('')
			.map((_, idx) => addDays(startDate, idx).toDateString());
	}

	private get rangeDates() {
		return new Array(10)
			.fill('')
			.map((_, idx) => ({start:addDays(new Date(), idx*14).toDateString(), end:addDays(new Date(), (idx+1)*14-1).toDateString()}));
	}

	private getKeyboradsInfo(data:string) {
		return prepareNDaysForOther(this.dates(data));
	}

	private get getKeyboradsInfoRange() {
		return prepareNRangeForOther(this.rangeDates);
	}

	forKeyobard(data: string) {
		return this.keyboardStore.addCancel(
			this.getKeyboradsInfo(data).daysForKeyboard,
		);
	}

	get forRange() {
		return this.keyboardStore.addCancel(
			this.getKeyboradsInfoRange.daysForKeyboard,
		);
	}

	getDate(data: string) {
		const [dateP] = data.split(' (');
		return parse(dateP, 'd MMMM', new Date(),{ locale: ru });
	}

	getDateField(data: string) {
		return this.getDate(data);
	}
}
