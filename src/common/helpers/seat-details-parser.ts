import { PlacePosition } from 'src/train-info/enums/place-position.enum';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import type { PlacePositionItem, PlaceTypeItem } from './html-parser';
import { isSidePlace, toPlacePosition, toPlaceType } from './place-normalize';

type CarGroup = {
	PlacesFormatted?: string[];
	Prices?: { Full?: string };
	/** seat number → "верх" | "низ" | "верх.бок" | "ниж.бок" | "верхняя полка" … */
	PlaceTypes?: Record<string, string>;
};

type SeatsData = {
	/** car key ("3Э_10_2530862998") → groups of FREE seats */
	CarsFormat?: Record<string, CarGroup[]>;
};

/** class key ("0_0") → car keys */
type ClassGroups = Record<string, string[]>;

export type SeatDetails = {
	/** Free seats per car class, side seats excluded. */
	noSide: PlaceTypeItem[];
	/** Free side seats per car class: верх = "верх.бок", низ = "ниж.бок". */
	side: { type: PlaceType; places: PlacePositionItem[] }[];
};

/**
 * Parses a train page: https://grandtrain.ru/search/{from}-{to}/{date}/{train}/
 *
 * The page has inline JS with the free seats of every car:
 *   seatsData = {'CarsFormat': {'3Э_10_…': [{'PlaceTypes': {'37': 'ниж.бок', …},
 *                                             'Prices': {'Full': '4798.4'}}, …]}, …},
 *   classGroups = {'0_0': ['3Э_10_…', …], …};
 * and the class name of every group:
 *   <div class="car-class" data-filter="Плацкарт" data-classkey=0_0>
 *
 * The JS objects are converted to JSON and parsed as data; page code is
 * never executed.
 */
export class SeatDetailsParser {
	parse(html: string): SeatDetails | null {
		const seatsData = this.readJsObject<SeatsData>(html, 'seatsData');
		const classGroups = this.readJsObject<ClassGroups>(html, 'classGroups');
		if (!seatsData?.CarsFormat || !classGroups) return null;

		const carTypes = this.getCarTypes(html, classGroups);

		const noSide = new Map<
			PlaceType,
			{ price: number; places: Map<PlacePosition, number> }
		>();
		const side = new Map<PlaceType, Map<PlacePosition, number>>();

		for (const [car, groups] of Object.entries(seatsData.CarsFormat)) {
			const type = carTypes.get(car);
			if (!type) continue;

			for (const group of groups ?? []) {
				const price = Number(group.Prices?.Full);
				for (const placeType of Object.values(group.PlaceTypes ?? {})) {
					const position = toPlacePosition(placeType);
					if (!position) continue;

					if (isSidePlace(placeType)) {
						const places = side.get(type) ?? new Map();
						places.set(position, (places.get(position) ?? 0) + 1);
						side.set(type, places);
						continue;
					}

					const entry = noSide.get(type) ?? {
						price: Infinity,
						places: new Map<PlacePosition, number>(),
					};
					entry.places.set(
						position,
						(entry.places.get(position) ?? 0) + 1,
					);
					if (!isNaN(price))
						entry.price = Math.min(entry.price, price);
					noSide.set(type, entry);
				}
			}
		}

		return {
			noSide: [...noSide].map(([type, { price, places }]) => ({
				type,
				price: isFinite(price) ? price : 0,
				places: [...places].map(
					([position, count]): PlacePositionItem => ({
						position,
						count,
					}),
				),
			})),
			side: [...side].map(([type, places]) => ({
				type,
				places: [...places].map(([position, count]) => ({
					position,
					count,
				})),
			})),
		};
	}

	/** car key → PlaceType, through classGroups and the .car-class blocks. */
	private getCarTypes(
		html: string,
		classGroups: ClassGroups,
	): Map<string, PlaceType> {
		const result = new Map<string, PlaceType>();
		const blocks =
			html.match(/<div[^>]*class="car-class[\s"][^>]*>/g) ?? [];
		for (const block of blocks) {
			const name = /data-filter="([^"]*)"/.exec(block)?.[1];
			const key = /data-classkey="?([\w-]+)"?/.exec(block)?.[1];
			const type = name ? toPlaceType(name) : null;
			if (!key || !type) continue;
			for (const car of classGroups[key] ?? []) result.set(car, type);
		}
		return result;
	}

	/** Finds `name = {…}` in the page and parses the object literal as data. */
	private readJsObject<T>(html: string, name: string): T | null {
		const match = new RegExp(`\\b${name}\\s*=\\s*\\{`).exec(html);
		if (!match) return null;
		const start = match.index + match[0].length - 1;
		const literal = this.sliceBalanced(html, start);
		if (!literal) return null;
		try {
			return JSON.parse(this.toJson(literal)) as T;
		} catch (e) {
			console.warn(
				`SeatDetailsParser: cannot parse ${name}:`,
				e instanceof Error ? e.message : e,
			);
			return null;
		}
	}

	/** `{ … }` starting at `start`, skipping braces inside quoted strings. */
	private sliceBalanced(text: string, start: number): string | null {
		let depth = 0;
		let quote: string | null = null;
		for (let i = start; i < text.length; i++) {
			const char = text[i];
			if (quote) {
				if (char === '\\') i++;
				else if (char === quote) quote = null;
				continue;
			}
			if (char === "'" || char === '"') quote = char;
			else if (char === '{') depth++;
			else if (char === '}' && --depth === 0) {
				return text.slice(start, i + 1);
			}
		}
		return null;
	}

	/** JS object literal with single-quoted strings → JSON. */
	private toJson(literal: string): string {
		return literal
			.replace(/'((?:[^'\\]|\\.)*)'/g, (_, body: string) =>
				JSON.stringify(body.replace(/\\'/g, "'")),
			)
			.replace(/,\s*([}\]])/g, '$1');
	}
}
