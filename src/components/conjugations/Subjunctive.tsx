import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import {
	CONJUGATION_GROUPS,
	type RegularConjugation,
} from "./Conjugations.utils";

// Checked against Allen & Greenough §§ 154, 157, 439, 441–447, 483–484,
// 515–517, 531, 533, 537–538, 545–547, 549 and 574.

const MOOD_COLUMNS = [
	{ key: "mood", label: "Mood" },
	{ key: "use", label: "Used for" },
	{ key: "example", label: "Example" },
];

const MOOD_ROWS = [
	{
		id: "indicative",
		la: "indicātīvus",
		en: "indicative",
		use: "statements and questions: what is, was or will be",
		example: "salūtat",
		english: "he greets",
	},
	{
		id: "imperative",
		la: "imperātīvus",
		en: "imperative",
		use: "orders",
		example: "salūtā",
		english: "greet!",
	},
	{
		id: "subjunctive",
		la: "coniūnctīvus",
		en: "subjunctive",
		use: "what is wanted, wondered or only possible, and most clauses that hang on another verb",
		example: "salūtet",
		english: "let him greet",
	},
].map(({ id, la, en, use, example, english }) => ({
	id,
	cells: {
		mood: (
			<>
				<LatinWord>{la}</LatinWord> <span className="text-ink-600">({en})</span>
			</>
		),
		use,
		example: (
			<>
				<LatinWord>{example}</LatinWord>, <em>{english}</em>
			</>
		),
	},
}));

/** The vowel of each group's present subjunctive, and its letters in "we fear a liar". */
const VOWELS: Record<
	RegularConjugation,
	{ label: string; vowel: string; word: [string, string, string] }
> = {
	"1": { label: "1st", vowel: "e", word: ["w", "e", ""] },
	"2": { label: "2nd", vowel: "ea", word: ["f", "ea", "r"] },
	"3": { label: "3rd", vowel: "a", word: ["", "a", ""] },
	"4": { label: "4th", vowel: "ia", word: ["l", "ia", "r"] },
	"3io": { label: "Mixed", vowel: "ia", word: ["l", "ia", "r"] },
};

const VOWEL_COLUMNS = [
	{ key: "conjugation", label: "Conjugation" },
	{ key: "indicative", label: "Indicative" },
	{ key: "subjunctive", label: "Subjunctive" },
	{ key: "vowel", label: "Vowel" },
	{ key: "word", label: "Mnemonic" },
];

// Read off the paradigms, so this table cannot disagree with them.
const VOWEL_ROWS = CONJUGATION_GROUPS.map(({ conjugation, verbs }) => {
	const [verb] = verbs;
	const { label, vowel, word } = VOWELS[conjugation];
	const [before, marked, after] = word;
	return {
		id: conjugation,
		cells: {
			conjugation: label,
			indicative: (
				<LatinWord>{verb.indicative.active?.present?.["3sg"].form}</LatinWord>
			),
			subjunctive: (
				<LatinWord>{verb.subjunctive?.active?.present?.["3sg"].form}</LatinWord>
			),
			vowel: <LatinWord>{vowel}</LatinWord>,
			word: (
				<>
					{before}
					<strong className="font-semibold text-accent">{marked}</strong>
					{after}
				</>
			),
		},
	};
});

function Example({ la, en, tense }: { la: string; en: string; tense: string }) {
	return (
		<>
			<LatinWord>{la}</LatinWord>
			<span className="block text-ink-600">
				<em>{en}</em>
			</span>
			<span className="block text-ink-600 text-sm">{tense}</span>
		</>
	);
}

const SEQUENCE_COLUMNS = [
	{ key: "main", label: "Main verb" },
	{ key: "same", label: "Same time" },
	{ key: "before", label: "Earlier" },
];

const SEQUENCE_ROWS = [
	{
		id: "primary",
		cells: {
			main: "Present or future",
			same: (
				<Example
					la="sciō quid faciās"
					en="I know what you are doing"
					tense="present subjunctive"
				/>
			),
			before: (
				<Example
					la="sciō quid fēcerīs"
					en="I know what you have done"
					tense="perfect subjunctive"
				/>
			),
		},
	},
	{
		id: "secondary",
		cells: {
			main: "Past",
			same: (
				<Example
					la="sciēbam quid facerēs"
					en="I knew what you were doing"
					tense="imperfect subjunctive"
				/>
			),
			before: (
				<Example
					la="sciēbam quid fēcissēs"
					en="I knew what you had done"
					tense="pluperfect subjunctive"
				/>
			),
		},
	},
];

const LEAD = "font-semibold text-ink-900";

