/**
 * Turns bare lemmas into full `entries` rows, using English Wiktionary as the
 * source. Give it what you can read off a page — `puella`, `ambulo` — and it
 * works out the rest of the filing described in vault/schema.md: the macronned
 * lemma, the principal parts, gender, declension, conjugation, a gloss.
 *
 *   npx tsx scripts/enrich-entries.ts puella ambulo mater
 *   npx tsx scripts/enrich-entries.ts --file lemmas.txt --write
 *
 * A page can hold several Latin words under one spelling (`capio` is both a
 * verb and a noun; `bonus` an adjective and a noun). Pin the one you mean with
 * `lemma#pos`, e.g. `capio#verb`. Without it the script takes the first and
 * says so.
 *
 * The output is a paste-ready block of seed.ts rows. Treat it as a research
 * assistant, not an oracle — Wiktionary's first sense is rarely the gloss you
 * would write yourself, so read the rows before they become dictionary entries.
 */
import { readFileSync } from "node:fs";

const API = "https://en.wiktionary.org/w/api.php";
/** Wikimedia asks scripts to identify themselves and link somewhere contactable. */
const USER_AGENT = "dictionarium-enrich/0.1 (+https://github.com/bremmdev/dictionarium)";
/** Wikimedia throttles bursts hard — a second between requests keeps us welcome. */
const THROTTLE_MS = 1000;

type Row = {
    lemma: string;
    lemmaPlain: string;
    partOfSpeech: string;
    principalParts?: string;
    gender?: string;
    declension?: string;
    conjugation?: string;
    meaningEn: string;
    notes?: string;
};

/* ------------------------------------------------------------------- text */

/**
 * "vīlla" -> "villa". Decomposing to NFD turns a macron into its own combining
 * mark, so dropping every mark strips it without touching the base letter. Kept
 * identical to normalizeLemma in src/utils/search/rules.ts: this writes lemma_plain,
 * that reads it, and a drift between the two makes lookups silently miss.
 */
function normalizeLemma(value: string) {
    return value.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLowerCase().replace(/[^a-z ]/g, "");
}

const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
};

function decodeEntities(html: string) {
    return html
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
        .replace(/&(amp|apos|gt|lt|nbsp|quot);/g, (_, n) => NAMED_ENTITIES[n]);
}

/** Flattens a fragment of Wiktionary HTML to the text a reader would see. */
function toText(html: string) {
    return decodeEntities(html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, ""))
        .replace(/\s+/g, " ")
        .trim()
        .normalize("NFC");
}

/**
 * Wiktionary nests <span> inside <span> and <li> inside <li>, so a lazy regex
 * closes on the wrong tag and swallows half a section. Count depth instead.
 */
function extractTag(html: string, tag: string, from = 0) {
    const opening = new RegExp(`<${tag}(?=[\\s/>])[^>]*>`, "gi");
    opening.lastIndex = from;
    const first = opening.exec(html);
    if (!first) return null;

    const scan = new RegExp(`<${tag}(?=[\\s/>])[^>]*>|</${tag}\\s*>`, "gi");
    scan.lastIndex = first.index;
    let depth = 0;

    for (let m = scan.exec(html); m; m = scan.exec(html)) {
        depth += m[0].startsWith("</") ? -1 : 1;
        if (depth > 0) continue;
        return {
            inner: html.slice(first.index + first[0].length, m.index),
            start: first.index,
            end: scan.lastIndex,
        };
    }
    return null;
}

function removeTag(html: string, tag: string) {
    let out = html;
    for (let cut = extractTag(out, tag); cut; cut = extractTag(out, tag)) {
        out = out.slice(0, cut.start) + out.slice(cut.end);
    }
    return out;
}

/* ------------------------------------------------------------- wiktionary */

let lastRequest = 0;

