import axios from 'axios';
import { TrainRequestStore } from './trainRequestStore';
import type { TrainLeg } from './html-parser';

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

	/** Train page with the seat map: /search/{from}-{to}/{date}/{train}/ */
	getTrainPage(leg: TrainLeg): Promise<string | null> {
		const url =
			'https://grandtrain.ru/search/' +
			`${leg.from}-${leg.to}/${leg.date}/${encodeURIComponent(
				leg.train,
			)}/`;
		return axios
			.get<string>(url, { responseType: 'text', timeout: 30_000 })
			.then((e) => e.data)
			.catch((e) => {
				console.warn(
					`getTrainPage failed for ${url}:`,
					e?.message ?? e,
				);
				return null;
			});
	}
}