export function Subjunctive() {
	return (
		<section
			id="subjunctive"
			aria-labelledby="subjunctive-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-4 sm:px-8"
		>
			<Heading
				id="subjunctive-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Coniūnctīvus
			</Heading>
			<p>
				A Latin verb has three moods that take personal endings. The indicative
				states things and asks about them, the imperative gives orders, and the
				subjunctive covers almost everything else.
			</p>
			<Table
				caption="The three moods of salūtō."
				columns={MOOD_COLUMNS}
				rows={MOOD_ROWS}
				className="mx-auto max-w-4xl"
			/>
			<p>
				The subjunctive is often called the mood of the unreal, but that is only
				part of it. It is often translated by a plain English indicative: a
				result clause states a fact, and a reported question asks about one. The
				Latin name is a better guide. <LatinWord>coniūnctīvus</LatinWord> comes
				from <LatinWord>coniungō</LatinWord>, <em>to join</em>, and most
				subjunctives stand in a clause joined to another verb. Its uses fall
				into a handful of types, each with its own signal word or position.
			</p>

			<Heading variant="h4" as="h3" className="mx-auto max-w-3xl">
				Spotting the present subjunctive
			</Heading>
			<p className="mx-auto max-w-3xl">
				The present subjunctive swaps the vowel before the ending. Read the new
				vowels down the groups and they spell <em>we fear a liar</em>. The first
				conjugation is the only one without an <LatinWord>a</LatinWord>.
			</p>
			<Table
				caption="The third person singular of each example verb, indicative against subjunctive."
				columns={VOWEL_COLUMNS}
				rows={VOWEL_ROWS}
				nowrap
				className="mx-auto max-w-4xl"
			/>

			<Heading variant="h4" as="h3" className="mx-auto max-w-3xl">
				On its own
			</Heading>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
				<p>
					<strong className={LEAD}>Let us, let them.</strong> The imperative
					mostly speaks to <em>you</em>. For <em>let us</em> and{" "}
					<em>let them</em> Latin uses the present subjunctive, called hortatory
					or jussive: <LatinWord>eāmus</LatinWord>, <em>let us go</em>. Dido in
					the <cite>Aeneid</cite> puts the two moods side by side:{" "}
					<LatinWord>moriēmur inultae, sed moriāmur</LatinWord>,{" "}
					<em>we shall die unavenged — but let us die</em>.
				</p>
				<p>
					<strong className={LEAD}>Wishes.</strong> The present wishes for
					something that may still happen:{" "}
					<LatinWord>valeant cīvēs meī; sint incolumēs</LatinWord>,{" "}
					<em>farewell to my fellow citizens; may they be safe from harm</em>.
					With <LatinWord>utinam</LatinWord>, the imperfect wishes for what is
					not so now and the pluperfect for what was not so:{" "}
					<LatinWord>utinam Clōdius vīveret</LatinWord>,{" "}
					<em>would that Clodius were alive</em>;{" "}
					<LatinWord>utinam mē mortuum vīdissēs</LatinWord>,{" "}
					<em>would you had seen me dead</em>.
				</p>
				<p>
					<strong className={LEAD}>Questions to yourself.</strong> The
					deliberative subjunctive asks what to do:{" "}
					<LatinWord>quid agam, iūdicēs? quō mē vertam?</LatinWord>,{" "}
					<em>what am I to do, judges? Which way shall I turn?</em> In the past
					it becomes <LatinWord>quid facerem?</LatinWord>,{" "}
					<em>what was I to do?</em>.
				</p>
				<p>
					<strong className={LEAD}>Might, would, could.</strong> The potential
					subjunctive puts something forward as only possible:{" "}
					<LatinWord>aliquis dīcat</LatinWord>, <em>somebody may say</em>. It is
					narrower than the English. It is mostly found in polite first persons
					like <LatinWord>velim</LatinWord>, <em>I should like</em>, and in a
					general <em>you</em>: <LatinWord>crēderēs victōs</LatinWord>,{" "}
					<em>you would have thought them beaten</em>.
				</p>
			</div>

			<Heading variant="h4" as="h3" className="mx-auto max-w-3xl">
				In a joined clause
			</Heading>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
				<p>
					<strong className={LEAD}>
						Purpose, with <LatinWord>ut</LatinWord> or <LatinWord>nē</LatinWord>
						.
					</strong>{" "}
					Latin prose never uses a plain infinitive for a purpose:{" "}
					<LatinWord>veniō ut tē salūtem</LatinWord>,{" "}
					<em>I come to greet you</em>, literally{" "}
					<em>so that I may greet you</em>;{" "}
					<LatinWord>fugiō nē mē capiant</LatinWord>,{" "}
					<em>I run away so that they don't catch me</em>. The clause says what
					was aimed at, not what came of it.
				</p>
				<p>
					<strong className={LEAD}>
						Result, with <LatinWord>ut</LatinWord> or{" "}
						<LatinWord>ut nōn</LatinWord>,
					</strong>{" "}
					usually after <LatinWord>tam</LatinWord>, <LatinWord>ita</LatinWord>,{" "}
					<LatinWord>tantus</LatinWord> or <LatinWord>adeō</LatinWord>:{" "}
					<LatinWord>tam clārē clāmat ut omnēs eum audiant</LatinWord>,{" "}
					<em>he shouts so loudly that everyone hears him</em>. Here the
					subjunctive states a fact. In the affirmative purpose and result look
					the same, and only the negative tells them apart:{" "}
					<LatinWord>lentē ambulō nē cadam</LatinWord>,{" "}
					<em>I walk slowly so as not to fall</em>, against{" "}
					<LatinWord>tam lentē ambulō ut nōn cadam</LatinWord>,{" "}
					<em>I walk so slowly that I don't fall</em>.
				</p>
				<p>
					<strong className={LEAD}>Reported questions.</strong> A question that
					is reported rather than asked always takes the subjunctive:{" "}
					<LatinWord>rogat mē quid sentiam</LatinWord>,{" "}
					<em>he asks me what I think</em>. Asked straight out, it is{" "}
					<LatinWord>quid sentīs?</LatinWord>, in the indicative.
				</p>
				<p>
					<strong className={LEAD}>
						<LatinWord>cum</LatinWord>: when, since, although.
					</strong>{" "}
					In a story, <LatinWord>cum</LatinWord> with the imperfect or
					pluperfect subjunctive sets the scene:{" "}
					<LatinWord>cum in forō essem, amīcum salūtāvī</LatinWord>,{" "}
					<em>when I was in the forum, I greeted a friend</em>. Meaning{" "}
					<em>since</em> or <em>although</em>, it takes the subjunctive in any
					tense: <LatinWord>cum fessus sīs, domī manē</LatinWord>,{" "}
					<em>since you are tired, stay at home</em>;{" "}
					<LatinWord>cum dīves sit, nōn est laetus</LatinWord>,{" "}
					<em>although he is rich, he is not happy</em>. A plain <em>when</em>{" "}
					in the present or future is indicative:{" "}
					<LatinWord>cum Rōmae sum, amīcōs salūtō</LatinWord>,{" "}
					<em>when I'm in Rome, I greet my friends</em>.
				</p>
				<p>
					<strong className={LEAD}>Conditions.</strong> An <em>if</em> that the
					speaker treats as real is indicative:{" "}
					<LatinWord>sī tū exercitusque valētis, bene est</LatinWord>,{" "}
					<em>if you and the army are well, it is well</em>. The subjunctive is
					for the rest, and its tense says how far from real: the present for a
					future only imagined, <LatinWord>sī moneam, audiat</LatinWord>,{" "}
					<em>if I should warn, he would hear</em>; the imperfect for what is
					not true now, <LatinWord>sī vīveret, verba eius audīrētis</LatinWord>,{" "}
					<em>if he were alive, you would hear his words</em>; the pluperfect
					for what did not happen,{" "}
					<LatinWord>nisi tū āmīsissēs, numquam recēpissem</LatinWord>,{" "}
					<em>if you had not lost it, I should never have recovered it</em>.
				</p>
			</div>

			<Heading variant="h4" as="h3" className="mx-auto max-w-3xl">
				Which tense
			</Heading>
			<p className="mx-auto max-w-3xl">
				In a joined clause the subjunctive's tense does not give the time by
				itself. It follows the main verb: a present or future main verb takes
				the present or perfect subjunctive, a past one the imperfect or
				pluperfect. Within that pair, the choice is whether the joined action
				happens at the same time as the main verb or before it.
			</p>
			<Table
				caption="The sequence of tenses, in a reported question."
				columns={SEQUENCE_COLUMNS}
				rows={SEQUENCE_ROWS}
				className="mx-auto max-w-4xl"
			/>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-600 leading-relaxed">
				<p>
					<em>Same time</em> also covers what is still ahead when the clause
					looks forward, as a purpose does:{" "}
					<LatinWord>scrībit ut nōs moneat</LatinWord>,{" "}
					<em>he writes to warn us</em>;{" "}
					<LatinWord>scrīpsit ut nōs monēret</LatinWord>,{" "}
					<em>he wrote to warn us</em>. The perfect subjunctive{" "}
					<LatinWord>fēcerīs</LatinWord> has a long <LatinWord>ī</LatinWord>,
					against the future perfect <LatinWord>fēceris</LatinWord>.
				</p>
				<p className="text-sm">
					After Allen and Greenough, <cite>New Latin Grammar</cite>, §§ 154,
					157, 439, 441–447, 483–484, 515–517, 531, 533, 537–538, 545–547, 549
					and 574. Dido's line is <cite>Aeneid</cite> 4.659–660.
				</p>
			</div>
		</section>
	);
}
