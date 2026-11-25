import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import Database from "better-sqlite3";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import type { Db } from "#/db";
import * as schema from "#/db/schema";
import { entries, senses } from "#/db/schema";
import { invalidateForms } from "#/server/forms";
import { search } from "#/server/searching";
import { parseEntryDraft } from "#/utils/entries/rules";
import { MAX_RESULTS } from "#/utils/search/rules";

const migrationsFolder = fileURLToPath(
	new URL("../../drizzle", import.meta.url),
);

/** A fresh dictionary per test, built from the same migrations as production. */
function dictionary(): Db {
	const db = drizzle(new Database(":memory:"), { schema });
	migrate(db, { migrationsFolder });
	return db;
}

/** Files a word through the editor's rules, so lemma_plain is derived as production derives it. */
function file(db: Db, fields: Record<string, unknown>) {
	const { senses: drafted, ...columns } = parseEntryDraft({
		senses: [{ meaningEn: "a meaning" }],
		...fields,
	});
	const [{ n }] = db
		.select({ n: count() })
		.from(entries)
		.where(eq(entries.lemma, columns.lemma))
		.all();
	const [created] = db
		.insert(entries)
		.values({ ...columns, homonym: n + 1 })
		.returning({ id: entries.id })
		.all();
	db.insert(senses)
		.values(drafted.map((s, i) => ({ ...s, entryId: created.id, rank: i + 1 })))
		.run();
	invalidateForms();
}

const verb = (principalParts: string, conjugation = "1") => ({
	lemma: principalParts.split(",")[0],
	partOfSpeech: "verb",
	principalParts,
	conjugation,
});

const noun = (
	lemma: string,
	genitive: string,
	gender: string,
	declension: string,
) => ({
	lemma,
	partOfSpeech: "noun",
	principalParts: genitive,
	gender,
	declension,
});

async function find(db: Db, q: string) {
	return (await search(db, q)).outcome;
}

const lemmas = (outcome: { results: Array<{ lemma: string }> }) =>
	outcome.results.map((r) => r.lemma);

test("lists the word, then words starting with the query, then words containing it", async () => {
	const db = dictionary();
	file(db, verb("clāmō, clāmāre, clāmāvī, clāmātum"));
	file(db, verb("ambulō, ambulāre, ambulāvī, ambulātum"));
	file(db, verb("amō, amāre, amāvī, amātum"));

	const outcome = await find(db, "amo");
	assert.deepEqual(lemmas(outcome), ["amō", "clāmō"]);
	assert.deepEqual(
		outcome.results.map((r) => r.match),
		["lemma", "other"],
	);
});

test("shortest first inside a tier, so am lists amō before ambulō", async () => {
	const db = dictionary();
	file(db, verb("ambulō, ambulāre, ambulāvī, ambulātum"));
	file(db, verb("amō, amāre, amāvī, amātum"));
	file(db, verb("clāmō, clāmāre, clāmāvī, clāmātum"));

	assert.deepEqual(lemmas(await find(db, "am")), ["amō", "ambulō", "clāmō"]);
});

test("macrons and case are optional", async () => {
	const db = dictionary();
	file(db, noun("vīlla", "vīllae", "f", "1"));

	assert.deepEqual(lemmas(await find(db, "Villa")), ["vīlla"]);
	assert.deepEqual(lemmas(await find(db, "vīlla")), ["vīlla"]);
});

test("finds a word from one of its forms, and says which form it is", async () => {
	const db = dictionary();
	file(db, {
		lemma: "bonus",
		partOfSpeech: "adjective",
		principalParts: "bonus, bona, bonum",
		declension: "1-2",
	});

	const [result] = (await find(db, "bonae")).results;
	assert.equal(result?.lemma, "bonus");
	assert.equal(result?.match, "form");
	assert.equal(result?.forms[0]?.form, "bonae");
});

test("u for v finds the word, as texts print uilla", async () => {
	const db = dictionary();
	file(db, noun("vīlla", "vīllae", "f", "1"));

	const [result] = (await find(db, "uilla")).results;
	assert.equal(result?.lemma, "vīlla");
	assert.equal(result?.match, "lemma");
});

test("strips -que when the whole word finds nothing", async () => {
	const db = dictionary();
	file(db, noun("vir", "virī", "m", "2"));

	const [result] = (await find(db, "virumque")).results;
	assert.equal(result?.lemma, "vir");
	assert.equal(result?.match, "form");
	assert.equal(result?.forms[0]?.enclitic, "que");
});

