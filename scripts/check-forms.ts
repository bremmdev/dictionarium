/**
 * The forms search (vault/forms.md) against the grammar pages: every paradigm
 * there has to come out of the generator cell for cell. Then the lookups phase
 * 1 promises, and, for every filed entry, that each generated form starts with
 * one of the keys the index finds the entry by.
 */
import {
	type Cetera,
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
import { fold, searchKey } from "#/utils/search/key";
import { maxEditsFor, nearestSuggestions } from "#/utils/search/suggestions";
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
	stemClass: null,
	conjugation: null,
	...fields,
});

function slot(a: Analysis) {
	if (a.kind === "case") return `${a.of ? `${a.of} ` : ""}${a.number} ${a.case}${a.gender ? ` ${a.gender}` : ""}`;
	if (a.kind === "finite") return `${a.mood} ${a.voice} ${a.tense} ${a.person}`;
	if (a.kind === "imperative") return `${a.voice} ${a.tense} imperative ${a.person}`;
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
			stemClass: p.stemClass ?? null,
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
			// "These are i-stems", as the page says.
			stemClass: declension === "3" ? "i-stem" : null,
		});
		compare(p.lemma, page, paradigm(entry));
	}
}

/** The Cētera tab, slot by slot; the two-word infinitives are left out. */
function ceteraSlots(cetera: Cetera, page: Map<string, Array<string>>) {
	const set = (slot: string, cell: Form | undefined) => {
		if (cell) page.set(slot, formsOf(cell));
	};
	for (const voice of ["active", "passive"] as const) {
		for (const tense of ["present", "future"] as const) {
			for (const [person, cell] of Object.entries(cetera.imperative[voice]?.[tense] ?? {})) {
				set(`${voice} ${tense} imperative ${person}`, cell);
			}
		}
		set(`present ${voice} infinitive`, cetera.infinitive.present?.[voice]);
	}
	set("perfect active infinitive", cetera.infinitive.perfect?.active);
	const [nominative, genitive] = cetera.participle.present?.form.split(", ") ?? [];
	for (const g of ["m", "f", "n"] as const) {
		if (nominative) page.set(`presentParticiple singular nominative ${g}`, [nominative]);
		if (genitive) page.set(`presentParticiple singular genitive ${g}`, [genitive]);
	}
	for (const [of, line] of [
		["perfectParticiple", cetera.participle.perfect],
		["futureParticiple", cetera.participle.future],
		["gerundive", cetera.gerundive],
	] as const) {
		line?.form.split(", ").forEach((form, i) => page.set(`${of} singular nominative ${["m", "f", "n"][i]}`, [form]));
	}
	for (const [c, cell] of Object.entries(cetera.gerund ?? {})) set(`gerund singular ${c}`, cell);
	for (const [c, cell] of Object.entries(cetera.supine ?? {})) set(`supine singular ${c}`, cell);
}

