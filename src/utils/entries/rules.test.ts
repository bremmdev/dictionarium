import assert from "node:assert/strict";
import { test } from "node:test";

import {
	EntryValidationError,
	hasPrincipalParts,
	isDeclensionFor,
	parseEntryDraft,
} from "#/utils/entries/rules";

function pronoun(fields: Record<string, string>) {
	return {
		partOfSpeech: "pronoun",
		senses: [{ meaningEn: "nothing" }],
		...fields,
	};
}

function fieldsOf(input: unknown) {
	try {
		parseEntryDraft(input);
		return {};
	} catch (error) {
		if (error instanceof EntryValidationError) return error.fields;
		throw error;
	}
}

test("a pronoun can be indeclinable, and then it files no other forms", () => {
	assert.ok(isDeclensionFor("pronoun", "indeclinable"));
	assert.equal(hasPrincipalParts("pronoun", "indeclinable"), false);
	assert.equal(hasPrincipalParts("pronoun", "irregular"), true);

	const draft = parseEntryDraft(
		pronoun({ lemma: "nihil", declension: "indeclinable" }),
	);
	assert.equal(draft.declension, "indeclinable");
	assert.equal(draft.principalParts, null);
});

test("an indeclinable pronoun with forms filed is refused", () => {
	const fields = fieldsOf(
		pronoun({
			lemma: "nihil",
			declension: "indeclinable",
			principalParts: "nihil, nihilī",
		}),
	);
	assert.match(fields.principalParts ?? "", /indeclinable pronoun/);
});

test("an irregular pronoun still has to file its forms", () => {
	const fields = fieldsOf(pronoun({ lemma: "hic", declension: "irregular" }));
	assert.ok(fields.principalParts);
});

test("a numeral that declines files its terminations; one that does not, none", () => {
	const draft = parseEntryDraft({
		lemma: "ūnus",
		partOfSpeech: "numeral",
		declension: "1-2",
		principalParts: "ūnus, ūna, ūnum",
		senses: [{ meaningEn: "one" }],
	});
	assert.equal(draft.principalParts, "ūnus, ūna, ūnum");
	assert.equal(hasPrincipalParts("numeral", "indeclinable"), false);
	const fields = fieldsOf({
		lemma: "prīmus",
		partOfSpeech: "numeral",
		declension: "1-2",
		senses: [{ meaningEn: "first" }],
	});
	assert.match(fields.principalParts ?? "", /numeral/);
});
