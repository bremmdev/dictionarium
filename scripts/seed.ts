import { and, eq, gt, inArray, or, sql } from "drizzle-orm";
import { normalizeLemma } from "#/utils/search/rules";
import { db } from "../src/db";
import { entries, senses } from "../src/db/schema";

type SeedSense = {
  meaningEn: string;
  /** 'medical', 'military', 'poetic' — a label on this sense only. */
  usage?: string;
  exampleLa?: string;
  exampleEn?: string;
};

type SeedWord = {
  lemma: string;
  partOfSpeech: string;
  principalParts?: string;
  gender?: string;
  declension?: string;
  conjugation?: string;
  /**
   * Position is the rank: the first sense is the core meaning. Typed non-empty
   * because an entry without a meaning is not an entry.
   */
  senses: [SeedSense, ...Array<SeedSense>];
};

const words: Array<SeedWord> = [{
  lemma: "ambulō",
  partOfSpeech: "verb",
  principalParts: "ambulō, ambulāre, ambulāvī, ambulātum",
  conjugation: "1",
  senses: [{ meaningEn: "traverse, travel" }, { meaningEn: "to walk" }],
},
{
  lemma: "amō",
  partOfSpeech: "verb",
  principalParts: "amō, amāre, amāvī, amātum",
  conjugation: "1",
  senses: [{ meaningEn: "to love" }],
},
{
  lemma: "audiō",
  partOfSpeech: "verb",
  principalParts: "audiō, audīre, audīvī, audītum",
  conjugation: "4",
  senses: [{ meaningEn: "to hear, listen to" }],
},
{
  lemma: "cantō",
  partOfSpeech: "verb",
  principalParts: "cantō, cantāre, cantāvī, cantātum",
  conjugation: "1",
  senses: [{ meaningEn: "to sing" }],
},
{
  lemma: "currō",
  partOfSpeech: "verb",
  principalParts: "currō, currere, cucurrī, cursum",
  conjugation: "3",
  senses: [{ meaningEn: "to run" }],
},
{
  lemma: "labōrō",
  partOfSpeech: "verb",
  principalParts: "labōrō, labōrāre, labōrāvī, labōrātum",
  conjugation: "1",
  senses: [{ meaningEn: "to work" }],
},
{
  lemma: "rīdeō",
  partOfSpeech: "verb",
  principalParts: "rīdeō, rīdēre, rīsī, rīsum",
  conjugation: "2",
  senses: [{ meaningEn: "to laugh, smile" }],
},
{
  lemma: "sedeō",
  partOfSpeech: "verb",
  principalParts: "sedeō, sedēre, sēdī, sessum",
  conjugation: "2",
  senses: [{ meaningEn: "to sit" }],
},
{
  lemma: "spectō",
  partOfSpeech: "verb",
  principalParts: "spectō, spectāre, spectāvī, spectātum",
  conjugation: "1",
  senses: [{ meaningEn: "to watch, look at" }],
},
{
  lemma: "videō",
  partOfSpeech: "verb",
  principalParts: "videō, vidēre, vīdī, vīsum",
  conjugation: "2",
  senses: [{ meaningEn: "to see" }],
},
{
  lemma: "vocō",
  partOfSpeech: "verb",
  principalParts: "vocō, vocāre, vocāvī, vocātum",
  conjugation: "1",
  senses: [{ meaningEn: "to call" }],
},
{
  lemma: "fīlia",
  partOfSpeech: "noun",
  principalParts: "fīliae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "daughter" }],
},
{
  lemma: "fīlius",
  partOfSpeech: "noun",
  principalParts: "fīliī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "son" }],
},
{
  lemma: "hortus",
  partOfSpeech: "noun",
  principalParts: "hortī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "garden" }],
},
{
  lemma: "māter",
  partOfSpeech: "noun",
  principalParts: "mātris",
  gender: "f",
  declension: "3",
  senses: [{ meaningEn: "mother" }],
},
{
  lemma: "pater",
  partOfSpeech: "noun",
  principalParts: "patris",
  gender: "m",
  declension: "3",
  senses: [{ meaningEn: "father" }],
},
{
  lemma: "puella",
  partOfSpeech: "noun",
  principalParts: "puellae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "girl" }],
},
{
  lemma: "rosa",
  partOfSpeech: "noun",
  principalParts: "rosae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "rose" }],
},
{
  lemma: "servus",
  partOfSpeech: "noun",
  principalParts: "servī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "slave" }],
},
{
  lemma: "et",
  partOfSpeech: "conjunction",
  senses: [{ meaningEn: "and" }],
},
{
  lemma: "nōn",
  partOfSpeech: "adverb",
  senses: [{ meaningEn: "not" }],
},
{
  lemma: "quoque",
  partOfSpeech: "adverb",
  senses: [{ meaningEn: "also" }],
},
{
  lemma: "sed",
  partOfSpeech: "conjunction",
  senses: [{ meaningEn: "but" }],
},
{
  lemma: "tum",
  partOfSpeech: "adverb",
  senses: [{ meaningEn: "then" }],
},
{
  lemma: "oppidum",
  partOfSpeech: "noun",
  principalParts: "oppidī",
  gender: "n",
  declension: "2",
  senses: [{ meaningEn: "town" }],
},
{
  lemma: "fluvius",
  partOfSpeech: "noun",
  principalParts: "fluviī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "river" }],
},
{
  lemma: "īnsula",
  partOfSpeech: "noun",
  principalParts: "īnsulae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "island" }],
},
{
  lemma: "imperium",
  partOfSpeech: "noun",
  principalParts: "imperiī",
  gender: "n",
  declension: "2",
  senses: [{ meaningEn: "empire" }],
},
{
  lemma: "vīlla",
  partOfSpeech: "noun",
  principalParts: "vīllae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "villa, country house" }],
},
{
  lemma: "via",
  partOfSpeech: "noun",
  principalParts: "viae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "road, street, path" }],
},
{
  lemma: "aqua",
  partOfSpeech: "noun",
  principalParts: "aquae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "water" }],
},
{
  lemma: "cēna",
  partOfSpeech: "noun",
  principalParts: "cēnae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "dinner, supper" }],
},
{
  lemma: "equus",
  partOfSpeech: "noun",
  principalParts: "equī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "horse" }],
},
{
  lemma: "amīcus",
  partOfSpeech: "noun",
  principalParts: "amīcī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "male friend" }],
},
{
  lemma: "portō",
  partOfSpeech: "verb",
  principalParts: "portō, portāre, portāvī, portātum",
  conjugation: "1",
  senses: [{ meaningEn: "to carry" }],
},
{
  lemma: "parō",
  partOfSpeech: "verb",
  principalParts: "parō, parāre, parāvī, parātum",
  conjugation: "1",
  senses: [{ meaningEn: "to prepare" }],
},
{
  lemma: "habitō",
  partOfSpeech: "verb",
  principalParts: "habitō, habitāre, habitāvī, habitātum",
  conjugation: "1",
  senses: [{ meaningEn: "to live in" }],
},
{
  lemma: "abacus",
  partOfSpeech: "noun",
  principalParts: "abacī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "abacus, counting board, square board" }],
},
{
  lemma: "littera",
  partOfSpeech: "noun",
  principalParts: "litterae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "letter (of the alphabet), letter, literature" }],
},
{
  lemma: "numerus",
  partOfSpeech: "noun",
  principalParts: "numerī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "number" }],
},
{
  lemma: "verbum",
  partOfSpeech: "noun",
  principalParts: "verbi",
  gender: "n",
  declension: "2",
  senses: [{ meaningEn: "word, verb (grammar)" }],
},
{
  lemma: "calculus",
  partOfSpeech: "noun",
  principalParts: "calculī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "pebble, stone, calculation" }],
},
{
  lemma: "ostendō",
  partOfSpeech: "verb",
  principalParts: "ostendō, ostendere, ostendī, ostentum",
  conjugation: "3",
  senses: [{ meaningEn: "to expose, exhibit, show" }],
},
{
  lemma: "fēlīciter",
  partOfSpeech: "adverb",
  senses: [{ meaningEn: "happily, favorably, fortunately" }],
},
{
  lemma: "fax",
  partOfSpeech: "noun",
  principalParts: "facis",
  gender: "f",
  declension: "3",
  senses: [{ meaningEn: "torch" }],
},
{
  lemma: "spērō",
  partOfSpeech: "verb",
  principalParts: "spērō, spērāre, spērāvī, spērātum",
  conjugation: "1",
  senses: [{ meaningEn: "to hope, expect, anticipate, assume" }],
},
{
  lemma: "dubitō",
  partOfSpeech: "verb",
  principalParts: "dubitō, dubitāre, dubitāvī, dubitātum",
  conjugation: "1",
  senses: [{ meaningEn: "to waver (in opinion), be uncertain, doubt, hesitate, ponder" }],
},
{
  lemma: "rogō",
  partOfSpeech: "verb",
  principalParts: "rogō, rogāre, rogāvī, rogātum",
  conjugation: "1",
  senses: [{ meaningEn: "to ask, enquire, request, beg" }],
},
{
  lemma: "superō",
  partOfSpeech: "verb",
  principalParts: "superō, superāre, superāvī, superātum",
  conjugation: "1",
  senses: [{ meaningEn: "to surmount, rise above, surpass, exceed, be superior, overcome" }],
},
{
  lemma: "tēlum",
  partOfSpeech: "noun",
  principalParts: "tēlī",
  gender: "n",
  declension: "2",
  senses: [{ meaningEn: "a spear, projectile weapon (javelin, arrow, etc.)" }],
},
{
  lemma: "auxilium",
  partOfSpeech: "noun",
  principalParts: "auxiliī",
  gender: "n",
  declension: "2",
  senses: [
    { meaningEn: "help, aid, assistance" },
    { meaningEn: "remedy, antidote", usage: "medical" },
  ],
},
{
  lemma: "mūrus",
  partOfSpeech: "noun",
  principalParts: "mūrī",
  gender: "m",
  declension: "2",
  senses: [{ meaningEn: "wall, city wall(s)" }],
},
{
  lemma: "fabula",
  partOfSpeech: "noun",
  principalParts: "fabulae",
  gender: "f",
  declension: "1",
  senses: [{ meaningEn: "story, tale, discourse, narrative" }],
}]