const verbs = [
	...CONJUGATION_GROUPS.flatMap(({ conjugation, verbs }) => verbs.map((verb) => ({ verb, conjugation }))),
	...IRREGULAR_VERBS.map((verb) => ({ verb, conjugation: "irregular" })),
];
for (const { verb, conjugation } of verbs) {
	const page = new Map<string, Array<string>>();
	for (const mood of ["indicative", "subjunctive"] as const) {
		for (const voice of ["active", "passive"] as const) {
			const tenses: Record<string, Record<string, Form> | undefined> = verb[mood]?.[voice] ?? {};
			for (const [tense, forms] of Object.entries(tenses)) {
				if (!forms) continue;
				for (const person of PERSONS) {
					// The perfect passive is two words; its participle is checked on its own.
					const single = formsOf(forms[person]).filter((form) => !form.includes(" "));
					if (single.length > 0) page.set(`${mood} ${voice} ${tense} ${person}`, single);
				}
			}
		}
	}
	if (verb.cetera) ceteraSlots(verb.cetera, page);
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
	filing({ lemma: "rēx", partOfSpeech: "noun", principalParts: "rēgis", gender: "m", declension: "3", stemClass: "consonant" }),
	filing({ lemma: "vōx", partOfSpeech: "noun", principalParts: "vōcis", gender: "f", declension: "3", stemClass: "consonant" }),
	filing({ lemma: "vetus", partOfSpeech: "adjective", principalParts: "vetus, veteris", declension: "3", terminations: "1", stemClass: "consonant" }),
	filing({ lemma: "urbs", partOfSpeech: "noun", principalParts: "urbis", gender: "f", declension: "3", stemClass: "i-stem" }),
	filing({ lemma: "mare", partOfSpeech: "noun", principalParts: "maris", gender: "n", declension: "3", stemClass: "i-stem" }),
	filing({ lemma: "ingēns", partOfSpeech: "adjective", principalParts: "ingēns, ingentis", declension: "3", terminations: "1", stemClass: "i-stem" }),
	filing({ lemma: "volō", partOfSpeech: "verb", principalParts: "volō, velle, voluī, volitūrus", conjugation: "irregular" }),
	filing({ lemma: "audiō", partOfSpeech: "verb", principalParts: "audiō, audīre, audīvī, audītum", conjugation: "4" }),
	filing({ lemma: "hortor", partOfSpeech: "verb", principalParts: "hortor, hortārī, hortātus sum", conjugation: "1" }),
	filing({ lemma: "loquor", partOfSpeech: "verb", principalParts: "loquor, loquī, locūtus sum", conjugation: "3" }),
	filing({ lemma: "patior", partOfSpeech: "verb", principalParts: "patior, patī, passus sum", conjugation: "3io" }),
	filing({ lemma: "audeō", partOfSpeech: "verb", principalParts: "audeō, audēre, ausus sum", conjugation: "2" }),
	filing({ lemma: "dīcō", partOfSpeech: "verb", principalParts: "dīcō, dīcere, dīxī, dictum", conjugation: "3" }),
	filing({ lemma: "capiō", partOfSpeech: "verb", principalParts: "capiō, capere, cēpī, captum", conjugation: "3io" }),
	filing({ lemma: "volō", partOfSpeech: "verb", principalParts: "volō, volāre, volāvī, volātum", conjugation: "1" }),
	filing({ lemma: "nōlō", partOfSpeech: "verb", principalParts: "nōlō, nōlle, nōluī", conjugation: "irregular" }),
	filing({ lemma: "ferō", partOfSpeech: "verb", principalParts: "ferō, ferre, tulī, lātum", conjugation: "3" }),
	filing({ lemma: "afferō", partOfSpeech: "verb", principalParts: "afferō, afferre, attulī, allātum", conjugation: "3" }),
	filing({ lemma: "prōsum", partOfSpeech: "verb", principalParts: "prōsum, prōdesse, prōfuī, prōfutūrus", conjugation: "irregular" }),
	filing({ lemma: "absum", partOfSpeech: "verb", principalParts: "absum, abesse, āfuī, āfutūrus", conjugation: "irregular" }),
	filing({ lemma: "redeō", partOfSpeech: "verb", principalParts: "redeō, redīre, rediī, reditum", conjugation: "irregular" }),
	filing({ lemma: "faciō", partOfSpeech: "verb", principalParts: "faciō, facere, fēcī, factum", conjugation: "3io" }),
	filing({ lemma: "ego", partOfSpeech: "pronoun" }),
	filing({ lemma: "uterque", partOfSpeech: "pronoun", principalParts: "uterque, utraque, utrumque" }),
	filing({ lemma: "uter", partOfSpeech: "pronoun", principalParts: "uter, utra, utrum" }),
	filing({ lemma: "pater", partOfSpeech: "noun", principalParts: "patris", gender: "m", declension: "3", stemClass: "consonant" }),
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
	["veterum", "vetus"],
	["patrum", "pater"],
	["urbium", "urbs"],
	["urbis", "urbs"],
	["maria", "mare"],
	["marium", "mare"],
	["ingentium", "ingēns"],
	["ingentia", "ingēns"],
	// Phase 2: the passive, deponents and everything that is not finite.
	["amatur", "amō"],
	["amabantur", "amō"],
	["amaris", "amō"],
	["amere", "amō"],
	["audiri", "audiō"],
	["capi", "capiō"],
	["caperis", "capiō"],
	["hortatur", "hortor"],
	["hortari", "hortor"],
	["hortatus", "hortor"],
	["hortans", "hortor"],
	["loquitur", "loquor"],
	["locuti", "loquor"],
	["patiuntur", "patior"],
	["passa", "patior"],
	["ausus", "audeō"],
	["audet", "audeō"],
	["ama", "amō"],
	["amate", "amō"],
	["amanto", "amō"],
	["dic", "dīcō"],
	["cape", "capiō"],
	["amantis", "amō"],
	["amantium", "amō"],
	["amandi", "amō"],
	["amandum", "amō"],
	["amandae", "amō"],
	["amatum", "amō"],
	["amatu", "amō"],
	["amatae", "amō"],
	["amaturus", "amō"],
	["capientes", "capiō"],
	["dicturi", "dīcō"],
	["uult", "volō"],
	["velle", "volō"],
	["velim", "volō"],
	["volebat", "volō"],
	["volat", "volō"],
	["noli", "nōlō"],
	["nolite", "nōlō"],
	["nollem", "nōlō"],
	["fertur", "ferō"],
	["ferat", "ferō"],
	["ferret", "ferō"],
	["ferri", "ferō"],
	["ferens", "ferō"],
	["lata", "ferō"],
	["laturos", "ferō"],
	["ferendum", "ferō"],
	["fer", "ferō"],
	["fore", "sum"],
	["este", "sum"],
	["attulit", "afferō"],
	["affert", "afferō"],
	["allatum", "afferō"],
	["prodest", "prōsum"],
	["prosunt", "prōsum"],
	["afuit", "absum"],
	["abest", "absum"],
	["redit", "redeō"],
	["redeunt", "redeō"],
	["redire", "redeō"],
	// Enclitics, tried only when the whole query matched nothing.
	["bonumque", "bonus"],
	["paterque", "pater"],
	["amatne", "amō"],
	["regisue", "rēx"],
	["mecum", "ego"],
	["nobiscum", "ego"],
	["utrumque", "uterque"],
];
// A typo in a form is offered the form: "Did you mean amāvissent (amō)?"
for (const [typo, form, lemma] of [
	["amavisent", "amāvissent", "amō"],
	["regsi", "rēgis", "rēx"],
] as const) {
	checked++;
	const key = searchKey(typo);
	if (!key) continue;
	const offered = nearestSuggestions(key, index.suggest(key.folded, maxEditsFor(key)));
	if (!offered.some((s) => fold(s.text) === fold(form) && s.of === lemma)) {
		problems.push(`suggestion for "${typo}": expected ${form} (${lemma}), got ${offered.map((s) => `${s.text} (${s.of})`).join(", ") || "nothing"}`);
	}
}

