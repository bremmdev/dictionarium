/**
 * The forms search (vault/forms.md) against the grammar pages: every paradigm
 * there has to come out of the generator cell for cell. Then the lookups phase
 * 1 promises, and, for every filed entry, that each generated form starts with
 * one of the keys the index finds the entry by.
 */
import {
	CONJUGATION_GROUPS,
	PERSONS,
} from "#/components/conjugations/Conjugations.utils";
import {
	ADJECTIVE_CASES,
	FIRST_SECOND,
	THIRD,
} from "#/components/declensions/Adjectives.utils";
import {
	CASES,
	DECLENSION_GROUPS,
	type Form,
} from "#/components/declensions/Declensions.utils";
import { IRREGULAR_VERBS } from "#/components/irregular-verbs/IrregularVerbs.utils";
import { PERSONAL, PRONOUNS } from "#/components/pronouns/Pronouns.utils";
import { formKey } from "#/utils/inflection/key";
import { FormIndex, type Indexed } from "#/utils/inflection/lookup";
import { inflectionOf, keysOf, paradigm } from "#/utils/inflection/paradigm";
import {
	type Analysis,
	type Cell,
	type Filing,
	firstForm,
} from "#/utils/inflection/types";
import { db } from "../src/db";
import { entries } from "../src/db/schema";

const problems: Array<string> = [];
let checked = 0;

const filing = (fields: Partial<Filing> & Pick<Filing, "lemma" | "partOfSpeech">): Filing => ({
	principalParts: null,
	gender: null,
	declension: null,
	terminations: null,
	conjugation: null,
	...fields,
});

function slot(a: Analysis) {
	if (a.kind === "case") return `${a.number} ${a.case}${a.gender ? ` ${a.gender}` : ""}`;
	if (a.kind === "finite") return `${a.mood} ${a.voice} ${a.tense} ${a.person}`;
	return `${a.tense} ${a.voice} infinitive`;
}

const formsOf = ({ form, alt }: Form) => [form, ...(alt === undefined ? [] : typeof alt === "string" ? [alt] : alt)];

/**
 * Every form the page prints is generated in that slot, and every form the
 * generator vouches for (not a variant) is on the page.
 */
function compare(where: string, page: Map<string, Array<string>>, cells: Array<Cell>) {
	const generated = new Map<string, Array<Cell>>();
	for (const cell of cells) {
		const key = slot(cell.analysis);
		generated.set(key, [...(generated.get(key) ?? []), cell]);
	}
	for (const [key, forms] of page) {
		const got = generated.get(key) ?? [];
		for (const form of forms) {
			checked++;
			if (!got.some((c) => c.form === form)) {
				problems.push(`${where} ${key}: the page has "${form}", the generator gives ${got.map((c) => `"${c.form}"`).join(", ") || "nothing"}`);
			}
		}
		for (const cell of got) {
			if (!cell.variant && !forms.includes(cell.form)) {
				problems.push(`${where} ${key}: the generator gives "${cell.form}", which the page does not have`);
			}
		}
	}
}

// --- the grammar pages --------------------------------------------------------

DECLENSION_GROUPS.forEach(({ paradigms }, i) => {
	for (const p of paradigms) {
		const page = new Map<string, Array<string>>();
		for (const number of ["singular", "plural"] as const) {
			for (const c of CASES) page.set(`${number} ${c}`, formsOf(p[number][c]));
		}
		const entry = filing({
			lemma: p.lemma,
			partOfSpeech: "noun",
			principalParts: p.genitive,
			gender: p.gender[0] as Filing["gender"],
			declension: String(i + 1),
		});
		compare(p.lemma, page, paradigm(entry));
	}
});

const TERMINATIONS: Record<string, string> = {
	"three terminations": "3",
	"two terminations": "2",
	"one termination": "1",
};

for (const [declension, paradigms] of [["1-2", FIRST_SECOND], ["3", THIRD]] as const) {
	for (const p of paradigms) {
		const page = new Map<string, Array<string>>();
		for (const number of ["singular", "plural"] as const) {
			for (const c of ADJECTIVE_CASES) {
				for (const g of ["m", "f", "n"] as const) page.set(`${number} ${c} ${g}`, [p[number][c][g]]);
			}
		}
		const entry = filing({
			lemma: firstForm(p.lemma),
			partOfSpeech: "adjective",
			principalParts: p.lemma,
			declension,
			terminations: declension === "3" ? (TERMINATIONS[p.label] ?? null) : null,
		});
		compare(p.lemma, page, paradigm(entry));
	}
}

const verbs = [
	...CONJUGATION_GROUPS.flatMap(({ conjugation, verbs }) => verbs.map((verb) => ({ verb, conjugation }))),
	...IRREGULAR_VERBS.map((verb) => ({ verb, conjugation: "irregular" })),
];
for (const { verb, conjugation } of verbs) {
	const page = new Map<string, Array<string>>();
	for (const mood of ["indicative", "subjunctive"] as const) {
		const tenses: Record<string, Record<string, Form> | undefined> = verb[mood]?.active ?? {};
		for (const [tense, forms] of Object.entries(tenses)) {
			if (!forms) continue;
			for (const person of PERSONS) page.set(`${mood} active ${tense} ${person}`, formsOf(forms[person]));
		}
	}
	const [lemma] = verb.principalParts;
	const entry = filing({
		lemma,
		partOfSpeech: "verb",
		principalParts: verb.principalParts.join(", "),
		conjugation,
	});
	compare(lemma, page, paradigm(entry));
}

