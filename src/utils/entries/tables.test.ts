import assert from "node:assert/strict";
import { test } from "node:test";

import { fullTableFor } from "#/utils/entries/tables";

function numeral(lemma: string, partOfSpeech = "numeral") {
	return {
		lemma,
		partOfSpeech,
		principalParts: null,
		conjugation: null,
		declension: "1-2",
		gender: null,
		terminations: null,
		stemClass: null,
	};
}

test("ūnus, duo and trēs link to their table on the numbers page", () => {
	for (const lemma of ["ūnus", "duo", "trēs"]) {
		assert.deepEqual(fullTableFor(numeral(lemma)), {
			to: "/numbers",
			hash: "declining-one-two-three",
		});
	}
});

test("ūnus filed as an adjective still links to the numbers page", () => {
	assert.deepEqual(fullTableFor(numeral("ūnus", "adjective")), {
		to: "/numbers",
		hash: "declining-one-two-three",
	});
});

test("the other pronominal adjectives still point at tōtus", () => {
	assert.equal(fullTableFor(numeral("nūllus", "adjective"))?.like, "tōtus");
});
