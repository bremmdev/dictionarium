import {
	CASES,
	type Case,
	type Form,
} from "#/components/declensions/Declensions.utils";
import { type Gender, isStemClass } from "#/utils/entries/rules";
import { type Declension, sheet } from "./nouns";
import {
	type Cell,
	type Filing,
	type GrammaticalNumber,
	type Inflection,
	partsOf,
} from "./types";

type Builder = {
	cells: Array<Cell>;
	add: (
		number: GrammaticalNumber,
		c: Case,
		gender: Gender,
		forms: Array<string>,
		variant?: boolean,
	) => void;
};

function builder(): Builder {
	const cells: Array<Cell> = [];
	return {
		cells,
		add: (number, c, gender, forms, variant = false) => {
			for (const form of forms) {
				cells.push({
					form,
					analysis: { kind: "case", case: c, number, gender },
					...(variant ? { variant: true as const } : {}),
				});
			}
		},
	};
}

const GENDERS: Array<Gender> = ["m", "f", "n"];
const NUMBERS: Array<GrammaticalNumber> = ["singular", "plural"];

/** The -īus genitive and -ī dative of ūnus, tōtus and the rest, for all genders. */
export type Pronominal = { genitive: Form; dative: Form };

/**
 * bonus, bona, bonum on the 1st- and 2nd-declension sheets: masculine and
 * neuter from the 2nd column, feminine from the 1st. Plural only when filed
 * plural (bīnī, bīnae, bīna).
 */
export function firstSecond(
	line: string | null,
	pronominal?: Pronominal,
): Inflection | null {
	const [m, f, n] = partsOf(line);
	if (!m || !f || !n) return null;

	const pluralOnly = m.endsWith("ī") && f.endsWith("ae") && n.endsWith("a");
	if (!pluralOnly && !(f.endsWith("a") && n.endsWith("um"))) return null;
	const stem = f.slice(0, pluralOnly ? -2 : -1);
	const nominatives = { m, f, n };
	const column: Record<Gender, Declension> = { m: "2", f: "1", n: "2" };

	const cells = () => {
		const { cells, add } = builder();
		for (const number of NUMBERS) {
			if (number === "singular" && pluralOnly) continue;
			for (const c of CASES) {
				// ūnus and the rest have no vocative to speak of.
				if (c === "vocative" && pronominal) continue;
				for (const g of GENDERS) {
					const nominative =
						number === "singular" || pluralOnly
							? nominatives[g]
							: stem +
								(g === "n" ? "a" : sheet("plural", column[g], "nominative")[0]);
					if (
						c === "nominative" ||
						(c === "vocative" && !(number === "singular" && g === "m"))
					) {
						add(number, c, g, [nominative]);
					} else if (c === "vocative") {
						add(number, c, g, [m.endsWith("us") ? `${stem}e` : m]);
					} else if (c === "accusative" && g === "n") {
						add(number, c, g, [nominative]);
					} else if (
						pronominal &&
						number === "singular" &&
						(c === "genitive" || c === "dative")
					) {
						const { form, alt } = pronominal[c];
						add(number, c, g, [form]);
						if (alt)
							add(
								number,
								c,
								g,
								typeof alt === "string" ? [alt] : [...alt],
								true,
							);
					} else {
						add(
							number,
							c,
							g,
							sheet(number, column[g], c).map((e) => stem + e),
						);
					}
				}
			}
		}
		return cells;
	};

	return { stems: [stem], cells };
}

/**
 * The 3rd declension, stem by terminations: ācer, ācris, ācre from the
 * feminine; fortis, forte from the lemma; vetus, veteris from the genitive.
 * Where i-stems differ, the stem class picks; unfiled, both forms.
 */
export function third(
	line: string | null,
	terminations: string | null,
	stemClass: string | null = null,
): Inflection | null {
	const filed = stemClass !== null && isStemClass(stemClass) ? stemClass : null;
	const parts = partsOf(line);
	const source = { "1": parts[1], "2": parts[0], "3": parts[1] }[
		terminations ?? ""
	];
	if (
		!source?.endsWith("is") ||
		parts.length < (terminations === "3" ? 3 : 2)
	) {
		return null;
	}
	const stem = source.slice(0, -2);
	const nominatives: Record<Gender, string> =
		terminations === "3"
			? { m: parts[0], f: parts[1], n: parts[2] }
			: terminations === "2"
				? { m: parts[0], f: parts[0], n: parts[1] }
				: { m: parts[0], f: parts[0], n: parts[0] };

	const cells = () => {
		const { cells, add } = builder();
		const on = (endings: Array<string>) => endings.map((e) => stem + e);
		const both = (
			number: GrammaticalNumber,
			c: Case,
			g: Gender,
			i: string,
			consonant: string,
		) => {
			if (filed === "i-stem") add(number, c, g, on([i]));
			else if (filed === "consonant") add(number, c, g, on([consonant]));
			else add(number, c, g, on([i, consonant]), true);
		};

		for (const g of GENDERS) {
			for (const c of CASES) {
				if (c === "nominative" || c === "vocative")
					add("singular", c, g, [nominatives[g]]);
				else if (c === "accusative" && g === "n")
					add("singular", c, g, [nominatives.n]);
				else if (c === "ablative") both("singular", c, g, "ī", "e");
				else add("singular", c, g, on(sheet("singular", "3", c)));

				if (c === "genitive") both("plural", c, g, "ium", "um");
				else if (c === "dative" || c === "ablative")
					add("plural", c, g, on(sheet("plural", "3", c)));
				else if (g === "n") both("plural", c, g, "ia", "a");
				else if (c === "accusative" && filed !== null) {
					add("plural", c, g, on(["ēs"]));
					if (filed === "i-stem") add("plural", c, g, on(["īs"]), true);
				} else if (c === "accusative") both("plural", c, g, "ēs", "īs");
				else add("plural", c, g, on(sheet("plural", "3", "nominative")));
			}
		}
		return cells;
	};

	return { stems: [stem], cells };
}

export function adjectiveInflection(filing: Filing): Inflection | null {
	if (filing.declension === "1-2") return firstSecond(filing.principalParts);
	if (filing.declension === "3")
		return third(filing.principalParts, filing.terminations, filing.stemClass);
	return null;
}
