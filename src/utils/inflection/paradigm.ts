import { adjectiveInflection } from "./adjectives";
import { fixedInflection } from "./fixed";
import { fold } from "#/utils/search/key";
import { nounInflection } from "./nouns";
import { type Cell, type Filing, type Inflection, partsOf } from "./types";
import { regularInflection } from "./verbs";

/** How an entry inflects: a table by lemma first, then the rules for its part of speech. */
export function inflectionOf(filing: Filing): Inflection | null {
	const fixed = fixedInflection(filing);
	if (fixed !== undefined) return fixed;

	switch (filing.partOfSpeech) {
		case "verb":
			return regularInflection(filing);
		case "noun":
			return nounInflection(filing);
		case "adjective":
		case "pronoun":
		case "numeral":
			return adjectiveInflection(filing);
		default:
			return null;
	}
}

/** Every form the generator can vouch for, with its cell. */
export function paradigm(filing: Filing): Array<Cell> {
	return inflectionOf(filing)?.cells() ?? [];
}

/**
 * What an entry is found by: its stems and every filed form. The filed forms
 * cover what is not stem + ending, like rēx beside rēg-, so every form starts
 * with one of these (scripts/check-forms.ts holds that).
 */
export function keysOf(filing: Filing, inflection = inflectionOf(filing)) {
	const keys = [
		filing.lemma,
		...partsOf(filing.principalParts),
		...(inflection?.stems ?? []),
	].map(fold);
	return [...new Set(keys)].filter((key) => key !== "");
}
