/**
 * English Wiktionary as a research assistant.
 *
 * Give it what you can read off a page — `puella`, `ambulo` — and it works out
 * the rest of the filing described in vault/schema.md: the macronned lemma, the
 * principal parts, gender, declension, conjugation, and every sense Wiktionary
 * lists, in its order — its first sense becomes rank 1.
 *
 * Two callers share it. scripts/enrich-entries.ts prints rows to paste or write
 * straight to the database; the suggestEntry RPC hands the admin form a filled
 * draft. Neither treats what comes back as an oracle: Wiktionary's senses are
 * rarely the ones you would write yourself, and it lists far more of them than a
 * learner's dictionary wants. The script says so in its footer, and the form
 * fills the fields but never submits them — a person still reads every one.
 *
 * A page can hold several Latin words under one spelling (`capio` is both a verb
 * and a noun; `bonus` an adjective and a noun), so a lookup can be pinned to a
 * part of speech. Unpinned, it takes the first and says which others it saw.
 */
import type { DraftFields, EntrySuggestion } from "#/utils/entries/form";
import {
	CONJUGATIONS,
	declensionsFor,
	GENDERS,
	hasTerminations,
	INFLECTS,
	isConjugation,
	isDeclensionFor,
	isGender,
	isPartOfSpeech,
	isTerminations,
	TERMINATIONS,
} from "#/utils/entries/rules";
import { normalizeLemma } from "#/utils/search/rules";

const API = "https://en.wiktionary.org/w/api.php";
/** Wikimedia asks scripts to identify themselves and link somewhere contactable. */
const USER_AGENT =
	"dictionarium-enrich/0.1 (+https://github.com/bremmdev/dictionarium)";
/** Wikimedia throttles bursts hard — a second between requests keeps us welcome. */
const THROTTLE_MS = 1000;

export type WiktionarySense = {
	meaningEn: string;
	/** 'medical', 'military', 'poetic' — a label on this sense only. */
	usage?: string;
};

export type WiktionaryRow = {
	lemma: string;
	lemmaPlain: string;
	partOfSpeech: string;
	principalParts?: string;
	gender?: string;
	declension?: string;
	terminations?: string;
	conjugation?: string;
	notes?: string;
	/** Position is the rank, so Wiktionary's own order is the dictionary order. */
	senses: Array<WiktionarySense>;
};

export type LookupSpec = {
	lemma: string;
	/** `capio#verb` on the command line, the part-of-speech chips in the form. */
	partOfSpeech?: string;
	/**
	 * Whether that is a pin or a preference. On the command line it is a pin:
	 * asking for a section that is not there is a mistake worth stopping for.
	 * The form only prefers, because its chips hold whatever the last fill wrote
	 * into them and a radio cannot be unpicked — a pin there would mean looking
	 * up a verb once left you unable to look up a noun.
	 */
	pinned?: boolean;
};

/**
 * Wiktionary will happily list twenty senses for a common verb. Past the first
 * handful they are dialect, Medieval and New Latin — noise for a reader here,
 * and a wall of text to cut down by hand.
 */
const MAX_SENSES = 8;

/* ------------------------------------------------------------------- text */

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	apos: "'",
	gt: ">",
	lt: "<",
	nbsp: " ",
	quot: '"',
};

function decodeEntities(html: string) {
	return html
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, n) =>
			String.fromCodePoint(Number.parseInt(n, 16)),
		)
		.replace(/&(amp|apos|gt|lt|nbsp|quot);/g, (_, n) => NAMED_ENTITIES[n]);
}

/** Flattens a fragment of Wiktionary HTML to the text a reader would see. */
function toText(html: string) {
	return decodeEntities(
		html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, ""),
	)
		.replace(/\s+/g, " ")
		.trim()
		.normalize("NFC");
}

/**
 * Wiktionary nests <span> inside <span> and <li> inside <li>, so a lazy regex
 * closes on the wrong tag and swallows half a section. Count depth instead.
 */
