import { ADJECTIVE_CASES } from "#/components/declensions/Adjectives.utils";
import { PARADIGM_COLUMNS } from "#/components/declensions/Declensions.utils";
import { GenderedParadigm } from "#/components/declensions/GenderedParadigm";
import { FormCell } from "#/components/FormCell";
import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { TextLink } from "#/components/TextLink";
import {
	DEIXIS,
	DEIXIS_COLUMNS,
	DEMONSTRATIVES,
	type GenderedPronoun,
	INTENSIVE_AND_IDENTITY,
	PERSONAL,
	type PersonalForms,
	type PersonalPronoun,
	POSSESSIVES,
	PRONOMINAL_ADJECTIVE_COLUMNS,
	PRONOMINAL_ADJECTIVE_PARADIGMS,
	PRONOMINAL_ADJECTIVES,
	PRONOMINAL_CELLS,
	PRONOMINAL_COLUMNS,
} from "./Pronouns.utils";

// Checked against Allen & Greenough §§ 113, 142–146, 295–302, and the forms
// against Wiktionary.

// Keyed by lemma, like the notes on /grammar/irregular-verbs.
const BLURBS: Record<string, React.ReactNode> = {
	"meus, mea, meum": (
		<>
			<em>My</em>, the possessive of <LatinWord>ego</LatinWord>:{" "}
			<LatinWord>domus mea</LatinWord>, <em>my house</em>.
		</>
	),
	"tuus, tua, tuum": (
		<>
			<em>Your</em>, when the owner is one person:{" "}
			<LatinWord>domus tua</LatinWord>. For several, it is{" "}
			<LatinWord>vester</LatinWord>.
		</>
	),
	"suus, sua, suum": (
		<>
			<em>His</em>, <em>her</em>, <em>its</em> or <em>their own</em>: the
			possessive of the reflexive <LatinWord>suī</LatinWord>, and like it, it
			looks back to the subject.{" "}
			<LatinWord>Caesar suās cōpiās subdūcit</LatinWord>,{" "}
			<em>Caesar leads up his troops</em>. Anyone else's is the genitive of{" "}
			<LatinWord>is</LatinWord>: <LatinWord>patrem suum occīdit</LatinWord>,{" "}
			<em>he killed his own father</em>, but{" "}
			<LatinWord>patrem eius occīdit</LatinWord>, <em>he killed his father</em>,
			someone else's.
		</>
	),
	"noster, nostra, nostrum": (
		<>
			<em>Our</em>, the possessive of <LatinWord>nōs</LatinWord>:{" "}
			<LatinWord>pater noster</LatinWord>, <em>our father</em>.
		</>
	),
	"vester, vestra, vestrum": (
		<>
			<em>Your</em>, when the owner is several people:{" "}
			<LatinWord>domus vestra</LatinWord>, <em>your house</em>, said to a
			family.
		</>
	),
	"hic, haec, hoc": (
		<>
			What is near the speaker, in place, time or thought, which makes it the
			demonstrative of the first person: <LatinWord>hic liber</LatinWord>,{" "}
			<em>this book</em>. Set against <LatinWord>ille</LatinWord> it is often{" "}
			<em>the latter</em>, the nearer of two things just named.
		</>
	),
	"iste, ista, istud": (
		<>
			What is near the person spoken to, the demonstrative of the second person:{" "}
			<LatinWord>iste liber</LatinWord>, <em>that book of yours</em>. In a
			speech it is the word for the opponent, and it often carries contempt.
		</>
	),
	"ille, illa, illud": (
		<>
			What is far off, the demonstrative of the third person:{" "}
			<LatinWord>ille liber</LatinWord>, <em>that book over there</em>. After
			its noun it can mean <em>that famous</em>; set against{" "}
			<LatinWord>hic</LatinWord> it is <em>the former</em>; and the neuter{" "}
			<LatinWord>illud</LatinWord> often points ahead, <em>the following</em>.
		</>
	),
	"is, ea, id": (
		<>
			The weakest of the four. It points at nothing in particular, only back at
			something just mentioned or ahead to a relative clause:{" "}
			<LatinWord>is quī</LatinWord>, <em>the man who</em>. That makes it the
			everyday <em>he, she, it</em>. The verb ending usually says who the
			subject is, so it is in the other cases that you meet it most:{" "}
			<LatinWord>eum videō</LatinWord>, <em>I see him</em>;{" "}
			<LatinWord>liber eius</LatinWord>, <em>his book</em> or <em>her book</em>.
		</>
	),
	"ipse, ipsa, ipsum": (
		<>
			Intensive: it leans on the word it goes with.{" "}
			<LatinWord>rēx ipse vēnit</LatinWord>, <em>the king himself came</em>;{" "}
			<LatinWord>id ipsum</LatinWord>, <em>that very thing</em>. It is not the
			reflexive. The <em>himself</em> of <em>he hurts himself</em> is{" "}
			<LatinWord>sē</LatinWord>; <LatinWord>ipse</LatinWord> is the{" "}
			<em>himself</em> of <em>he came himself</em>.
		</>
	),
	"tōtus, tōta, tōtum": (
		<>
			<em>Whole</em>, <em>all of</em>: <LatinWord>tōta Gallia</LatinWord>,{" "}
			<em>the whole of Gaul</em>. The pattern for the nine:{" "}
			<LatinWord>bonus</LatinWord> in every cell but the genitive and dative
			singular.
		</>
	),
	"alius, alia, aliud": (
		<>
			<em>Other</em>, <em>another</em>, one of any number:{" "}
			<LatinWord>aliud tempus</LatinWord>, <em>another time</em>. Doubled, it
			shares a group out: <LatinWord>aliī … aliī</LatinWord>,{" "}
			<em>some … others</em>. Where there are only two, the other one is{" "}
			<LatinWord>alter</LatinWord>.
		</>
	),
	"īdem, eadem, idem": (
		<>
			<LatinWord>is</LatinWord> with the ending <LatinWord>-dem</LatinWord>,
			which never changes: <em>the same</em>. <LatinWord>īdem rēx</LatinWord>,{" "}
			<em>the same king</em>; <LatinWord>eadem via</LatinWord>,{" "}
			<em>the same road</em>.
		</>
	),
};

