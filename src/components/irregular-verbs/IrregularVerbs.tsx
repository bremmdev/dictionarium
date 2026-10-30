import { Verb } from "#/components/conjugations/Verb";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { IRREGULAR_VERBS, type IrregularVerb } from "./IrregularVerbs.utils";

// Keyed by lemma, like the notes in conjugations/Paradigms.tsx.
const BLURBS: Record<string, React.ReactNode> = {
	sum: (
		<>
			The commonest verb in Latin. Its present system has no stem vowel and two
			forms of the root, <LatinWord>es-</LatinWord> and{" "}
			<LatinWord>s-</LatinWord>. The fourth principal part is{" "}
			<LatinWord>futūrus</LatinWord>, the future participle, because{" "}
			<LatinWord>sum</LatinWord> has no supine and no passive.
		</>
	),
};

const PRESENT_NOTES: Record<string, React.ReactNode> = {
	sum: (
		<>
			The root is <LatinWord>es-</LatinWord> in <LatinWord>es</LatinWord>,{" "}
			<LatinWord>est</LatinWord>, <LatinWord>estis</LatinWord> and plain{" "}
			<LatinWord>s-</LatinWord> in <LatinWord>sum</LatinWord>,{" "}
			<LatinWord>sumus</LatinWord>, <LatinWord>sunt</LatinWord>. The imperfect
			and the future run on <LatinWord>er-</LatinWord> because of rhotacism: in
			early Latin a single <LatinWord>s</LatinWord> between two vowels turned
			into <LatinWord>r</LatinWord>, so <LatinWord>*esam</LatinWord> became{" "}
			<LatinWord>eram</LatinWord> and <LatinWord>*esō</LatinWord> became{" "}
			<LatinWord>erō</LatinWord>. The same change explains{" "}
			<LatinWord>genus, generis</LatinWord> and{" "}
			<LatinWord>flōs, flōris</LatinWord>, and the <LatinWord>-re</LatinWord> of
			every other infinitive: <LatinWord>amāre</LatinWord> was once{" "}
			<LatinWord>*amāse</LatinWord>.
		</>
	),
};

const PERFECT_NOTES: Record<string, React.ReactNode> = {
	sum: (
		<>
			Regular throughout: <LatinWord>fu-</LatinWord> takes the endings every
			perfect stem does.
		</>
	),
};

const COMPOUND_NOTES: Record<string, React.ReactNode> = {
	sum: (
		<>
			The prefix never merges with the verb, so the compounds conjugate exactly
			like <LatinWord>sum</LatinWord>: <LatinWord>abest</LatinWord>,{" "}
			<LatinWord>aderant</LatinWord>, <LatinWord>dēfuerit</LatinWord>.{" "}
			<LatinWord>prōsum</LatinWord> keeps an old <LatinWord>prōd-</LatinWord>{" "}
			before a vowel — <LatinWord>prōdest</LatinWord>,{" "}
			<LatinWord>prōderam</LatinWord>, <LatinWord>prōdesse</LatinWord>, but{" "}
			<LatinWord>prōsunt</LatinWord>, <LatinWord>prōfuī</LatinWord>. Most take a
			dative: <LatinWord>adesse amīcō</LatinWord>, <em>to stand by a friend</em>
			; <LatinWord>praeesse exercituī</LatinWord>, <em>to command the army</em>.
		</>
	),
};

const COMPOUND_COLUMNS = [
	{ key: "compound", label: "Compound" },
	{ key: "english", label: "Meaning" },
];

function Compounds({ verb }: { verb: IrregularVerb }) {
	const [lemma] = verb.principalParts;
	if (!verb.compounds) return null;

	const rows = verb.compounds.map(({ principalParts, english }) => ({
		id: principalParts,
		cells: { compound: <LatinWord>{principalParts}</LatinWord>, english },
	}));

	return (
		<div className="mx-auto max-w-4xl space-y-4">
			<Heading variant="h4" as="h3" className="text-center">
				Compounds of <LatinWord>{lemma}</LatinWord>
			</Heading>
			<p>{COMPOUND_NOTES[lemma]}</p>
			<Table
				caption={
					<>
						Compounds of <span lang="la">{lemma}</span>
					</>
				}
				columns={COMPOUND_COLUMNS}
				rows={rows}
			/>
		</div>
	);
}

function IrregularVerbSection({ verb }: { verb: IrregularVerb }) {
	const [lemma] = verb.principalParts;
	const headingId = `${verb.id}-heading`;

	return (
		<section
			id={verb.id}
			aria-labelledby={headingId}
			className="scroll-mt-8 mx-auto max-w-page-width space-y-12 px-4 sm:px-8"
		>
			<div className="space-y-6">
				<Heading
					id={headingId}
					variant="h2"
					className="mx-auto text-center uppercase tracking-wide"
				>
					<span lang="la">{lemma}</span>{" "}
					<span className="font-normal text-ink-600 normal-case">
						(to {verb.english})
					</span>
				</Heading>
				<p className="mx-auto max-w-3xl text-center">{BLURBS[lemma]}</p>
			</div>
			<Verb
				verb={verb}
				headingAs="h3"
				notes={{
					present: PRESENT_NOTES[lemma],
					perfect: PERFECT_NOTES[lemma],
				}}
			/>
			<Compounds verb={verb} />
		</section>
	);
}

export function IrregularVerbs() {
	return IRREGULAR_VERBS.map((verb) => (
		<IrregularVerbSection key={verb.id} verb={verb} />
	));
}
