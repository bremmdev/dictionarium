import assert from "node:assert/strict";
import { test } from "node:test";

import { fold, searchKey } from "#/utils/search/key";

test("fold spells out æ and œ rather than deleting them", () => {
	assert.equal(fold("cælum"), "caelum");
	assert.equal(fold("Cœpī"), "coepi");
});

test("fold sets v/u and j/i aside", () => {
	assert.equal(fold("vīlla"), "uilla");
	assert.equal(fold("jam"), "iam");
});

test("plain keeps v and j, folded does not", () => {
	assert.deepEqual(searchKey(" Vīlla "), { plain: "villa", folded: "uilla" });
	assert.deepEqual(searchKey("cælum"), { plain: "caelum", folded: "caelum" });
});

test("too short is measured on the key, so a% is one letter", () => {
	for (const q of ["", "a", "a%", "ā!", "  a  "]) {
		assert.equal(searchKey(q), null, q);
	}
	assert.notEqual(searchKey("æ"), null);
});
