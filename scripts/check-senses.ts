/** The rule is checkSenses in src/utils/health/checks.ts, which /admin/health runs too. */
import { db } from "../src/db";
import { checkSenses } from "#/utils/health/checks";

const rows = await db.query.entries.findMany({ with: { senses: true } });
const problems = checkSenses(rows);

for (const p of problems) console.error(`${p.where}: ${p.message}`);

if (problems.length > 0) {
	console.error(`\n${problems.length} sense problem(s). See vault/schema.md — "senses".`);
	process.exit(1);
}

const senseCount = rows.reduce((n, entry) => n + entry.senses.length, 0);
console.log(`Senses OK — checked ${senseCount} senses across ${rows.length} entries.`);
