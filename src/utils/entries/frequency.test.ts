import assert from "node:assert/strict";
import { test } from "node:test";

import { filedLexemes, type Lexeme } from "#/utils/entries/frequency";

function lexeme(fields: Partial<Lexeme>): Lexeme {
	return {
		lemma: "tempus",
		prosody: "",
		upos: "NOUN",
		flcat: "n3",
		gender: "n",
		count: 100,
		rank: 500,
		...fields,
	};
}

const noun = {
	lemma: "tempus",
	partOfSpeech: "noun",
	conjugation: null,
	declension: "3",
	gender: "n",
};

test("an entry files the one LASLA word it matches", () => {
	const time = lexeme({ count: 2900, rank: 76 });
	const verb = lexeme({ upos: "VERB", flcat: "v3", gender: "", rank: 900 });

	assert.deepEqual(filedLexemes(noun, [time, verb]), [time]);
});

test("a spelling LASLA has twice is filed by an entry with that spelling and part of speech", () => {
	const time = lexeme({ count: 2900, rank: 76 });
	const temple = lexeme({ count: 120, rank: 2400 });

	assert.deepEqual(filedLexemes(noun, [time, temple]), [time, temple]);
});

test("an entry LASLA files under another part of speech files nothing", () => {
	const pronoun = lexeme({ lemma: "nihil", upos: "PRON", flcat: "p" });

	assert.deepEqual(
		filedLexemes({ ...noun, lemma: "nihil", declension: "indeclinable" }, [
			pronoun,
		]),
		[],
	);
});

test("an entry files every word LASLA splits its spelling into, whatever the class", () => {
	const fourth = lexeme({
		lemma: "domus",
		flcat: "n4",
		gender: "f",
		count: 1800,
	});
	const second = lexeme({
		lemma: "domus",
		flcat: "n2",
		gender: "f",
		count: 1100,
	});
	const domus = { ...noun, lemma: "domus", declension: "4", gender: "f" };

	assert.deepEqual(filedLexemes(domus, [fourth, second]), [fourth, second]);
});

test("a vowel length LASLA marks still tells two words apart", () => {
	const evil = lexeme({ lemma: "malum", prosody: "mălum", flcat: "n2" });
	const apple = lexeme({ lemma: "malum", prosody: "mālum", flcat: "n2" });
	const entry = { ...noun, lemma: "mālum", declension: "2" };

	assert.deepEqual(filedLexemes(entry, [evil, apple]), [apple]);
});
