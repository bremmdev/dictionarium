/**
 * The rules a proverb has to satisfy, in one place — the same role
 * src/utils/entries/rules.ts plays for entries.
 */
import { latin, suspectCharacter } from "#/utils/entries/rules";
import { normalizeLemma } from "#/utils/search/rules";

/**
 * The `author` of a saying nobody wrote: Fēstīnā lentē, Errāre hūmānum est.
 *
 * A value, not NULL, for the reason `indeclinable` is one in `declension`: NULL
 * cannot tell "no author to name" from "nobody filled this in", and only the
 * second is a gap. So the column is NOT NULL and this is the answer to give.
 * Lowercase like the rest of the stored vocabularies; the UI capitalizes.
 */
export const ANONYMOUS = "anonymous";

/** A validated row, ready to write. */
export type ProverbDraft = {
	textLa: string;
	textPlain: string;
	translationEn: string;
	meaningEn: string | null;
	author: string;
	source: string | null;
	notes: string | null;
};

/**
 * Every problem at once, keyed by field — EntryValidationError's shape, for the
 * same reason: the form puts each message beside its input, and `message` is
 * the part that survives the RPC boundary.
 */
export class ProverbValidationError extends Error {
	readonly fields: Record<string, string>;

	constructor(fields: Record<string, string>) {
		super(Object.values(fields)[0] ?? "This proverb is not valid.");
		this.name = "ProverbValidationError";
		this.fields = fields;
	}
}

function text(value: unknown) {
	return typeof value === "string" ? value.trim() : "";
}

/**
 * Turns whatever arrived into the row to write, or throws with every problem it
 * found. Runs in the form for the messages and as the server functions'
 * validator for real, exactly as parseEntryDraft does.
 */
export function parseProverbDraft(input: unknown): ProverbDraft {
	const raw = (
		typeof input === "object" && input !== null ? input : {}
	) as Record<string, unknown>;

	const fields: Record<string, string> = {};

	// Rendered under lang="la", so it answers to the lemma's script rule.
	const textLa = latin(raw.textLa);
	const suspect = suspectCharacter(textLa);

	if (textLa === "") {
		fields.textLa = "The Latin is required — it is the proverb.";
	} else if (suspect) {
		fields.textLa = suspect;
	} else if (normalizeLemma(textLa) === "") {
		fields.textLa =
			"Nothing is left of this once macrons and punctuation are stripped, so no search could ever reach it.";
	}

	const translationEn = text(raw.translationEn);

	if (translationEn === "") {
		fields.translationEn = "Say what it says in English.";
	}

	// A typed "Anonymous" is the vocabulary value under another case, not a
	// person by that name — so it is filed in the one spelling.
	const authorInput = text(raw.author);
	const author =
		authorInput.toLowerCase() === ANONYMOUS ? ANONYMOUS : authorInput;

	if (author === "") {
		fields.author = `Name the author, or file it as ${ANONYMOUS} when there is nobody to name.`;
	}

	if (Object.keys(fields).length > 0) {
		throw new ProverbValidationError(fields);
	}

	// NULL when the translation already is the meaning, as the column says. A
	// copy of it is that case typed out, not a second answer.
	const meaningInput = text(raw.meaningEn);
	const meaningEn =
		meaningInput === "" ||
		meaningInput.toLowerCase() === translationEn.toLowerCase()
			? null
			: meaningInput;

	return {
		textLa,
		// Derived, never typed — the same rule as lemma_plain.
		textPlain: normalizeLemma(textLa),
		translationEn,
		meaningEn,
		author,
		source: text(raw.source) || null,
		notes: text(raw.notes) || null,
	};
}
