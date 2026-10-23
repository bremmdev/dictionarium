/** The rule is checkLemmas in src/utils/health/checks.ts, which /admin/health runs too. */
import { db } from "../src/db";
import { entries } from "../src/db/schema";
import { checkLemmas } from "#/utils/health/checks";

const rows = await db.select().from(entries);
const problems = checkLemmas(rows);

for (const p of problems) console.error(`${p.where}: ${p.message}`);

if (problems.length > 0) {
	console.error(`${problems.length} row(s) with a stale search key.`);
	process.exit(1);
}

console.log(`Lemmas OK — checked ${rows.length} rows.`);
