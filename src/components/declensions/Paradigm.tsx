import { LatinWord } from "../LatinWord";
import { Table } from "../Table";
import {
	CASES,
	PARADIGM_COLUMNS,
	type Paradigm as ParadigmData,
} from "./Declensions.utils";

/**
 * One cell: the form, and the second form that shares the slot where there is
 * one — urbīs beside urbēs, domō beside domuī. The alternative is set in muted
 * ink rather than gold so the form to learn first still reads as the answer,
 * and the "or" sits outside the lang="la" span so a Latin voice does not try to
 * pronounce an English word.
 */
function Cell({ form, alt }: { form: string; alt?: string }) {
	return (
		<>
			<LatinWord>{form}</LatinWord>
			{alt && (
				<span className="text-base text-ink-500">
					{" or "}
					<span lang="la">{alt}</span>
				</span>
			)}
		</>
	);
}

type ParadigmProps = {
	paradigm: ParadigmData;
	/** Sits under the table when the noun does something the pattern does not. */
	note?: React.ReactNode;
	/** Lands on the paradigm's own box — its place in the grid belongs to the caller. */
	className?: string;
};

export function Paradigm({ paradigm, note, className }: ParadigmProps) {
	const { lemma, genitive, gender, english, singular, plural } = paradigm;

	const rows = CASES.map((grammaticalCase) => ({
		id: grammaticalCase,
		cells: {
			grammaticalCase,
			singular: <Cell {...singular[grammaticalCase]} />,
			plural: <Cell {...plural[grammaticalCase]} />,
		},
	}));

	return (
		// The dictionary entry is the caption rather than a heading above it, so
		// a screen reader announces "fīlia, fīliae, f. — daughter" on entering
		// the table and the forms arrive already attached to their noun.
		<div className={`space-y-3 ${className ?? ""}`}>
			<Table
				caption={
					<>
						<LatinWord className="text-lg">{lemma}</LatinWord>
						{", "}
						<span lang="la">{genitive}</span>
						{`, ${gender} — ${english}`}
					</>
				}
				columns={PARADIGM_COLUMNS}
				rows={rows}
			/>
			{note && <p className="text-base text-ink-500 leading-relaxed">{note}</p>}
		</div>
	);
}