function extractTag(html: string, tag: string, from = 0) {
	const opening = new RegExp(`<${tag}(?=[\\s/>])[^>]*>`, "gi");
	opening.lastIndex = from;
	const first = opening.exec(html);
	if (!first) return null;

	const scan = new RegExp(`<${tag}(?=[\\s/>])[^>]*>|</${tag}\\s*>`, "gi");
	scan.lastIndex = first.index;
	let depth = 0;

	for (let m = scan.exec(html); m; m = scan.exec(html)) {
		depth += m[0].startsWith("</") ? -1 : 1;
		if (depth > 0) continue;
		return {
			inner: html.slice(first.index + first[0].length, m.index),
			start: first.index,
			end: scan.lastIndex,
		};
	}
	return null;
}

function removeTag(html: string, tag: string) {
	let out = html;
	for (let cut = extractTag(out, tag); cut; cut = extractTag(out, tag)) {
		out = out.slice(0, cut.start) + out.slice(cut.end);
	}
	return out;
}

/* ------------------------------------------------------------- wiktionary */

/** When the most recently booked request leaves, whether or not it has yet. */
let nextSlot = 0;

async function callApi(params: Record<string, string>) {
	// Book the slot before waiting, not after. Stamping the time once the wait
	// is over lets every caller that arrives during one wait read the same stale
	// stamp, sleep the same second, and leave together.
	const slot = Math.max(Date.now(), nextSlot + THROTTLE_MS);
	nextSlot = slot;
	const wait = slot - Date.now();
	if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

	const query = new URLSearchParams({
		format: "json",
		formatversion: "2",
		redirects: "1",
		...params,
	});
	const response = await fetch(`${API}?${query}`, {
		headers: { "User-Agent": USER_AGENT },
	});
	if (!response.ok) {
		throw new Error(
			`Wiktionary answered ${response.status} ${response.statusText}`,
		);
	}

	const body = await response.json();
	if (body.error) {
		// The code travels as the cause: "missingtitle" is the ordinary answer to
		// a typo, and the caller says that in its own words rather than
		// MediaWiki's.
		throw new Error(body.error.info ?? body.error.code, {
			cause: body.error.code,
		});
	}
	return body.parse;
}

/**
 * Latin pages are filed under the macron-less spelling ("ambulo", never
 * "ambulō"), so we look up the stripped form whatever the caller typed. Titles
 * are case-sensitive, hence the capitalised retry for proper nouns.
 */
async function fetchLatinSection(lemma: string) {
	const plain = normalizeLemma(lemma);
	const titles = [plain, plain.charAt(0).toUpperCase() + plain.slice(1)];
	const errors: Array<unknown> = [];

	for (const title of titles) {
		try {
			const outline = await callApi({
				action: "parse",
				page: title,
				prop: "sections",
			});
			const latin = outline.sections.find(
				(s: { line: string; toclevel: number }) =>
					s.line === "Latin" && s.toclevel === 1,
			);
			if (!latin) {
				// The cause is what the check below reads, the same way MediaWiki's
				// own codes travel.
				throw new Error(`"${title}" has no Latin section on Wiktionary`, {
					cause: "nolatin",
				});
			}

			const section = await callApi({
				action: "parse",
				page: title,
				prop: "text",
				section: String(latin.index),
			});
			return section.text as string;
		} catch (error) {
			errors.push(error);
		}
	}

	// Both spellings missed. A page that is not there and a page with no Latin
	// on it are the same answer to the person who typed the word; anything else
	// — a network failure, a 500 from Wikimedia — is not, and travels as it is,
	// even when the other spelling came back as a plain miss.
	const failure = errors.find(
		(error) =>
			!(
				error instanceof Error &&
				(error.cause === "missingtitle" || error.cause === "nolatin")
			),
	);
	if (failure !== undefined) {
		throw failure;
	}
	throw new Error(`Wiktionary has no Latin entry for “${lemma}”.`);
}

/* ---------------------------------------------------------------- parsing */

