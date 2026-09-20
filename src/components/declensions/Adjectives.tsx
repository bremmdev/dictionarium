import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import {
	ADJECTIVE_CASES,
	ADJECTIVE_COLUMNS,
	ADJECTIVE_FILING,
	type AdjectiveParadigm,
	FILING_COLUMNS,
	FIRST_SECOND,
	THIRD,
} from "./Adjectives.utils";

const FILING_ROWS = ADJECTIVE_FILING.map(({ entry, className, tells }) => ({
	id: entry,
	cells: {
		entry: <LatinWord>{entry}</LatinWord>,
		className,
		tells,
	},
}));

/** Keyed by lemma, so a paradigm carries its own footnote. */
const NOTES: Record<string, React.ReactNode> = {
	"bonus, bona, bonum": (
		<>
			Three columns, two declensions: the feminine is{" "}
			<LatinWord>fīlia</LatinWord> exactly, and the masculine and neuter are{" "}
			<LatinWord>dominus</LatinWord> and <LatinWord>bellum</LatinWord>. Nine
			adjectives break the genitive and dative singular —{" "}
			<LatinWord>
				ūnus, sōlus, tōtus, nūllus, ūllus, alius, alter, uter
			</LatinWord>{" "}
			and <LatinWord>neuter</LatinWord> take <LatinWord>-īus</LatinWord> in the
			genitive and <LatinWord>-ī</LatinWord> in the dative, in all three
			genders: <LatinWord>tōtīus</LatinWord>, <LatinWord>tōtī</LatinWord>. In
			practice <LatinWord>alius</LatinWord> borrows the genitive of{" "}
			<LatinWord>alter</LatinWord>: <LatinWord>alterīus</LatinWord>.
		</>
	),
	"pulcher, pulchra, pulchrum": (
		<>
			The same endings on a stem that drops its <LatinWord>e</LatinWord>:{" "}
			<LatinWord>pulchr-</LatinWord>, so only the masculine nominative singular
			keeps it. Some <LatinWord>-er</LatinWord> adjectives hold on to it instead
			— <LatinWord>miser, misera, miserum</LatinWord> declines{" "}
			<LatinWord>miserī</LatinWord>, <LatinWord>miserōrum</LatinWord>, with the{" "}
			<LatinWord>e</LatinWord> all the way through. The dictionary line settles
			it, which is why it prints the feminine.
		</>
	),
	"ācer, ācris, ācre": (
		<>
			The only class with a separate form for each gender in the nominative
			singular.
		</>
	),
	"fortis, forte": (
		<>
			The commonest of the three classes. One form does masculine and feminine
			throughout — <LatinWord>fortis</LatinWord>, <LatinWord>fortem</LatinWord>,{" "}
			<LatinWord>fortēs</LatinWord> — and the neuter differs in the nominative
			and accusative only, as every neuter does.
		</>
	),
	"fēlīx, fēlīcis": (
		<>
			One form for all three genders in the nominative, which is why the
			dictionary prints the genitive as the second form: nothing in{" "}
			<LatinWord>fēlīx</LatinWord> shows the stem <LatinWord>fēlīc-</LatinWord>.
			A handful of one-termination adjectives are consonant stems rather than
			i-stems — <LatinWord>vetus, veteris</LatinWord>,{" "}
			<LatinWord>pauper</LatinWord>, <LatinWord>dīves</LatinWord> — and those
			decline with <LatinWord>-e</LatinWord> in the ablative singular,{" "}
			<LatinWord>-um</LatinWord> in the genitive plural and{" "}
			<LatinWord>-a</LatinWord> in the neuter plural:{" "}
			<LatinWord>vetere</LatinWord>, <LatinWord>veterum</LatinWord>,{" "}
			<LatinWord>vetera</LatinWord>.
		</>
	),
};

