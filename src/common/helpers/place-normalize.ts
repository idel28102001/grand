import { PlacePosition } from 'src/train-info/enums/place-position.enum';
import { PlaceType } from 'src/train-info/enums/place-type.enum';
import type { PlacePositionItem } from './html-parser';

/** Full or short car class name → PlaceType ("Плац" → Плацкарт). */
export function toPlaceType(name: string): PlaceType | null {
	const value = name.trim().toLowerCase();
	if (value.startsWith('плац')) return PlaceType.SEAT;
	if (value.startsWith('купе')) return PlaceType.COUPE;
	if (value === 'св' || value.startsWith('св ')) return PlaceType.SV;
	if (value.startsWith('люкс')) return PlaceType.LUX;
	return null;
}

/**
 * Seat word → PlacePosition:
 * "верх"/"верхних"/"верхняя полка"/"верх.бок" → верх,
 * "низ"/"нижних"/"нижняя полка"/"ниж.бок" → низ,
 * "место"/"места"/"мест" → места.
 */
export function toPlacePosition(word: string): PlacePosition | null {
	const value = word.trim().toLowerCase();
	if (value.startsWith('верх')) return PlacePosition.TOP;
	// "ниж" covers "нижних", "нижняя полка" and "ниж.бок"
	if (value.startsWith('низ') || value.startsWith('ниж')) {
		return PlacePosition.BOTTOM;
	}
	if (value.startsWith('мест')) return PlacePosition.PlACES;
	return null;
}

/** Seats free on every leg: per position, the minimum over legs. */
export function intersectPlaces(
	legs: PlacePositionItem[][],
): PlacePositionItem[] {
	const [first = [], ...rest] = legs;
	return first
		.map(({ position, count }) => {
			const counts = rest.map(
				(places) => places.find((e) => e.position === position)?.count,
			);
			if (counts.some((e) => e === undefined)) return null;
			return { position, count: Math.min(count, ...counts) };
		})
		.filter((e): e is PlacePositionItem => e !== null);
}

/** Seat type on the train page: "верх.бок", "ниж.бок", "боковое" … */
export function isSidePlace(placeType: string): boolean {
	return placeType.toLowerCase().includes('бок');
}

/** Sections (compartments) in a plackart, coupe or SV car. */
export const SECTIONS_COUNT = 9;

/**
 * Section of a seat, counted from the start of the car (seat 1).
 * Taken from the car schemas on grandtrain.ru (data-coupe groups):
 *  - plackart: section N = seats 4N-3…4N and side seats 55-2N, 56-2N
 *    (section 1: 1–4, 53, 54; section 9: 33–36, 37, 38);
 *  - coupe: section N = seats 4N-3…4N;
 *  - SV: section N = seats 2N-1, 2N.
 * null for other classes (lux) and for numbers outside the standard layout.
 */
export function sectionOf(type: PlaceType, seat: number): number | null {
	let section: number | null = null;
	if (type === PlaceType.SEAT) {
		if (seat >= 1 && seat <= 36) section = Math.ceil(seat / 4);
		else if (seat >= 37 && seat <= 54)
			section = Math.floor((56 - seat) / 2);
	} else if (type === PlaceType.COUPE) {
		if (seat >= 1 && seat <= 36) section = Math.ceil(seat / 4);
	} else if (type === PlaceType.SV) {
		if (seat >= 1 && seat <= 18) section = Math.ceil(seat / 2);
	}
	return section;
}