const WIKTIONARY_PARTS_OF_SPEECH = new Set([
	"adjective",
	"adverb",
	"article",
	"conjunction",
	"determiner",
	"interjection",
	"noun",
	"numeral",
	"particle",
	"phrase",
	"preposition",
	"pronoun",
	"proper noun",
	"proverb",
	"verb",
]);

type Candidate = {
	partOfSpeech: string;
	/** The macronned headword as Wiktionary prints it. */
	headword: string;
	/** "genitive" -> "mātris", "present infinitive" -> "ambulāre", ... */
	forms: Map<string, string>;
	gender?: string;
	/** The whole headword line as text: where "third conjugation, deponent" lives. */
	grammar: string;
	senses: Array<WiktionarySense>;
	/** How many definitions Wiktionary listed, before MAX_SENSES cut them down. */
	senseCount: number;
	/** True for sections that only point at another lemma ("ablative singular of quisque"). */
	isInflectedForm: boolean;
};

/** Slices the Latin section into one block per heading, keyed by heading text. */
function splitByHeading(html: string) {
	const heading =
		/<div class="mw-heading[^"]*">\s*<h(\d)[^>]*>([\s\S]*?)<\/h\1>/g;
	const found = [...html.matchAll(heading)];

	return found.map((match, i) => ({
		title: toText(match[2]).toLowerCase(),
		html: html.slice(
			match.index + match[0].length,
			found[i + 1]?.index ?? html.length,
		),
	}));
}

/**
 * Reads the labelled forms off a headword line. The line is a stream of
 * <i>label</i> <b>form</b> pairs — "present infinitive ambulāre, perfect active
 * cucurrī or currī" — where "or" introduces an alternative rather than a new
 * label, so we keep the first form under each label and drop the variants.
 */
function readForms(headwordLine: string) {
	const forms = new Map<string, string>();
	let label = "";

	for (const token of headwordLine.matchAll(
		/<i\b[^>]*>([\s\S]*?)<\/i>|<b\b[^>]*>([\s\S]*?)<\/b>/g,
	)) {
		if (token[1] !== undefined) {
			const read = toText(token[1]).toLowerCase();
			if (read && read !== "or" && read !== "and") label = read;
			continue;
		}
		const form = toText(token[2]);
		if (label && form && !forms.has(label)) forms.set(label, form);
	}
	return forms;
}

function findForm(forms: Map<string, string>, label: RegExp) {
	for (const [key, value] of forms) {
		if (label.test(key)) return value;
	}
	return undefined;
}

type Definition = {
	/** The definition's own markup, with its quotations and sub-senses cut away. */
	html: string;
	/** Usage labels of the headings it is filed under: "(figurative):" gives "figurative". */
	labels: Array<string>;
};

/**
 * Most entries list their senses flat, but some file them under headings that
 * are not senses themselves: magnus puts "great, large, big" under
 * "(literally):" and "noble, lofty" under "(figurative):", and sub puts each
 * meaning under the case it takes. A heading is an item with a list under it
 * and nothing of its own to say: a bare label, or a lead-in that ends in a
 * colon ("especially:", "absolute uses:"). Its senses are read in its place and
 * carry its label down with them. Any other list under an item is sub-senses,
 * and stays out — including under a gloss that goes on to narrow itself: diēs
 * is "A day, particularly:", and "a day" is the sense.
 */
function readDefinitions(
	list: string,
	partOfSpeech: string,
	labels: Array<string> = [],
): Array<Definition> {
	const definitions: Array<Definition> = [];

	for (
		let cut = extractTag(list, "li");
		cut;
		cut = extractTag(list, "li", cut.end)
	) {
		// Quotations, synonyms and sub-senses hang off the definition in nested lists.
		const html = ["dl", "ul", "ol"].reduce(removeTag, cut.inner);
		const text = toText(html);
		const isBareLabel = tidyGloss(text, partOfSpeech) === "";
		const isLeadIn = text.endsWith(":") && !COMMENTARY.test(text);
		// Quotations are lists too, and may hold one of their own.
		const nested = extractTag(["dl", "ul"].reduce(removeTag, cut.inner), "ol");

		if (nested && (isBareLabel || isLeadIn)) {
			// A lead-in says what follows, not where it is used.
			const heading = isBareLabel ? readUsage(text) : [];
			definitions.push(
				...readDefinitions(nested.inner, partOfSpeech, [...labels, ...heading]),
			);
		} else if (text) {
			definitions.push({ html, labels });
		}
	}
	return definitions;
}

