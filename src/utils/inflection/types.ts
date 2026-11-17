import type {
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
	| "conjugation"
>;

export type GrammaticalNumber = "singular" | "plural";

export type Analysis =
	| {
			kind: "case";
			case: Case;
			number: GrammaticalNumber;
			/** Only where the word inflects for gender: adjectives and pronouns. */
			gender?: Gender;
	  }
	| { kind: "finite"; person: Person; tense: Tense; mood: Mood; voice: Voice }
	| { kind: "infinitive"; tense: "present" | "perfect"; voice: Voice };

/** One form in one slot. `variant`: a genuine alternative, or one of the i-stem pair. */
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
