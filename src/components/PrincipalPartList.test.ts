import assert from "node:assert/strict";
import { test } from "node:test";

import { verbLabels } from "#/components/PrincipalPartList";

const parts = (filing: string) => filing.split(", ");

test("a regular verb is labelled present to supine", () => {
	assert.deepEqual(verbLabels(parts("amō, amāre, amāvī, amātum")), [
		"present",
		"infinitive",
		"perfect",
		"supine",
	]);
});

test("a perfect-only verb leads with its perfect", () => {
	assert.deepEqual(verbLabels(parts("coepī, coepisse, coeptum")), [
		"perfect",
		"infinitive",
		"supine",
	]);
	assert.deepEqual(verbLabels(parts("meminī, meminisse")), [
		"perfect",
		"infinitive",
	]);
});

test("a future participle is not called a supine", () => {
	assert.deepEqual(verbLabels(parts("sum, esse, fuī, futūrus")), [
		"present",
		"infinitive",
		"perfect",
		"future participle",
	]);
	assert.deepEqual(verbLabels(parts("ōdī, ōdisse, ōsūrus")), [
		"perfect",
		"infinitive",
		"future participle",
	]);
});

test("a shape that cannot be named is left unlabelled", () => {
	// The old import's coepī: a repeated infinitive in the perfect's place.
	assert.equal(verbLabels(parts("coepī, coepisse, coepisse, coeptum")), null);
	assert.equal(verbLabels(parts("ōdī, ōdisse, ōsus sum")), null);
	assert.equal(verbLabels(parts("possum, posse, potuī")), null);
});