/**
 * The definitions are an <ol>, one <li> per sense, printed in the order a
 * dictionary would give them — which is what senses.rank means, so the list
 * order carries straight across. Headings are read through (readDefinitions),
 * so a grouped entry comes out in the same order, just flat.
 */
function readSenses(block: string, partOfSpeech: string) {
	const list = extractTag(block, "ol");
	if (!list) return { senses: [], isInflectedForm: false, senseCount: 0 };

	const definitions = readDefinitions(list.inner, partOfSpeech);

	// Only the first definition says whether this is a headword section at all:
	// "ablative singular of quisque" is a signpost, and has no second sense.
	const isInflectedForm =
		definitions.length > 0 &&
		/class="[^"]*form-of-definition/.test(definitions[0].html);

	const senses: Array<WiktionarySense> = [];
	const seen = new Set<string>();

	for (const { html, labels } of definitions) {
		let definition = html;

		// "(female parent)" style clarifiers are marked up, so they come off
		// cleanly — but held on to, because two senses of one word can tidy down
		// to the same gloss (māter is "mother (female parent)" and "mother
		// (source, origin)"), and then the clarifier is all that separates them.
		const clarifier = toText(
			definition.match(/<span class="mention-gloss">([\s\S]*?)<\/span>/)?.[1] ??
				"",
		);
		definition = definition.replace(
			/<span class="mention-gloss[^"]*"[^>]*>[\s\S]*?<\/span>/g,
			"",
		);

		const text = toText(definition);
		const meaningEn = tidyGloss(text, partOfSpeech);
		// A sense that tidies away to nothing was a bare label or an empty <li>.
		if (!meaningEn) continue;

		const distinct =
			seen.has(meaningEn.toLowerCase()) && clarifier
				? `${meaningEn} (${clarifier})`
				: meaningEn;

		// Nothing tells this one apart from a sense already taken, so it is a
		// repeat rather than a meaning: printing it twice only makes work.
		if (seen.has(distinct.toLowerCase())) continue;

		seen.add(meaningEn.toLowerCase());
		seen.add(distinct.toLowerCase());

		const usage = [...new Set([...labels, ...readUsage(text)])];
		senses.push({
			meaningEn: distinct,
			usage: usage.length > 0 ? usage.join(", ") : undefined,
		});
		if (senses.length === MAX_SENSES) break;
	}

	return { senses, isInflectedForm, senseCount: definitions.length };
}

function parseCandidates(sectionHtml: string) {
	const candidates: Array<Candidate> = [];

	for (const block of splitByHeading(sectionHtml)) {
		// "Adverb 2", under a second etymology, is still an adverb.
		const partOfSpeech = block.title.replace(/\s+\d+$/, "");
		if (!WIKTIONARY_PARTS_OF_SPEECH.has(partOfSpeech)) continue;

		const paragraph = extractTag(block.html, "p");
		const lineStart = block.html.indexOf('<span class="headword-line"');
		if (!paragraph || lineStart < 0) continue;

		const line = extractTag(block.html, "span", lineStart);
		if (!line) continue;

		const headword = line.inner.match(
			/<strong[^>]*class="[^"]*headword[^"]*"[^>]*>([\s\S]*?)<\/strong>/,
		);
		if (!headword) continue;

		const gender = line.inner.match(
			/<span class="gender"[^>]*>([\s\S]*?)<\/span>/,
		);

		candidates.push({
			partOfSpeech,
			headword: toText(headword[1]),
			forms: readForms(line.inner),
			gender: gender ? toText(gender[1]) : undefined,
			grammar: toText(paragraph.inner),
			...readSenses(block.html, partOfSpeech),
		});
	}
	return candidates;
}