function Paradigm({ paradigm }: { paradigm: AdjectiveParadigm }) {
	const { lemma, english, label, singular, plural } = paradigm;

	const rows = (forms: AdjectiveParadigm["singular"]) =>
		ADJECTIVE_CASES.map((grammaticalCase) => ({
			id: grammaticalCase,
			cells: {
				grammaticalCase,
				m: <LatinWord>{forms[grammaticalCase].m}</LatinWord>,
				f: <LatinWord>{forms[grammaticalCase].f}</LatinWord>,
				n: <LatinWord>{forms[grammaticalCase].n}</LatinWord>,
			},
		}));

	return (
		<div className="space-y-4">
			<Heading
				variant="h4"
				className="mx-auto text-center uppercase tracking-wide"
			>
				<LatinWord className="normal-case">{lemma}</LatinWord>{" "}
				<span className="font-normal text-ink-500 normal-case">
					({label}) — {english}
				</span>
			</Heading>
			{/* Singular and plural are two tables rather than one six-column grid:
			    the Table header is a single row, so a six-column version would
			    have to label a column "M" twice and leave the reader to work out
			    which half is which. */}
			<div className="grid items-start gap-8 lg:grid-cols-2">
				<Table
					caption="Singular"
					columns={ADJECTIVE_COLUMNS}
					rows={rows(singular)}
				/>
				<Table
					caption="Plural"
					columns={ADJECTIVE_COLUMNS}
					rows={rows(plural)}
				/>
			</div>
			<p className="mx-auto max-w-4xl text-base text-ink-500 leading-relaxed">
				{NOTES[lemma]}
			</p>
		</div>
	);
}

export function Adjectives() {
	return (
		<section
			id="adjectives"
			aria-labelledby="adjectives-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-8"
		>
			<Heading
				id="adjectives-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Adiectīva
			</Heading>
			<p>
				An adjective agrees with its noun in case, number and gender, but not in
				declension. It borrows nothing from the noun beside it except those
				three answers, and then takes whichever endings its own class gives it.
				So a first-declension noun can carry a third-declension adjective and a
				third-declension noun a first-and-second one:{" "}
				<LatinWord>fīlia fortis</LatinWord>, <LatinWord>urbs pulchra</LatinWord>
				, and <LatinWord>nauta bonus</LatinWord> — masculine, on a noun that
				looks like <LatinWord>fīlia</LatinWord> all the way down.
			</p>
			<p>
				There are only two families, and the dictionary line says which one a
				word is in. What the second form is doing there is what separates the
				classes:
			</p>
			<Table
				caption="Reading the dictionary line. fortis, forte and vetus, veteris both print two forms and are not the same class."
				columns={FILING_COLUMNS}
				rows={FILING_ROWS}
				className="mx-auto max-w-5xl"
			/>

			<Heading
				variant="h4"
				as="h3"
				className="mx-auto pt-4 text-center uppercase tracking-wide"
			>
				First and second declension{" "}
				<span className="font-normal text-ink-500 normal-case">
					(the 2-1-2 adjectives)
				</span>
			</Heading>
			<p className="mx-auto max-w-3xl text-center">
				A separate form for each gender, built out of endings already on this
				page: second declension for the masculine and the neuter, first
				declension for the feminine.
			</p>
			{FIRST_SECOND.map((paradigm) => (
				<Paradigm key={paradigm.lemma} paradigm={paradigm} />
			))}

			<Heading
				variant="h4"
				as="h3"
				className="mx-auto pt-4 text-center uppercase tracking-wide"
			>
				Third declension{" "}
				<span className="font-normal text-ink-500 normal-case">
					(one, two or three terminations)
				</span>
			</Heading>
			<p className="mx-auto max-w-3xl text-center">
				These are i-stems, so they differ from the third-declension nouns above
				in three cells: <LatinWord>-ī</LatinWord> in the ablative singular,{" "}
				<LatinWord>-ium</LatinWord> in the genitive plural and{" "}
				<LatinWord>-ia</LatinWord> in the neuter plural. The class is counted by
				how many forms the nominative singular has.
			</p>
			{THIRD.map((paradigm) => (
				<Paradigm key={paradigm.lemma} paradigm={paradigm} />
			))}

			<p className="mx-auto max-w-4xl text-base text-ink-500 leading-relaxed">
				The vocative is not printed above because it is the nominative again in
				every cell but one: the masculine singular of the{" "}
				<LatinWord>bonus</LatinWord> type, which is <LatinWord>bone</LatinWord>{" "}
				— and <LatinWord>meus</LatinWord> is <LatinWord>mī</LatinWord>. The
				accusative plural of an i-stem is also found as{" "}
				<LatinWord>-īs</LatinWord> — <LatinWord>fortīs</LatinWord>,{" "}
				<LatinWord>ācrīs</LatinWord> — mostly in verse.
			</p>
		</section>
	);
}
