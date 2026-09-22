import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { type DeclensionGroup, DECLENSION_GROUPS } from "./Declensions.utils";
import { Paradigm } from "./Paradigm";

// The prose is JSX rather than strings in Declensions.utils.ts for one reason:
// almost every sentence here names a Latin form, and vault/a11y.md asks that
// every run of Latin carry lang="la". A data string cannot hold that markup.

const BLURBS: Record<string, React.ReactNode> = {
	"First declension": (
		<>
			One pattern, almost all of it feminine, and the easiest to recognise with
			the thematic <LatinWord>a</LatinWord>.
		</>
	),
	"Second declension": (
		<>
			Masculine in <LatinWord>-us</LatinWord> and <LatinWord>-er</LatinWord>,
			neuter in <LatinWord>-um</LatinWord>. It is named for its{" "}
			<LatinWord>o</LatinWord>, which is plain in <LatinWord>dominō</LatinWord>{" "}
			and <LatinWord>dominōrum</LatinWord> and surfaces as a short{" "}
			<LatinWord>u</LatinWord> everywhere else — <LatinWord>dominus</LatinWord>,{" "}
			<LatinWord>dominum</LatinWord>, <LatinWord>bellum</LatinWord>. The
			masculines and the neuter share every ending except the nominative,
			accusative and vocative, where the neuter rule takes over.
		</>
	),
	"Third declension": (
		<>
			The largest declension and the loosest: any gender, and a nominative
			singular with no fixed ending at all: it can come out in{" "}
			<LatinWord>-a, -e, -ī, -ō, -y, -c, -l, -n, -r, -s, -t</LatinWord> or{" "}
			<LatinWord>-x</LatinWord>, so it has to be memorised with the word. Learn
			the stem from the genitive and the rest follows.
		</>
	),
	"Fourth declension": (
		<>
			Mostly masculine with <LatinWord>u</LatinWord> as thematic vowel. It is
			similar to the third declension with a <LatinWord>u</LatinWord> where the{" "}
			<LatinWord>i</LatinWord> would be. A great many of its nouns are made from
			verbs, off the stem that ends in <LatinWord>-tus</LatinWord> or{" "}
			<LatinWord>-sus</LatinWord>: <LatinWord>cantus</LatinWord> from{" "}
			<LatinWord>canō</LatinWord>, <LatinWord>cāsus</LatinWord> from{" "}
			<LatinWord>cadō, cadere, cecidī, cāsum</LatinWord>. It also stays close
			enough to the second declension that Roman writers mixed the two
			themselves, which is how <LatinWord>domus</LatinWord> ended up with two
			sets of forms.
		</>
	),
	"Fifth declension": (
		<>
			The smallest declension, feminine except for <LatinWord>diēs</LatinWord>,
			which is usually masculine. Most of its nouns are seldom met in the plural
			at all. Only <LatinWord>rēs</LatinWord> and <LatinWord>diēs</LatinWord>{" "}
			are common words in the plural.
		</>
	),
};

