import { formKey } from "./key";
import { keysOf, paradigm } from "./paradigm";
import type { Cell, Filing } from "./types";

export type Indexed = Filing & { id: number };

export type FormMatches = {
	/** Entries whose lemma is the query once v/u and i/j are set aside: uilla, vīlla. */
	lemmaIds: Set<number>;
	/** Every other entry with a form spelled like the query, and those forms' cells. */
	forms: Map<number, Array<Cell>>;
};

type Keyed = Cell & { key: string };

/** Paradigms kept at once. Every form of 15k words would be ~100 MB (vault/forms.md). */
const MEMO_SIZE = 2000;

/**
 * Stem → entries, in memory. A lookup takes every entry with a key that starts
 * the query, generates its paradigm, and keeps the cells spelled like the query.
 */
export class FormIndex {
	private readonly byKey = new Map<string, Array<number>>();
	private readonly filings = new Map<number, Indexed>();
	private readonly memo = new Map<number, Array<Keyed>>();

	constructor(entries: Iterable<Indexed>) {
		for (const entry of entries) {
			this.filings.set(entry.id, entry);
			for (const key of keysOf(entry)) {
				const ids = this.byKey.get(key);
				if (ids) ids.push(entry.id);
				else this.byKey.set(key, [entry.id]);
			}
		}
	}

	filing(id: number) {
		return this.filings.get(id);
	}

	private cellsOf(id: number, filing: Indexed) {
		const hit = this.memo.get(id);
		if (hit) {
			// Re-inserted, so the Map's order is least recently used first.
			this.memo.delete(id);
			this.memo.set(id, hit);
			return hit;
		}
		const cells = paradigm(filing).map((cell) => ({
			...cell,
			key: formKey(cell.form),
		}));
		this.memo.set(id, cells);
		if (this.memo.size > MEMO_SIZE) {
			const [oldest] = this.memo.keys();
			this.memo.delete(oldest);
		}
		return cells;
	}

	/** `key` is already formKey'd. */
	lookup(key: string): FormMatches {
		const candidates = new Set<number>();
		for (let length = 1; length <= key.length; length++) {
			for (const id of this.byKey.get(key.slice(0, length)) ?? [])
				candidates.add(id);
		}

		const matches: FormMatches = { lemmaIds: new Set(), forms: new Map() };
		for (const id of candidates) {
			const filing = this.filings.get(id);
			if (!filing) continue;
			if (formKey(filing.lemma) === key) {
				matches.lemmaIds.add(id);
				continue;
			}
			const cells = this.cellsOf(id, filing)
				.filter((cell) => cell.key === key)
				.map(({ key: _, ...cell }) => cell);
			if (cells.length > 0) matches.forms.set(id, cells);
		}
		return matches;
	}
}
