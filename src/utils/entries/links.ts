import { linkOptions } from "@tanstack/react-router";

/** What says which word a page is about: the lemma alone cannot, once cum¹ and cum² are both filed. */
export type EntryRef = { id: number; lemma: string; homonym: number };

/**
 * The URL's homonym segment as a number: absent is 1, so /verbum/cum stays
 * cum¹. null for anything that is not a positive integer.
 */
export function parseHomonym(segment: string | undefined) {
	if (segment === undefined) return 1;
	return /^[1-9]\d*$/.test(segment) ? Number(segment) : null;
}

/** The detail page of one word. Homonym 1 is the bare URL, never /1. */
export function entryLink(
	entry: Pick<EntryRef, "lemma" | "homonym">,
	q?: string,
) {
	return linkOptions({
		to: "/verbum/$lemma/{-$homonym}",
		params: {
			lemma: entry.lemma,
			homonym: entry.homonym > 1 ? String(entry.homonym) : undefined,
		},
		search: q === undefined || q === "" ? {} : { q },
		// /verbum/cum is otherwise "active" on /verbum/cum/2, as its parent path.
		activeOptions: { exact: true },
	});
}

/** homographs: how many entries share the lemma, itself included. */
export type Numbered = Pick<EntryRef, "lemma" | "homonym"> & {
	homographs: number;
};

/** A lone cum stays bare; once cum² exists, cum¹ shows its 1 too. */
export function showsHomonym(entry: Numbered) {
	return entry.homographs > 1 || entry.homonym > 1;
}

const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** "cum²" as plain text, for places a <sup> cannot go. */
export function homonymLabel(entry: Numbered) {
	if (!showsHomonym(entry)) return entry.lemma;
	const digits = [...String(entry.homonym)].map((d) => SUPERSCRIPTS[Number(d)]);
	return `${entry.lemma}${digits.join("")}`;
}
