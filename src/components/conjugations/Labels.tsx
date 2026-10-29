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
export function TenseLabel({
	tense,
	abbreviate = false,
}: {
	tense: Tense;
	/** Show the short name below md; a screen reader still hears the full one. */
	abbreviate?: boolean;
}) {
	const { la, en, short } = TENSE_LABELS[tense];
	return (
		<>
			{abbreviate && short ? (
				<span lang="la">
					<span aria-hidden="true" className="md:hidden">
						{short}
					</span>
					<span className="max-md:sr-only">{la}</span>
				</span>
			) : (
				<span lang="la">{la}</span>
			)}
			<span className="sr-only">{` (${en})`}</span>
		</>
	);
}
