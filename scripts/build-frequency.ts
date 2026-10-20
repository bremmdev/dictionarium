/**
 * Builds data/lasla-frequency.json from the LASLA corpus: one row per word
 * (a LiLa lemma), with how often it occurs and its rank. The counts are
 * LASLA's; the headword, vowel lengths and gender come from LiLa's record of
 * the lemma each token is linked to. Run again only when LASLA publishes new
 * files. See vault/frequency.md.
 *
 *   git clone --depth 1 https://github.com/CIRCSE/LASLA
 *   npx tsx scripts/build-frequency.ts path/to/LASLA/conllup
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
	console.error(
		"Usage: npx tsx scripts/build-frequency.ts path/to/LASLA/conllup",
	);
	process.exit(1);
}

const SPARQL = "https://lila-erc.eu/sparql/lila_knowledge_base/sparql";
const LEMMA = "http://lila-erc.eu/data/id/lemma/";
// LiLa answers are cached beside the corpus, so a rebuild asks it nothing.
const CACHE = path.join(dir, "..", "lila-lemmas.json");

// Not words a dictionary files: names, punctuation, unanalysed tokens.
const SKIPPED = new Set(["PROPN", "PUNCT", "X", "_"]);
const GENDERS: Record<string, string> = {
	masculine: "m",
	feminine: "f",
	neuter: "n",
};

type Tally = Map<string, number>;
type Word = { count: number; lemma: Tally; upos: Tally; flcat: Tally };
type LilaLemma = { label: string; prosody: string; flcat: string; gender: string };

function bump(tally: Tally, key: string, by = 1) {
	tally.set(key, (tally.get(key) ?? 0) + by);
}

function top(tally: Tally) {
	let best = "";
	let most = 0;
	for (const [key, n] of tally) {
		if (n > most) {
			best = key;
			most = n;
		}
	}
	return best;
}

/** LASLA and LiLa write u for v and i for j: nouus, iacio. */
function plain(lemma: string) {
	return lemma.toLowerCase().replaceAll("v", "u").replaceAll("j", "i");
}

const byId = new Map<string, Word>();
// Tokens LASLA never linked to LiLa, by lemma|upos|flcat, handed to a linked word afterwards.
const unlinked: Tally = new Map();
let tokens = 0;

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".conllup"));
for (const file of files) {
	const lines = readline.createInterface({
		input: fs.createReadStream(path.join(dir, file)),
		crlfDelay: Number.POSITIVE_INFINITY,
	});
	for await (const line of lines) {
		if (line === "" || line.startsWith("#")) continue;
		const cols = line.split("\t");
		const lemma = plain(cols[2]);
		const upos = cols[3];
		const flcat = cols[10] ?? "";
		const id = cols[13] ?? "";
		if (SKIPPED.has(upos) || !/^[a-z]+$/.test(lemma)) continue;
		tokens++;

		if (!id.startsWith("lila")) {
			bump(unlinked, `${lemma}|${upos}|${flcat}`);
			continue;
		}
		const word = byId.get(id) ?? {
			count: 0,
			lemma: new Map(),
			upos: new Map(),
			flcat: new Map(),
		};
		byId.set(id, word);
		word.count++;
		bump(word.lemma, lemma);
		bump(word.upos, upos);
		bump(word.flcat, flcat);
	}
}

// An unlinked token belongs to the busiest linked word with its lemma, part of speech and class.
const linkedBy = new Map<string, Word>();
for (const word of byId.values()) {
	const key = `${top(word.lemma)}|${top(word.upos)}|${top(word.flcat)}`;
	const held = linkedBy.get(key);
	if (!held || held.count < word.count) linkedBy.set(key, word);
}
let orphaned = 0;
for (const [key, n] of unlinked) {
	const word = linkedBy.get(key);
	if (word) word.count += n;
	else orphaned += n;
}

const lila: Record<string, LilaLemma> = fs.existsSync(CACHE)
	? JSON.parse(fs.readFileSync(CACHE, "utf8"))
	: {};

/** One SPARQL round trip for a batch of lemma numbers. */
async function fetchLemmas(numbers: Array<string>) {
	const query = `PREFIX lila: <http://lila-erc.eu/ontologies/lila/>
SELECT ?id ?label ?prosody ?flcat ?gender WHERE {
	VALUES ?id { ${numbers.map((n) => `<${LEMMA}${n}>`).join(" ")} }
	?id rdfs:label ?label .
	OPTIONAL { ?id lila:prosodicRepresentation ?prosody }
	OPTIONAL { ?id lila:hasInflectionType ?flcat }
	OPTIONAL { ?id lila:hasGender ?gender }
}`;
	const res = await fetch(SPARQL, {
		method: "POST",
		body: new URLSearchParams({ query, format: "json" }),
	});
	if (!res.ok) throw new Error(`LiLa answered ${res.status}`);
	const json = (await res.json()) as {
		results: { bindings: Array<Record<string, { value: string }>> };
	};
	const tail = (v?: { value: string }) => v?.value.replace(/.*\//, "") ?? "";
	for (const b of json.results.bindings) {
		lila[`lilaLemma:${tail(b.id)}`] = {
			label: b.label.value,
			prosody: b.prosody?.value ?? "",
			// n3n → n3, v5r → v5: the class without LiLa's subtype.
			flcat: tail(b.flcat).slice(0, 2),
			gender: GENDERS[tail(b.gender)] ?? "",
		};
	}
}

// Hypolemmas (hīc "here" beside hic "this") keep LASLA's own lemma and class.
const missing = [...byId.keys()]
	.filter((id) => id.startsWith("lilaLemma:") && !(id in lila))
	.map((id) => id.slice("lilaLemma:".length));
for (let i = 0; i < missing.length; i += 200) {
	await fetchLemmas(missing.slice(i, i + 200));
	console.log(`LiLa: ${Math.min(i + 200, missing.length)} of ${missing.length}`);
	fs.writeFileSync(CACHE, JSON.stringify(lila));
}

const rows = [...byId].map(([id, word]) => {
	const known = lila[id];
	return {
		lemma: known ? plain(known.label) : top(word.lemma),
		prosody: known?.prosody ?? "",
		upos: top(word.upos),
		flcat: known?.flcat || top(word.flcat),
		gender: known?.gender ?? "",
		count: word.count,
	};
});
rows.sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma));

// Competition ranking: words seen equally often share a rank.
let rank = 0;
const lexemes = rows.map((row, i) => {
	if (i === 0 || rows[i - 1].count !== row.count) rank = i + 1;
	const { lemma, prosody, upos, flcat, gender, count } = row;
	return [lemma, prosody, upos, flcat, gender, count, rank];
});

const out = path.resolve("data/lasla-frequency.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
	out,
	`${JSON.stringify({
		source:
			"LASLA, Laboratoire d'Analyse Statistique des Langues Anciennes (Université de Liège), as linked to the LiLa LemmaBank: github.com/CIRCSE/LASLA",
		license: "CC BY-NC-SA 4.0",
		tokens,
		columns: ["lemma", "prosody", "upos", "flcat", "gender", "count", "rank"],
		lexemes,
	})}\n`,
);

console.log(
	`${files.length} files, ${tokens} tokens, ${lexemes.length} words → ${out}`,
);
console.log(
	`${orphaned} unlinked tokens matched no linked word and were left out.`,
);
