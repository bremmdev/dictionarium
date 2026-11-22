/** Progress towards v1 (PRODUCT.md, Goal and Milestones), pure so it can be tested. */

/** Weeks run Monday to Sunday on the editor's calendar, not the server's UTC one. */
const TIME_ZONE = "Europe/Amsterdam";

/** The last day v1 can be reached on. */
export const DEADLINE: Day = "2027-03-31";

/** Core words a week; recalculated each month from what is left, never lower. */
export const WEEKLY_TARGET = 50;

/** The pace is the average of this many complete weeks before the current one. */
export const PACE_WEEKS = 4;

/** A calendar day, "2026-11-16". Sorts and compares as a string. */
export type Day = string;

const dayFormat = new Intl.DateTimeFormat("en-CA", {
	timeZone: TIME_ZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/** The day a Unix-seconds timestamp falls on in Amsterdam. */
function dayOf(seconds: number): Day {
	return dayFormat.format(new Date(seconds * 1000));
}

/** Days are reckoned as UTC midnights, so no daylight saving can shift them. */
export function toDate(day: Day) {
	return new Date(`${day}T00:00:00Z`);
}

function addDays(day: Day, n: number): Day {
	const date = toDate(day);
	date.setUTCDate(date.getUTCDate() + n);
	return date.toISOString().slice(0, 10);
}

function daysBetween(from: Day, to: Day) {
	return Math.round(
		(toDate(to).getTime() - toDate(from).getTime()) / 86_400_000,
	);
}

function mondayOf(day: Day): Day {
	return addDays(day, -((toDate(day).getUTCDay() + 6) % 7));
}

export type V1Progress = {
	total: number;
	filed: number;
	remaining: number;
	week: { start: Day; filed: number; target: number };
	/** Core words a week over the last PACE_WEEKS complete weeks. */
	pace: number;
	/** When v1 is reached at that pace; null when done or there is no pace. */
	projected: Day | null;
	behind: boolean;
};

export function v1Progress({
	total,
	filedAt,
	now,
}: {
	total: number;
	/** When each filed Core word was first filed, in Unix seconds; null if before dates were kept. */
	filedAt: ReadonlyArray<number | null>;
	now: number;
}): V1Progress {
	const days = filedAt.map((seconds) =>
		seconds === null ? null : dayOf(seconds),
	);
	const filedFrom = (from: Day, before?: Day) =>
		days.filter(
			(day) =>
				day !== null && day >= from && (before === undefined || day < before),
		).length;

	const today = dayOf(now);
	const weekStart = mondayOf(today);
	const filed = filedAt.length;

	// Set on the 1st of the month the week starts in, so a week has one target.
	const monthStart = `${weekStart.slice(0, 7)}-01`;
	const leftAtMonthStart = total - (filed - filedFrom(monthStart));
	const weeksLeft = Math.ceil((daysBetween(monthStart, DEADLINE) + 1) / 7);
	const target = Math.max(
		WEEKLY_TARGET,
		weeksLeft > 0 ? Math.ceil(leftAtMonthStart / weeksLeft) : leftAtMonthStart,
	);

	const remaining = total - filed;
	const pace =
		filedFrom(addDays(weekStart, -7 * PACE_WEEKS), weekStart) / PACE_WEEKS;
	const projected =
		remaining > 0 && pace > 0
			? addDays(today, Math.ceil((remaining / pace) * 7))
			: null;

	return {
		total,
		filed,
		remaining,
		week: { start: weekStart, filed: filedFrom(weekStart), target },
		pace,
		projected,
		behind: remaining > 0 && (projected === null || projected > DEADLINE),
	};
}
