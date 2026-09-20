import { Heading } from "#/components/Heading";
import { LatinWord } from "#/components/LatinWord";
import { Table } from "#/components/Table";
import {
	ENDING_COLUMNS,
	PLURAL_ENDINGS,
	SINGULAR_ENDINGS,
} from "./Declensions.utils";

// null is the third declension nominative singular. It has no ending of its
// own, so the cell says so with a dash rather than inventing one.
const cell = (ending: string | null) =>
	ending ? (
		<LatinWord>{ending}</LatinWord>
	) : (
		// Hidden content rather than an aria-label — vault/a11y.md: a label that
		// has to say something the dash cannot is content, not an attribute.
		<span className="text-ink-500">
			<span aria-hidden="true">—</span>
			<span className="sr-only">no fixed ending</span>
		</span>
	);

const toRows = (endings: typeof SINGULAR_ENDINGS) =>
	endings.map(({ grammaticalCase, first, second, third, fourth, fifth }) => ({
		id: grammaticalCase,
		cells: {
			grammaticalCase,
			first: cell(first),
			second: cell(second),
			third: cell(third),
			fourth: cell(fourth),
			fifth: cell(fifth),
		},
	}));

const SINGULAR_ROWS = toRows(SINGULAR_ENDINGS);
const PLURAL_ROWS = toRows(PLURAL_ENDINGS);

export function Endings() {
	return (
		<section
			id="endings"
			aria-labelledby="endings-heading"
			className="scroll-mt-8 mx-auto max-w-page-width space-y-8 px-8"
		>
			<Heading
				id="endings-heading"
				variant="h2"
				className="mx-auto text-center uppercase tracking-wide"
				lang="la"
			>
				Terminātiōnēs
			</Heading>
			<p>
				Every noun paradigm above, with the words taken away. This is the sheet
				to come back to once the five patterns are familiar — five columns of
				endings that attach to whatever stem the genitive gave you.
			</p>
			{/* table-fixed on both grids, so the two read as one sheet: with
			    automatic layout each table sizes its columns to its own contents
			    and the 1st-declension column lands in a different place in the
			    plural than in the singular. Six equal columns also keep the
			    endings in a straight line down the page.

			    Only from md up, though. Fixed layout divides the width it is
			    given no matter how little that is, and six columns of a phone
			    screen are narrower than the word "accusative" — the cells do not
			    scroll or wrap, they overlap. Below md the tables size to their
			    contents and the box they sit in scrolls instead, which is what
			    the two grids losing their shared column positions buys. */}
			<div className="mx-auto max-w-5xl space-y-10 md:[&_table]:table-fixed">
				<Table
					caption="Singular endings, by case and declension."
					columns={ENDING_COLUMNS}
					rows={SINGULAR_ROWS}
					nowrap
				/>
				<Table
					caption="Plural endings, by case and declension."
					columns={ENDING_COLUMNS}
					rows={PLURAL_ROWS}
					nowrap
				/>
			</div>
			<div className="mx-auto max-w-3xl space-y-3 text-base text-ink-500 leading-relaxed">
				<p>
					<strong className="font-semibold text-ink-900">
						The third declension nominative singular
					</strong>{" "}
					is blank because it has no fixed ending: those words end in{" "}
					<LatinWord>-a, -e, -ī, -ō, -y, -c, -l, -n, -r, -s, -t</LatinWord> or{" "}
					<LatinWord>-x</LatinWord>, and it is learnt with the word.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">Neuters</strong> run
					off the same grid with one change, and it is always the same change:
					the nominative and accusative are identical, and in the plural both
					end in <LatinWord>-a</LatinWord> — <LatinWord>bellum</LatinWord>,{" "}
					<LatinWord>bella</LatinWord>; <LatinWord>nōmen</LatinWord>,{" "}
					<LatinWord>nōmina</LatinWord>; <LatinWord>genū</LatinWord>,{" "}
					<LatinWord>genua</LatinWord>.
				</p>
				<p>
					<strong className="font-semibold text-ink-900">The vocative</strong>{" "}
					is left out because it is the nominative again in every cell of the
					grid but one: second declension <LatinWord>-us</LatinWord> becomes{" "}
					<LatinWord>-e</LatinWord> in the singular.
				</p>
			</div>
		</section>
	);
}
