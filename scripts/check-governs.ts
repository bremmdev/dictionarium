/** The rule is checkGoverns in src/utils/health/checks.ts, which /admin/health runs too. */
import { db } from "../src/db";
import { checkGoverns } from "#/utils/health/checks";

const rows = await db.query.entries.findMany({ with: { senses: true } });
const problems = checkGoverns(rows);

for (const p of problems) console.error(`${p.where}: ${p.message}`);

if (problems.length > 0) {
	console.error(`\n${problems.length} governs problem(s). See vault/schema.md — "governs".`);
	process.exit(1);
}

console.log(`Governs OK — checked ${rows.length} entries.`);
