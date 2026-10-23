import { and, eq } from "drizzle-orm";

import { db } from "#/db";
import { acceptedDisagreements, entries } from "#/db/schema";
import { laslaCandidates } from "#/server/frequency";
import { CHECKS, type CheckId, type Problem } from "#/utils/health/checks";
import {
	type Disagreement,
	disagreements,
	type Field,
} from "#/utils/health/lila";

/**
 * Every check run over the whole database. Queries only, like
 * #/db/analytics: the RPCs in #/server/health are the boundary.
 */

export type HealthReport = {
	entries: number;
	checks: Array<{
		id: CheckId;
		la: string;
		en: string;
		problems: Array<Problem>;
	}>;
	/** LiLa's second opinions still waiting for a look. */
	open: Array<Disagreement>;
	accepted: Array<Disagreement>;
};

function allEntries() {
	return db.query.entries
		.findMany({
			orderBy: [entries.lemmaPlain, entries.lemma, entries.homonym],
			with: { senses: true },
		})
		.sync();
}

export function healthReport(): HealthReport {
	const rows = allEntries();
	const kept = new Set(
		db
			.select()
			.from(acceptedDisagreements)
			.all()
			.map((a) => `${a.entryId}|${a.field}|${a.ours}|${a.theirs}`),
	);

	const found = rows.flatMap((r) => disagreements(r, laslaCandidates(r.lemma)));
	const isKept = (d: Disagreement) =>
		kept.has(`${d.entry.id}|${d.field}|${d.ours}|${d.theirs}`);

	return {
		entries: rows.length,
		checks: CHECKS.map(({ id, la, en, run }) => ({
			id,
			la,
			en,
			problems: run(rows),
		})),
		open: found.filter((d) => !isKept(d)),
		accepted: found.filter(isKept),
	};
}

/** Keeps today's disagreement as filed. False when LiLa no longer disagrees. */
export function acceptDisagreement(entryId: number, field: Field) {
	const entry = db.select().from(entries).where(eq(entries.id, entryId)).get();
	const found = entry
		? disagreements(entry, laslaCandidates(entry.lemma)).find(
				(d) => d.field === field,
			)
		: undefined;
	if (!found) return false;

	const values = { ours: found.ours, theirs: found.theirs };
	db.insert(acceptedDisagreements)
		.values({ entryId, field, ...values })
		.onConflictDoUpdate({
			target: [acceptedDisagreements.entryId, acceptedDisagreements.field],
			set: values,
		})
		.run();
	return true;
}

export function reopenDisagreement(entryId: number, field: Field) {
	db.delete(acceptedDisagreements)
		.where(
			and(
				eq(acceptedDisagreements.entryId, entryId),
				eq(acceptedDisagreements.field, field),
			),
		)
		.run();
}