const NOTES: Record<string, React.ReactNode> = {
	"meus, mea, meum": (
		<>
			The masculine vocative singular is <LatinWord>mī</LatinWord>, rarely{" "}
			<LatinWord>meus</LatinWord>: <LatinWord>mī fīlī</LatinWord>,{" "}
			<em>my son</em>. The masculine plural <LatinWord>meī</LatinWord> is
			spelled like the genitive of <LatinWord>ego</LatinWord>, and the sentence
			tells them apart: <LatinWord>meī amīcī</LatinWord>, <em>my friends</em>,
			against <LatinWord>memor meī</LatinWord>, <em>mindful of me</em>.
		</>
	),
	"suus, sua, suum": (
		<>
			It agrees with the thing owned, never with the owner, so nothing in{" "}
			<LatinWord>suam fīliam amat</LatinWord> says whether a father or a mother
			is meant. Where the point is <em>their own and no one else's</em>,{" "}
			<LatinWord>suus</LatinWord> can stand anywhere in the sentence.
		</>
	),
	"noster, nostra, nostrum": (
		<>
			Declined like <LatinWord>pulcher</LatinWord>: the stem{" "}
			<LatinWord>nostr-</LatinWord> keeps no <LatinWord>e</LatinWord> outside
			the masculine nominative singular. As a noun the plural{" "}
			<LatinWord>nostrī</LatinWord> means <em>our men</em>, <em>our side</em>.
		</>
	),
	"ille, illa, illud": (
		<>
			The model for the pronominal declension: the endings at the top of this
			page are <LatinWord>ille</LatinWord> with <LatinWord>ill-</LatinWord>{" "}
			taken off.
		</>
	),
	"is, ea, id": (
		<>
			The stem is <LatinWord>i-</LatinWord> in <LatinWord>is</LatinWord> and{" "}
			<LatinWord>id</LatinWord> and <LatinWord>e-</LatinWord> everywhere else,
			and the genitive and dative singular are the pronominal ones on it:{" "}
			<LatinWord>eius</LatinWord>, <LatinWord>eī</LatinWord>.{" "}
			<LatinWord>eī</LatinWord>, <LatinWord>iī</LatinWord> and{" "}
			<LatinWord>ī</LatinWord> in the plural are one word spelled three ways: by
			classical times it was said as a single syllable, written{" "}
			<LatinWord>ei</LatinWord> under the Republic and <LatinWord>ii</LatinWord>{" "}
			after it. <LatinWord>eīs</LatinWord>, <LatinWord>iīs</LatinWord> and{" "}
			<LatinWord>īs</LatinWord> are the same. The ablative{" "}
			<LatinWord>eō</LatinWord> is also the adverb <em>to there</em> in the
			table above, and the verb <em>I go</em>.
		</>
	),
	"ipse, ipsa, ipsum": (
		<>
			It declines like <LatinWord>ille</LatinWord> except in the neuter
			singular, which is <LatinWord>ipsum</LatinWord> where{" "}
			<LatinWord>illud</LatinWord> would lead you to expect{" "}
			<LatinWord>ipsud</LatinWord>, a form only medieval Latin uses.
		</>
	),
	"īdem, eadem, idem": (
		<>
			Decline <LatinWord>is</LatinWord> and add <LatinWord>-dem</LatinWord>,
			with three adjustments. An <LatinWord>m</LatinWord> turns into{" "}
			<LatinWord>n</LatinWord> before the <LatinWord>d</LatinWord>:{" "}
			<LatinWord>eundem</LatinWord>, <LatinWord>eandem</LatinWord>,{" "}
			<LatinWord>eōrundem</LatinWord>, though <LatinWord>eumdem</LatinWord> is
			found too. The masculine <LatinWord>īdem</LatinWord> stands for{" "}
			<LatinWord>*isdem</LatinWord>: the <LatinWord>s</LatinWord> dropped out
			and lengthened the <LatinWord>i</LatinWord>. The neuter{" "}
			<LatinWord>idem</LatinWord> keeps its short <LatinWord>i</LatinWord>, so
			the macron is the only thing telling the two apart. The plural doublets
			are those of <LatinWord>is</LatinWord>.
		</>
	),
	"tōtus, tōta, tōtum": (
		<>
			Against <LatinWord>ille</LatinWord>, it keeps the nominatives of{" "}
			<LatinWord>bonus</LatinWord>: <LatinWord>tōtus</LatinWord> and{" "}
			<LatinWord>tōtum</LatinWord>, never <LatinWord>*tōte</LatinWord> or{" "}
			<LatinWord>*tōtud</LatinWord>.
		</>
	),
	"alius, alia, aliud": (
		<>
			The neuter is <LatinWord>aliud</LatinWord>, like{" "}
			<LatinWord>illud</LatinWord>. The genitive of its own,{" "}
			<LatinWord>alīus</LatinWord>, is rare: Latin borrows{" "}
			<LatinWord>alterīus</LatinWord> from <LatinWord>alter</LatinWord>, or for{" "}
			<em>someone else's</em> uses the adjective <LatinWord>aliēnus</LatinWord>.
		</>
	),
};