await db
  .insert(entries)
  .values(
    words.map(({ senses: _senses, ...columns }) => ({
      ...columns,
      lemmaPlain: normalizeLemma(columns.lemma),
    })),
  )
  // The seed is what a word IS, so a re-run has to overwrite the row it finds.
  // excluded.* is the row this statement tried to insert, which keeps a column
  // the seed cleared out from surviving as its old value. notes is left alone:
  // the seed does not carry it, so it is the database's to keep.
  .onConflictDoUpdate({
    target: [entries.lemma],
    set: {
      lemmaPlain: sql`excluded.lemma_plain`,
      partOfSpeech: sql`excluded.part_of_speech`,
      principalParts: sql`excluded.principal_parts`,
      gender: sql`excluded.gender`,
      declension: sql`excluded.declension`,
      conjugation: sql`excluded.conjugation`,
    },
  });

// Read the ids back rather than using returning(): returning() reports only the
// rows this statement touched, and reading by lemma covers every seeded word.
const rows = await db
  .select({ id: entries.id, lemma: entries.lemma })
  .from(entries)
  .where(
    inArray(
      entries.lemma,
      words.map((w) => w.lemma),
    ),
  );

const idByLemma = new Map(rows.map((r) => [r.lemma, r.id]));

function entryIdFor(lemma: string) {
  const id = idByLemma.get(lemma);

  if (id === undefined) {
    throw new Error(`seed: no entries row for "${lemma}" after insert`);
  }

  return id;
}

