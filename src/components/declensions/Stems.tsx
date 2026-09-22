import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import {
	GENDER_COLUMNS,
	GENDER_RULES,
	GENITIVE_COLUMNS,
	GENITIVE_ENDINGS,
} from "./Declensions.utils";

const GENDER_ROWS = GENDER_RULES.map(
	({ declension, usually, examples, exception, exceptionExamples }) => ({
		id: declension,
		cells: {
			declension,
			usually: (
				<>
					{usually}
					{examples && (
						<>
							{" — "}
							<LatinWord>{examples}</LatinWord>
						</>
					)}
				</>
			),
			// A declension whose gender is genuinely unpredictable gets a dash
			// rather than an empty cell, so the row does not read as unfinished.
			exception: exception ? (
				<>
					{exception}
					{": "}
					<LatinWord>{exceptionExamples}</LatinWord>
				</>
			) : (
				<span className="text-ink-600">—</span>
			),
		},
	}),
);

// The declension is the row header, so the Latin it names is the cell that
// carries the gold — the same split the numeral tables on /numbers use.
const GENITIVE_ROWS = GENITIVE_ENDINGS.map(
	({ declension, ending, example, stem }) => ({
		id: declension,
		cells: {
			declension,
			example: <LatinWord>{example}</LatinWord>,
			ending: <LatinWord>{ending}</LatinWord>,
			stem: <LatinWord>{stem}</LatinWord>,
		},
	}),
);

const STEPS = [
	{
		id: "stem",
		body: (
			<>
				Take the{" "}
				<strong className="font-semibold text-ink-900">genitive</strong> and
				remove its ending — <LatinWord>-ae</LatinWord>,{" "}
				<LatinWord>-ī</LatinWord>, <LatinWord>-is</LatinWord>,{" "}
				<LatinWord>-ūs</LatinWord>, <LatinWord>-eī</LatinWord>. What is left is
				the stem.
			</>
		),
	},
	{
		id: "endings",
		body: (
			<>
				Add the endings of that declension to the stem. From{" "}
				<LatinWord>urbs, urbis</LatinWord> the stem is{" "}
				<LatinWord>urb-</LatinWord>, and every other form is built on it:{" "}
				<LatinWord>urbem</LatinWord>, <LatinWord>urbium</LatinWord>,{" "}
				<LatinWord>urbibus</LatinWord>.
			</>
		),
	},
];

export function Stems() {
	return (
		<section
			id="filing"
			aria-labelledby="filing-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-8"
		>
			<Heading
				id="filing-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
			>
				Filing a noun
			</Heading>
			<p>
				A declension is a group of nouns that share one set of endings. A noun
				never moves between them. Whatever declension it belongs to, it belongs
				to for good, which is what makes the patterns worth learning instead of
				memorising every form of every word. The third declension is the largest
				of the five by a wide margin.
			</p>
			<p>
				Which declension a noun is in says nothing certain about its gender, but
				it does narrow the field:
			</p>
			<Table
				caption="Gender by declension — the tendency, and the exceptions worth knowing early."
				columns={GENDER_COLUMNS}
				rows={GENDER_ROWS}
				className="mx-auto max-w-5xl"
			/>
			<p>
				You cannot decline a noun from its nominative. The nominative is the one
				form that has been worn down: <LatinWord>urbs</LatinWord> has lost the{" "}
				<LatinWord>i</LatinWord> that the rest of the word is built on, and{" "}
				<LatinWord>manus</LatinWord> and <LatinWord>dominus</LatinWord> end
				alike while declining nothing alike. The genitive is what holds the
				stem, and that is the whole reason a dictionary entry carries two forms
				rather than one.
			</p>
			<Table
				caption="Every noun is filed by its genitive singular, and the stem falls out of the same form."
				columns={GENITIVE_COLUMNS}
				rows={GENITIVE_ROWS}
				nowrap
				className="mx-auto max-w-4xl"
			/>
			<p>So declining any noun is two steps:</p>
			{/* The step number is content, not decoration — it is how the two
			    halves of the process refer to each other, so it is set in the
			    markup rather than left to a list marker. The pattern is the one
			    the senses list on a word page uses. */}
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
		</section>
	);
}
