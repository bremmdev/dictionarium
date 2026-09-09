/**
 * The rules a new entry has to satisfy, in one place.
 *
 * These rules were enforced by the seed file and the guard scripts after the fact
 * and are documented in vault/schema.md's filing conventions.
 *
 * One function does it, and three callers share it: the form (for the messages),
 * the createEntry RPC (as its .validator, which is the actual gate — the form is
 * reachable only through a browser, an RPC by anyone the session lets in), and
 * scripts/check-inflection.ts (for the vocabulary).
 */
import { normalizeLemma } from "#/utils/search/rules";

/** `1-2` is the adjective pattern (bonus, bona, bonum); `indeclinable` is an answer, not an absence. */
export const DECLENSIONS = [
	"1",
	"2",
	"3",
	"4",
	"5",
	"1-2",
	"indeclinable",
] as const;

export const CONJUGATIONS = ["1", "2", "3", "4", "3io", "irregular"] as const;

export const GENDERS = ["m", "f", "n"] as const;

/**
 * Which question a part of speech has to answer.
 */
export const INFLECTS = {
	noun: "declension",
	adjective: "declension",
	numeral: "declension",
	pronoun: "declension",
	verb: "conjugation",
	adverb: "neither",
	conjunction: "neither",
	preposition: "neither",
	interjection: "neither",
	particle: "neither",
} as const satisfies Record<string, "declension" | "conjugation" | "neither">;

export type PartOfSpeech = keyof typeof INFLECTS;
export type Declension = (typeof DECLENSIONS)[number];
export type Conjugation = (typeof CONJUGATIONS)[number];
export type Gender = (typeof GENDERS)[number];

/** Insertion order, so the form's buttons read noun, adjective, numeral, … */
export const PARTS_OF_SPEECH = Object.keys(INFLECTS) as Array<PartOfSpeech>;

export function isPartOfSpeech(value: string): value is PartOfSpeech {
	return Object.hasOwn(INFLECTS, value);
}

export function isDeclension(value: string): value is Declension {
	return (DECLENSIONS as ReadonlyArray<string>).includes(value);
}

export function isConjugation(value: string): value is Conjugation {
	return (CONJUGATIONS as ReadonlyArray<string>).includes(value);
}

export function isGender(value: string): value is Gender {
	return (GENDERS as ReadonlyArray<string>).includes(value);
}

/** Nouns file their genitive there, verbs their principal parts; see vault/schema.md. */
export function hasPrincipalParts(
	partOfSpeech: string,
): partOfSpeech is "noun" | "verb" {
	return partOfSpeech === "noun" || partOfSpeech === "verb";
}

export type SenseDraft = {
	meaningEn: string;
	/** 'medical', 'military', 'poetic' — a label on this sense only. */
	usage: string | null;
};

/** A validated row plus its senses */
export type EntryDraft = {
	lemma: string;
	lemmaPlain: string;
	partOfSpeech: PartOfSpeech;
	principalParts: string | null;
	gender: Gender | null;
	declension: Declension | null;
	conjugation: Conjugation | null;
	notes: string | null;
	/** Position is the rank, so ranks running 1..n with no gaps falls out of the array. */
	senses: [SenseDraft, ...Array<SenseDraft>];
};

/**
 * Every problem at once, keyed by field, so the form can put each message
 * beside the input that caused it. `message` is the first of them: a thrown
 * error crossing the RPC boundary arrives as a plain Error, and the message is
 * the only part of it that survives. That is enough, because the form runs this
 * same function before it sends — the server's copy is the guard, not the UI.
 */
export class EntryValidationError extends Error {
	readonly fields: Record<string, string>;

	constructor(fields: Record<string, string>) {
		super(Object.values(fields)[0] ?? "This entry is not valid.");
		this.name = "EntryValidationError";
		this.fields = fields;
	}
}