test("homographs are listed in homonym order and know of each other", async () => {
	const db = dictionary();
	file(db, { lemma: "cum", partOfSpeech: "conjunction" });
	file(db, { lemma: "cum", partOfSpeech: "conjunction" });

	const { results } = await find(db, "cum");
	assert.deepEqual(
		results.map((r) => [r.homonym, r.homographs]),
		[
			[1, 2],
			[2, 2],
		],
	);
});

test("caps the list and counts every match", async () => {
	const db = dictionary();
	for (const letter of "bcdfghlmnprst") {
		file(db, noun(`ar${letter}a`, `ar${letter}ae`, "f", "1"));
	}

	const outcome = await find(db, "ar");
	assert.equal(outcome.results.length, MAX_RESULTS);
	assert.equal(outcome.matchCount, 13);
});

test("a short list is its own count", async () => {
	const db = dictionary();
	file(db, verb("amō, amāre, amāvī, amātum"));

	assert.equal((await find(db, "amo")).matchCount, 1);
});

test("too short to run is measured on the key, so a% is one letter", async () => {
	const db = dictionary();
	file(db, verb("amō, amāre, amāvī, amātum"));

	for (const q of ["", "a", "a%", "ā!", "  a  "]) {
		const { key, outcome } = await search(db, q);
		assert.equal(key, null, q);
		assert.deepEqual(outcome, { results: [], suggestions: [], matchCount: 0 });
	}
});

test("the key is what ran, for recording", async () => {
	const db = dictionary();
	assert.equal((await search(db, " Vīlla ")).key?.plain, "villa");
});

test("wildcards never reach the pattern", async () => {
	const db = dictionary();
	file(db, verb("amō, amāre, amāvī, amātum"));
	file(db, verb("agō, agere, ēgī, āctum", "3"));

	assert.deepEqual(lemmas(await find(db, "a_o")), []);
	assert.deepEqual(lemmas(await find(db, "%%")), []);
});

test("suggests a lemma one edit away when nothing matches", async () => {
	const db = dictionary();
	file(db, noun("amīcus", "amīcī", "m", "2"));

	const outcome = await find(db, "amcius");
	assert.deepEqual(outcome.results, []);
	assert.deepEqual(outcome.suggestions, [{ text: "amīcus" }]);
});

test("suggests a form, with the word it belongs to", async () => {
	const db = dictionary();
	file(db, verb("salūtō, salūtāre, salūtāvī, salūtātum"));

	const { suggestions } = await find(db, "salutavisent");
	assert.deepEqual(suggestions, [{ text: "salūtāvissent", of: "salūtō" }]);
});

test("no suggestions once something matched, or for a short key", async () => {
	const db = dictionary();
	file(db, noun("amīcus", "amīcī", "m", "2"));

	assert.deepEqual((await find(db, "amic")).suggestions, []);
	assert.deepEqual((await find(db, "amx")).suggestions, []);
});

test("a word filed after the first search is found", async () => {
	const db = dictionary();
	file(db, verb("amō, amāre, amāvī, amātum"));
	await find(db, "amat");
	file(db, verb("laudō, laudāre, laudāvī, laudātum"));

	assert.deepEqual(lemmas(await find(db, "laudat")), ["laudō"]);
});

test("uen finds veniō as a word starting with it, as texts print uenio", async () => {
	const db = dictionary();
	file(db, verb("veniō, venīre, vēnī, ventum", "4"));

	assert.deepEqual(lemmas(await find(db, "uen")), ["veniō"]);
});

test("cælm suggests caelum: æ is spelled out, not deleted", async () => {
	const db = dictionary();
	file(db, noun("caelum", "caelī", "n", "2"));

	const { suggestions } = await find(db, "cælm");
	assert.ok(
		suggestions.some((s) => s.text === "caelum" && s.of === undefined),
		JSON.stringify(suggestions),
	);
});

test("lemmas and forms open like the query in one key space, so vidis offers videō first", async () => {
	const db = dictionary();
	file(db, verb("videō, vidēre, vīdī, vīsum", "2"));
	file(db, {
		lemma: "fīdus",
		partOfSpeech: "adjective",
		principalParts: "fīdus, fīda, fīdum",
		declension: "1-2",
	});

	const { suggestions } = await find(db, "vidis");
	const owners = suggestions.map((s) => s.of);
	assert.equal(owners[0], "videō", JSON.stringify(suggestions));
	assert.equal(owners.at(-1), "fīdus", JSON.stringify(suggestions));
});
