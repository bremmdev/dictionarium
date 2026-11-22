import "@tanstack/react-start/server-only";

import { db } from "#/db";
import { entries } from "#/db/schema";
import { CORE_TOTAL, laslaCandidates } from "#/server/frequency";
import { nowSeconds } from "#/utils/analytics/rules";
import { bandFor, filedLexemes, type Lexeme } from "#/utils/entries/frequency";
import { type V1Progress, v1Progress } from "#/utils/progress/rules";

/** Undated (null) was filed before dates were kept, so it is earliest of all. */
function earliest(a: number | null, b: number | null) {
	return a === null || b === null ? null : Math.min(a, b);
}

/** Progress towards v1 from every entry on file. See vault/analytics.md. */
export function currentV1Progress(now: number = nowSeconds()): V1Progress {
	const rows = db
		.select({
			lemma: entries.lemma,
			partOfSpeech: entries.partOfSpeech,
			conjugation: entries.conjugation,
			declension: entries.declension,
			gender: entries.gender,
			createdAt: entries.createdAt,
		})
		.from(entries)
		.all();

	// A Core word counts from its first filing.
	const filedAt = new Map<Lexeme, number | null>();
	for (const row of rows) {
		for (const lexeme of filedLexemes(row, laslaCandidates(row.lemma))) {
			if (bandFor(lexeme.rank) !== "core") continue;
			const seen = filedAt.get(lexeme);
			filedAt.set(
				lexeme,
				seen === undefined ? row.createdAt : earliest(seen, row.createdAt),
			);
		}
	}

	return v1Progress({ total: CORE_TOTAL, filedAt: [...filedAt.values()], now });
}
