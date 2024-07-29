import { sliceIntoChunks } from '../utils';
import { KeyboardStore } from './keyboardStore';

export class KeyboardOptionsStore {
	private keyBoardStore = new KeyboardStore();
	private toTextObjects(data: string[]) {
		return data.map((e) => ({ text: e }));
	}

	convert(data: string[], slice = 2) {
		const result = this.toTextObjects(data);
		const slices = sliceIntoChunks(result, slice);
		return this.keyBoardStore.addCancel(slices);
	}
}
