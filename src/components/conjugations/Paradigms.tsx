import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import {
	CONJUGATION_GROUPS,
	type ConjugationGroup,
} from "./Conjugations.utils";
import { Verb } from "./Verb";

// JSX rather than strings for the reason Paradigms.tsx on /declensions gives:
// nearly every sentence names a Latin form, and each needs lang="la".

const BLURBS: Record<string, React.ReactNode> = {
	"First conjugation": (
		<>
			Verbs whose stem ends in a long <LatinWord>ā</LatinWord>. It is the
			largest group and the most regular.
		</>
	),
	"Second conjugation": (
		<>
			A stem in long <LatinWord>ē</LatinWord>: <LatinWord>monēre</LatinWord>.
			Unlike the <LatinWord>ā</LatinWord> of the first conjugation, the vowel
			survives in front of the <LatinWord>-ō</LatinWord>, so the dictionary
			entry starts <LatinWord>-eō</LatinWord>.
		</>
	),
	"Third conjugation": (
		<>
			No stem vowel at all. Its infinitive <LatinWord>dūcere</LatinWord> is
			spelled like <LatinWord>monēre</LatinWord> with the macron taken off, and
			the macron is the only thing that tells the two groups apart.
		</>
	),
	"Fourth conjugation": (
		<>
			A stem in long <LatinWord>ī</LatinWord>: <LatinWord>audīre</LatinWord>.
			Like the second conjugation it keeps its vowel in front of the{" "}
			<LatinWord>-ō</LatinWord>, and it shows it again before the{" "}
			<LatinWord>-unt</LatinWord> of the third person plural.
		</>
	),
	"Mixed conjugation": (
		<>
			Third-conjugation verbs whose first principal part ends in{" "}
			<LatinWord>-iō</LatinWord>. They keep an <LatinWord>i</LatinWord> in front
			of another vowel, as the fourth conjugation does —{" "}
			<LatinWord>capiō</LatinWord>, <LatinWord>capiunt</LatinWord> like{" "}
			<LatinWord>audiō</LatinWord>, <LatinWord>audiunt</LatinWord> — and are
			third conjugation everywhere else.
		</>
	),
};

// Keyed by lemma, one set per table. A verb without one follows its pattern.
const PRESENT_NOTES: Record<string, React.ReactNode> = {
	salūtō: <></>,
	moneō: (
		<>
			In the imperfect and the future the <LatinWord>ē</LatinWord> stays long in
			every person: <LatinWord>monēbam</LatinWord>,{" "}
			<LatinWord>monēbant</LatinWord>, <LatinWord>monēbō</LatinWord>,{" "}
			<LatinWord>monēbunt</LatinWord>.
		</>
	),
	dūcō: (
		<>
			The future has no <LatinWord>b</LatinWord>: <LatinWord>-am</LatinWord> and
			then a long <LatinWord>ē</LatinWord>, short before{" "}
			<LatinWord>-t</LatinWord> and <LatinWord>-nt</LatinWord>. So{" "}
			<LatinWord>dūcēs</LatinWord>, <em>you will lead</em>, ends like the
			present <LatinWord>monēs</LatinWord>, <em>you warn</em>, and only the
			conjugation tells you which tense it is.
		</>
	),
	audiō: (
		<>
			The <LatinWord>i</LatinWord> of <LatinWord>audit</LatinWord> is short
			because of the <LatinWord>-t</LatinWord>, and the one in{" "}
			<LatinWord>audiō</LatinWord> and <LatinWord>audiunt</LatinWord> because a
			vowel in front of another vowel is short in Latin. The future follows the
			third conjugation, with the <LatinWord>i</LatinWord> in front:{" "}
			<LatinWord>audiam</LatinWord>, <LatinWord>audiēs</LatinWord>. Early Latin
			also had <LatinWord>audībō</LatinWord>, made like{" "}
			<LatinWord>monēbō</LatinWord>.
		</>
	),
	capiō: (
		<>
			Put it beside <LatinWord>audiō</LatinWord>: <LatinWord>capis</LatinWord>,{" "}
			<LatinWord>capimus</LatinWord>, <LatinWord>capitis</LatinWord> are short
			where <LatinWord>audīs</LatinWord>, <LatinWord>audīmus</LatinWord>,{" "}
			<LatinWord>audītis</LatinWord> are long. In those three forms the vowel
			length is all that separates the two groups. The imperfect and the future
			are the the same as the fourth conjugation.
		</>
	),
};

