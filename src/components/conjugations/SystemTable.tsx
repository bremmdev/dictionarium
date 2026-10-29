import { FormCell } from "../FormCell";
import { Table } from "../Table";
import { PERSONS, type Tense, type TenseForms } from "./Conjugations.utils";
import { PersonLabel, TenseLabel } from "./Labels";

type SystemTableProps = {
	caption: React.ReactNode;
	/** The tenses of one system, in order. Only those with forms get a column. */
	tenses: ReadonlyArray<Tense>;
	forms: Partial<Record<Tense, TenseForms>>;
};

/** One verb, one stem: a column per tense, a row per person. */
export function SystemTable({ caption, tenses, forms }: SystemTableProps) {
	const filled = tenses.flatMap((tense) => {
		const tenseForms = forms[tense];
		return tenseForms ? [{ tense, tenseForms }] : [];
	});

	const columns = [
		{ key: "person", label: "Person" },
		...filled.map(({ tense }) => ({
			key: tense,
			label: <TenseLabel tense={tense} abbreviate />,
		})),
	];

	const rows = PERSONS.map((person) => ({
		id: person,
		cells: {
			person: <PersonLabel person={person} />,
			...Object.fromEntries(
				filled.map(({ tense, tenseForms }) => [
					tense,
					<FormCell key={tense} {...tenseForms[person]} />,
				]),
			),
		},
	}));

	return <Table caption={caption} columns={columns} rows={rows} nowrap />;
}