/** Under each personal pronoun's table, keyed by id. */
const PERSONAL_NOTES: Record<string, React.ReactNode> = {
	ego: (
		<>
			The plural <LatinWord>nōs</LatinWord> often stands for{" "}
			<LatinWord>ego</LatinWord>, the way an author writes <em>we</em>.{" "}
		</>
	),
	tu: (
		<>
			<LatinWord>tū</LatinWord> and <LatinWord>vōs</LatinWord> are also the
			vocatives, the one case these tables leave out. Unlike{" "}
			<LatinWord>nōs</LatinWord>, <LatinWord>vōs</LatinWord> is never said to
			one person.
		</>
	),
	sui: (
		<>
			It refers back to the subject of its clause, so it has no nominative, and
			one set of forms serves both numbers and all three genders.
		</>
	),
};

/** suī's missing nominative: a dash on screen, words for a screen reader. */
function PersonalCell({ cell }: { cell: PersonalForms[keyof PersonalForms] }) {
	if (cell === null) {
		return (
			<>
				<span aria-hidden="true">—</span>
				<span className="sr-only">no form</span>
			</>
		);
	}
	return <FormCell {...cell} />;
}

function Personal({ pronoun }: { pronoun: PersonalPronoun }) {
	const { id, lemma, english, singular, plural } = pronoun;
	const rows = ADJECTIVE_CASES.map((grammaticalCase) => ({
		id: grammaticalCase,
		cells: {
			grammaticalCase,
			singular: <PersonalCell cell={singular[grammaticalCase]} />,
			plural: <PersonalCell cell={plural[grammaticalCase]} />,
		},
	}));

	return (
		// The pronoun is the caption, as with the nouns on /grammar/declensions,
		// so a screen reader hears "ego, nōs — I, we" on entering the table.
		<div id={id} className="scroll-mt-8 min-w-0 space-y-3">
			<Table
				caption={
					<>
						<LatinWord className="text-base md:text-lg">{lemma}</LatinWord>
						{` — ${english}`}
					</>
				}
				columns={PARADIGM_COLUMNS}
				rows={rows}
			/>
			<p className="text-base text-ink-600 leading-relaxed">
				{PERSONAL_NOTES[id]}
			</p>
		</div>
	);
}

