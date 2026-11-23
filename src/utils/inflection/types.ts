import type {
	ImperativePerson,
	Mood,
	Person,
	Tense,
	Voice,
} from "#/components/conjugations/Conjugations.utils";
import type { Case } from "#/components/declensions/Declensions.utils";
import type { Entry } from "#/db/schema";
import type { Gender } from "#/utils/entries/rules";

/** What the generator reads off an entry. */
export type Filing = Pick<
	Entry,
	| "lemma"
	| "partOfSpeech"
	| "principalParts"
	| "gender"
	| "declension"
	| "terminations"
	| "stemClass"
	| "conjugation"
>;

export type GrammaticalNumber = "singular" | "plural";

/** The declined parts of a verb, each with its own label. */
export type VerbalNoun =
	| "presentParticiple"
	| "perfectParticiple"
	| "futureParticiple"
	| "gerundive"
	| "gerund"
	| "supine";

/** Passive in form, active in meaning: hortātur is "he urges", so no voice is printed. */
type Deponent = { deponent?: true };

export type Analysis =
	| {
			kind: "case";
			case: Case;
			number: GrammaticalNumber;
			/** Only where the word inflects for gender: adjectives and pronouns. */
			gender?: Gender;
			/** Set when this is a participle, the gerund or the like, not the word itself. */
			of?: VerbalNoun;
	  }
	| ({
			kind: "finite";
			person: Person;
			tense: Tense;
			mood: Mood;
			voice: Voice;
	  } & Deponent)
	| ({
			kind: "infinitive";
			tense: "present" | "perfect" | "future";
			voice: Voice;
	  } & Deponent)
	| ({
			kind: "imperative";
			tense: "present" | "future";
			person: ImperativePerson;
			voice: Voice;
	  } & Deponent);

/** One form in one slot. `variant`: a genuine alternative, or one of the i-stem pair while the stem class is unfiled. */
export type Cell = { form: string; analysis: Analysis; variant?: true };

/**
 * An entry's stems are cheap to read off the filing; its cells are built only
 * when a lookup needs them.
 */
export type Inflection = { stems: Array<string>; cells: () => Array<Cell> };

/** "-ērunt / -ēre" → ["ērunt", "ēre"]. */
export function endingsOf(sheet: string | null | undefined) {
	return sheet ? sheet.split(" / ").map((e) => e.replace(/^-/, "")) : [];
}

/** "amō, amāre, amāvī, amātum" → its parts; "hortātus sum" keeps only its first word. */
export function partsOf(filing: string | null | undefined) {
	return (filing ?? "")
		.split(",")
		.map((part) => part.trim().split(/\s+/)[0] ?? "")
		.filter((part) => part !== "");
}

/** The first form of a dictionary line: "hic, haec, hoc" → "hic". */
export const firstForm = (line: string) => line.split(", ")[0];