/* -------------------------------------------------------- grammar mapping */

const ORDINALS = ["first", "second", "third", "fourth", "fifth"];

function ordinalToDigit(word: string) {
	return String(ORDINALS.indexOf(word) + 1);
}

function readDeclension(grammar: string) {
	// Adjectives take two: "first/second-declension adjective". This dictionary
	// spells that pair "1-2" (vault/schema.md).
	const both = grammar.match(
		/(first|second|third|fourth|fifth)\/(first|second|third|fourth|fifth)[- ]declension/,
	);
	if (both) return `${ordinalToDigit(both[1])}-${ordinalToDigit(both[2])}`;

	const one = grammar.match(/(first|second|third|fourth|fifth)[- ]declension/);
	if (one) return ordinalToDigit(one[1]);

	// Not an absence: a word that never changes shape has answered the question.
	return /\bindeclinable\b/.test(grammar) ? "indeclinable" : undefined;
}

/**
 * Wiktionary names the class in the headword line — "third-declension
 * three-termination adjective" — which is the one place this fact is written
 * down in words rather than left to be read off the forms. Lewis & Short and the
 * OLD print acer, cris, cre and say nothing; the count is the reader's to make.
 */
function readTerminations(grammar: string) {
	const counted = grammar.match(/\b(one|two|three)[- ]termination\b/);
	return counted
		? String(["one", "two", "three"].indexOf(counted[1]) + 1)
		: undefined;
}

function readConjugation(grammar: string) {
	if (/irregular conjugation/.test(grammar)) return "irregular";
	if (/third \(-i[ōo] variant\) conjugation/.test(grammar)) return "3io";

	const plain = grammar.match(/(first|second|third|fourth)[- ]conjugation/);
	return plain ? ordinalToDigit(plain[1]) : undefined;
}

/**
 * Everything Wiktionary says about the word that the columns have nowhere to
 * put — deponency, indeclinability, the case a preposition governs.
 */
function readNotes(candidate: Candidate) {
	const flags = new Set<string>();

	// Longest alternative first: "semi-deponent" must not be read as "deponent".
	const phrases =
		/\b(semi-deponent|deponent|indeclinable|impersonal(?: in the passive)?|defective|suppletive|no passive|no supine|not comparable)\b/g;
	for (const match of candidate.grammar.matchAll(phrases)) flags.add(match[1]);

	for (const match of candidate.grammar.matchAll(
		/\+ (ablative|accusative|dative|genitive)/g,
	)) {
		flags.add(`takes the ${match[1]}`);
	}
	// The gender column holds one letter; "m or f" has to be said in words.
	if (candidate.gender?.includes("or"))
		flags.add(`gender: ${candidate.gender}`);

	return flags.size > 0 ? [...flags].join("; ") : undefined;
}

function readGender(candidate: Candidate) {
	return candidate.gender?.match(/\b([mfn])\b/)?.[1];
}

/**
 * The dictionary filing for the word: all four principal parts for a verb, the
 * genitive for a noun, the genders for an adjective, nothing for the rest —
 * their lemma is already the whole filing (see vault/schema.md).
 */