const PRONOMINAL_ROWS = PRONOMINAL_CELLS.map(
	({ id, slot, bonus, ille, ipse }) => ({
		id,
		cells: {
			slot,
			bonus: <LatinWord>{bonus}</LatinWord>,
			ille: <LatinWord>{ille}</LatinWord>,
			ipse: <LatinWord>{ipse}</LatinWord>,
		},
	}),
);

// The column labels are Latin words, so they carry the lang too.
const PRONOMINAL_COLUMNS_LA = PRONOMINAL_COLUMNS.map((column) =>
	column.key === "slot"
		? column
		: { ...column, label: <span lang="la">{column.label}</span> },
);

function Adverb({ la, en }: { la: string; en: string }) {
	return (
		<>
			<LatinWord>{la}</LatinWord>
			<span className="block text-ink-600 text-sm md:text-base">{en}</span>
		</>
	);
}

const DEIXIS_ROWS = DEIXIS.map(
	({ id, pronoun, near, where, whither, whence }) => ({
		id,
		cells: {
			pronoun: <LatinWord>{pronoun}</LatinWord>,
			near,
			where: <Adverb {...where} />,
			whither: <Adverb {...whither} />,
			whence: <Adverb {...whence} />,
		},
	}),
);

function Pronoun({ pronoun }: { pronoun: GenderedPronoun }) {
	const { id, lemma, english, singular, plural } = pronoun;
	return (
		<div id={id} className="scroll-mt-8">
			<GenderedParadigm
				headingAs="h3"
				abbreviate
				title={
					<>
						<LatinWord className="normal-case">{lemma}</LatinWord>{" "}
						<span className="font-normal text-ink-600 normal-case">
							— {english}
						</span>
					</>
				}
				lemma={lemma}
				singular={singular}
				plural={plural}
				intro={BLURBS[lemma]}
				note={NOTES[lemma]}
			/>
		</div>
	);
}

const PRONOMINAL_ADJECTIVE_ROWS = PRONOMINAL_ADJECTIVES.map(
	({ lemma, english, genitive, dative }) => ({
		id: lemma,
		cells: {
			lemma: <LatinWord>{lemma}</LatinWord>,
			english,
			genitive: <FormCell {...genitive} />,
			dative: <FormCell {...dative} />,
		},
	}),
);

const SECTION = "scroll-mt-8 mx-auto max-w-page-width space-y-8 px-4 sm:px-8";
const H2 = "mx-auto text-center uppercase tracking-wide";

export function Pronominal() {
	return (
		<section
			id="pronominal"
			aria-labelledby="pronominal-heading"
			className={SECTION}
		>
			<Heading id="pronominal-heading" variant="h2" className={H2} lang="la">
				Dēclīnātiō prōnōminālis
			</Heading>
			<p>
				Most pronouns decline on one pattern, and you know most of it already:
				it is <LatinWord>bonus, bona, bonum</LatinWord> with a handful of cells
				changed. The genitive singular is <LatinWord>-īus</LatinWord> and the
				dative singular <LatinWord>-ī</LatinWord>, the same in all three
				genders, and the neuter ends in <LatinWord>-d</LatinWord>. Learn{" "}
				<LatinWord>ille</LatinWord> and you have <LatinWord>iste</LatinWord> and
				nearly all of <LatinWord>ipse</LatinWord>;{" "}
				<TextLink to="/grammar/pronouns" hash="pronominal-adjectives">
					nine adjectives
				</TextLink>
				, among them <LatinWord>ūnus</LatinWord> and{" "}
				<LatinWord>tōtus</LatinWord>, borrow the same genitive and dative.
			</p>
			<Table
				caption={
					<>
						Where <span lang="la">ille</span> and <span lang="la">ipse</span>{" "}
						part from <span lang="la">bonus</span>. Every other cell is{" "}
						<span lang="la">bonus</span> on another stem.
					</>
				}
				columns={PRONOMINAL_COLUMNS_LA}
				rows={PRONOMINAL_ROWS}
				className="mx-auto max-w-5xl"
			/>
			<p className="mx-auto max-w-4xl text-base text-ink-600 leading-relaxed">
				The <LatinWord>ī</LatinWord> of <LatinWord>-īus</LatinWord> is long in
				prose and often short in verse, <LatinWord>illius</LatinWord>.{" "}
				<LatinWord>hic</LatinWord> and <LatinWord>is</LatinWord> keep their own
				shapes, but the same genitive and dative show through:{" "}
				<LatinWord>huius</LatinWord>, <LatinWord>huic</LatinWord>;{" "}
				<LatinWord>eius</LatinWord>, <LatinWord>eī</LatinWord>.
			</p>
		</section>
	);
}

