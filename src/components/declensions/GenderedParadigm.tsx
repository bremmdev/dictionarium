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
	/** "masc.", "fem." and "neut." below md; a screen reader still hears the full word. */
	abbreviate?: boolean;
};

const short = (abbreviation: string, label: string) => (
	<>
		<span aria-hidden="true" className="md:hidden">
			{abbreviation}
		</span>
		<span className="max-md:sr-only">{label}</span>
	</>
);

const ABBREVIATIONS: Record<string, string> = {
	m: "masc.",
	f: "fem.",
	n: "neut.",
};

const SHORT_COLUMNS = ADJECTIVE_COLUMNS.map((column) =>
	column.key in ABBREVIATIONS
		? { ...column, label: short(ABBREVIATIONS[column.key], column.label) }
		: column,
);

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
	abbreviate = false,
}: GenderedParadigmProps) {
	const columns = abbreviate ? SHORT_COLUMNS : ADJECTIVE_COLUMNS;
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
					columns={columns}
					rows={rows(singular)}
				/>
				<Table
					caption={
						<>
							<span lang="la">{lemma}</span>, plural
						</>
					}
					columns={columns}
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