function readPrincipalParts(candidate: Candidate) {
	const { forms, headword, partOfSpeech } = candidate;

	if (partOfSpeech === "verb") {
		const parts = [
			headword,
			findForm(forms, /infinitive/),
			findForm(forms, /perfect/),
			// sum has no supine; its fourth part is the future active participle.
			findForm(forms, /supine/) ?? findForm(forms, /future active participle/),
		];
		return parts.filter(Boolean).join(", ");
	}

	if (partOfSpeech === "noun" || partOfSpeech === "proper noun") {
		return findForm(forms, /genitive/);
	}

	if (partOfSpeech === "adjective") {
		// One line per termination the adjective actually has: bonus, bona, bonum
		// and ācer, ācris, ācre give three; fortis, forte gives two.
		const filed = [
			headword,
			findForm(forms, /feminine/),
			findForm(forms, /neuter/),
		].filter(Boolean);

		if (filed.length > 1) return filed.join(", ");

		// Nothing but the headword, so this is a one-termination adjective: it has
		// no separate genders to print, and what a dictionary prints beside it is
		// the genitive — vetus, veteris — because the nominative hides the stem.
		const genitive = findForm(forms, /genitive/);
		return genitive ? `${headword}, ${genitive}` : undefined;
	}

	return undefined;
}

/**
 * Where a definition stops being a gloss and starts being commentary on one:
 * "tower, especially a military tower for siege, advanced to the walls..."
 */
const COMMENTARY =
	/[,;]\s*(?:especially|particularly|specifically|namely|loosely|chiefly|originally|properly|by extension|figuratively)\b.*$/i;

/** Wiktionary writes definitions as prose; the column wants a bare gloss. */
function tidyGloss(gloss: string, partOfSpeech: string) {
	let tidied = gloss;

	// Labels and clarifications wrap each other — "(space) [with ablative]" —
	// so peel until nothing more comes off.
	for (let previous = ""; tidied !== previous; ) {
		previous = tidied;
		tidied = tidied
			// A leading "(intransitive)" or "(poetic)" is a label, not the meaning.
			.replace(/^\((?:[^()]|\([^()]*\))*\)\s*/, "")
			// A trailing parenthesis is a clarification the gloss can live without.
			.replace(/\s*\((?:[^()]|\([^()]*\))*\)$/, "")
			.replace(/\s*\[[^\]]*\]$/, "")
			.trim();
	}

	tidied = tidied
		.replace(COMMENTARY, "")
		.replace(/[,;:]+$/, "")
		.trim();

	// "A day" -> "a day", but Rōma stays Rōma and SPQR stays SPQR.
	if (partOfSpeech !== "proper noun" && /^[A-Z][a-z]*\b/.test(tidied)) {
		tidied = tidied.charAt(0).toLowerCase() + tidied.slice(1);
	}
	return tidied;
}

/**
 * Labels that say how a word is construed rather than where it is used. The
 * columns and the notes already carry these, and senses.usage is for the other
 * kind of label — the register or field one meaning belongs to.
 */
const GRAMMAR_LABELS = new Set([
	"absolute",
	"absolute use",
	"absolutely",
	"active",
	"ambitransitive",
	"auxiliary",
	"comparable",
	"copulative",
	"countable",
	"defective",
	"deponent",
	"ditransitive",
	"impersonal",
	"in absolute use",
	"in the plural",
	"in the singular",
	"indeclinable",
	"intransitive",
	"not comparable",
	"passive",
	"personal",
	"plural",
	"reflexive",
	"semi-deponent",
	"singular",
	"transitive",
	"uncountable",
]);

/**
 * Qualifiers that say how far a sense reaches, not where it is used: magnus is
 * "(in general) great, noble" and then "(in particular) advanced in years".
 */
const SCOPE_LABELS = new Set([
	"especially",
	"generally",
	"in general",
	"in particular",
	"particularly",
	"specifically",
]);

/**
 * A definition can open with a label: "(transitive, poetic) to love". What is
 * left once the grammar is dropped is this sense's usage — and for most senses
 * that is nothing at all, which is the normal answer.
 */
function readUsage(gloss: string) {
	const label = gloss.match(/^\(([^()]*)\)/);
	if (!label) return [];

	return (
		label[1]
			.split(/\s*(?:,|;|\bor\b|\band\b)\s*/)
			.map((part) => part.trim().toLowerCase())
			// "with the accusative" is the same grammar note in a longer coat.
			.filter(
				(part) =>
					part &&
					!GRAMMAR_LABELS.has(part) &&
					!SCOPE_LABELS.has(part) &&
					!/^(?:with|takes|\+)\b/.test(part),
			)
	);
}