export function PersonalPronouns() {
	return (
		<section
			id="personal"
			aria-labelledby="personal-heading"
			className={SECTION}
		>
			<Heading id="personal-heading" variant="h2" className={H2} lang="la">
				Persōnālia
			</Heading>
			<p>
				Latin has personal pronouns for the first and second persons only:{" "}
				<LatinWord>ego</LatinWord>, <em>I</em>, and <LatinWord>tū</LatinWord>,{" "}
				<em>you</em>, with their plurals <LatinWord>nōs</LatinWord> and{" "}
				<LatinWord>vōs</LatinWord>. There is none for <em>he</em>, <em>she</em>{" "}
				or <em>they</em>; a demonstrative stands in, most often{" "}
				<LatinWord>is</LatinWord>. The one pronoun of the third person is the
				reflexive <LatinWord>suī</LatinWord>, <em>himself</em>. None of the
				three follows the pattern above.
			</p>
			<p>
				The verb ending already says who the subject is, so{" "}
				<LatinWord>ego</LatinWord> and <LatinWord>tū</LatinWord> are said only
				for contrast or emphasis: <LatinWord>tē vocō</LatinWord>,{" "}
				<em>I am calling you</em>, but{" "}
				<LatinWord>quis mē vocat? ego tē vocō</LatinWord>,{" "}
				<em>who is calling me? I am calling you</em>.
			</p>
			<div className="grid items-start gap-10 lg:grid-cols-2 2xl:grid-cols-3">
				{PERSONAL.map((pronoun) => (
					<Personal key={pronoun.id} pronoun={pronoun} />
				))}
			</div>
			<p>
				With <LatinWord>cum</LatinWord> the pronoun comes first and the two are
				written as one word: <LatinWord>mēcum</LatinWord>,{" "}
				<LatinWord>tēcum</LatinWord>, <LatinWord>sēcum</LatinWord>,{" "}
				<LatinWord>nōbīscum</LatinWord>, <LatinWord>vōbīscum</LatinWord>,{" "}
				<em>with me</em>, <em>with you</em> and so on. Every case but the
				genitive plural can take <LatinWord>-met</LatinWord> for emphasis,{" "}
				<LatinWord>egomet</LatinWord>, <LatinWord>vōsmet</LatinWord>, and{" "}
				<LatinWord>tū</LatinWord> has <LatinWord>tūte</LatinWord>.
			</p>
		</section>
	);
}

export function Possessives() {
	return (
		<section
			id="possessives"
			aria-labelledby="possessives-heading"
			className={SECTION}
		>
			<Heading id="possessives-heading" variant="h2" className={H2} lang="la">
				Possessīva
			</Heading>
			<p>
				Each personal pronoun has an adjective for <em>whose</em>:{" "}
				<LatinWord>meus</LatinWord>, <LatinWord>tuus</LatinWord>,{" "}
				<LatinWord>suus</LatinWord>, <LatinWord>noster</LatinWord>,{" "}
				<LatinWord>vester</LatinWord>. They decline like{" "}
				<LatinWord>bonus</LatinWord> and agree with the thing owned, not with
				its owner: <LatinWord>haec ōrnāmenta sunt mea</LatinWord>,{" "}
				<em>these are my jewels</em>, says a woman, in the neuter plural to
				match <LatinWord>ōrnāmenta</LatinWord>. For <em>my</em> Latin uses the
				possessive, not the genitive of the pronoun:{" "}
				<LatinWord>domus mea</LatinWord>, never <LatinWord>domus meī</LatinWord>
				. And where the owner is obvious it leaves the possessive out:{" "}
				<LatinWord>socium fraudāvit</LatinWord>, <em>he cheated his partner</em>
				.
			</p>
			{POSSESSIVES.map((pronoun) => (
				<Pronoun key={pronoun.id} pronoun={pronoun} />
			))}
		</section>
	);
}

