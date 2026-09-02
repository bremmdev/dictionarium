/**
 * UNIQUE (entry_id, rank) stops two sense number 2s and says nothing about
 * the two invariants vault/schema.md actually relies on:
 *
 *   - every entry has at least one sense — a word with no meaning is not an entry;
 *   - ranks run 1..n with no gaps, because rank 1 *is* the headline meaning
 *     and the UI reads `senses[0]` on the strength of that promise.
 */
import { db } from "../src/db";

const rows = await db.query.entries.findMany({ with: { senses: true } });
const problems: Array<string> = [];
let senseCount = 0;

for (const entry of rows) {
	senseCount += entry.senses.length;

	if (entry.senses.length === 0) {
		problems.push(`${entry.lemma}: no senses — a word with no meaning is not an entry`);
		continue;
	}

	// Rows come back in insertion order, so sort before reading the sequence.
	const ranks = entry.senses.map((s) => s.rank).sort((a, b) => a - b);
	const expected = ranks.map((_, i) => i + 1);

	if (ranks.join(",") !== expected.join(",")) {
		problems.push(
			`${entry.lemma}: ranks are [${ranks.join(", ")}] — must run 1..${ranks.length} with no gaps`,
		);
	}

	// notNull permits the empty string, which is the same absent meaning wearing a different hat.
	for (const s of entry.senses) {
		if (s.meaningEn.trim() === "") {
			problems.push(`${entry.lemma}: sense ${s.rank} has a blank meaning_en`);
		}
	}
}

for (const p of problems) console.error(p);

if (problems.length > 0) {
	console.error(`\n${problems.length} sense problem(s). See vault/schema.md — "senses".`);
	process.exit(1);
}

console.log(`Senses OK — checked ${senseCount} senses across ${rows.length} entries.`);
