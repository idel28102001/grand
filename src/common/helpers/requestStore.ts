import axios from 'axios';
import { TrainRequestStore } from './trainRequestStore';
import { readFile } from 'fs/promises';

export class RequestStore {
	get(data: TrainRequestStore) {
		// return readFile('./src/common/helpers/mock.html', { encoding: 'utf8' });
		return axios
			.post(
				'https://grandtrain.ru/local/components/oscompany/train.select/ajax.php',
				{
					from: data.from,
					to: data.to,
					forward_date: data.formatttedDate,
					backward_date: undefined,
					multimodal: 0,
					pagestyle: 'tav',
					timeout: 5,
				},
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				},
			)
			.then((e) => e.data)
			.catch(() => null);
	}
}
