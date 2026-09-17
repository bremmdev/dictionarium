import { lt } from "drizzle-orm";

import { db } from "#/db";
import { searchEvents, viewEvents } from "#/db/schema";
import { cutoff } from "#/utils/analytics/rules";
import { envNumber } from "./backup";

/**
 * Deleting old events is what makes an event log affordable.
 *
 * The analytics tables are the only ones in this database that grow on their
 * own, and they grow inside every backup as well: each `VACUUM INTO` dump is a
 * copy of the whole file, seven are retained, and they sit on the same volume.
 * So an unbounded event log is not one cost, it is eight. This is the dial.
 */

/** 0 disables pruning entirely and lets the log grow. */
const DEFAULT_RETENTION_DAYS = 365;

const dayMs = 24 * 60 * 60 * 1000;

// Never prune in the first minute of a process, for the same reason backups do
// not: a deploy is a restart, and there is no value in making a cold start do
// housekeeping before it has served anything.
const minDelayMs = 60_000;

/** Delete every event older than the window. Returns how many rows went. */
export function pruneEvents(
	days = envNumber("ANALYTICS_RETENTION_DAYS", DEFAULT_RETENTION_DAYS),
): number {
	if (days <= 0) {
		return 0;
	}

	const since = cutoff(days);

	// Two statements rather than one transaction: the tables are unrelated, and
	// a half-finished prune is not a broken state — it is simply less pruned,
	// which the next tick fixes.
	const searches = db
		.delete(searchEvents)
		.where(lt(searchEvents.createdAt, since))
		.run();

	const views = db
		.delete(viewEvents)
		.where(lt(viewEvents.createdAt, since))
		.run();

	return searches.changes + views.changes;
}

/**
 * Prune every 24 hours (`ANALYTICS_RETENTION_DAYS`, 0 disables).
 *
 * Deliberately simpler than `scheduleBackups`, and the difference is the point.
 * That one anchors to the newest dump's mtime because a missed backup is a real
 * loss and Railway's redeploys would otherwise reset the clock forever. A missed
 * prune costs nothing — the rows just survive until the next tick — so a plain
 * interval needs no catch-up logic and no state on disk to read.
 *
 * Kept out of the backup tick on purpose, tempting as the single timer is:
 * setting DB_BACKUP_INTERVAL_HOURS=0 would then silently disable retention too,
 * and the table would grow forever with nothing in the log to say why.
 */
export function scheduleRetention(): void {
	// Two timers deleting from one table would each be racing the other's read.
	// The guard lives on globalThis because Vite re-evaluates modules and Nitro
	// re-runs its plugins — module state would be discarded along with the old
	// timer's owner, but not the timer. Same reasoning as scheduleBackups.
	const g = globalThis as typeof globalThis & {
		__dictionariumRetentionScheduled?: boolean;
	};
	if (g.__dictionariumRetentionScheduled) {
		return;
	}
	g.__dictionariumRetentionScheduled = true;

	const days = envNumber("ANALYTICS_RETENTION_DAYS", DEFAULT_RETENTION_DAYS);
	if (days <= 0) {
		console.log(
			"SQLite: analytics retention disabled, events are kept forever.",
		);
		return;
	}

	const tick = () => {
		try {
			const removed = pruneEvents(days);
			if (removed > 0) {
				console.log(
					`SQLite: pruned ${removed} analytics event(s) older than ${days} days.`,
				);
			}
		} catch (err) {
			// A failed prune is not a reason to take the site down — but a silent
			// one leaves a table growing that nobody is watching.
			console.error("SQLite: analytics prune failed.", err);
		}
	};

	// unref on both: housekeeping must never be the reason the process stays
	// alive, nor hold it open during a shutdown waiting for the loop to empty.
	setTimeout(() => {
		tick();
		setInterval(tick, dayMs).unref();
	}, minDelayMs).unref();
}