// Spellings that must not be found under a word, for the rules not to guess.
const REFUSALS: Array<[string, string]> = [
	["uult", "volō, volāre"],
	["volabat", "volō, velle"],
	["facitur", "faciō"],
	["fert", "afferō"],
	// uterque is a word of its own, not uter + -que.
	["utrumque", "uter"],
	// The stem class picks one side where i-stems differ.
	["patrium", "pater"],
	["regium", "rēx"],
	["veterium", "vetus"],
	["veteria", "vetus"],
	["urbum", "urbs"],
	["mara", "mare"],
	["marum", "mare"],
	["ingentum", "ingēns"],
];
for (const [query, owner] of REFUSALS) {
	checked++;
	const { forms } = index.lookup(fold(query));
	for (const id of forms.keys()) {
		const f = index.filing(id);
		if (f && (f.lemma === owner || f.principalParts?.startsWith(`${owner},`) || (owner.includes(",") && f.principalParts?.startsWith(owner)))) {
			problems.push(`lookup "${query}": found under ${f.principalParts}, which has no such form`);
		}
	}
}
for (const [query, lemma] of PROMISES) {
	checked++;
	const { lemmaIds, forms } = index.lookup(fold(query));
	const found = [...lemmaIds, ...forms.keys()].map((id) => index.filing(id)?.lemma);
	if (!found.includes(lemma)) {
		problems.push(`lookup "${query}": expected ${lemma}, found ${found.join(", ") || "nothing"}`);
	}
}

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
		const key = fold(cell.form);
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
