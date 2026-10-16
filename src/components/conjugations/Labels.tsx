import {
	PERSON_LABELS,
	type Person,
	TENSE_LABELS,
	type Tense,
} from "./Conjugations.utils";

/** "1st sg." on screen, the whole name for a screen reader. */
export function PersonLabel({ person }: { person: Person }) {
	const { short, full } = PERSON_LABELS[person];
	return (
		<>
			<span aria-hidden="true">{short}</span>
			<span className="sr-only">{full}</span>
		</>
	);
}

/** The Latin tense name, glossed the way SectionNav glosses its Latin labels. */
export function TenseLabel({ tense }: { tense: Tense }) {
	const { la, en } = TENSE_LABELS[tense];
	return (
		<>
			<span lang="la">{la}</span>
			<span className="sr-only">{` (${en})`}</span>
		</>
	);
}
