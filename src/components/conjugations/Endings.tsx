import { FormCell } from "#/components/FormCell";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import {
	CONJUGATION_GROUPS,
	ENDING_COLUMNS,
	ENDINGS,
	PERFECT_ENDINGS,
	PERSONS,
} from "./Conjugations.utils";
import { PersonLabel } from "./Labels";

const CONJUGATIONS = ENDING_COLUMNS.flatMap(({ key }) =>
	key === "person" ? [] : [key],
);

const PRESENT_ROWS = PERSONS.map((person) => ({
	id: person,
	cells: {
		person: <PersonLabel person={person} />,
		...Object.fromEntries(
			CONJUGATIONS.map((c) => {
				const ending = ENDINGS[c].indicative.active?.present?.[person];
				return [c, ending ? <LatinWord key={c}>{ending}</LatinWord> : null];
			}),
		),
	},
}));

const PERFECT_COLUMNS = [
	{ key: "person", label: "Person" },
	{ key: "ending", label: "Ending" },
	{ key: "example", label: <span lang="la">dūcō</span> },
];

const DUCO = CONJUGATION_GROUPS.flatMap(({ verbs }) => verbs).find(
	({ principalParts }) => principalParts[0] === "dūcō",
);

const PERFECT_ROWS = PERSONS.map((person) => {
	const [form, alt] = (PERFECT_ENDINGS.active?.perfect?.[person] ?? "").split(
		" / ",
	);
	const example = DUCO?.indicative.active?.perfect?.[person];
	return {
		id: person,
		cells: {
			person: <PersonLabel person={person} />,
			ending: <FormCell form={form} alt={alt} />,
			example: example ? <FormCell {...example} /> : null,
		},
	};
});

export function Endings() {
	return (
		<section
			id="endings"
			aria-labelledby="endings-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-4 sm:px-8"
		>
			<Heading
				id="endings-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Terminātiōnēs
			</Heading>
			<p>
				Every paradigm above, with the verbs taken away. In the present, these
				are the endings that attach to whatever is left once the{" "}
				<LatinWord>-ō</LatinWord>, <LatinWord>-eō</LatinWord> or{" "}
				<LatinWord>-iō</LatinWord> comes off the first principal part.
			</p>
			{/* table-fixed from md only, for the reason given in Endings.tsx on
			    /declensions: six fixed columns of a phone screen overlap. */}
			<div className="mx-auto max-w-5xl md:[&_table]:table-fixed">
				<Table
					caption="Present indicative active endings, by person and conjugation."
					columns={ENDING_COLUMNS}
					rows={PRESENT_ROWS}
					nowrap
				/>
			</div>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
				<p>
					<strong className="font-semibold text-ink-900">
						Long vowels shorten
					</strong>{" "}
					before <LatinWord>-t</LatinWord> and <LatinWord>-nt</LatinWord>, which
					is why every column has a short vowel in the third person:{" "}
					<LatinWord>-at</LatinWord>, <LatinWord>-et</LatinWord>,{" "}
					<LatinWord>-it</LatinWord>.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">
						The third and mixed columns
					</strong>{" "}
					differ only in the <LatinWord>i</LatinWord> of the first person
					singular and the third person plural. The fourth has the same{" "}
					<LatinWord>i</LatinWord> there, and a long <LatinWord>ī</LatinWord>{" "}
					everywhere but <LatinWord>-it</LatinWord>.
				</p>
			</div>
			<p>
				The perfect needs no columns. Every verb in Latin takes the same six
				endings, the irregular ones included, on whatever perfect stem its third
				principal part gives it.
			</p>
			<Table
				caption="Perfect indicative active endings, the same in every conjugation."
				columns={PERFECT_COLUMNS}
				rows={PERFECT_ROWS}
				nowrap
				className="mx-auto max-w-2xl"
			/>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
				<p>
					<strong className="font-semibold text-ink-900">
						The third person plural
					</strong>{" "}
					has a second form, <LatinWord>-ēre</LatinWord>, which is common in
					poetry and in the historians: <LatinWord>dūxēre</LatinWord> for{" "}
					<LatinWord>dūxērunt</LatinWord>. It looks like an infinitive, but the
					perfect stem gives it away.
				</p>
			</div>
		</section>
	);
}