/** The three ranges scripts/check-macrons.ts scans for, with its hints. */
const SUSPECT = [
	{
		from: 0x0300,
		to: 0x036f,
		kind: "a combining mark",
		hint: "paste a vowel that already carries its macron rather than one built from two characters",
	},
	{
		from: 0x0370,
		to: 0x03ff,
		kind: "a Greek letter",
		hint: "it looks Latin, and is not",
	},
	{
		from: 0x0400,
		to: 0x04ff,
		kind: "a Cyrillic letter",
		hint: "it looks Latin, and is not",
	},
];

/**
 * The rule scripts/check-macrons.ts holds over source files, applied to the entry form
 * Rendered under lang="la", a macron built from a combining mark or a lookalike
 * letter from another script looks identical and makes that attribute a lie.
 *
 * The caller normalizes to NFC first, which composes a decomposed macron away;
 * what this can still find is a mark with no precomposed form, and those are
 * exactly the ones worth refusing.
 */
function suspectCharacter(value: string) {
	for (const char of value) {
		const code = char.codePointAt(0) as number;
		const suspect = SUSPECT.find((s) => code >= s.from && code <= s.to);

		if (suspect) {
			return `“${char}” is ${suspect.kind} — ${suspect.hint}. Latin here is rendered under lang="la", so it has to be Latin.`;
		}
	}

	return null;
}

/** "a noun", but "an adverb" — a part of speech is named inside a sentence. */
function aWord(word: string) {
	return `${/^[aeiou]/.test(word) ? "an" : "a"} ${word}`;
}

