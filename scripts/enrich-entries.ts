/**
 * Turns bare lemmas into full `entries` rows, using English Wiktionary as the
 * source. Give it what you can read off a page — `puella`, `ambulo` — and it
 * works out the rest of the filing described in vault/schema.md: the macronned
 * lemma, the principal parts, gender, declension, conjugation, and every sense
 * Wiktionary lists, in its order — its first sense becomes rank 1.
 *
 *   npx tsx scripts/enrich-entries.ts puella ambulo mater
 *   npx tsx scripts/enrich-entries.ts --file lemmas.txt --write
 *
 * A page can hold several Latin words under one spelling (`capio` is both a
 * verb and a noun; `bonus` an adjective and a noun). Pin the one you mean with
 * `lemma#pos`, e.g. `capio#verb`. Without it the script takes the first and
 * says so.
 *
 * The looking up and the parsing live in src/utils/entries/wiktionary.ts, which
 * the admin form's Quaere button calls too — one word at a time, into the
 * fields, for a person to read. This file is the other end of the same thing:
 * many words at once, printed or written.
 *
 * The output is a paste-ready block of seed.ts rows. Treat it as a research
 * assistant, not an oracle — Wiktionary's senses are rarely the ones you would
 * write yourself, and it lists far more of them than a learner's dictionary
 * wants, so read and cut the rows before they become dictionary entries.
 */
import { readFileSync } from "node:fs";
import { lookupEntry, type WiktionaryRow } from "#/utils/entries/wiktionary";

/* ------------------------------------------------------------------ output */

/**
 * lemma_plain is left out on purpose: seed.ts derives it from the lemma, so a
 * pasted row carrying its own could drift from the key the search reads.
 */
const COLUMN_ORDER: Array<
    Exclude<keyof WiktionaryRow, "lemmaPlain" | "senses">
> = [
    "lemma",
    "partOfSpeech",
    "principalParts",
    "gender",
    "declension",
    "terminations",
    "conjugation",
    "notes",
];

/** Prints a row in the shape seed.ts uses, ready to paste into its array. */
function formatRow(row: WiktionaryRow) {
    const columns = COLUMN_ORDER.filter((key) => row[key] !== undefined && row[key] !== "").map(
        (key) => `  ${key}: ${JSON.stringify(row[key])},`,
    );

    const senses = row.senses.map((sense) => {
        const fields = [`meaningEn: ${JSON.stringify(sense.meaningEn)}`];
        if (sense.usage) fields.push(`usage: ${JSON.stringify(sense.usage)}`);
        return `    { ${fields.join(", ")} },`;
    });

    return `{\n${columns.join("\n")}\n  senses: [\n${senses.join("\n")}\n  ],\n},`;
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
        // Pinned: `capio#verb` asked for the verb, and the noun is not an answer.
        return { lemma: lemma.normalize("NFC"), partOfSpeech: partOfSpeech?.toLowerCase(), pinned: true };
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

const rows: Array<WiktionaryRow> = [];
const warnings: Array<string> = [];
const failures: Array<string> = [];

for (const spec of specs) {
    try {
        const found = await lookupEntry(spec);
        // The lookup does not know which word it was asked about among many.
        for (const warning of found.warnings) warnings.push(`${spec.lemma}: ${warning}`);
        rows.push(found.row);
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
    const { entries, senses } = await import("../src/db/schema");

    // Nothing here overwrites: a lemma already on file keeps its row and the
    // senses someone has curated for it, and is reported as already present.
    const inserted = await db
        .insert(entries)
        .values(rows.map(({ senses: _senses, ...columns }) => columns))
        .onConflictDoNothing({ target: [entries.lemma] })
        .returning({ id: entries.id, lemma: entries.lemma });

    const sensesByLemma = new Map(rows.map((row) => [row.lemma, row.senses]));

    // Senses ride along with the entry that was just created, in the order
    // Wiktionary printed them: position is the rank, exactly as in seed.ts.
    const newSenses = inserted.flatMap(({ id, lemma }) =>
        (sensesByLemma.get(lemma) ?? []).map((sense, i) => ({ ...sense, entryId: id, rank: i + 1 })),
    );

    if (newSenses.length > 0) await db.insert(senses).values(newSenses);

    console.error(
        `${inserted.length} inserted with ${newSenses.length} senses, ${rows.length - inserted.length} already present.`,
    );
}

if (failures.length > 0) process.exit(1);