function toRow(candidate: Candidate): WiktionaryRow {
	const isNoun =
		candidate.partOfSpeech === "noun" ||
		candidate.partOfSpeech === "proper noun";
	// The four this dictionary asks a declension of (INFLECTS), plus Wiktionary's
	// separate filing for proper nouns.
	const isNominal =
		isNoun ||
		["adjective", "numeral", "pronoun"].includes(candidate.partOfSpeech);

	return {
		lemma: candidate.headword.normalize("NFC"),
		lemmaPlain: normalizeLemma(candidate.headword),
		partOfSpeech: candidate.partOfSpeech,
		principalParts: readPrincipalParts(candidate) || undefined,
		gender: isNoun ? readGender(candidate) : undefined,
		declension: isNominal ? readDeclension(candidate.grammar) : undefined,
		terminations:
			candidate.partOfSpeech === "adjective"
				? readTerminations(candidate.grammar)
				: undefined,
		conjugation:
			candidate.partOfSpeech === "verb"
				? readConjugation(candidate.grammar)
				: undefined,
		notes: readNotes(candidate),
		senses: candidate.senses,
	};
}

/* --------------------------------------------------------------- choosing */

function chooseCandidate(
	candidates: Array<Candidate>,
	spec: LookupSpec,
	warn: (message: string) => void,
) {
	if (candidates.length === 0) {
		throw new Error("no part-of-speech section found in the Latin entry");
	}

	let pool = candidates;

	if (spec.partOfSpeech) {
		// This dictionary has no separate filing for proper nouns, so asking for
		// a noun has to keep Rōma in the running.
		const wanted =
			spec.partOfSpeech === "noun"
				? ["noun", "proper noun"]
				: [spec.partOfSpeech];
		const asked = pool.filter((c) => wanted.includes(c.partOfSpeech));

		if (asked.length > 0) {
			pool = asked;
		} else if (spec.pinned) {
			const available = [
				...new Set(candidates.map((c) => c.partOfSpeech)),
			].join(", ");
			throw new Error(
				`no ${spec.partOfSpeech} section; Wiktionary has: ${available}`,
			);
		} else {
			warn(
				`Wiktionary has no ${spec.partOfSpeech} under this spelling, so the part of speech below is the one it does have`,
			);
		}
	}

	// If the caller typed the macrons, they are a disambiguator: liber vs līber.
	if (spec.lemma !== normalizeLemma(spec.lemma)) {
		const exact = pool.filter(
			(c) => c.headword.normalize("NFC") === spec.lemma.normalize("NFC"),
		);
		if (exact.length > 0) pool = exact;
	}

	// A section that only says "ablative singular of quisque" is not a headword.
	const headwords = pool.filter((c) => !c.isInflectedForm);
	if (headwords.length > 0) pool = headwords;

	if (pool.length > 1) {
		const others = [...new Set(pool.slice(1).map((c) => c.partOfSpeech))].join(
			", ",
		);
		warn(
			`${pool.length} Latin entries under this spelling, took the ${pool[0].partOfSpeech}. Others: ${others}`,
		);
	}
	return pool[0];
}

/* ---------------------------------------------------------------- lookups */

export type Lookup = { row: WiktionaryRow; warnings: Array<string> };

/**
 * One word, looked up and filed. The warnings are the things a person has to
 * know about what came back — that a choice was made between several entries,
 * that senses were cut, that the page is filed under a different spelling — and
 * every caller is expected to put them in front of one.
 */
export async function lookupEntry(spec: LookupSpec): Promise<Lookup> {
	const warnings: Array<string> = [];
	const candidates = parseCandidates(await fetchLatinSection(spec.lemma));
	const candidate = chooseCandidate(candidates, spec, (message) =>
		warnings.push(message),
	);
	const row = toRow(candidate);

	if (row.senses.length === 0) {
		warnings.push("no definitions found, its senses need writing by hand");
	}
	if (candidate.senseCount > row.senses.length) {
		warnings.push(
			`Wiktionary lists ${candidate.senseCount} definitions, kept ${row.senses.length}`,
		);
	}
	if (normalizeLemma(row.lemma) !== normalizeLemma(spec.lemma)) {
		warnings.push(`Wiktionary files this under "${row.lemma}"`);
	}

	return { row, warnings };
}

