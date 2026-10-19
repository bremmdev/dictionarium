/**
 * UNIQUE (lemma, homonym) stops two cum²s and says nothing about gaps. The
 * homonyms of a lemma run 1..n, because the bare /verbum/cum is homonym 1 and
 * a lone cum² would leave that URL pointing at nothing.
 */
import { db } from "../src/db";
import { entries } from "../src/db/schema";

const rows = await db
	.select({ lemma: entries.lemma, homonym: entries.homonym })
	.from(entries);

const byLemma = new Map<string, Array<number>>();
for (const r of rows) {
	byLemma.set(r.lemma, [...(byLemma.get(r.lemma) ?? []), r.homonym]);
}

const problems: Array<string> = [];

for (const [lemma, homonyms] of byLemma) {
	const sorted = homonyms.sort((a, b) => a - b);
	const expected = sorted.map((_, i) => i + 1);

	if (sorted.join(",") !== expected.join(",")) {
		problems.push(
			`${lemma}: homonyms are [${sorted.join(", ")}] — must run 1..${sorted.length} with no gaps`,
		);
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(
		`\n${problems.length} homonym problem(s). See vault/schema.md — "Unique on (lemma, homonym)".`,
	);
	process.exit(1);
}

console.log(
	`Homonyms OK — checked ${rows.length} rows across ${byLemma.size} lemmas.`,
);
