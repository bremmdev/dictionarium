import { FormCell } from "../FormCell";
import { Table } from "../Table";
import type {
	Cetera as CeteraForms,
	Form,
	ImperativePerson,
	Voice,
} from "./Conjugations.utils";
import { PersonLabel } from "./Labels";

const IMPERATIVE_PERSONS: ImperativePerson[] = ["2sg", "3sg", "2pl", "3pl"];
const VOICES: Voice[] = ["active", "passive"];
const INFINITIVE_TENSES = ["present", "perfect", "future"] as const;

const capitalised = (text: string) => text[0].toUpperCase() + text.slice(1);

/** An empty slot: the present has no third person, the future passive no second plural. */
function Slot({ form }: { form?: Form }) {
	if (form) return <FormCell {...form} />;
	return (
		<>
			<span aria-hidden="true">—</span>
			<span className="sr-only">none</span>
		</>
	);
}

/**
 * The imperatives, the infinitives, and the declined parts of the verb. Only
 * what the verb has gets a column or a row: sum has no passive and no gerund.
 */
export function Cetera({
	lemma,
	cetera,
}: {
	lemma: string;
	cetera: CeteraForms;
}) {
	const { imperative, infinitive, participle } = cetera;
	const name = <span lang="la">{lemma}</span>;

	const imperativeColumns = VOICES.flatMap((voice) =>
		(["present", "future"] as const).flatMap((tense) => {
			const row = imperative[voice]?.[tense];
			return row && Object.keys(row).length > 0
				? [
						{
							key: `${tense}-${voice}`,
							label: `${capitalised(tense)} ${voice}`,
							row,
						},
					]
				: [];
		}),
	);
	const imperativeRows = IMPERATIVE_PERSONS.filter((person) =>
		imperativeColumns.some(({ row }) => row[person]),
	).map((person) => ({
		id: person,
		cells: {
			person: <PersonLabel person={person} />,
			...Object.fromEntries(
				imperativeColumns.map(({ key, row }) => [
					key,
					<Slot key={key} form={row[person]} />,
				]),
			),
		},
	}));

	const infinitiveVoices = VOICES.filter((voice) =>
		INFINITIVE_TENSES.some((tense) => infinitive[tense]?.[voice]),
	);
	const infinitiveRows = INFINITIVE_TENSES.filter(
		(tense) => infinitive[tense],
	).map((tense) => ({
		id: tense,
		cells: {
			tense: capitalised(tense),
			...Object.fromEntries(
				infinitiveVoices.map((voice) => [
					voice,
					<Slot key={voice} form={infinitive[tense]?.[voice]} />,
				]),
			),
		},
	}));

	const declined = (
		[
			["present", "Present participle", participle.present],
			["perfect", "Perfect participle", participle.perfect],
			["future", "Future participle", participle.future],
			["gerundive", "Gerundive", cetera.gerundive],
			["gerundGenitive", "Gerund, genitive", cetera.gerund?.genitive],
			["gerundDative", "Gerund, dative", cetera.gerund?.dative],
			["gerundAccusative", "Gerund, accusative", cetera.gerund?.accusative],
			["gerundAblative", "Gerund, ablative", cetera.gerund?.ablative],
			["supineAccusative", "Supine, accusative", cetera.supine?.accusative],
			["supineAblative", "Supine, ablative", cetera.supine?.ablative],
		] as const
	).flatMap(([id, label, form]) =>
		form ? [{ id, cells: { name: label, latin: <FormCell {...form} /> } }] : [],
	);

	return (
		<div className="mx-auto grid max-w-4xl items-start gap-8">
			{imperativeRows.length > 0 && (
				<Table
					caption={<>{name}, imperative</>}
					columns={[
						{ key: "person", label: "Person" },
						...imperativeColumns.map(({ key, label }) => ({ key, label })),
					]}
					rows={imperativeRows}
					nowrap
				/>
			)}
			{infinitiveRows.length > 0 && (
				<Table
					caption={<>{name}, infinitives</>}
					columns={[
						{ key: "tense", label: "Tense" },
						...infinitiveVoices.map((voice) => ({
							key: voice,
							label: capitalised(voice),
						})),
					]}
					rows={infinitiveRows}
					nowrap
				/>
			)}
			{declined.length > 0 && (
				<Table
					caption={<>{name}, participles, gerundive, gerund and supine</>}
					columns={[
						{ key: "name", label: "Form" },
						{ key: "latin", label: "Latin" },
					]}
					rows={declined}
					nowrap
				/>
			)}
		</div>
	);
}
