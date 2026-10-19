import { sql } from "drizzle-orm";
import { entries, type viewEvents } from "#/db/schema";

/**
 * How many entries share the outer row's lemma, itself included; 2+ earns the superscript.
 * Names the table, not the column: relational queries render a column unqualified.
 */
export function homographCount(outer: typeof entries | typeof viewEvents) {
	return sql<number>`(select count(*) from ${entries} as h where h.lemma = ${outer}.lemma)`;
}
