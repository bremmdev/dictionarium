/**
 * The pronoun tables on /grammar/pronouns are typed out by hand, so a macron
 * slip would go unnoticed. Every cell of a word with a pattern has to equal its
 * stem + that pattern's ending; irregular cells are skipped. bonus's endings are
 * read off its own table on /grammar/declensions rather than typed out again.
 */
import {
	ADJECTIVE_CASES,
	FIRST_SECOND,
} from "#/components/declensions/Adjectives.utils";
import {
	PERSONAL,
	PRONOMINAL_ADJECTIVES,
	PRONOMINAL_ENDINGS,
	PRONOUNS,
} from "#/components/pronouns/Pronouns.utils";

const NUMBERS = ["singular", "plural"] as const;
const GENDERS = ["m", "f", "n"] as const;

const problems: Array<string> = [];
const ids = new Set<string>();
let checked = 0;

// The id is the anchor, so two of them would send a link to the wrong table.
for (const { id, lemma } of [...PERSONAL, ...PRONOUNS]) {
	if (ids.has(id)) problems.push(`${lemma}: duplicate id "${id}"`);
	ids.add(id);
}

const bonus = FIRST_SECOND.find(({ lemma }) => lemma === "bonus, bona, bonum");
if (!bonus) throw new Error("bonus, bona, bonum is gone from FIRST_SECOND");

/** The ending of one cell under a pattern, with its leading hyphen. */
function ending(
	endings: "pronominal" | "bonus",
	number: (typeof NUMBERS)[number],
	grammaticalCase: (typeof ADJECTIVE_CASES)[number],
	gender: (typeof GENDERS)[number],
) {
	if (endings === "pronominal") {
		return PRONOMINAL_ENDINGS[number][grammaticalCase][gender];
	}
	const form = bonus?.[number][grammaticalCase][gender] ?? "";
	return `-${form.replace(/^bon/, "")}`;
}

for (const pronoun of PRONOUNS) {
	const [m, f, n] = pronoun.lemma.split(", ");
	const nominative = pronoun.singular.nominative;
	if (nominative.m.form !== m || nominative.f.form !== f || nominative.n.form !== n) {
		problems.push(`${pronoun.lemma}: the nominative singular is not the lemma`);
	}

	const { pattern } = pronoun;
	if (!pattern) continue;
	for (const number of NUMBERS) {
		for (const grammaticalCase of ADJECTIVE_CASES) {
			for (const gender of GENDERS) {
				const cell = pronoun[number][grammaticalCase][gender];
				if (cell.irregular) continue;
				const end = ending(pattern.endings, number, grammaticalCase, gender);
				const built = pattern.stem + end.replace(/^-/, "");
				checked++;
				if (cell.form !== built) {
					problems.push(
						`${pronoun.lemma} ${grammaticalCase} ${number} ${gender}: "${cell.form}", but ${pattern.stem}- + ${end} gives "${built}"`,
					);
				}
			}
		}
	}
}

// No pattern to rebuild ego from, but its table has to be headed by its own
// nominatives. suī has none, and its lemma is the genitive.
for (const pronoun of PERSONAL) {
	const [singular, plural = singular] = pronoun.lemma.split(", ");
	const heads = [pronoun.singular.nominative, pronoun.plural.nominative];
	if (heads.every((cell) => cell === null)) {
		if (pronoun.singular.genitive?.form !== singular) {
			problems.push(`${pronoun.lemma}: no nominative, so the lemma should be the genitive`);
		}
	} else if (heads[0]?.form !== singular || heads[1]?.form !== plural) {
		problems.push(`${pronoun.lemma}: the nominatives are not the lemma`);
	}
}

// The nine: genitive and dative on the feminine's stem, and the same cells as
// the full table where the word has one.
for (const adjective of PRONOMINAL_ADJECTIVES) {
	const feminine = adjective.lemma.split(", ")[1];
	const stem = feminine.replace(/a$/, "");
	const full = PRONOUNS.find(({ lemma }) => lemma === adjective.lemma);
	for (const [grammaticalCase, ending] of [
		["genitive", "īus"],
		["dative", "ī"],
	] as const) {
		const cell = adjective[grammaticalCase];
		if (!cell.irregular) {
			checked++;
			if (cell.form !== stem + ending) {
				problems.push(
					`${adjective.lemma} ${grammaticalCase}: "${cell.form}", but ${stem}- + -${ending} gives "${stem + ending}"`,
				);
			}
		}
		const inFull = full?.singular[grammaticalCase].m;
		if (inFull && (inFull.form !== cell.form || `${inFull.alt}` !== `${cell.alt}`)) {
			problems.push(
				`${adjective.lemma} ${grammaticalCase}: the summary and the full table disagree`,
			);
		}
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} pronoun problem(s). Fix the table or the endings in src/components/pronouns/Pronouns.utils.ts.`,
	);
	process.exit(1);
}

console.log(`Pronouns OK — checked ${checked} forms.`);
