import assert from "node:assert/strict";
import { test } from "node:test";

import { v1Progress } from "#/utils/progress/rules";

/** Unix seconds for a wall-clock time with its offset, "2026-11-16T00:30+01:00". */
function at(iso: string) {
	return Date.parse(iso) / 1000;
}

// Sunday evening in Amsterdam; the week began Monday 16 November.
const now = at("2026-11-22T20:00+01:00");

test("counts Core words filed, including those filed before dates were kept", () => {
	const progress = v1Progress({
		total: 1004,
		filedAt: [null, null, at("2026-10-01T12:00+02:00")],
		now,
	});

	assert.equal(progress.filed, 3);
	assert.equal(progress.remaining, 1001);
});

test("this week runs from Monday 00:00 in Amsterdam, not UTC", () => {
	const progress = v1Progress({
		total: 1004,
		filedAt: [
			at("2026-11-15T23:59+01:00"), // Sunday before
			at("2026-11-16T00:30+01:00"), // Monday, still Sunday in UTC
			at("2026-11-22T19:00+01:00"),
			null,
		],
		now,
	});

	assert.equal(progress.week.start, "2026-11-16");
	assert.equal(progress.week.filed, 2);
});

test("the weekly target stays at 50 while what is left fits", () => {
	// 904 left on 1 November over 22 weeks is 42 a week.
	const progress = v1Progress({
		total: 1004,
		filedAt: Array(100).fill(null),
		now,
	});

	assert.equal(progress.week.target, 50);
});

test("the weekly target rises to what is left at the start of the month", () => {
	// 600 left on 1 February over 9 weeks is 67; February's filings wait for March.
	const progress = v1Progress({
		total: 1004,
		filedAt: [
			...Array(404).fill(null),
			at("2027-02-03T12:00+01:00"),
			at("2027-02-04T12:00+01:00"),
		],
		now: at("2027-02-10T12:00+01:00"),
	});

	assert.equal(progress.week.target, 67);
});

/** n filings at one moment. */
function times(n: number, iso: string) {
	return Array(n).fill(at(iso));
}

test("projects v1 from the four complete weeks before this one", () => {
	// 200 in the four weeks from 19 October is 50 a week; 674 left takes 95 days.
	const progress = v1Progress({
		total: 1004,
		filedAt: [
			...times(100, "2026-10-14T12:00+02:00"),
			...times(100, "2026-10-19T00:10+02:00"),
			...times(100, "2026-11-15T23:50+01:00"),
			...times(30, "2026-11-17T12:00+01:00"),
		],
		now,
	});

	assert.equal(progress.pace, 50);
	assert.equal(progress.remaining, 674);
	assert.equal(progress.projected, "2027-02-25");
	assert.equal(progress.behind, false);
});

test("is Behind when the projected date falls after the deadline", () => {
	// 25 a week with 804 left takes 226 days.
	const progress = v1Progress({
		total: 1004,
		filedAt: [
			...Array(100).fill(null),
			...times(100, "2026-11-04T12:00+01:00"),
		],
		now,
	});

	assert.equal(progress.pace, 25);
	assert.equal(progress.projected, "2027-07-06");
	assert.equal(progress.behind, true);
});

test("is Behind with no projection when nothing was filed in the four weeks", () => {
	const progress = v1Progress({
		total: 1004,
		filedAt: Array(100).fill(null),
		now,
	});

	assert.equal(progress.pace, 0);
	assert.equal(progress.projected, null);
	assert.equal(progress.behind, true);
});

test("is not Behind once every Core word is filed", () => {
	const progress = v1Progress({
		total: 3,
		filedAt: [null, null, null],
		now,
	});

	assert.equal(progress.remaining, 0);
	assert.equal(progress.behind, false);
});

test("a week that crosses into a new month keeps its Monday's target", () => {
	// Week of Monday 30 November: 2,000 left on 1 November over 22 weeks is 91.
	const progress = v1Progress({
		total: 2000,
		filedAt: times(100, "2026-11-10T12:00+01:00"),
		now: at("2026-12-03T12:00+01:00"),
	});

	assert.equal(progress.week.target, 91);
});
