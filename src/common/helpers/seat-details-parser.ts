import { PlacePosition } from 'src/train-info/enums/place-position.enum';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import { isSidePlace, toPlacePosition, toPlaceType } from './place-normalize';

type CarGroup = {
	PlacesFormatted?: string[];
	/** seat number → "верх" | "низ" | "верх.бок" | "ниж.бок" | "верхняя полка" … */
	PlaceTypes?: Record<string, string>;
};

type SeatsData = {
	/** car key ("3Э_10_2530862998") → groups of FREE seats */
	CarsFormat?: Record<string, CarGroup[]>;
};

/** class key ("0_0") → car keys */
type ClassGroups = Record<string, string[]>;

/** One free seat from the train page. */
export type FreeSeat = {
	/** Seat number in its car (1–54). */
	n: number;
	position: PlacePosition;
	side: boolean;
};

/** Free seats of one train, per car class (all cars together). */
export type TrainSeats = Partial<Record<PlaceType, FreeSeat[]>>;

/**
 * Parses a train page: https://grandtrain.ru/search/{from}-{to}/{date}/{train}/
 *
 * The page has inline JS with the free seats of every car:
 *   seatsData = {'CarsFormat': {'3Э_10_…': [{'PlaceTypes': {'37': 'ниж.бок', …}}, …]}, …},
 *   classGroups = {'0_0': ['3Э_10_…', …], …};
 * and the class name of every group:
 *   <div class="car-class" data-filter="Плацкарт" data-classkey=0_0>
 *
 * The JS objects are converted to JSON and parsed as data; page code is
 * never executed. Seats without a known position (lux: "Купе" for a whole
 * compartment) are left out.
 */
export class SeatDetailsParser {
	parse(html: string): TrainSeats | null {
		const seatsData = this.readJsObject<SeatsData>(html, 'seatsData');
		const classGroups = this.readJsObject<ClassGroups>(html, 'classGroups');
		if (!seatsData?.CarsFormat || !classGroups) return null;

		const carTypes = this.getCarTypes(html, classGroups);
		const result: TrainSeats = {};

		for (const [car, groups] of Object.entries(seatsData.CarsFormat)) {
			const type = carTypes.get(car);
			if (!type) continue;

			for (const group of groups ?? []) {
				for (const [seat, placeType] of Object.entries(
					group.PlaceTypes ?? {},
				)) {
					const n = parseInt(seat, 10);
					const position = toPlacePosition(placeType);
					if (!n || !position) continue;
					(result[type] ??= []).push({
						n,
						position,
						side: isSidePlace(placeType),
					});
				}
			}
		}
		return result;
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
