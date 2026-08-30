/**
 * lemma_plain is derived from lemma, so it must equal normalizeLemma(lemma)
 * for every row. Rows the seed writes can no longer drift; rows the admin
 * panel will write are exactly why this exists.
 */
import { db } from "../src/db";
import { entries } from "../src/db/schema";
import { normalizeLemma } from "#/utils/search/rules";

const rows = await db.select().from(entries);
const wrong = rows.filter((r) => normalizeLemma(r.lemma) !== r.lemmaPlain);

for (const r of wrong) {
    console.error(
        `${r.lemma}: lemma_plain is "${r.lemmaPlain}", should be "${normalizeLemma(r.lemma)}"`,
    );
}

if (wrong.length > 0) {
    console.error(`${wrong.length} row(s) with a stale search key.`);
    process.exit(1);
}

console.log(`Lemmas OK — checked ${rows.length} rows.`);