/** Keyed by lemma. A noun without one simply follows its pattern. */
const NOTES: Record<string, React.ReactNode> = {
	fīlia: (
		<>
			The nominative and the ablative singular are the same letters and differ
			only in vowel length: <LatinWord>fīlia</LatinWord> against{" "}
			<LatinWord>fīliā</LatinWord>. <LatinWord>fīlia</LatinWord> and{" "}
			<LatinWord>dea</LatinWord> also keep an older dative and ablative plural,{" "}
			<LatinWord>fīliābus</LatinWord> and <LatinWord>deābus</LatinWord>, used
			where <LatinWord>fīliīs</LatinWord> and <LatinWord>deīs</LatinWord> would
			be taken for the sons and the gods.
		</>
	),
	dominus: (
		<>
			This is the one place in Latin where the vocative is not simply the
			nominative again: <LatinWord>-us</LatinWord> becomes{" "}
			<LatinWord>-e</LatinWord> in the singular. Nouns in{" "}
			<LatinWord>-ius</LatinWord> contract instead —{" "}
			<LatinWord>fīlius</LatinWord> is addressed as <LatinWord>fīlī</LatinWord>.
		</>
	),
	puer: (
		<>
			The <LatinWord>-r</LatinWord> nouns differ from{" "}
			<LatinWord>dominus</LatinWord> in the nominative and vocative singular
			alone. <LatinWord>puer</LatinWord> keeps its <LatinWord>e</LatinWord>{" "}
			throughout, but most do not: <LatinWord>ager</LatinWord> has{" "}
			<LatinWord>agrī</LatinWord>, <LatinWord>agrō</LatinWord>,{" "}
			<LatinWord>agrum</LatinWord>.
		</>
	),
	prīnceps: (
		<>
			A consonant stem: <LatinWord>prīncip-</LatinWord> is only visible from the
			genitive on, which is why the nominative has to be learnt as a form of its
			own. Consonant stems take <LatinWord>-um</LatinWord> in the genitive
			plural — the i-stems beside them take <LatinWord>-ium</LatinWord>.
		</>
	),
	urbs: (
		<>
			An i-stem, because the stem <LatinWord>urb-</LatinWord> ends in two
			consonants. The only cell that gives that away is the genitive plural{" "}
			<LatinWord>-ium</LatinWord>; the older accusative plural{" "}
			<LatinWord>urbīs</LatinWord> is common in verse.
		</>
	),
	nōmen: (
		<>
			Neuter, so the nominative, accusative and vocative are one form —{" "}
			<LatinWord>nōmen</LatinWord> in the singular,{" "}
			<LatinWord>nōmina</LatinWord> in the plural. That holds for every neuter
			noun in Latin.
		</>
	),
	manus: (
		<>
			Six of the twelve cells are spelled <LatinWord>manus</LatinWord> or{" "}
			<LatinWord>manūs</LatinWord>, so the macron is carrying the grammar.
		</>
	),
	domus: (
		<>
			The one noun that never settled: fourth declension with a full set of
			second-declension forms beside it, and both are correct Latin.
		</>
	),
	genū: (
		<>
			The neuters flatten the whole singular to <LatinWord>genū</LatinWord> and
			take <LatinWord>-ua</LatinWord>, <LatinWord>-ibus</LatinWord> in the
			plural. There are only a handful of them, most notably{" "}
			<LatinWord>genū</LatinWord> and <LatinWord>cornū</LatinWord>.
		</>
	),
	rēs: (
		<>
			The <LatinWord>e</LatinWord> of the genitive and dative singular is long
			only after a vowel — <LatinWord>diēī</LatinWord>, but{" "}
			<LatinWord>reī</LatinWord> and <LatinWord>fideī</LatinWord>.{" "}
			<LatinWord>rēs</LatinWord> and <LatinWord>diēs</LatinWord> are the only
			two nouns of this declension used in every case of the plural.
		</>
	),
};

// An odd paradigm left over on the last row of the two-column layout. It spans
// both columns and is then pulled back to one column's width — 50% less half
// the 2.5rem gap — so it sits centred under the pair at its own size rather
// than stretched across the row or stranded on the left. Three columns fit all
// three paradigms on one row, so the span is undone at 2xl.
const ORPHAN =
	"lg:col-span-2 lg:mx-auto lg:w-[calc(50%-1.25rem)] 2xl:col-span-1 2xl:mx-0 2xl:w-auto";

function Group({ title, stem, paradigms }: DeclensionGroup) {
	// Only an odd count leaves a row short in two columns.
	const hasOrphan = paradigms.length > 1 && paradigms.length % 2 === 1;

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
			{/* A lone paradigm is a column of its own width; a set of them sits in
			    a grid. It splits late — a paradigm needs about 30rem before
			    prīncipibus starts scrolling inside its own cell, so two columns
			    wait for lg and three for 2xl. Each keeps its own <table>, so a
			    screen reader still reads a row as one case of one noun. */}
			<div
				className={
					paradigms.length === 1
						? "mx-auto max-w-2xl"
						: "grid items-start gap-10 lg:grid-cols-2 2xl:grid-cols-3"
				}
			>
				{paradigms.map((paradigm, i) => (
					<Paradigm
						key={paradigm.lemma}
						paradigm={paradigm}
						note={NOTES[paradigm.lemma]}
						className={
							hasOrphan && i === paradigms.length - 1 ? ORPHAN : undefined
						}
					/>
				))}
			</div>
		</div>
	);
}

export function Paradigms() {
	return (
		<section
			id="declensions"
			aria-labelledby="declensions-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-12 px-4 sm:px-8"
		>
			<Heading
				id="declensions-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
			>
				The five declensions
			</Heading>
			{DECLENSION_GROUPS.map((group) => (
				<Group key={group.title} {...group} />
			))}
		</section>
	);
}
