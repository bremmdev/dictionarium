/** The rule is checkInflection in src/utils/health/checks.ts, which /admin/health runs too. */
import { db } from "../src/db";
import { entries } from "../src/db/schema";
import { checkInflection } from "#/utils/health/checks";

const rows = await db.select().from(entries);
const problems = checkInflection(rows);

for (const p of problems) console.error(`${p.where}: ${p.message}`);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} inflection problem(s). See vault/schema.md — "The inflection vocabulary".`,
	);
	process.exit(1);
}

console.log(`Inflection OK — checked ${rows.length} entries.`);
