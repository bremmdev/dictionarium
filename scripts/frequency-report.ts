/**
 * Which entries get a frequency badge, and why the rest do not. A report, not a
 * check: a word LASLA cannot place simply goes without. See vault/frequency.md.
 */
import lasla from "../data/lasla-frequency.json";
import { db } from "../src/db";
import { entries } from "../src/db/schema";
import {
	BANDS,
	bandFor,
	type LaslaRow,
	laslaKey,
	matchLexeme,
	toLexeme,
} from "../src/utils/entries/frequency";

const lexemes = (lasla.lexemes as Array<LaslaRow>).map(toLexeme);

const rows = await db.select().from(entries).orderBy(entries.lemmaPlain);

const counts = new Map<string, number>();
const missing: Array<string> = [];

for (const entry of rows) {
	const candidates = lexemes.filter((l) => l.lemma === laslaKey(entry.lemma));
	const match = matchLexeme(entry, candidates);
	if (match) {
		const band = bandFor(match.rank);
		counts.set(band, (counts.get(band) ?? 0) + 1);
		continue;
	}
	const found = candidates
		.map(
			(c) =>
				`${c.prosody || c.lemma} ${c.upos} ${c.flcat}${c.gender ? ` ${c.gender}` : ""} ×${c.count}`,
		)
		.join(", ");
	missing.push(
		`${entry.lemma} (${entry.partOfSpeech}): ${found === "" ? "not in LASLA" : `no single fit among ${found}`}`,
	);
}

for (const { band, label } of BANDS) {
	console.log(`${label.padEnd(9)} ${counts.get(band) ?? 0}`);
}
console.log(`No badge  ${missing.length} of ${rows.length}`);
for (const line of missing) console.log(`  ${line}`);