export function Demonstratives() {
	return (
		<section
			id="demonstratives"
			aria-labelledby="demonstratives-heading"
			className={SECTION}
		>
			<Heading
				id="demonstratives-heading"
				variant="h2"
				className={H2}
				lang="la"
			>
				Dēmōnstrātīva
			</Heading>
			<p>
				A demonstrative points. Latin has one for each person, the way its verbs
				do: <LatinWord>hic</LatinWord> for what is near me,{" "}
				<LatinWord>iste</LatinWord> for what is near you,{" "}
				<LatinWord>ille</LatinWord> for what is away from us both.{" "}
				<LatinWord>is</LatinWord> points at nothing, only back at what was just
				said. Each has a set of place adverbs to go with it.
			</p>
			<Table
				caption="Four demonstratives and their adverbs of place."
				columns={DEIXIS_COLUMNS}
				rows={DEIXIS_ROWS}
				className="mx-auto max-w-5xl"
			/>
			<p>
				Any of them can stand alone, <LatinWord>hic</LatinWord>,{" "}
				<em>this man</em>, or go with a noun, and then it agrees with it like an
				adjective: <LatinWord>hic liber</LatinWord>,{" "}
				<LatinWord>haec puella</LatinWord>, <LatinWord>hoc bellum</LatinWord>.
			</p>
			{DEMONSTRATIVES.map((pronoun) => (
				<Pronoun key={pronoun.id} pronoun={pronoun} />
			))}
		</section>
	);
}

export function IntensiveAndIdentity() {
	return (
		<section
			id="identity"
			aria-labelledby="identity-heading"
			className={SECTION}
		>
			<Heading id="identity-heading" variant="h2" className={H2} lang="la">
				Ipse et īdem
			</Heading>
			<p>
				Two words built on <LatinWord>is</LatinWord>.{" "}
				<LatinWord>ipse</LatinWord> adds weight to a word,{" "}
				<em>this one and no other</em>. <LatinWord>īdem</LatinWord> says it is
				the one already met, <em>the same again</em>.
			</p>
			{INTENSIVE_AND_IDENTITY.map((pronoun) => (
				<Pronoun key={pronoun.id} pronoun={pronoun} />
			))}
		</section>
	);
}

export function PronominalAdjectives() {
	return (
		<section
			id="pronominal-adjectives"
			aria-labelledby="pronominal-adjectives-heading"
			className={SECTION}
		>
			<Heading
				id="pronominal-adjectives-heading"
				variant="h2"
				className={H2}
				lang="la"
			>
				Adiectīva prōnōminālia
			</Heading>
			<p>
				Nine adjectives decline like <LatinWord>bonus</LatinWord> except in the
				genitive and dative singular, where they take the pronominal{" "}
				<LatinWord>-īus</LatinWord> and <LatinWord>-ī</LatinWord> in all three
				genders: <LatinWord>tōtīus</LatinWord>, <LatinWord>tōtī</LatinWord>. The
				plural is <LatinWord>bonus</LatinWord>'s throughout. In the order below,
				their first letters spell the schoolroom mnemonic{" "}
				<span lang="la">UNUS NAUTA</span>.
			</p>
			<Table
				caption={
					<>
						The nine, with the two cells where they part from{" "}
						<span lang="la">bonus</span>.
					</>
				}
				columns={PRONOMINAL_ADJECTIVE_COLUMNS}
				rows={PRONOMINAL_ADJECTIVE_ROWS}
				className="mx-auto max-w-5xl"
			/>
			<p className="mx-auto max-w-4xl text-base text-ink-600 leading-relaxed">
				Their compounds decline the same way: <LatinWord>uterque</LatinWord>,{" "}
				<em>each of two</em>, has <LatinWord>utrīusque</LatinWord>,{" "}
				<LatinWord>utrīque</LatinWord>. As with <LatinWord>ille</LatinWord>, the{" "}
				<LatinWord>ī</LatinWord> of <LatinWord>-īus</LatinWord> can be short in
				verse, often in <LatinWord>alterius</LatinWord> and always in{" "}
				<LatinWord>utriusque</LatinWord>. The regular forms of{" "}
				<LatinWord>bonus</LatinWord> turn up now and then too, such as{" "}
				<LatinWord>aliae</LatinWord> and <LatinWord>aliō</LatinWord>.{" "}
				<LatinWord>neuter</LatinWord> as a grammar term, <em>neuter</em> gender,
				is an ordinary adjective: <LatinWord>neutrī generis</LatinWord>.
			</p>
			{PRONOMINAL_ADJECTIVE_PARADIGMS.map((pronoun) => (
				<Pronoun key={pronoun.id} pronoun={pronoun} />
			))}
		</section>
	);
}
