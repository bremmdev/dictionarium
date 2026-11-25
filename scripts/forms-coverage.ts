/**
 * How much of real Latin the forms search finds (vault/forms.md). For every
 * LASLA token whose lemma is filed here, the lookup has to return that entry.
 * Tokens in forms not built yet (comparison, the future infinitive) are
 * counted apart by LASLA's own tags, not as misses.
 *
 *   git clone --depth 1 https://github.com/CIRCSE/LASLA
 *   npm run report:forms -- path/to/LASLA/conllup
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { FLCAT, UPOS } from "#/utils/entries/frequency";
import { fold } from "#/utils/search/key";
import { FormIndex } from "#/utils/inflection/lookup";
import { paradigm } from "#/utils/inflection/paradigm";
import { db } from "../src/db";
import { entries } from "../src/db/schema";

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
	console.error("Usage: npm run report:forms -- path/to/LASLA/conllup");
	process.exit(1);
}

const rows = await db.select().from(entries);
const index = new FormIndex(rows);
const inflects = new Set(rows.filter((r) => paradigm(r).length > 0).map((r) => r.id));

const byLemma = new Map<string, typeof rows>();
for (const row of rows) {
	const key = fold(row.lemma);
	byLemma.set(key, [...(byLemma.get(key) ?? []), row]);
}

/**
 * The entries this token is a form of: same lemma and part of speech, and the
 * same class where one fits. ferō is 3rd to us and irregular to LASLA, so a
 * class mismatch counts only when nothing matches exactly (as matchLexeme).
 */
function owners(lemma: string, upos: string, flcat: string) {
	const fits = (byLemma.get(lemma) ?? []).filter((row) =>
		(UPOS[row.partOfSpeech] ?? []).includes(upos),
	);
	const sameClass = fits.filter((row) => {
		const filed =
			row.partOfSpeech === "verb" ? row.conjugation : row.partOfSpeech === "noun" ? row.declension : null;
		if (!filed || filed === "indeclinable") return true;
		return flcat === `${row.partOfSpeech === "verb" ? "v" : "n"}${FLCAT[filed]}`;
	});
	return sameClass.length > 0 ? sameClass : fits;
}

/** Why a token is outside what is built so far, or null when the lookup should find it. */
function notYet(feats: string, inflected: boolean) {
	const has = (pair: string) => feats.split("|").includes(pair);
	if (has("Degree=Cmp") || has("Degree=Abs")) return "comparison";
	if (has("VerbForm=Inf") && has("Tense=Fut")) return "future infinitive";
	if (!inflected) return "a word with no paradigm yet";
	return null;
}

let tokens = 0;
let found = 0;
const outOfScope = new Map<string, number>();
const misses = new Map<string, { count: number; feats: string }>();

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".conllup"));
for (const file of files) {
	const lines = readline.createInterface({
		input: fs.createReadStream(path.join(dir, file)),
		crlfDelay: Number.POSITIVE_INFINITY,
	});
	for await (const line of lines) {
		if (line === "" || line.startsWith("#")) continue;
		const cols = line.split("\t");
		const [form, rawLemma, upos, feats, flcat] = [cols[1], cols[2], cols[3], cols[5], cols[10] ?? ""];
		const lemma = fold(rawLemma);
		const mine = owners(lemma, upos, flcat);
		if (mine.length === 0) continue;

		const key = fold(form);
		// A form spelled like its lemma is found by the lemma tier, inflected or not.
		const reason = mine.some((row) => fold(row.lemma) === key)
			? null
			: notYet(feats, mine.some((row) => inflects.has(row.id)));
		if (reason) {
			outOfScope.set(reason, (outOfScope.get(reason) ?? 0) + 1);
			continue;
		}

		tokens++;
		const { lemmaIds, forms } = index.lookup(key);
		if (mine.some((row) => lemmaIds.has(row.id) || forms.has(row.id) || fold(row.lemma) === key)) {
			found++;
		} else {
			const id = `${mine[0].lemma}: ${key}`;
			const miss = misses.get(id) ?? { count: 0, feats };
			miss.count++;
			misses.set(id, miss);
		}
	}
}

const share = (n: number) => `${((100 * n) / Math.max(tokens, 1)).toFixed(1)}%`;
console.log(`${files.length} files. ${tokens} tokens of filed words in scope; the lookup finds ${found} (${share(found)}).`);
console.log("\nNot built yet, so not counted:");
for (const [reason, n] of [...outOfScope].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${reason}`);
console.log(`\nMisses (${tokens - found}), commonest first:`);
for (const [id, { count, feats }] of [...misses].sort((a, b) => b[1].count - a[1].count).slice(0, 60)) {
	console.log(`  ${count}\t${id}\t${feats}`);
}
