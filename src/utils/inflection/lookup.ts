import { editDistance, type Scored } from "#/utils/search/suggestions";
import { formKey } from "./key";
import { keysOf, paradigm } from "./paradigm";
import type { Cell, Filing } from "./types";

export type Indexed = Filing & { id: number };

export type FormMatches = {
	/** Entries whose lemma is the query once v/u and i/j are set aside: uilla, vīlla. */
	lemmaIds: Set<number>;
	/** Every other entry with a form spelled like the query, and those forms' cells. */
	forms: Map<number, Array<Cell>>;
	/** Set when the query only matched without it: virumque is virum + -que. */
	enclitic?: string;
};

/**
 * Tried in this order, and only when the whole query matched nothing. Keyed as
 * formKey spells them (-ve is ue), shown as Latin spells them.
 */
const ENCLITICS = [
	{ key: "que", spelled: "que" },
	{ key: "ne", spelled: "ne" },
	{ key: "ue", spelled: "ve" },
];

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

	/**
	 * `key` is already formKey'd. An enclitic is stripped only when nothing
	 * matched, so quoque, itaque and uterque never split.
	 */
	lookup(key: string): FormMatches {
		const direct = this.match(key);
		if (direct.lemmaIds.size > 0 || direct.forms.size > 0) return direct;

		for (const enclitic of ENCLITICS) {
			if (!key.endsWith(enclitic.key) || key.length < enclitic.key.length + 2)
				continue;
			const { forms } = this.match(key.slice(0, -enclitic.key.length), true);
			if (forms.size > 0)
				return { lemmaIds: new Set(), forms, enclitic: enclitic.spelled };
		}

		// -cum goes on the ablative of a pronoun: mēcum, nōbīscum, quōcum.
		if (key.endsWith("cum") && key.length > 4) {
			const { forms } = this.match(key.slice(0, -3), true);
			const ablatives = new Map<number, Array<Cell>>();
			for (const [id, cells] of forms) {
				if (this.filings.get(id)?.partOfSpeech !== "pronoun") continue;
				const kept = cells.filter(
					({ analysis }) =>
						analysis.kind === "case" && analysis.case === "ablative",
				);
				if (kept.length > 0) ablatives.set(id, kept);
			}
			if (ablatives.size > 0)
				return { lemmaIds: new Set(), forms: ablatives, enclitic: "cum" };
		}
		return direct;
	}

	/**
	 * Forms within `max` edits of a query that matched nothing: salutavisent
	 * gives salūtāvissent (salūtō). The candidates are the entries with a key
	 * within one edit of the start of the query.
	 */
	suggest(key: string, max: number): Array<Scored> {
		if (max === 0) return [];
		const candidates = new Set<number>();
		for (const [stem, ids] of this.byKey) {
			if (stem.length > key.length + 1) continue;
			const near = [stem.length - 1, stem.length, stem.length + 1].some(
				(length) =>
					length > 0 && editDistance(stem, key.slice(0, length), 1) <= 1,
			);
			if (near) for (const id of ids) candidates.add(id);
		}

		const scored: Array<Scored> = [];
		for (const id of candidates) {
			const filing = this.filings.get(id);
			if (!filing) continue;
			const seen = new Set<string>();
			for (const cell of this.cellsOf(id, filing)) {
				if (seen.has(cell.form)) continue;
				seen.add(cell.form);
				const distance = editDistance(key, cell.key, max);
				if (distance === 0 || distance > max) continue;
				scored.push({
					text: cell.form,
					of: filing.lemma,
					key: cell.key,
					distance,
				});
			}
		}
		return scored;
	}

	/** With `asForms`, a lemma match is a form match too, so its cells are kept. */
	private match(key: string, asForms = false): FormMatches {
		const candidates = new Set<number>();
		for (let length = 1; length <= key.length; length++) {
			for (const id of this.byKey.get(key.slice(0, length)) ?? [])
				candidates.add(id);
		}

		const matches: FormMatches = { lemmaIds: new Set(), forms: new Map() };
		for (const id of candidates) {
			const filing = this.filings.get(id);
			if (!filing) continue;
			if (!asForms && formKey(filing.lemma) === key) {
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
