import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { PERSONAL_ENDINGS, PERSONS } from "./Conjugations.utils";
import { PersonLabel } from "./Labels";

const COLUMNS = [
	{ key: "person", label: "Person" },
	{ key: "ending", label: "Ending" },
	{ key: "example", label: "Example" },
	{ key: "english", label: "English" },
];

const ROWS = PERSONS.map((person) => {
	const { ending, example, english } = PERSONAL_ENDINGS[person];
	return {
		id: person,
		cells: {
			person: <PersonLabel person={person} />,
			ending: <LatinWord>{ending}</LatinWord>,
			example: <LatinWord>{example}</LatinWord>,
			english,
		},
	};
});

export function Persons() {
	return (
		<section
			id="persons"
			aria-labelledby="persons-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-4 sm:px-8"
		>
			<Heading
				id="persons-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Persōnae
			</Heading>
			<p>
				A Latin verb carries its subject in its ending.{" "}
				<LatinWord>salūtō</LatinWord> is a whole sentence, <em>I greet</em>, so
				a pronoun is only added when it is stressed:{" "}
				<LatinWord>ego salūtō</LatinWord>, <em>I</em> am the one greeting. Three
				persons, each singular or plural, make six endings. The perfect has a
				set of its own; every other active tense uses these six.
			</p>
			<Table
				caption="The six persons, their endings, and the present of salūtō."
				columns={COLUMNS}
				rows={ROWS}
				className="mx-auto max-w-4xl"
			/>
			<p>
				The first person singular is the one that varies:{" "}
				<LatinWord>-ō</LatinWord> in the present, <LatinWord>-m</LatinWord> in
				the imperfect and the pluperfect: <LatinWord>salūtābam</LatinWord>,{" "}
				<LatinWord>salūtāveram</LatinWord>. The future goes either way:{" "}
				<LatinWord>-ō</LatinWord> where it has a <LatinWord>b</LatinWord>,{" "}
				<LatinWord>salūtābō</LatinWord>, and <LatinWord>-m</LatinWord> where it
				does not, <LatinWord>dūcam</LatinWord>.
			</p>
		</section>
	);
}
