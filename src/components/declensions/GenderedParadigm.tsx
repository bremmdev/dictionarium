import { FormCell } from "#/components/FormCell";
import { Heading } from "#/components/Heading";
import { Table } from "#/components/Table";
import { ADJECTIVE_CASES, ADJECTIVE_COLUMNS } from "./Adjectives.utils";
import type { Form } from "./Declensions.utils";

type Cell = string | Form;

/** One number of a word that declines for gender: an adjective, a pronoun. */
export type GenderedForms = Record<
	(typeof ADJECTIVE_CASES)[number],
	{ m: Cell; f: Cell; n: Cell }
>;

type GenderedParadigmProps = {
	title: React.ReactNode;
	/** Leads each caption, so a screen reader hears whose table it entered. */
	lemma: string;
	singular: GenderedForms;
	plural: GenderedForms;
	/** Between the heading and the tables: what the word is for. */
	intro?: React.ReactNode;
	/** Under the tables: what the forms do that the pattern does not. */
	note?: React.ReactNode;
	/** h3 where the word heads its own part of a section, as on /grammar/pronouns. */
	headingAs?: "h3" | "h4";
};

const asForm = (cell: Cell): Form =>
	typeof cell === "string" ? { form: cell } : cell;

export function GenderedParadigm({
	title,
	lemma,
	singular,
	plural,
	intro,
	note,
	headingAs = "h4",
}: GenderedParadigmProps) {
	const rows = (forms: GenderedForms) =>
		ADJECTIVE_CASES.map((grammaticalCase) => ({
			id: grammaticalCase,
			cells: {
				grammaticalCase,
				m: <FormCell {...asForm(forms[grammaticalCase].m)} />,
				f: <FormCell {...asForm(forms[grammaticalCase].f)} />,
				n: <FormCell {...asForm(forms[grammaticalCase].n)} />,
			},
		}));

	return (
		<div className="space-y-4">
			<Heading
				variant="h4"
				as={headingAs}
				className="mx-auto text-center uppercase tracking-wide"
			>
				{title}
			</Heading>
			{intro && <p className="mx-auto max-w-3xl text-center">{intro}</p>}
			{/* Singular and plural are two tables rather than one six-column grid:
			    the Table header is a single row, so a six-column version would
			    have to label a column "M" twice and leave the reader to work out
			    which half is which. */}
			<div className="grid items-start gap-8 lg:grid-cols-2">
				<Table
					caption={
						<>
							<span lang="la">{lemma}</span>, singular
						</>
					}
					columns={ADJECTIVE_COLUMNS}
					rows={rows(singular)}
				/>
				<Table
					caption={
						<>
							<span lang="la">{lemma}</span>, plural
						</>
					}
					columns={ADJECTIVE_COLUMNS}
					rows={rows(plural)}
				/>
			</div>
			{note && (
				<p className="mx-auto max-w-4xl text-base text-ink-600 leading-relaxed">
					{note}
				</p>
			)}
		</div>
	);
}