/** …and sometimes at the start of one. */
function opens(phrase: string) {
	return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function text(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

/** Latin is stored precomposed, so normalize before anything else looks at it. */
function latin(value: unknown) {
	return text(value).normalize("NFC");
}

/**
 * Turns whatever arrived into the row to write, or throws with every problem it
 * found. `unknown` in, because this runs as a server function's validator, and
 * a server function is an RPC before it is a form handler.
 */
export function parseEntryDraft(input: unknown): EntryDraft {
	const raw = (
		typeof input === "object" && input !== null ? input : {}
	) as Record<string, unknown>;

	const fields: Record<string, string> = {};

	// --- lemma -------------------------------------------------------------
	const lemma = latin(raw.lemma);
	const suspect = suspectCharacter(lemma);

	if (lemma === "") {
		fields.lemma = "A lemma is required — it is the headword.";
	} else if (suspect) {
		fields.lemma = suspect;
	} else if (normalizeLemma(lemma) === "") {
		fields.lemma =
			"Nothing is left of this lemma once macrons are stripped, so no search could ever reach it.";
	}

	// --- part of speech ----------------------------------------------------
	const partOfSpeech = text(raw.partOfSpeech);

	if (partOfSpeech === "") {
		fields.partOfSpeech = "Pick a part of speech.";
	} else if (!isPartOfSpeech(partOfSpeech)) {
		fields.partOfSpeech = `“${partOfSpeech}” is not a part of speech this dictionary files. Add it to INFLECTS first, and say there whether it inflects.`;
	}

	// Undefined for a part of speech nobody has classified, which is what keeps
	// the two checks below quiet instead of guessing which question applies.
	const asks = isPartOfSpeech(partOfSpeech)
		? INFLECTS[partOfSpeech]
		: undefined;

	// --- declension / conjugation ------------------------------------------
	// The question that applies must be answered, and answered in the
	// vocabulary. The one that does not must stay empty, or NULL goes straight
	// back to meaning two different things.
	const declensionInput = text(raw.declension);
	let declension: Declension | null = null;

	if (asks === "declension") {
		if (declensionInput === "") {
			fields.declension = `${opens(aWord(partOfSpeech))} inflects, so say how (${DECLENSIONS.join(" | ")}).`;
		} else if (!isDeclension(declensionInput)) {
			fields.declension = `“${declensionInput}” is not one of ${DECLENSIONS.join(" | ")}.`;
		} else {
			declension = declensionInput;
		}
	} else if (asks !== undefined && declensionInput !== "") {
		fields.declension = `${opens(aWord(partOfSpeech))} does not decline, so it cannot carry a declension.`;
	}

	const conjugationInput = text(raw.conjugation);
	let conjugation: Conjugation | null = null;

	if (asks === "conjugation") {
		if (conjugationInput === "") {
			fields.conjugation = `${opens(aWord(partOfSpeech))} inflects, so say how (${CONJUGATIONS.join(" | ")}).`;
		} else if (!isConjugation(conjugationInput)) {
			fields.conjugation = `“${conjugationInput}” is not one of ${CONJUGATIONS.join(" | ")}.`;
		} else {
			conjugation = conjugationInput;
		}
	} else if (asks !== undefined && conjugationInput !== "") {
		fields.conjugation = `${opens(aWord(partOfSpeech))} does not conjugate, so it cannot carry a conjugation.`;
	}

	// --- gender ------------------------------------------------------------
	// A noun's third filing fact, and nothing else has one: an adjective
	// inflects for every gender rather than having one of its own.
	const genderInput = text(raw.gender);
	let gender: Gender | null = null;

	if (partOfSpeech === "noun") {
		if (genderInput === "") {
			fields.gender = `A noun is filed with its gender (${GENDERS.join(" | ")}).`;
		} else if (!isGender(genderInput)) {
			fields.gender = `“${genderInput}” is not one of ${GENDERS.join(" | ")}.`;
		} else {
			gender = genderInput;
		}
	} else if (asks !== undefined && genderInput !== "") {
		fields.gender = `Only nouns carry a gender, and this is ${aWord(partOfSpeech)}.`;
	}

	// --- principal parts ---------------------------------------------------
	// The rest of the dictionary filing: the four parts for a verb, the genitive
	// for a noun, and null wherever the lemma is the whole filing.
	const principalPartsInput = latin(raw.principalParts);
	let principalParts: string | null = null;

	if (hasPrincipalParts(partOfSpeech)) {
		const suspectPart = suspectCharacter(principalPartsInput);

		if (principalPartsInput === "") {
			fields.principalParts =
				partOfSpeech === "verb"
					? "A verb is filed by its principal parts, separated by commas."
					: "A noun is filed with its genitive.";
		} else if (suspectPart) {
			fields.principalParts = suspectPart;
		} else {
			principalParts = principalPartsInput;
		}
	} else if (asks !== undefined && principalPartsInput !== "") {
		fields.principalParts = `The lemma is the whole filing for ${aWord(partOfSpeech)}, so leave this empty.`;
	}

	// --- senses ------------------------------------------------------------
	// Rank is position, so ranks run 1..n by construction. That is also why a
	// blank meaning in the middle is an error rather than a row to skip:
	// skipping it would silently renumber every sense after it.
	const senses = (Array.isArray(raw.senses) ? raw.senses : []).map((sense) => {
		const row = (
			typeof sense === "object" && sense !== null ? sense : {}
		) as Record<string, unknown>;

		return {
			meaningEn: text(row.meaningEn),
			usage: text(row.usage) || null,
		};
	});

	if (senses.length === 0) {
		fields.senses = "A word with no meaning is not an entry — add a sense.";
	}

	senses.forEach((sense, i) => {
		if (sense.meaningEn === "") {
			fields[`senses.${i}.meaningEn`] = `Sense ${i + 1} has no meaning.`;
		}
	});

	if (Object.keys(fields).length > 0) {
		throw new EntryValidationError(fields);
	}

	return {
		lemma,
		// Derived here rather than by the caller, so the row this hands on already
		// satisfies check-lemmas: lemma_plain is never typed, only computed.
		lemmaPlain: normalizeLemma(lemma),
		partOfSpeech: partOfSpeech as PartOfSpeech,
		principalParts,
		gender,
		declension,
		conjugation,
		notes: text(raw.notes) || null,
		// The empty case threw above; this cast is what tells the type that.
		senses: senses as [SenseDraft, ...Array<SenseDraft>],
	};
}