await db
  .insert(senses)
  .values(
    words.flatMap((w) =>
      w.senses.map((sense, i) => ({
        ...sense,
        entryId: entryIdFor(w.lemma),
        rank: i + 1,
      })),
    ),
  )
  // Same as above, and it matters more here: (entry_id, rank) is unique, so
  // every re-seed collides on rank 1 of every word. Skipping the collision
  // would freeze each entry's core meaning at whatever text it was first
  // written with, and quietly ignore every edit made to it afterwards.
  .onConflictDoUpdate({
    target: [senses.entryId, senses.rank],
    set: {
      meaningEn: sql`excluded.meaning_en`,
      usage: sql`excluded."usage"`,
      exampleLa: sql`excluded.example_la`,
      exampleEn: sql`excluded.example_en`,
    },
  });

// Upserting only ever writes the ranks the seed still lists. A word that loses
// a sense keeps the dropped meaning at its old rank unless it is deleted here.
const pruned = await db
  .delete(senses)
  .where(
    or(
      ...words.map((w) =>
        and(
          eq(senses.entryId, entryIdFor(w.lemma)),
          gt(senses.rank, w.senses.length),
        ),
      ),
    ),
  );

console.log(
  `Seeded ${words.length} lemmas, ${words.reduce((n, w) => n + w.senses.length, 0)} senses` +
    (pruned.changes > 0 ? `, pruned ${pruned.changes} stale.` : "."),
);
