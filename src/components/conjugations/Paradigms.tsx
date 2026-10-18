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
			Verbs whose stem ends in a long <LatinWord>ā</LatinWord>, plain in the
			infinitive <LatinWord>salūtāre</LatinWord>. It is the largest group and
			the most regular, and the one Latin kept adding new verbs to.
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
			No stem vowel at all: <LatinWord>dūc-</LatinWord> ends in a consonant, and
			a short vowel joins it to the endings — <LatinWord>i</LatinWord> in most
			persons, <LatinWord>u</LatinWord> before <LatinWord>-nt</LatinWord>. Its
			infinitive <LatinWord>dūcere</LatinWord> is spelled like{" "}
			<LatinWord>monēre</LatinWord> with the macron taken off, and the macron is
			the only thing that tells the two groups apart.
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
			third conjugation everywhere else, short vowels and the infinitive{" "}
			<LatinWord>capere</LatinWord> included.
		</>
	),
};

// Keyed by lemma, one set per table. A verb without one follows its pattern.
const PRESENT_NOTES: Record<string, React.ReactNode> = {
	salūtō: (
		<>
			The <LatinWord>ā</LatinWord> of the stem is swallowed by the{" "}
			<LatinWord>-ō</LatinWord> — <LatinWord>salūtō</LatinWord>, not{" "}
			<LatinWord>salūtāō</LatinWord> — and shortens before{" "}
			<LatinWord>-t</LatinWord> and <LatinWord>-nt</LatinWord>:{" "}
			<LatinWord>salūtās</LatinWord> but <LatinWord>salūtat</LatinWord>,{" "}
			<LatinWord>salūtant</LatinWord>. The imperfect adds{" "}
			<LatinWord>-bā-</LatinWord>, whose <LatinWord>ā</LatinWord> shortens the
			same way and before a final <LatinWord>-m</LatinWord> too:{" "}
			<LatinWord>salūtābās</LatinWord> but <LatinWord>salūtābam</LatinWord>,{" "}
			<LatinWord>salūtābat</LatinWord>, <LatinWord>salūtābant</LatinWord>.
		</>
	),
	moneō: (
		<>
			Long everywhere but at the edges: <LatinWord>monēs</LatinWord>,{" "}
			<LatinWord>monēmus</LatinWord>, <LatinWord>monētis</LatinWord> against the
			short <LatinWord>e</LatinWord> of <LatinWord>moneō</LatinWord>,{" "}
			<LatinWord>monet</LatinWord> and <LatinWord>monent</LatinWord>. In the
			imperfect the <LatinWord>ē</LatinWord> stays long in every person:{" "}
			<LatinWord>monēbam</LatinWord>, <LatinWord>monēbant</LatinWord>.
		</>
	),
	dūcō: (
		<>
			Set it beside <LatinWord>moneō</LatinWord>: <LatinWord>dūcis</LatinWord>,{" "}
			<LatinWord>dūcimus</LatinWord> against <LatinWord>monēs</LatinWord>,{" "}
			<LatinWord>monēmus</LatinWord>. In the imperfect the two meet:{" "}
			<LatinWord>dūcēbam</LatinWord> takes a long <LatinWord>ē</LatinWord>{" "}
			exactly like <LatinWord>monēbam</LatinWord>. The <LatinWord>ū</LatinWord>{" "}
			of <LatinWord>dūc-</LatinWord> is long all through the present system, but
			not in the supine: <LatinWord>ductum</LatinWord>.
		</>
	),
	audiō: (
		<>
			The <LatinWord>i</LatinWord> of <LatinWord>audit</LatinWord> is short
			because of the <LatinWord>-t</LatinWord>, and the one in{" "}
			<LatinWord>audiō</LatinWord> and <LatinWord>audiunt</LatinWord> because a
			vowel in front of another vowel is short in Latin. Everywhere else in the
			present it is long. The imperfect puts an <LatinWord>ē</LatinWord> after
			it, so the <LatinWord>i</LatinWord> is short all through:{" "}
			<LatinWord>audiēbam</LatinWord>.
		</>
	),
	capiō: (
		<>
			Put it beside <LatinWord>audiō</LatinWord>: <LatinWord>capis</LatinWord>,{" "}
			<LatinWord>capimus</LatinWord>, <LatinWord>capitis</LatinWord> are short
			where <LatinWord>audīs</LatinWord>, <LatinWord>audīmus</LatinWord>,{" "}
			<LatinWord>audītis</LatinWord> are long. In those three forms the vowel
			length is all that separates the two groups. The imperfect is the fourth
			conjugation's outright: <LatinWord>capiēbam</LatinWord> like{" "}
			<LatinWord>audiēbam</LatinWord>.
		</>
	),
};

const PERFECT_NOTES: Record<string, React.ReactNode> = {
	salūtō: (
		<>
			The regular first-conjugation perfect: a <LatinWord>v</LatinWord> after
			the stem vowel, <LatinWord>salūtā-</LatinWord> + <LatinWord>v-</LatinWord>
			. Speech often dropped the <LatinWord>v</LatinWord> and ran the vowels
			together, and writers kept the short forms:{" "}
			<LatinWord>salūtāstī</LatinWord>, <LatinWord>salūtārunt</LatinWord>,{" "}
			<LatinWord>salūtāram</LatinWord>. The pluperfect endings look like the
			imperfect of <LatinWord>sum</LatinWord>, <LatinWord>eram</LatinWord>,{" "}
			<LatinWord>erās</LatinWord>, <LatinWord>erat</LatinWord>, and their{" "}
			<LatinWord>ā</LatinWord> shortens as the imperfect's{" "}
			<LatinWord>-bā-</LatinWord> does: <LatinWord>salūtāverās</LatinWord> but{" "}
			<LatinWord>salūtāveram</LatinWord>, <LatinWord>salūtāverat</LatinWord>,{" "}
			<LatinWord>salūtāverant</LatinWord>.
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
			pluperfect <LatinWord>audieram</LatinWord>.
		</>
	),
	capiō: (
		<>
			The perfect changes the root itself: <LatinWord>cap-</LatinWord> becomes{" "}
			<LatinWord>cēp-</LatinWord>, and the <LatinWord>i</LatinWord> of the
			present is gone. In the perfect and the pluperfect the mixed conjugation
			is no different from any other, because every verb takes the same endings
			there.
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