for (const table of PRONOUNS) {
	const page = new Map<string, Array<string>>();
	for (const number of ["singular", "plural"] as const) {
		for (const c of ADJECTIVE_CASES) {
			for (const g of ["m", "f", "n"] as const) page.set(`${number} ${c} ${g}`, formsOf(table[number][c][g]));
		}
	}
	const lemma = firstForm(table.lemma);
	compare(lemma, page, paradigm(filing({ lemma, partOfSpeech: "pronoun", principalParts: table.lemma })));
}

for (const pronoun of PERSONAL) {
	const page = new Map<string, Array<string>>();
	for (const number of ["singular", "plural"] as const) {
		for (const c of ADJECTIVE_CASES) {
			const cell = pronoun[number][c];
			if (cell) page.set(`${number} ${c}`, formsOf(cell));
		}
	}
	const lemma = firstForm(pronoun.lemma);
	compare(lemma, page, paradigm(filing({ lemma, partOfSpeech: "pronoun" })));
}

// --- what phase 1 promises ------------------------------------------------------

const fixtures: Array<Indexed> = [
	filing({ lemma: "bonus", partOfSpeech: "adjective", principalParts: "bonus, bona, bonum", declension: "1-2" }),
	filing({ lemma: "salūtō", partOfSpeech: "verb", principalParts: "salūtō, salūtāre, salūtāvī, salūtātum", conjugation: "1" }),
	filing({ lemma: "amō", partOfSpeech: "verb", principalParts: "amō, amāre, amāvī, amātum", conjugation: "1" }),
	filing({ lemma: "īdem", partOfSpeech: "pronoun", principalParts: "īdem, eadem, idem", declension: "irregular" }),
	filing({ lemma: "sum", partOfSpeech: "verb", principalParts: "sum, esse, fuī, futūrus", conjugation: "irregular" }),
	filing({ lemma: "rēx", partOfSpeech: "noun", principalParts: "rēgis", gender: "m", declension: "3" }),
	filing({ lemma: "vōx", partOfSpeech: "noun", principalParts: "vōcis", gender: "f", declension: "3" }),
	filing({ lemma: "vetus", partOfSpeech: "adjective", principalParts: "vetus, veteris", declension: "3", terminations: "1" }),
	filing({ lemma: "volō", partOfSpeech: "verb", principalParts: "volō, velle, voluī, volitūrus", conjugation: "irregular" }),
	filing({ lemma: "audiō", partOfSpeech: "verb", principalParts: "audiō, audīre, audīvī, audītum", conjugation: "4" }),
].map((f, i) => ({ ...f, id: i + 1 }));
const index = new FormIndex(fixtures);

// The query, and the lemma it has to find, as a form or as the word itself.
const PROMISES: Array<[string, string]> = [
	["bonae", "bonus"],
	["amat", "amō"],
	["amāre", "amō"],
	["salūtāvit", "salūtō"],
	["salūtāverō", "salūtō"],
	["salutauerunt", "salūtō"],
	["eundem", "īdem"],
	["est", "sum"],
	["fuisse", "sum"],
	["amasse", "amō"],
	["amarunt", "amō"],
	["audiit", "audiō"],
	["audierat", "audiō"],
	["audisse", "audiō"],
	["regis", "rēx"],
	["uox", "vōx"],
	["uocem", "vōx"],
	["uetus", "vetus"],
];
for (const [query, lemma] of PROMISES) {
	checked++;
	const { lemmaIds, forms } = index.lookup(formKey(query));
	const found = [...lemmaIds, ...forms.keys()].map((id) => index.filing(id)?.lemma);
	if (!found.includes(lemma)) {
		problems.push(`lookup "${query}": expected ${lemma}, found ${found.join(", ") || "nothing"}`);
	}
}
// volō is irregular with no table yet: the generator must not guess its forms.
if (paradigm(fixtures.find((f) => f.conjugation === "irregular" && f.lemma === "volō") ?? fixtures[0]).length > 0) problems.push("volō: generated forms with no table to vouch for them");
if (formKey("cælum") !== "caelum") problems.push(`formKey("cælum") is "${formKey("cælum")}", not "caelum"`);

// --- every filed entry -------------------------------------------------------------

const rows = await db.select().from(entries);
let silent = 0;
for (const row of rows) {
	const inflection = inflectionOf(row);
	if (!inflection) {
		silent++;
		continue;
	}
	const keys = keysOf(row, inflection);
	for (const cell of inflection.cells()) {
		checked++;
		const key = formKey(cell.form);
		if (!keys.some((k) => key.startsWith(k))) {
			problems.push(`${row.lemma} (#${row.id}): "${cell.form}" starts with none of its keys (${keys.join(", ")})`);
		}
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} forms problem(s). The rules are in src/utils/inflection/; see vault/forms.md.`,
	);
	process.exit(1);
}

console.log(
	`Forms OK — checked ${checked} forms and lookups. ${silent} of ${rows.length} entries generate nothing beyond their lemma.`,
);