/**
 * The same lookup, in the shape the admin form holds a half-filled entry in.
 *
 * Anything Wiktionary says that this dictionary has no vocabulary for is left
 * blank and said out loud rather than passed through: an unrecognised value
 * would only be rejected by parseEntryDraft later, with the editor wondering
 * where it came from.
 */
export async function suggestFromWiktionary(
	spec: LookupSpec,
): Promise<EntrySuggestion> {
	const { row, warnings } = await lookupEntry(spec);

	let partOfSpeech = row.partOfSpeech;

	if (partOfSpeech === "proper noun") {
		// This dictionary has one filing for both; the reader sees "noun".
		partOfSpeech = "noun";
		warnings.push("Wiktionary calls this a proper noun; filed here as a noun");
	} else if (!isPartOfSpeech(partOfSpeech)) {
		warnings.push(
			`Wiktionary calls this ${partOfSpeech ? `a ${partOfSpeech}` : "nothing this dictionary files"}, so the part of speech is for you to pick`,
		);
		partOfSpeech = "";
	}

	const read = {
		gender: row.gender ?? "",
		declension: row.declension ?? "",
		terminations: row.terminations ?? "",
		conjugation: row.conjugation ?? "",
	};

	const draft: DraftFields = {
		lemma: row.lemma,
		partOfSpeech,
		principalParts: row.principalParts ?? "",
		gender: isGender(read.gender) ? read.gender : "",
		// Checked against the part of speech, not just the column: Wiktionary
		// can call a noun "first/second-declension", and `1-2` is not a noun's.
		declension: isDeclensionFor(partOfSpeech, read.declension)
			? read.declension
			: "",
		terminations: isTerminations(read.terminations) ? read.terminations : "",
		conjugation: isConjugation(read.conjugation) ? read.conjugation : "",
		notes: row.notes ?? "",
	};

	// A value this dictionary has no vocabulary for is dropped rather than
	// passed through, because parseEntryDraft would only reject it later with
	// the editor wondering where it came from.
	for (const [field, vocabulary] of [
		["gender", GENDERS],
		["declension", declensionsFor(partOfSpeech)],
		["terminations", TERMINATIONS],
		["conjugation", CONJUGATIONS],
	] as const) {
		if (read[field] !== "" && draft[field] === "") {
			warnings.push(
				`“${read[field]}” is not one of ${vocabulary.join(" | ")}, so the ${field} is unanswered`,
			);
		}
	}

	// The question that applies has to be answered, and Wiktionary's headword
	// line does not always say: nothing on quisque's says how it declines.
	const asks = isPartOfSpeech(partOfSpeech)
		? INFLECTS[partOfSpeech]
		: undefined;
	if (asks !== undefined && asks !== "neither" && draft[asks] === "") {
		warnings.push(
			`Wiktionary does not say how this ${partOfSpeech} inflects, so the ${asks} is for you to answer`,
		);
	}

	// And the follow-up question, which only a 3rd-declension adjective is asked.
	// Wiktionary usually names the class outright, but an adjective whose entry
	// predates that template says only "third-declension adjective" — and then
	// the count has to be read off the forms by someone who can tell a neuter
	// from a genitive.
	if (
		hasTerminations(partOfSpeech, draft.declension) &&
		draft.terminations === ""
	) {
		warnings.push(
			"Wiktionary does not say how many terminations this adjective has, so that is for you to answer",
		);
	}

	return {
		draft,
		senses: row.senses.map((sense) => ({
			meaningEn: sense.meaningEn,
			usage: sense.usage ?? "",
		})),
		warnings,
	};
}
