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
	possum: (
		<>
			<LatinWord>pot-</LatinWord>, from the adjective{" "}
			<LatinWord>potis</LatinWord>, <em>able</em>, joined to{" "}
			<LatinWord>sum</LatinWord>: <em>I am able</em>, <em>I can</em>. It has no
			supine, no future participle and no passive, so it files only three
			principal parts. It usually takes an infinitive:{" "}
			<LatinWord>venīre nōn possum</LatinWord>, <em>I cannot come</em>.
		</>
	),
	eō: (
		<>
			The verb of going, built on a bare root <LatinWord>i-</LatinWord> with no
			stem vowel of its own. Being intransitive, it has a passive only in the
			impersonal third person singular: <LatinWord>ītur</LatinWord>,{" "}
			<em>people are going</em>; <LatinWord>itum est</LatinWord>,{" "}
			<em>people went</em>.
		</>
	),
	ferō: (
		<>
			<em>Bear</em>, <em>carry</em>, <em>bring</em>. Its parts come from two
			roots: <LatinWord>ferō</LatinWord> from one, <LatinWord>tulī</LatinWord>{" "}
			and <LatinWord>lātum</LatinWord> from the root of{" "}
			<LatinWord>tollō</LatinWord>, <em>raise</em>. Unlike{" "}
			<LatinWord>sum</LatinWord> and <LatinWord>eō</LatinWord> it has a full
			passive: <LatinWord>feror</LatinWord>, <LatinWord>ferris</LatinWord>,{" "}
			<LatinWord>fertur</LatinWord>, <em>I am carried</em> and so on.
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
	possum: (
		<>
			Each form is <LatinWord>pot-</LatinWord> plus the same form of{" "}
			<LatinWord>sum</LatinWord>. Before a vowel the <LatinWord>t</LatinWord>{" "}
			stays: <LatinWord>potes</LatinWord>, <LatinWord>potest</LatinWord>,{" "}
			<LatinWord>poteram</LatinWord>, <LatinWord>poterō</LatinWord>. Before{" "}
			<LatinWord>s</LatinWord> it turns into <LatinWord>s</LatinWord> too, so{" "}
			<LatinWord>*potsum</LatinWord> became <LatinWord>possum</LatinWord>, and
			likewise <LatinWord>possumus</LatinWord>, <LatinWord>possunt</LatinWord>.
			The infinitive <LatinWord>posse</LatinWord> comes from an older{" "}
			<LatinWord>potesse</LatinWord>.
		</>
	),
	eō: (
		<>
			The root is <LatinWord>ī-</LatinWord> before a consonant and{" "}
			<LatinWord>e-</LatinWord> before a vowel: <LatinWord>īs</LatinWord>,{" "}
			<LatinWord>īmus</LatinWord>, <LatinWord>ībam</LatinWord>, but{" "}
			<LatinWord>eō</LatinWord>, <LatinWord>eunt</LatinWord>. The third singular{" "}
			<LatinWord>it</LatinWord> is short because a long vowel shortens before a
			final <LatinWord>t</LatinWord>, as in <LatinWord>amat</LatinWord>. The
			future takes <LatinWord>-bō</LatinWord> like the first and second
			conjugations, not the <LatinWord>-am</LatinWord> of the third and fourth:{" "}
			<LatinWord>ībō</LatinWord>, <LatinWord>ībit</LatinWord>.
		</>
	),
	ferō: (
		<>
			A third-conjugation verb that drops the connecting vowel before{" "}
			<LatinWord>s</LatinWord>, <LatinWord>t</LatinWord> and{" "}
			<LatinWord>r</LatinWord>: <LatinWord>fers</LatinWord>,{" "}
			<LatinWord>fert</LatinWord>, <LatinWord>fertis</LatinWord> and the
			infinitive <LatinWord>ferre</LatinWord>. The passive does the same.
			Elsewhere it is regular.
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
	possum: (
		<>
			<LatinWord>potuī</LatinWord> is not <LatinWord>pot-</LatinWord> plus{" "}
			<LatinWord>fuī</LatinWord>: it comes from an obsolete verb{" "}
			<LatinWord>potēre</LatinWord>. From the stem <LatinWord>potu-</LatinWord>{" "}
			on, the endings are the regular ones.
		</>
	),
	eō: (
		<>
			The stem is a bare <LatinWord>i-</LatinWord> and takes the regular
			endings: <LatinWord>iī</LatinWord>, <LatinWord>iit</LatinWord>,{" "}
			<LatinWord>ieram</LatinWord>, <LatinWord>ierō</LatinWord>. Before{" "}
			<LatinWord>s</LatinWord> the two <LatinWord>i</LatinWord>s usually merge
			into one long <LatinWord>ī</LatinWord>: <LatinWord>īstī</LatinWord>,{" "}
			<LatinWord>īstis</LatinWord>, and the infinitive{" "}
			<LatinWord>īsse</LatinWord>. Some grammars give a perfect{" "}
			<LatinWord>īvī</LatinWord> as well (<LatinWord>īvit</LatinWord>,{" "}
			<LatinWord>īverat</LatinWord>), but it is very rare in the simple verb.
		</>
	),
	ferō: (
		<>
			<LatinWord>tulī</LatinWord> belongs to another verb, but from the stem{" "}
			<LatinWord>tul-</LatinWord> on the endings are the regular ones. Early
			Latin had a reduplicated perfect <LatinWord>tetulī</LatinWord>, like{" "}
			<LatinWord>tetigī</LatinWord> from <LatinWord>tangō</LatinWord>.
		</>
	),
};

const SUBJUNCTIVE_PRESENT_NOTES: Record<string, React.ReactNode> = {
	sum: (
		<>
			The present has an <LatinWord>ī</LatinWord>, not the{" "}
			<LatinWord>ē</LatinWord> or <LatinWord>ā</LatinWord> of the regular verbs:{" "}
			<LatinWord>sīs</LatinWord>, <LatinWord>sīmus</LatinWord>,{" "}
			<LatinWord>sītis</LatinWord>, short before <LatinWord>-m</LatinWord>,{" "}
			<LatinWord>-t</LatinWord> and <LatinWord>-nt</LatinWord>. Early Latin also
			had <LatinWord>siem</LatinWord>, <LatinWord>siēs</LatinWord>,{" "}
			<LatinWord>siet</LatinWord>, <LatinWord>sient</LatinWord> and{" "}
			<LatinWord>fuam</LatinWord>, <LatinWord>fuās</LatinWord>,{" "}
			<LatinWord>fuat</LatinWord>, <LatinWord>fuant</LatinWord>. The imperfect
			is the infinitive with the endings on it, as in every verb:{" "}
			<LatinWord>esse</LatinWord> + <LatinWord>-m</LatinWord>. Often{" "}
			<LatinWord>forem</LatinWord>, <LatinWord>forēs</LatinWord>,{" "}
			<LatinWord>foret</LatinWord>, <LatinWord>forent</LatinWord> stand in for
			it, as <LatinWord>fore</LatinWord> does for{" "}
			<LatinWord>futūrum esse</LatinWord>.
		</>
	),
};

const SUBJUNCTIVE_PERFECT_NOTES: Record<string, React.ReactNode> = {
	sum: (
		<>
			Regular here too: <LatinWord>fuerim</LatinWord> like{" "}
			<LatinWord>salūtāverim</LatinWord>, and the pluperfect is the perfect
			infinitive <LatinWord>fuisse</LatinWord> with the endings on it.
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
	eō: (
		<>
			The compounds conjugate like <LatinWord>eō</LatinWord>:{" "}
			<LatinWord>abit</LatinWord>, <LatinWord>exībant</LatinWord>,{" "}
			<LatinWord>rediērunt</LatinWord>. Like <LatinWord>prōsum</LatinWord>,{" "}
			<LatinWord>prōdeō</LatinWord> keeps its old <LatinWord>d</LatinWord>, and
			since every form of <LatinWord>eō</LatinWord> starts with a vowel it keeps
			it throughout: <LatinWord>prōdīs</LatinWord>,{" "}
			<LatinWord>prōdit</LatinWord>. Compounds that take an object, such as{" "}
			<LatinWord>adeō</LatinWord>, <LatinWord>ineō</LatinWord> and{" "}
			<LatinWord>trānseō</LatinWord>, have a full passive:{" "}
			<LatinWord>urbs adītur</LatinWord>, <em>the city is approached</em>.
		</>
	),
	ferō: (
		<>
			The compounds conjugate like <LatinWord>ferō</LatinWord>, but the prefix
			often takes on the next consonant, so it changes with the stem:{" "}
			<LatinWord>afferō</LatinWord>, <LatinWord>attulī</LatinWord>,{" "}
			<LatinWord>allātum</LatinWord>; <LatinWord>īnferō</LatinWord>,{" "}
			<LatinWord>intulī</LatinWord>, <LatinWord>illātum</LatinWord>.{" "}
			<LatinWord>ab-</LatinWord> becomes <LatinWord>au-</LatinWord> and{" "}
			<LatinWord>abs-</LatinWord>: <LatinWord>auferō</LatinWord>,{" "}
			<LatinWord>abstulī</LatinWord>, <LatinWord>ablātum</LatinWord>.
			Unassimilated spellings such as <LatinWord>adferō</LatinWord> occur too.{" "}
			<LatinWord>referō</LatinWord> keeps the old reduplication as a double{" "}
			<LatinWord>t</LatinWord>: <LatinWord>rettulī</LatinWord>.
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
					indicative: {
						present: PRESENT_NOTES[lemma],
						perfect: PERFECT_NOTES[lemma],
					},
					subjunctive: {
						present: SUBJUNCTIVE_PRESENT_NOTES[lemma],
						perfect: SUBJUNCTIVE_PERFECT_NOTES[lemma],
					},
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
