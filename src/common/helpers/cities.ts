import { cities, sliceIntoChunks } from '../utils';
import { KeyboardStore } from './keyboardStore';

export class Cities {
	private keyboardStore = new KeyboardStore();

	private get cities() {
		return cities;
	}

	getCode(data: string) {
		const item = this.getItem(data);
		if (!item) return -1;
		return item.code;
	}

	getCity(data: number) {
		const item = this.getItemByCode(data);
		if (!item) return `НЕИЗВЕСТНО - ${data}`;
		return item.city;
	}

	get options() {
		return this.cities.map((e) => e.city);
	}

	private get toTexts() {
		return this.toTextsObjects(this.options);
	}

	private getItem(data: string) {
		return this.cities.find((e) => e.city === data);
	}

	private getItemByCode(data: number) {
		return this.cities.find((e) => e.code === data);
	}

	private preprocessData(data: { text: string }[]) {
		const result = sliceIntoChunks(data, 2);
		return this.keyboardStore.addCancel(result);
	}

	get keyboardOptions() {
		return this.preprocessData(this.toTexts);
	}

	remainsKeyboardOptions(data: number) {
		const city = this.getItemByCode(data);
		if (!city) return [];
		return this.preprocessData(this.getRemainings(city.code));
	}

	private filterOptions(code: number) {
		return this.cities.filter((e) => e.code !== code);
	}

	private toTextsObjects(data: string[]) {
		return data.map((e) => ({ text: e }));
	}

	getRemainings(code: number) {
		return this.toTextsObjects(this.filterOptions(code).map((e) => e.city));
	}
}
