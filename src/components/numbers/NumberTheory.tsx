import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import {
	NUMERAL_COLUMNS,
	NUMERALS,
	SUBTRACTIVE_COLUMNS,
	SUBTRACTIVE_FORMS,
	SUBTRACTIVE_WORD_COLUMNS,
	SUBTRACTIVE_WORDS,
} from "./NumberTheory.utils";

const NUMERAL_ROWS = NUMERALS.map(({ symbol, value, word }) => ({
	id: symbol,
	cells: { symbol, value, word: <LatinWord>{word}</LatinWord> },
}));

// The form itself is the row header, so it takes the table's own ink styling;
// the spelling it replaces is set as Latin like any other numeral in the prose.
const SUBTRACTIVE_ROWS = SUBTRACTIVE_FORMS.map(
	({ form, reads, value, instead }) => ({
		id: form,
		cells: { form, reads, value, instead: <LatinWord>{instead}</LatinWord> },
	}),
);

// The number is the row header here, so the Latin it names is the cell that
// carries the gold — the same split the numeral table uses.
const SUBTRACTIVE_WORD_ROWS = SUBTRACTIVE_WORDS.map(
	({ number, word, literally }) => ({
		id: word,
		cells: { number, word: <LatinWord>{word}</LatinWord>, literally },
	}),
);

export function NumberTheory() {
	return (
		<section className="mx-auto max-w-page-width space-y-8 px-8">
			<Heading
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Numerī
			</Heading>
			<Table
				caption="The seven signs, their values, and what the Romans called them."
				columns={NUMERAL_COLUMNS}
				rows={NUMERAL_ROWS}
				className="mx-auto max-w-2xl"
			/>
			<p>
				Roman numbers are additive: to make larger numbers you can combine the
				values of the symbols. For example, <LatinWord>II</LatinWord> is 2,{" "}
				<LatinWord>VI</LatinWord> is 6 and <LatinWord>LXXVII</LatinWord> is 77.
				The higher values are always to the left of the lower values, and we
				read the number from left to right, adding the values together as we go.
			</p>

			<p>
				To add two numbers we combine all their symbols into a single string,
				order that string from highest value to lowest, and then trade the
				doubled-up symbols in for bigger ones. As an example, adding{" "}
				<LatinWord>MMDCCXXVII</LatinWord> (2727) and{" "}
				<LatinWord>MDCCXXVIII</LatinWord> (1728) looks like this:
				<code className="block text-center mx-auto my-4">
					MMDCCXXVII
					<br /> MDCCXXVIII <br /> ------- <br /> MMMDDCCCCXXXXVVIIIII <br />{" "}
					MMMMCCCCLV = 4455
				</code>
				Only that last step has a rule to remember: 2 D's become an M, 2 V's
				become an X, 5 I's become a V and 5 X's become an L.
			</p>

			<Heading
				variant="h4"
				as="h3"
				className="mx-auto text-center uppercase tracking-wide"
			>
				Subtractive Combinations
			</Heading>
			<p>
				When a smaller symbol stands before a larger one, you subtract it from
				the larger one. In practice, this was not used much because it makes
				numbers much harder to add up. Adding 2 numbers without subtractive
				combinations is much easier than adding 2 numbers with subtractive
				combinations. The following subtractive combinations do occur:
			</p>
			<Table
				caption="The six subtractive forms, and the additive spelling each one stands in for."
				columns={SUBTRACTIVE_COLUMNS}
				rows={SUBTRACTIVE_ROWS}
				className="mx-auto max-w-2xl"
			/>
			<p>
				Romans wrote <LatinWord>IIII</LatinWord> and{" "}
				<LatinWord>VIIII</LatinWord> all the time. The Colosseum's numbered
				gates are perfect witnesses: gate 44 is carved{" "}
				<LatinWord>XLIIII</LatinWord> — subtractive for the forty, additive for
				the four, in one breath. Roman calendars went further and wrote{" "}
				<LatinWord>XIIX</LatinWord> for 18. Subtractive spelling became a rule
				centuries after Rome fell, partly because <LatinWord>IV</LatinWord> was
				more concise than <LatinWord>IIII</LatinWord>.
			</p>

			<Heading
				variant="h4"
				as="h3"
				className="mx-auto text-center uppercase tracking-wide"
			>
				The words subtract too
			</Heading>
			<p>
				Subtraction is not only a habit of the symbols; it is built into the
				number words themselves. Latin counts the last two numbers before a
				round ten downwards from it, so 18 and 19 are not “ten and eight” and
				“ten and nine” but two and one taken away from twenty:
			</p>
			<Table
				caption="The two numbers before each round ten, counted down from it."
				columns={SUBTRACTIVE_WORD_COLUMNS}
				rows={SUBTRACTIVE_WORD_ROWS}
				className="mx-auto max-w-2xl"
			/>
			<p>
				The pattern holds all the way up: <LatinWord>ūndē-</LatinWord> is “one
				from” and <LatinWord>duodē-</LatinWord> is “two from”, glued to the
				number being counted down from.
			</p>
		</section>
	);
}
