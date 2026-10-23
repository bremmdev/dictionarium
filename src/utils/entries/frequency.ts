/**
 * How common a word is in classical Latin, from the LASLA corpus. Pure
 * functions over the rows scripts/build-frequency.ts writes, so the matching
 * can be checked without the server. See vault/frequency.md.
 */
import type { Entry } from "#/db/schema";
import { normalizeLemma } from "#/utils/search/rules";

/** One LASLA word as the JSON stores it: see its `columns`. */
export type LaslaRow = [string, string, string, string, string, number, number];

export type Lexeme = {
	lemma: string;
	/** LiLa's vowel lengths, "pōpulus"; empty unless it needed telling apart. */
	prosody: string;
	upos: string;
	flcat: string;
	gender: string;
	count: number;
	rank: number;
};

export const BANDS = [
	{ band: "core", label: "Core", upTo: 1000 },
	{ band: "common", label: "Common", upTo: 3000 },
	{ band: "uncommon", label: "Uncommon", upTo: 8000 },
	{ band: "rare", label: "Rare", upTo: Number.POSITIVE_INFINITY },
] as const;

export type Band = (typeof BANDS)[number]["band"];

export type Frequency = { band: Band };

type Filed = Pick<
	Entry,
	"lemma" | "partOfSpeech" | "conjugation" | "declension" | "gender"
>;

/** The universal POS tags LASLA files each of our parts of speech under. */
export const UPOS: Record<string, ReadonlyArray<string>> = {
	noun: ["NOUN"],
	verb: ["VERB", "AUX"],
	adjective: ["ADJ", "DET"],
	numeral: ["NUM", "ADJ", "DET"],
	pronoun: ["PRON", "DET"],
	adverb: ["ADV"],
	conjunction: ["CCONJ", "SCONJ", "PART"],
	preposition: ["ADP"],
	particle: ["PART", "ADV"],
	interjection: ["INTJ"],
};

/** LASLA's inflection class for each of our conjugations and noun declensions. */
export const FLCAT: Record<string, string> = {
	"1": "1",
	"2": "2",
	"3": "3",
	"4": "4",
	"5": "5",
	"3io": "5",
	irregular: "6",
};

/** A second word this close to the first means we cannot tell which one the entry is. */
export const AMBIGUOUS_SHARE = 0.02;
export const AMBIGUOUS_MIN = 5;

/** LASLA writes u for v and i for j: nouus, iacio. */
export function laslaKey(lemma: string) {
	return normalizeLemma(lemma).replaceAll("v", "u").replaceAll("j", "i");
}

export function toLexeme([
	lemma,
	prosody,
	upos,
	flcat,
	gender,
	count,
	rank,
]: LaslaRow): Lexeme {
	return { lemma, prosody, upos, flcat, gender, count, rank };
}

export function bandFor(rank: number): Band {
	return (BANDS.find((b) => rank <= b.upTo) ?? BANDS[BANDS.length - 1]).band;
}

export function bandLabel(band: Band) {
	return BANDS.find((b) => b.band === band)?.label ?? band;
}

const MACRON = String.fromCharCode(0x304);
const BREVE = String.fromCharCode(0x306);

/** Each letter's length: "L" long, "S" short, "?" unmarked. `unmarked` is what a bare vowel means. */
function lengths(word: string, unmarked: "S" | "?") {
	let letters = "";
	let marks = "";
	for (const ch of word.normalize("NFD").toLowerCase()) {
		if (ch === MACRON) marks = `${marks.slice(0, -1)}L`;
		else if (ch === BREVE) marks = `${marks.slice(0, -1)}S`;
		else if (/[a-z]/.test(ch)) {
			letters += ch.replace("v", "u").replace("j", "i");
			marks += unmarked;
		}
	}
	return { letters, marks };
}

/** Our lemmas mark every long vowel, so mālum is not LiLa's mălum. */
export function sameLengths(lemma: string, prosody: string) {
	if (prosody === "") return true;
	const ours = lengths(lemma, "S");
	const theirs = lengths(prosody, "?");
	if (ours.letters !== theirs.letters) return true;
	return [...theirs.marks].every((m, i) => m === "?" || m === ours.marks[i]);
}

function sameClass(entry: Filed, lexeme: Lexeme) {
	if (entry.partOfSpeech === "verb" && entry.conjugation) {
		return lexeme.flcat === `v${FLCAT[entry.conjugation]}`;
	}
	if (entry.partOfSpeech === "noun" && entry.declension) {
		return entry.declension === "indeclinable"
			? !/^n\d/.test(lexeme.flcat)
			: lexeme.flcat === `n${FLCAT[entry.declension]}`;
	}
	// Adjectives change class with degree (melior is 3rd), so they are not asked.
	return true;
}

/** ferō is 3rd conjugation to us and irregular to LASLA: the same word, filed differently. */
function irregularEitherWay(entry: Filed, lexeme: Lexeme) {
	return (
		entry.partOfSpeech === "verb" &&
		(entry.conjugation === "irregular" || lexeme.flcat === "v6")
	);
}

/**
 * The LASLA word an entry is, or null when none fits or two could. Part of
 * speech, class and vowel length have to agree, since a disagreement there
 * means a different word; gender only chooses between words that remain.
 */
export function matchLexeme(
	entry: Filed,
	candidates: ReadonlyArray<Lexeme>,
): Lexeme | null {
	const tags = UPOS[entry.partOfSpeech] ?? [];
	const fits = candidates.filter(
		(c) => tags.includes(c.upos) && sameLengths(entry.lemma, c.prosody),
	);
	const exact = fits.filter((c) => sameClass(entry, c));
	const classed =
		exact.length > 0 ? exact : fits.filter((c) => irregularEitherWay(entry, c));
	// Gender only breaks ties: canis is m. to us and f. to LiLa, and both are right.
	const gendered = classed.filter(
		(c) => !entry.gender || !c.gender || c.gender === entry.gender,
	);
	const pool = (gendered.length > 0 ? gendered : classed).sort(
		(a, b) => b.count - a.count,
	);

	const [first, second] = pool;
	if (!first) return null;
	if (
		second &&
		second.count >= AMBIGUOUS_MIN &&
		second.count >= first.count * AMBIGUOUS_SHARE
	) {
		return null;
	}
	return first;
}

export function frequencyOf(lexeme: Lexeme | null): Frequency | null {
	return lexeme ? { band: bandFor(lexeme.rank) } : null;
}
