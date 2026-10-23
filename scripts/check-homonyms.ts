/** The rule is checkHomonyms in src/utils/health/checks.ts, which /admin/health runs too. */
import { db } from "../src/db";
import { entries } from "../src/db/schema";
import { checkHomonyms } from "#/utils/health/checks";

const rows = await db.select().from(entries);
const problems = checkHomonyms(rows);

for (const p of problems) console.error(`${p.where}: ${p.message}`);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} homonym problem(s). See vault/schema.md — "Unique on (lemma, homonym)".`,
	);
	process.exit(1);
}

const lemmas = new Set(rows.map((r) => r.lemma)).size;
console.log(`Homonyms OK — checked ${rows.length} rows across ${lemmas} lemmas.`);