async function callApi(params: Record<string, string>) {
    const wait = lastRequest + THROTTLE_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequest = Date.now();

    const query = new URLSearchParams({
        format: "json",
        formatversion: "2",
        redirects: "1",
        ...params,
    });
    const response = await fetch(`${API}?${query}`, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) {
        throw new Error(`Wiktionary answered ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    if (body.error) throw new Error(body.error.info ?? body.error.code);
    return body.parse;
}

/**
 * Latin pages are filed under the macron-less spelling ("ambulo", never
 * "ambulō"), so we look up the stripped form whatever the caller typed. Titles
 * are case-sensitive, hence the capitalised retry for proper nouns.
 */
async function fetchLatinSection(lemma: string) {
    const plain = normalizeLemma(lemma);
    const titles = [plain, plain.charAt(0).toUpperCase() + plain.slice(1)];
    let lastError: unknown;

    for (const title of titles) {
        try {
            const outline = await callApi({ action: "parse", page: title, prop: "sections" });
            const latin = outline.sections.find(
                (s: { line: string; toclevel: number }) => s.line === "Latin" && s.toclevel === 1,
            );
            if (!latin) throw new Error(`"${title}" has no Latin section on Wiktionary`);

            const section = await callApi({
                action: "parse",
                page: title,
                prop: "text",
                section: String(latin.index),
            });
            return section.text as string;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}

/* ---------------------------------------------------------------- parsing */

const PARTS_OF_SPEECH = new Set([
    "adjective",
    "adverb",
    "article",
    "conjunction",
    "determiner",
    "interjection",
    "noun",
    "numeral",
    "particle",
    "phrase",
    "preposition",
    "pronoun",
    "proper noun",
    "proverb",
    "verb",
]);

type Candidate = {
    partOfSpeech: string;
    /** The macronned headword as Wiktionary prints it. */
    headword: string;
    /** "genitive" -> "mātris", "present infinitive" -> "ambulāre", ... */
    forms: Map<string, string>;
    gender?: string;
    /** The whole headword line as text: where "third conjugation, deponent" lives. */
    grammar: string;
    gloss: string;
    /** True for sections that only point at another lemma ("ablative singular of quisque"). */
    isInflectedForm: boolean;
};

/** Slices the Latin section into one block per heading, keyed by heading text. */
function splitByHeading(html: string) {
    const heading = /<div class="mw-heading[^"]*">\s*<h(\d)[^>]*>([\s\S]*?)<\/h\1>/g;
    const found = [...html.matchAll(heading)];

    return found.map((match, i) => ({
        title: toText(match[2]).toLowerCase(),
        html: html.slice(match.index + match[0].length, found[i + 1]?.index ?? html.length),
    }));
}

/**
 * Reads the labelled forms off a headword line. The line is a stream of
 * <i>label</i> <b>form</b> pairs — "present infinitive ambulāre, perfect active
 * cucurrī or currī" — where "or" introduces an alternative rather than a new
 * label, so we keep the first form under each label and drop the variants.
 */
function readForms(headwordLine: string) {
    const forms = new Map<string, string>();
    let label = "";

    for (const token of headwordLine.matchAll(/<i\b[^>]*>([\s\S]*?)<\/i>|<b\b[^>]*>([\s\S]*?)<\/b>/g)) {
        if (token[1] !== undefined) {
            const read = toText(token[1]).toLowerCase();
            if (read && read !== "or" && read !== "and") label = read;
            continue;
        }
        const form = toText(token[2]);
        if (label && form && !forms.has(label)) forms.set(label, form);
    }
    return forms;
}

function findForm(forms: Map<string, string>, label: RegExp) {
    for (const [key, value] of forms) {
        if (label.test(key)) return value;
    }
    return undefined;
}

function readGloss(block: string) {
    const list = extractTag(block, "ol");
    const item = list && extractTag(list.inner, "li");
    if (!item) return { gloss: "", isInflectedForm: false };

    const isInflectedForm = /class="[^"]*form-of-definition/.test(item.inner);

    // Quotations, synonyms and sub-senses hang off the definition in nested lists.
    let sense = ["dl", "ul", "ol"].reduce(removeTag, item.inner);
    // "(female parent)" style clarifiers are marked up, so they can go cleanly.
    sense = sense.replace(/<span class="mention-gloss[^"]*"[^>]*>[\s\S]*?<\/span>/g, "");

    return { gloss: toText(sense), isInflectedForm };
}

function parseCandidates(sectionHtml: string) {
    const candidates: Array<Candidate> = [];

    for (const block of splitByHeading(sectionHtml)) {
        // "Adverb 2", under a second etymology, is still an adverb.
        const partOfSpeech = block.title.replace(/\s+\d+$/, "");
        if (!PARTS_OF_SPEECH.has(partOfSpeech)) continue;

        const paragraph = extractTag(block.html, "p");
        const lineStart = block.html.indexOf('<span class="headword-line"');
        if (!paragraph || lineStart < 0) continue;

        const line = extractTag(block.html, "span", lineStart);
        if (!line) continue;

        const headword = line.inner.match(
            /<strong[^>]*class="[^"]*headword[^"]*"[^>]*>([\s\S]*?)<\/strong>/,
        );
        if (!headword) continue;

        const gender = line.inner.match(/<span class="gender"[^>]*>([\s\S]*?)<\/span>/);

        candidates.push({
            partOfSpeech,
            headword: toText(headword[1]),
            forms: readForms(line.inner),
            gender: gender ? toText(gender[1]) : undefined,
            grammar: toText(paragraph.inner),
            ...readGloss(block.html),
        });
    }
    return candidates;
}

/* -------------------------------------------------------- grammar mapping */

const ORDINALS = ["first", "second", "third", "fourth", "fifth"];

function ordinalToDigit(word: string) {
    return String(ORDINALS.indexOf(word) + 1);
}

function readDeclension(grammar: string) {
    // Adjectives take two: "first/second-declension adjective".
    const both = grammar.match(
        /(first|second|third|fourth|fifth)\/(first|second|third|fourth|fifth)[- ]declension/,
    );
    if (both) return `${ordinalToDigit(both[1])}/${ordinalToDigit(both[2])}`;

    const one = grammar.match(/(first|second|third|fourth|fifth)[- ]declension/);
    return one ? ordinalToDigit(one[1]) : undefined;
}

function readConjugation(grammar: string) {
    if (/irregular conjugation/.test(grammar)) return "irregular";
    if (/third \(-i[ōo] variant\) conjugation/.test(grammar)) return "3io";

    const plain = grammar.match(/(first|second|third|fourth)[- ]conjugation/);
    return plain ? ordinalToDigit(plain[1]) : undefined;
}

/**
 * Everything Wiktionary says about the word that the columns have nowhere to
 * put — deponency, indeclinability, the case a preposition governs.
 */
function readNotes(candidate: Candidate) {
    const flags = new Set<string>();

    // Longest alternative first: "semi-deponent" must not be read as "deponent".
    const phrases =
        /\b(semi-deponent|deponent|indeclinable|impersonal(?: in the passive)?|defective|suppletive|no passive|no supine|not comparable)\b/g;
    for (const match of candidate.grammar.matchAll(phrases)) flags.add(match[1]);

    for (const match of candidate.grammar.matchAll(/\+ (ablative|accusative|dative|genitive)/g)) {
        flags.add(`takes the ${match[1]}`);
    }
    // The gender column holds one letter; "m or f" has to be said in words.
    if (candidate.gender?.includes("or")) flags.add(`gender: ${candidate.gender}`);

    return flags.size > 0 ? [...flags].join("; ") : undefined;
}

function readGender(candidate: Candidate) {
    return candidate.gender?.match(/\b([mfn])\b/)?.[1];
}

/**
 * The dictionary filing for the word: all four principal parts for a verb, the
 * genitive for a noun, the genders for an adjective, nothing for the rest —
 * their lemma is already the whole filing (see vault/schema.md).
 */
function readPrincipalParts(candidate: Candidate) {
    const { forms, headword, partOfSpeech } = candidate;

    if (partOfSpeech === "verb") {
        const parts = [
            headword,
            findForm(forms, /infinitive/),
            findForm(forms, /perfect/),
            // sum has no supine; its fourth part is the future active participle.
            findForm(forms, /supine/) ?? findForm(forms, /future active participle/),
        ];
        return parts.filter(Boolean).join(", ");
    }

    if (partOfSpeech === "noun" || partOfSpeech === "proper noun") {
        return findForm(forms, /genitive/);
    }

    if (partOfSpeech === "adjective") {
        // Third-declension adjectives file with fewer forms: ācer, ācris, ācre.
        const filed = [headword, findForm(forms, /feminine/), findForm(forms, /neuter/)].filter(Boolean);
        return filed.length > 1 ? filed.join(", ") : undefined;
    }

    return undefined;
}

/**
 * Where a definition stops being a gloss and starts being commentary on one:
 * "tower, especially a military tower for siege, advanced to the walls..."
 */
const COMMENTARY =
    /[,;]\s*(?:especially|particularly|specifically|namely|loosely|chiefly|originally|properly|by extension|figuratively)\b.*$/i;

/** Wiktionary writes definitions as prose; the column wants a bare gloss. */
function tidyGloss(gloss: string, partOfSpeech: string) {
    let tidied = gloss;

    // Labels and clarifications wrap each other — "(space) [with ablative]" —
    // so peel until nothing more comes off.
    for (let previous = ""; tidied !== previous;) {
        previous = tidied;
        tidied = tidied
            // A leading "(intransitive)" or "(poetic)" is a label, not the meaning.
            .replace(/^\((?:[^()]|\([^()]*\))*\)\s*/, "")
            // A trailing parenthesis is a clarification the gloss can live without.
            .replace(/\s*\((?:[^()]|\([^()]*\))*\)$/, "")
            .replace(/\s*\[[^\]]*\]$/, "")
            .trim();
    }

    tidied = tidied.replace(COMMENTARY, "").replace(/[,;:]+$/, "").trim();

    // "A day" -> "a day", but Rōma stays Rōma and SPQR stays SPQR.
    if (partOfSpeech !== "proper noun" && /^[A-Z][a-z]*\b/.test(tidied)) {
        tidied = tidied.charAt(0).toLowerCase() + tidied.slice(1);
    }
    return tidied;
}

function toRow(candidate: Candidate): Row {
    const isNoun = candidate.partOfSpeech === "noun" || candidate.partOfSpeech === "proper noun";
    const isNominal = isNoun || candidate.partOfSpeech === "adjective";

    return {
        lemma: candidate.headword.normalize("NFC"),
        lemmaPlain: normalizeLemma(candidate.headword),
        partOfSpeech: candidate.partOfSpeech,
        principalParts: readPrincipalParts(candidate) || undefined,
        gender: isNoun ? readGender(candidate) : undefined,
        declension: isNominal ? readDeclension(candidate.grammar) : undefined,
        conjugation: candidate.partOfSpeech === "verb" ? readConjugation(candidate.grammar) : undefined,
        meaningEn: tidyGloss(candidate.gloss, candidate.partOfSpeech),
        notes: readNotes(candidate),
    };
}

/* --------------------------------------------------------------- choosing */

type Spec = { lemma: string; partOfSpeech?: string };

function chooseCandidate(
    candidates: Array<Candidate>,
    spec: Spec,
    warn: (message: string) => void,
) {
    if (candidates.length === 0) {
        throw new Error("no part-of-speech section found in the Latin entry");
    }

    let pool = candidates;

    if (spec.partOfSpeech) {
        pool = pool.filter((c) => c.partOfSpeech === spec.partOfSpeech);
        if (pool.length === 0) {
            const available = [...new Set(candidates.map((c) => c.partOfSpeech))].join(", ");
            throw new Error(`no ${spec.partOfSpeech} section; Wiktionary has: ${available}`);
        }
    }

    // If the caller typed the macrons, they are a disambiguator: liber vs līber.
    if (spec.lemma !== normalizeLemma(spec.lemma)) {
        const exact = pool.filter((c) => c.headword.normalize("NFC") === spec.lemma.normalize("NFC"));
        if (exact.length > 0) pool = exact;
    }

    // A section that only says "ablative singular of quisque" is not a headword.
    const headwords = pool.filter((c) => !c.isInflectedForm);
    if (headwords.length > 0) pool = headwords;

    if (pool.length > 1) {
        const options = pool.map((c) => `${spec.lemma}#${c.partOfSpeech}`).join(", ");
        warn(`${spec.lemma}: ${pool.length} Latin entries, took the ${pool[0].partOfSpeech}. Others: ${options}`);
    }
    return pool[0];
}

/* ------------------------------------------------------------------ output */

const COLUMN_ORDER: Array<keyof Row> = [
    "lemma",
    "lemmaPlain",
    "partOfSpeech",
    "principalParts",
    "gender",
    "declension",
    "conjugation",
    "meaningEn",
    "notes",
];

/** Prints a row in the shape seed.ts uses, ready to paste into its array. */
function formatRow(row: Row) {
    const lines = COLUMN_ORDER.filter((key) => row[key] !== undefined && row[key] !== "").map(
        (key) => `      ${key}: ${JSON.stringify(row[key])},`,
    );
    return `    {\n${lines.join("\n")}\n    },`;
}

/* -------------------------------------------------------------------- main */

function parseArgs(argv: Array<string>) {
    const flags = { write: false, json: false };
    const words: Array<string> = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--write") flags.write = true;
        else if (arg === "--json") flags.json = true;
        else if (arg === "--file") {
            const path = argv[++i];
            if (!path) throw new Error("--file needs a path");
            // One lemma per line; blank lines and // comments are ignored.
            for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
                const cleaned = line.replace(/\/\/.*$/, "").trim();
                if (cleaned) words.push(cleaned);
            }
        } else if (arg.startsWith("-")) throw new Error(`unknown flag ${arg}`);
        else words.push(arg);
    }

    const specs = words.map((word) => {
        const [lemma, partOfSpeech] = word.split(/[#:]/);
        return { lemma: lemma.normalize("NFC"), partOfSpeech: partOfSpeech?.toLowerCase() };
    });
    return { specs, ...flags };
}

const { specs, write, json } = parseArgs(process.argv.slice(2));

if (specs.length === 0) {
    console.error(
        "Usage: npx tsx scripts/enrich-entries.ts <lemma[#pos]>... [--file list.txt] [--json] [--write]",
    );
    process.exit(1);
}

const rows: Array<Row> = [];
const warnings: Array<string> = [];
const failures: Array<string> = [];

for (const spec of specs) {
    try {
        const candidates = parseCandidates(await fetchLatinSection(spec.lemma));
        const row = toRow(chooseCandidate(candidates, spec, (message) => warnings.push(message)));

        if (!row.meaningEn) warnings.push(`${spec.lemma}: no gloss found, meaningEn needs writing by hand`);
        if (normalizeLemma(row.lemma) !== normalizeLemma(spec.lemma)) {
            warnings.push(`${spec.lemma}: Wiktionary files this under "${row.lemma}"`);
        }
        rows.push(row);
    } catch (error) {
        failures.push(`${spec.lemma}: ${error instanceof Error ? error.message : String(error)}`);
    }
}

if (json) {
    console.log(JSON.stringify(rows, null, 2));
} else if (rows.length > 0) {
    console.log(rows.map(formatRow).join("\n"));
}

for (const warning of warnings) console.error(`! ${warning}`);
for (const failure of failures) console.error(`x ${failure}`);
console.error(`\n${rows.length} enriched, ${failures.length} failed. Read the glosses before trusting them.`);

if (write && rows.length > 0) {
    // Imported late so a dry run never opens the database file.
    const { db } = await import("../src/db");
    const { entries } = await import("../src/db/schema");

    const inserted = await db
        .insert(entries)
        .values(rows)
        .onConflictDoNothing({ target: [entries.lemma] })
        .returning();
    console.error(`${inserted.length} inserted, ${rows.length - inserted.length} already present.`);
}

if (failures.length > 0) process.exit(1);
