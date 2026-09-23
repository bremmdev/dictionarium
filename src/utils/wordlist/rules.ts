/**
 * What a word list can be filtered on, in one place. The route's
 * validateSearch, the listEntries RPC's validator and the form all read the
 * same rules, so a filter the form offers is one the server accepts.
 */

/** The parts of speech the list offers. No `pos` at all means every word. */
export const WORD_LIST_PARTS_OF_SPEECH = ["noun", "adjective", "verb"] as const;

export type WordListPartOfSpeech = (typeof WORD_LIST_PARTS_OF_SPEECH)[number];

/**
 * `param` is what goes in the URL, `value` what entries stores. They differ
 * because the router parses search params as JSON: a bare `?decl=1` comes back
 * as the number 1, and a string "1" goes out quoted as `?decl=%221%22`. A word
 * like `1st` is neither, so the URL stays readable.
 */
type Option = { param: string; value: string; label: string };

/**
 * Declensions per part of speech. An adjective files as `1-2` (bonus, bona,
 * bonum) or `3`, never as a bare 1 or 2, so offering nouns' five here would
 * only ever produce empty lists.
 */
export const DECLENSION_OPTIONS = {
	noun: [
		{ param: "1st", value: "1", label: "1st" },
		{ param: "2nd", value: "2", label: "2nd" },
		{ param: "3rd", value: "3", label: "3rd" },
		{ param: "4th", value: "4", label: "4th" },
		{ param: "5th", value: "5", label: "5th" },
	],
	adjective: [
		{ param: "1st-2nd", value: "1-2", label: "1st & 2nd" },
		{ param: "3rd", value: "3", label: "3rd" },
	],
} as const satisfies Record<string, ReadonlyArray<Option>>;

export const CONJUGATION_OPTIONS = [
	{ param: "1st", value: "1", label: "1st" },
	{ param: "2nd", value: "2", label: "2nd" },
	{ param: "3rd", value: "3", label: "3rd" },
	{ param: "3rd-io", value: "3io", label: "3rd -iō" },
	{ param: "4th", value: "4", label: "4th" },
	{ param: "irregular", value: "irregular", label: "irregular" },
] as const satisfies ReadonlyArray<Option>;

export function findDeclension(
	pos: WordListPartOfSpeech | undefined,
	param: unknown,
): Option | undefined {
	if (pos !== "noun" && pos !== "adjective") return undefined;
	const options: ReadonlyArray<Option> = DECLENSION_OPTIONS[pos];
	return options.find((o) => o.param === param);
}

export function findConjugation(param: unknown): Option | undefined {
	const options: ReadonlyArray<Option> = CONJUGATION_OPTIONS;
	return options.find((o) => o.param === param);
}

/** A list is for reading, not for paging through — past this it gets cut off. */
export const MAX_LIST_RESULTS = 250;

export type LettersResult =
	| { ok: true; letters: Array<string> }
	| { ok: false; error: string };

const LETTER = /^[a-z]$/;
const RANGE = /^([a-z])\s*-\s*([a-z])$/;

/**
 * Reads the start-letter filter: "a", a range "h-l", a list "a,b,e", or any mix
 * of those — "a, h-l". Returns the letters in alphabetical order without
 * duplicates. An empty filter means every letter, which callers handle before
 * getting here — so reaching this with nothing in it is an error.
 */
export function parseLetters(input: string): LettersResult {
	const letters = new Set<string>();

	const tokens = input
		.toLowerCase()
		.split(",")
		.map((token) => token.trim())
		.filter((token) => token !== "");

	if (tokens.length === 0) {
		return { ok: false, error: "Type at least one letter." };
	}

	for (const token of tokens) {
		if (LETTER.test(token)) {
			letters.add(token);
			continue;
		}

		const range = RANGE.exec(token);
		if (!range) {
			return {
				ok: false,
				error: `“${token}” is not a letter or a range. Use a single letter (a), a range (h-l) or a list (a,b,e).`,
			};
		}

		const [, from, to] = range;
		if (from > to) {
			return {
				ok: false,
				error: `The range “${token}” runs backwards. Try ${to}-${from}.`,
			};
		}
		for (let code = from.charCodeAt(0); code <= to.charCodeAt(0); code++) {
			letters.add(String.fromCharCode(code));
		}
	}

	return { ok: true, letters: [...letters].sort() };
}

/** decl and conj hold an option's `param`, not the stored value. */
export type WordListSearch = {
	pos?: WordListPartOfSpeech;
	decl?: string;
	conj?: string;
	letters?: string;
};

function isPartOfSpeech(value: unknown): value is WordListPartOfSpeech {
	return WORD_LIST_PARTS_OF_SPEECH.some((pos) => pos === value);
}

/**
 * Cleans an untrusted search object into a WordListSearch. Defaults are left
 * out rather than filled in, so a bare /word-list stays bare — the router would
 * otherwise redirect every visitor to a URL full of empty params. Anything that
 * does not fit is dropped rather than rejected: a declension only survives
 * beside a part of speech that has it, and a letters filter only if it parses.
 *
 * Every key is always present, dropped ones as undefined. The router spreads
 * the result over the raw params, so a key simply left out would let the raw,
 * rejected value through to useSearch and loaderDeps.
 */
export function parseWordListSearch(search: unknown): WordListSearch {
	const raw =
		typeof search === "object" && search !== null
			? (search as Record<string, unknown>)
			: {};

	const pos = isPartOfSpeech(raw.pos) ? raw.pos : undefined;
	const letters =
		typeof raw.letters === "string" ? raw.letters.trim() : undefined;

	return {
		pos,
		decl: findDeclension(pos, raw.decl)?.param,
		conj: pos === "verb" ? findConjugation(raw.conj)?.param : undefined,
		letters: letters && parseLetters(letters).ok ? letters : undefined,
	};
}