const PERFECT_NOTES: Record<string, React.ReactNode> = {
	salūtō: (
		<>
			The regular first-conjugation perfect: a <LatinWord>v</LatinWord> after
			the stem vowel, <LatinWord>salūtā-</LatinWord> + <LatinWord>v-</LatinWord>
			. Speech often dropped the <LatinWord>v</LatinWord> and writers kept the
			short forms: <LatinWord>salūtāstī</LatinWord>,{" "}
			<LatinWord>salūtārunt</LatinWord>, <LatinWord>salūtāram</LatinWord>,{" "}
			<LatinWord>salūtārō</LatinWord>. The pluperfect endings look like the
			imperfect of <LatinWord>sum</LatinWord> (<LatinWord>eram</LatinWord>,{" "}
			<LatinWord>erās</LatinWord>…) and the future perfect ones like its future
			(<LatinWord>erō</LatinWord>, <LatinWord>eris</LatinWord>…), except in the
			third person plural: <LatinWord>salūtāverint</LatinWord>, not{" "}
			<LatinWord>-erunt</LatinWord>.
		</>
	),
	moneō: (
		<>
			The <LatinWord>ē</LatinWord> of the stem gives way to a{" "}
			<LatinWord>u</LatinWord>: <LatinWord>monu-</LatinWord>. That is the
			commonest second-conjugation perfect but far from the only one —{" "}
			<LatinWord>videō</LatinWord> has <LatinWord>vīdī</LatinWord>,{" "}
			<LatinWord>maneō</LatinWord> has <LatinWord>mānsī</LatinWord>.
		</>
	),
	dūcō: (
		<>
			An s-perfect: <LatinWord>dūc-</LatinWord> + <LatinWord>s</LatinWord>,
			which Latin writes <LatinWord>x</LatinWord>. The third conjugation has no
			one way of making a perfect, so the third principal part is the only safe
			guide.
		</>
	),
	audiō: (
		<>
			Made like the first conjugation, with a <LatinWord>v</LatinWord> after the
			long <LatinWord>ī</LatinWord>. Forms without the <LatinWord>v</LatinWord>{" "}
			are common as well: <LatinWord>audiī</LatinWord>,{" "}
			<LatinWord>audiistī</LatinWord>, <LatinWord>audiit</LatinWord>, and in the
			pluperfect and future perfect <LatinWord>audieram</LatinWord>,{" "}
			<LatinWord>audierō</LatinWord>.
		</>
	),
	capiō: (
		<>
			The perfect changes the root itself: <LatinWord>cap-</LatinWord> becomes{" "}
			<LatinWord>cēp-</LatinWord>, and the <LatinWord>i</LatinWord> of the
			present is gone. So <LatinWord>capiēs</LatinWord>, <em>you will take</em>,
			and <LatinWord>cēperis</LatinWord>, <em>you will have taken</em>, share no
			stem at all.
		</>
	),
};

function Group({ title, stem, verbs }: ConjugationGroup) {
	return (
		<div className="space-y-6">
			<Heading
				variant="h4"
				as="h3"
				className="mx-auto text-center uppercase tracking-wide"
			>
				{title}{" "}
				<span className="font-normal text-ink-600 normal-case">({stem})</span>
			</Heading>
			<p className="mx-auto max-w-3xl text-center">{BLURBS[title]}</p>
			{verbs.map((verb) => {
				const [lemma] = verb.principalParts;
				return (
					<Verb
						key={lemma}
						verb={verb}
						notes={{
							present: PRESENT_NOTES[lemma],
							perfect: PERFECT_NOTES[lemma],
						}}
					/>
				);
			})}
		</div>
	);
}

export function Paradigms() {
	return (
		<section
			id="conjugations"
			aria-labelledby="conjugations-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-12 px-4 sm:px-8"
		>
			<Heading
				id="conjugations-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
			>
				The conjugations
			</Heading>
			{CONJUGATION_GROUPS.map((group) => (
				<Group key={group.title} {...group} />
			))}
		</section>
	);
}
