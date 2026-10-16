import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import { CONJUGATION_KEYS, PRINCIPAL_PARTS } from "./Conjugations.utils";

const PART_COLUMNS = [
	{ key: "part", label: "Part" },
	{ key: "example", label: "Example" },
	{ key: "gives", label: "What it gives you" },
];

const PART_ROWS = PRINCIPAL_PARTS.map(({ part, example, gives }) => ({
	id: part,
	cells: { part, example: <LatinWord>{example}</LatinWord>, gives },
}));

const KEY_COLUMNS = [
	{ key: "conjugation", label: "Conjugation" },
	{ key: "entry", label: "Dictionary entry" },
	{ key: "infinitive", label: "Look for" },
	{ key: "stemVowel", label: "Stem vowel" },
];

const KEY_ROWS = CONJUGATION_KEYS.map(
	({ conjugation, entry, infinitive, stemVowel }) => ({
		id: conjugation,
		cells: {
			conjugation,
			entry: <LatinWord>{entry}</LatinWord>,
			infinitive: <LatinWord>{infinitive}</LatinWord>,
			stemVowel: stemVowel ? (
				<LatinWord>{stemVowel}</LatinWord>
			) : (
				<span className="text-ink-600">
					<span aria-hidden="true">—</span>
					<span className="sr-only">none</span>
				</span>
			),
		},
	}),
);

const STEM_COLUMNS = [
	{ key: "conjugation", label: "Conjugation" },
	{ key: "perfect", label: "Perfect" },
	{ key: "stem", label: "Stem" },
	{ key: "how", label: "How it is made" },
];

const STEM_ROWS = [
	{
		conjugation: "1st",
		perfect: "salūtāvī",
		stem: "salūtāv-",
		how: (
			<>
				<LatinWord>v</LatinWord> after the stem vowel, in nearly every verb of
				the group
			</>
		),
	},
	{
		conjugation: "2nd",
		perfect: "monuī",
		stem: "monu-",
		how: (
			<>
				<LatinWord>u</LatinWord> in place of the <LatinWord>ē</LatinWord>, the
				commonest of several types
			</>
		),
	},
	{
		conjugation: "3rd",
		perfect: "dūxī",
		stem: "dūx-",
		how: (
			<>
				<LatinWord>s</LatinWord> after the root, and <LatinWord>c</LatinWord> +{" "}
				<LatinWord>s</LatinWord> is written <LatinWord>x</LatinWord>; other
				verbs of the group do it differently
			</>
		),
	},
	{
		conjugation: "4th",
		perfect: "audīvī",
		stem: "audīv-",
		how: (
			<>
				<LatinWord>v</LatinWord> after the stem vowel, as in the first
			</>
		),
	},
	{
		conjugation: "Mixed",
		perfect: "cēpī",
		stem: "cēp-",
		how: "the root vowel itself lengthened and changed",
	},
].map(({ conjugation, perfect, stem, how }) => ({
	id: conjugation,
	cells: {
		conjugation,
		perfect: <LatinWord>{perfect}</LatinWord>,
		stem: <LatinWord>{stem}</LatinWord>,
		how,
	},
}));

const STEPS = [
	{
		id: "infinitive",
		body: (
			<>
				Read the{" "}
				<strong className="font-semibold text-ink-900">infinitive</strong>.{" "}
				<LatinWord>-āre</LatinWord>, <LatinWord>-ēre</LatinWord> and{" "}
				<LatinWord>-īre</LatinWord> settle it. <LatinWord>-ere</LatinWord> is
				third or mixed, and the first part decides: <LatinWord>-iō</LatinWord>{" "}
				is mixed, a plain <LatinWord>-ō</LatinWord> is third.
			</>
		),
	},
	{
		id: "endings",
		body: (
			<>
				Take the <LatinWord>-ō</LatinWord>, <LatinWord>-eō</LatinWord> or{" "}
				<LatinWord>-iō</LatinWord> off the first part and add that group's
				endings: <LatinWord>salūt-</LatinWord> + <LatinWord>-ās</LatinWord>,{" "}
				<LatinWord>mon-</LatinWord> + <LatinWord>-ēs</LatinWord>,{" "}
				<LatinWord>dūc-</LatinWord> + <LatinWord>-is</LatinWord>.
			</>
		),
	},
];

export function Filing() {
	return (
		<section
			id="filing"
			aria-labelledby="filing-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-4 sm:px-8"
		>
			<Heading
				id="filing-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
			>
				Filing a verb
			</Heading>
			<p>
				A dictionary files a verb under four principal parts. No one form shows
				every stem the verb has, so between them the four hold all of them:
			</p>
			<Table
				caption="The four principal parts of salūtō, and what each one is for."
				columns={PART_COLUMNS}
				rows={PART_ROWS}
				className="mx-auto max-w-4xl"
			/>
			<p>
				The first two parts are enough for the present, and they also say which
				of the five groups a verb belongs to. Like a declension, a conjugation
				is for good: a verb never changes group.
			</p>
			<Table
				caption="Reading the conjugation off the dictionary entry. -ēre and -ere differ only in the macron."
				columns={KEY_COLUMNS}
				rows={KEY_ROWS}
				nowrap
				className="mx-auto max-w-4xl"
			/>
			<p>So conjugating any regular verb in the present is two steps:</p>
			{/* The same numbered steps as Filing a noun on /declensions. */}
			<ol className="mx-auto max-w-3xl space-y-3">
				{STEPS.map(({ id, body }, i) => (
					<li
						key={id}
						className="flex gap-4 rounded-lg border border-parchment-200 bg-parchment-100 p-4"
					>
						<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-300 font-bold text-ink-900 text-sm tabular-nums">
							{i + 1}
						</span>
						<p className="text-ink-700">{body}</p>
					</li>
				))}
			</ol>
			<p>
				The perfect is not built from the present at all. It has a stem of its
				own, and only in the first and fourth conjugations can you count on
				guessing it. Take the third principal part and drop its{" "}
				<LatinWord>-ī</LatinWord>: what is left is the perfect stem, and the
				perfect endings go straight onto it.
			</p>
			<Table
				caption="The perfect stem, read off the third principal part."
				columns={STEM_COLUMNS}
				rows={STEM_ROWS}
				className="mx-auto max-w-4xl"
			/>
		</section>
	);
}
