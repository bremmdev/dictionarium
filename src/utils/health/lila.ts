/**
 * Where LiLa files a word differently from us: a second opinion, not an error.
 * Pure, over the LASLA rows src/server/frequency.ts holds. See vault/health.md.
 */
import type { Entry } from "#/db/schema";
import {
	AMBIGUOUS_MIN,
	AMBIGUOUS_SHARE,
	FLCAT,
	type Lexeme,
	sameLengths,
	UPOS,
} from "#/utils/entries/frequency";
import type { EntryRef } from "#/utils/entries/links";

export const FIELDS = ["class", "gender"] as const;
export type Field = (typeof FIELDS)[number];

export function isField(value: unknown): value is Field {
	return (FIELDS as ReadonlyArray<unknown>).includes(value);
}

/** ours is our column's value, theirs LiLa's code: "3" and "v6", or "m" and "f". */
export type Disagreement = {
	entry: EntryRef;
	where: string;
	field: Field;
	ours: string;
	theirs: string;
	message: string;
};

type Filed = Pick<
	Entry,
	| "id"
	| "lemma"
	| "homonym"
	| "partOfSpeech"
	| "declension"
	| "conjugation"
	| "gender"
>;

/** LiLa's adjective classes: n6 is bonus, n7 is fortis. */
const ADJECTIVE_FLCAT: Record<string, string> = { "1-2": "6", "3": "7" };

const ORDINALS: Record<string, string> = {
	"1": "1st",
	"2": "2nd",
	"3": "3rd",
	"4": "4th",
	"5": "5th",
};

const GENDER_NAMES: Record<string, string> = {
	m: "masculine",
	f: "feminine",
	n: "neuter",
};

/** Our class, or null when the word is not asked (or its class is missing, which checkInflection reports). */
function ourClass(entry: Filed) {
	if (entry.partOfSpeech === "verb") return entry.conjugation;
	if (entry.partOfSpeech === "noun" || entry.partOfSpeech === "adjective") {
		return entry.declension;
	}
	return null;
}

function sameClass(entry: Filed, ours: string, flcat: string) {
	if (entry.partOfSpeech === "verb") return flcat === `v${FLCAT[ours]}`;
	if (ours === "indeclinable") return !/^n\d/.test(flcat);
	const table = entry.partOfSpeech === "adjective" ? ADJECTIVE_FLCAT : FLCAT;
	return flcat === `n${table[ours]}`;
}

function ourClassName(entry: Filed, ours: string) {
	if (ours === "indeclinable" || ours === "irregular") return ours;
	if (ours === "3io") return "3rd conjugation (-iō)";
	if (ours === "1-2") return "1st and 2nd declension";
	const kind = entry.partOfSpeech === "verb" ? "conjugation" : "declension";
	return `${ORDINALS[ours] ?? ours} ${kind}`;
}

function lilaClassName(entry: Filed, flcat: string) {
	const [kind, n] = [flcat[0], flcat.slice(1)];
	if (kind === "v") {
		if (n === "5") return "3rd conjugation (-iō)";
		if (n === "6") return "irregular";
		if (ORDINALS[n]) return `${ORDINALS[n]} conjugation`;
	}
	if (kind === "n" && n !== "") {
		if (n === "6") return "1st and 2nd declension";
		if (n === "7") return "3rd declension";
		if (ORDINALS[n]) return `${ORDINALS[n]} declension`;
	}
	if (entry.partOfSpeech !== "verb" && !/^n\d/.test(flcat)) {
		return "indeclinable";
	}
	return `class "${flcat}"`;
}

/**
 * LiLa's words this entry could be: same spelling, part of speech and vowel
 * lengths, most frequent first, without the ones too rare to count.
 */
function candidatesFor(entry: Filed, lexemes: ReadonlyArray<Lexeme>) {
	const tags = UPOS[entry.partOfSpeech] ?? [];
	const fits = lexemes
		.filter((c) => tags.includes(c.upos) && sameLengths(entry.lemma, c.prosody))
		.sort((a, b) => b.count - a.count);
	const [top] = fits;
	return fits.filter(
		(c, i) =>
			i === 0 ||
			(c.count >= AMBIGUOUS_MIN && c.count >= top.count * AMBIGUOUS_SHARE),
	);
}

/**
 * Flagged only when none of the candidates agrees: volō "want" and volō "fly"
 * each match one of LiLa's two uolo. Gender is asked among the ones that
 * agree on class, so a word is never flagged twice.
 */
export function disagreements(
	entry: Filed,
	lexemes: ReadonlyArray<Lexeme>,
): Array<Disagreement> {
	const ours = ourClass(entry);
	if (ours === null) return [];

	const candidates = candidatesFor(entry, lexemes);
	if (candidates.length === 0) return [];

	const ref = { id: entry.id, lemma: entry.lemma, homonym: entry.homonym };
	const where = `${entry.lemma} (${entry.partOfSpeech})`;

	const classed = candidates.filter((c) => sameClass(entry, ours, c.flcat));
	if (classed.length === 0) {
		const theirs = candidates[0].flcat;
		return [
			{
				entry: ref,
				where,
				field: "class",
				ours,
				theirs,
				message: `LiLa files it as ${lilaClassName(entry, theirs)}; you file it as ${ourClassName(entry, ours)}.`,
			},
		];
	}

	if (entry.partOfSpeech !== "noun" || !entry.gender) return [];
	const gendered = classed.filter((c) => c.gender !== "");
	if (
		gendered.length === 0 ||
		gendered.some((c) => c.gender === entry.gender)
	) {
		return [];
	}

	const theirs = gendered[0].gender;
	return [
		{
			entry: ref,
			where,
			field: "gender",
			ours: entry.gender,
			theirs,
			message: `LiLa files it as ${GENDER_NAMES[theirs] ?? theirs}; you file it as ${GENDER_NAMES[entry.gender] ?? entry.gender}.`,
		},
	];
}
