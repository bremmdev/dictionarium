import assert from "node:assert/strict";
import { test } from "node:test";

import { fileSection } from "#/utils/entries/wiktionary";

/** One <i>label</i> <b>form</b> pair, as Wiktionary marks it up. */
const form = (label: string, word: string) =>
	`<i>${label}</i> <b class="Latn" lang="la"><a href="/wiki/x">${word}</a></b>`;

/** A Latin section holding one verb, its headword line copied from Wiktionary. */
function verb(headword: string, forms: Array<string>, grammar: string) {
	return `<div class="mw-heading mw-heading3"><h3 id="Verb">Verb</h3></div>
<p><span class="headword-line"><strong class="Latn headword" lang="la">${headword}</strong> (${forms.join(", ")})</span>; <i>${grammar}</i></p>
<ol><li>to do something</li></ol>`;
}

function filed(html: string) {
	return fileSection(html, { lemma: "x", partOfSpeech: "verb" }).row
		.principalParts;
}

test("a regular verb files its four parts", () => {
	const html = verb(
		"ārdeō",
		[
			form("present infinitive", "ārdēre"),
			form("perfect active", "ārsī"),
			form("supine", "ārsum"),
		],
		"second conjugation",
	);
	assert.equal(filed(html), "ārdeō, ārdēre, ārsī, ārsum");
});

test("coepī's perfect infinitive is not also its perfect", () => {
	const html = verb(
		"coepī",
		[form("perfect infinitive", "coepisse"), form("supine", "coeptum")],
		"third conjugation, no present stem",
	);
	assert.equal(filed(html), "coepī, coepisse, coeptum");
});

test("meminī files its perfect and infinitive", () => {
	const html = verb(
		"meminī",
		[form("present infinitive", "meminisse")],
		"third conjugation, no present stem, no supine stem",
	);
	assert.equal(filed(html), "meminī, meminisse");
});

test("ōdī is its own perfect, so ōsus sum is not filed as one", () => {
	const html = verb(
		"ōdī",
		[form("present infinitive", "ōdisse"), form("perfect active", "ōsus sum")],
		"fourth conjugation, no present stem, deponent in the perfect",
	);
	assert.equal(filed(html), "ōdī, ōdisse");
});

test("a semi-deponent files its perfect participle", () => {
	const html = verb(
		"fīō",
		[form("present infinitive", "fierī"), form("perfect active", "factus sum")],
		"third conjugation, suppletive, semi-deponent",
	);
	assert.equal(filed(html), "fīō, fierī, factus sum");
});

test("the future participle stands in for a missing supine", () => {
	const html = verb(
		"volō",
		[
			form("present infinitive", "velle"),
			form("perfect active", "voluī"),
			form("future active participle", "volitūrus"),
		],
		"irregular conjugation, no supine stem",
	);
	assert.equal(filed(html), "volō, velle, voluī, volitūrus");
});

test("a perfect spelled like the present is still filed", () => {
	const html = verb(
		"pluit",
		[form("present infinitive", "pluere"), form("perfect active", "pluit")],
		"third conjugation, impersonal",
	);
	assert.equal(filed(html), "pluit, pluere, pluit");
});
