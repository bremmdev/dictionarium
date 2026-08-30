import { Heading } from "../Heading";
import { LatinWord } from "../LatinWord";
import { Table } from "../Table";
import {
	CARDINAL_COLUMNS,
	CARDINALS_1_10,
	CARDINALS_11_20,
	DECLENSION_COLUMNS,
	DECLENSIONS,
	HUNDREDS,
	ORDINAL_COLUMNS,
	ORDINALS,
	TENS,
} from "./NumberTheory.utils";

const toCardinalRows = (cardinals: typeof CARDINALS_1_10) =>
	cardinals.map(({ number, numeral, word }) => ({
		id: number,
		cells: { number, numeral, word: <LatinWord>{word}</LatinWord> },
	}));

const CARDINAL_ROWS_1_10 = toCardinalRows(CARDINALS_1_10);
const CARDINAL_ROWS_11_20 = toCardinalRows(CARDINALS_11_20);
const TENS_ROWS = toCardinalRows(TENS);
const HUNDREDS_ROWS = toCardinalRows(HUNDREDS);

const ORDINAL_ROWS = ORDINALS.map(({ number, word, english }) => ({
	id: number,
	cells: { number, word: <LatinWord>{word}</LatinWord>, english },
}));

const DECLENSION_ROWS = DECLENSIONS.map(
	({ grammaticalCase, one, two, three }) => ({
		id: grammaticalCase,
		cells: {
			grammaticalCase,
			one: <LatinWord>{one}</LatinWord>,
			two: <LatinWord>{two}</LatinWord>,
			three: <LatinWord>{three}</LatinWord>,
		},
	}),
);

export function Counting() {
	return (
		<section className="mx-auto max-w-page-width space-y-8 px-8">
			<Heading
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
			>
				Counting
			</Heading>
			<p>
				You do not learn a thousand numbers. Instead, you learn a few dozen, and
				then you build up from there.
			</p>
			<p>First we start with the numbers 1 through 20:</p>
			{/* Two tens side by side on a wide screen, stacked on a phone — each
			    stays its own table so a screen reader still reads a row as one
			    number rather than two. */}
			<div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
				<Table
					caption="The numbers 1 to 10, and the numeral each is written as."
					columns={CARDINAL_COLUMNS}
					rows={CARDINAL_ROWS_1_10}
				/>
				<Table
					caption="The numbers 11 to 20 — ten glued onto the unit, until 18 and 19 count down from twenty."
					columns={CARDINAL_COLUMNS}
					rows={CARDINAL_ROWS_11_20}
				/>
			</div>
			<p>
				The first three are the only cardinals below a hundred that carry
				gender: <LatinWord>ūnus</LatinWord> and <LatinWord>duo</LatinWord> have
				a separate masculine, feminine and neuter form, while{" "}
				<LatinWord>trēs</LatinWord> has one form for masculine and feminine and
				another for neuter. From <LatinWord>quattuor</LatinWord> up to a hundred
				the words never change shape, no matter how the noun beside them is
				used. Those first three also decline for case:
			</p>
			<Table
				caption="How one, two and three decline. Below a hundred, every other number is fixed."
				columns={DECLENSION_COLUMNS}
				rows={DECLENSION_ROWS}
				className="mx-auto max-w-3xl"
			/>
			<p>
				Past twenty the counting goes by tens, and past a hundred by hundreds.
				The tens are fixed words, but the hundreds are plural adjectives that
				agree with what they count — that is what the{" "}
				<LatinWord>-ae, -a</LatinWord> endings below stand for.
			</p>
			<div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
				<Table
					caption="The tens, 10 to 100."
					columns={CARDINAL_COLUMNS}
					rows={TENS_ROWS}
				/>
				<Table
					caption="The hundreds, 100 to 1000."
					columns={CARDINAL_COLUMNS}
					rows={HUNDREDS_ROWS}
				/>
			</div>

			<p>
				We can then combine these numbers to make{" "}
				<LatinWord>vīgintī (et) ūnus</LatinWord> for 21,{" "}
				<LatinWord>ducentī quadrāgintā septem</LatinWord> for 247, and so on.
			</p>

			<Heading
				variant="h4"
				as="h3"
				className="mx-auto text-center uppercase tracking-wide"
			>
				Ordinals
			</Heading>
			<p>
				Unlike most of the cardinals, the ordinals are perfectly ordinary
				adjectives of the <LatinWord>bonus</LatinWord> type: three endings,
				agreeing with their noun. Only the masculine is listed below. The first
				two are words in their own right; the rest are built straight off the
				number they rank.
			</p>
			<Table
				caption="The ordinals, first to tenth."
				columns={ORDINAL_COLUMNS}
				rows={ORDINAL_ROWS}
				className="mx-auto max-w-2xl"
			/>
		</section>
	);
}
