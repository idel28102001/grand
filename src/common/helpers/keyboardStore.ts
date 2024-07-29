export enum Keys {
	CANCEL = 'Отмена',
}

export class KeyboardStore {
	addCancel<T extends { text: string }[][]>(data: T) {
		return data.concat([[{ text: Keys.CANCEL }]]);
	}
}
