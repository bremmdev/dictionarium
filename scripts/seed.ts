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
  notes?: string;
  /**
   * Position is the rank: the first sense is the core meaning. Typed non-empty
   * because an entry without a meaning is not an entry.
   */
  senses: [SeedSense, ...Array<SeedSense>];
};

const words: Array<SeedWord> = [{
  lemma: "soror",
  partOfSpeech: "noun",
  principalParts: "sorōris",
  gender: "f",
  declension: "3",
  senses: [
    { meaningEn: "sister" },
    { meaningEn: "cousin, daughter of either a father's brother or of a mother's sister" },
    { meaningEn: "female friend" },
    { meaningEn: "sister, nun", usage: "christianity" },
  ],
},
{
  lemma: "deus",
  partOfSpeech: "noun",
  principalParts: "deī",
  gender: "m",
  declension: "2",
  senses: [
    { meaningEn: "god, deity" },
  ],
},
{
  lemma: "sed",
  partOfSpeech: "conjunction",
  senses: [
    { meaningEn: "but" },
  ],
},
{
  lemma: "māter",
  partOfSpeech: "noun",
  principalParts: "mātris",
  gender: "f",
  declension: "3",
  senses: [
    { meaningEn: "mother" },
    { meaningEn: "matron of a house" },
    { meaningEn: "woman" },
    { meaningEn: "nurse" },
    { meaningEn: "motherland" },
    { meaningEn: "maternity, motherhood" },
  ],
},
{
  lemma: "uxor",
  partOfSpeech: "noun",
  principalParts: "uxōris",
  gender: "f",
  declension: "3",
  senses: [
    { meaningEn: "a wife, a spouse, a consort" },
  ],
},
{
  lemma: "dea",
  partOfSpeech: "noun",
  principalParts: "deae",
  gender: "f",
  declension: "1",
  senses: [
    { meaningEn: "goddess" },
  ],
},
{
  lemma: "rēgīna",
  partOfSpeech: "noun",
  principalParts: "rēgīnae",
  gender: "f",
  declension: "1",
  senses: [
    { meaningEn: "queen" },
    { meaningEn: "princess" },
  ],
},
{
  lemma: "fīlius",
  partOfSpeech: "noun",
  principalParts: "fīliī",
  gender: "m",
  declension: "2",
  senses: [
    { meaningEn: "a son" },
    { meaningEn: "any male descendant" },
    { meaningEn: "children" },
  ],
},
{
  lemma: "fīlia",
  partOfSpeech: "noun",
  principalParts: "fīliae",
  gender: "f",
  declension: "1",
  senses: [
    { meaningEn: "daughter" },
    { meaningEn: "any female offspring" },
  ],
},
{
  lemma: "nōn",
  partOfSpeech: "particle",
  senses: [
    { meaningEn: "not" },
  ],
},
{
  lemma: "quoque",
  partOfSpeech: "adverb",
  senses: [{ meaningEn: "also, likewise, besides, too" }, { meaningEn: "not only" }, { meaningEn: "even, actually" }],
},
{
  lemma: "pater",
  partOfSpeech: "noun",
  principalParts: "patris",
  gender: "m",
  declension: "3",
  senses: [{ meaningEn: "father" }, { meaningEn: "head of household" }, { meaningEn: "parent" }, { meaningEn: "forefather" }, { meaningEn: "priest" }],
},
{
  lemma: "et",
  partOfSpeech: "conjunction",
  senses: [{ meaningEn: "and" }, { meaningEn: "both" }, { meaningEn: "plus", usage: "mathematics", exampleLa: "Duo et duo sunt quattuor", exampleEn: "Two plus two equals four" }],
},
{
  lemma: "sedeō",
  partOfSpeech: "verb",
  principalParts: "sedeō, sedēre, sēdī, sessum",
  conjugation: "2",
  notes: "impersonal in the passive",
  senses: [
    { meaningEn: "to sit, to be seated" },
    { meaningEn: "to sit in an official seat; sit in council or court, hold court, preside" },
    { meaningEn: "to keep the field, remain encamped" },
    { meaningEn: "to settle or sink down, subside" },
    { meaningEn: "to sit still; remain, linger, loiter; sit around" },
  ],
},
{
  lemma: "rēgnō",
  partOfSpeech: "verb",
  principalParts: "rēgnō, rēgnāre, rēgnāvī, rēgnātum",
  conjugation: "1",
  senses: [
    { meaningEn: "to reign, rule" },
    { meaningEn: "to be lord, govern" },
    { meaningEn: "to tyrannize" },
  ],
},
{
  lemma: "templum",
  partOfSpeech: "noun",
  principalParts: "templī",
  gender: "n",
  declension: "2",
  senses: [
    { meaningEn: "temple, sanctuary, shrine" },
  ],
},
{
  lemma: "bellum",
  partOfSpeech: "noun",
  principalParts: "bellī",
  gender: "n",
  declension: "2",
  senses: [
    { meaningEn: "war", exampleLa: "Dulce bellum inexpertīs.", exampleEn: "War is sweet to those who have never experienced it." },
  ],
},
{
  lemma: "habeō",
  partOfSpeech: "verb",
  principalParts: "habeō, habēre, habuī, habitum",
  conjugation: "2",
  senses: [
    { meaningEn: "to have, hold" },
    { meaningEn: "to own" },
    { meaningEn: "to retain, maintain" },
    { meaningEn: "to regard, consider or account a person or thing as something" },
  ],
},
{
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
  senses: [
    { meaningEn: "to love" },
    { meaningEn: "to be fond of, like, admire" },
    { meaningEn: "to be pleased by or with (someone or something) for (a particular reason)" },
    { meaningEn: "to be thankful, grateful to, feel obliged for a service" },
    { meaningEn: "to make love" },
  ],
},
{
  lemma: "populus",
  partOfSpeech: "noun",
  principalParts: "populī",
  gender: "m",
  declension: "2",
  senses: [
    { meaningEn: "a people, nation" },
    { meaningEn: "a parish, part of a city", usage: "medieval latin" },
  ],
},
{
  lemma: "saepe",
  partOfSpeech: "adverb",
  senses: [
    { meaningEn: "often, frequently" },
  ],
},
{
  lemma: "servō",
  partOfSpeech: "verb",
  principalParts: "servō, servāre, servāvī, servātum",
  conjugation: "1",
  senses: [
    { meaningEn: "to maintain, keep" },
    { meaningEn: "to protect, save, keep, guard, safeguard, watch over" },
    { meaningEn: "to pay attention to" },
    { meaningEn: "to save, rescue" },
  ],
},
{
  lemma: "timeō",
  partOfSpeech: "verb",
  principalParts: "timeō, timēre, timuī",
  conjugation: "2",
  notes: "no supine",
  senses: [
    { meaningEn: "to fear, be afraid of" }
  ],
},
{
  lemma: "mittō",
  partOfSpeech: "verb",
  principalParts: "mittō, mittere, mīsī, missum",
  conjugation: "3",
  senses: [
    { meaningEn: "to send, dispatch, let go, release, discharge" },
    { meaningEn: "to put out, extend, reach out" },
    { meaningEn: "to announce, tell, report, send word, advise" },
    { meaningEn: "to let or bring out, put or send forth, emit, speak, say" },
    { meaningEn: "to throw, cast, launch" },
    { meaningEn: "to attend, guide, escort" },
  ],
},
{
  lemma: "nam",
  partOfSpeech: "conjunction",
  senses: [
    { meaningEn: "for" },
    { meaningEn: "since" },
    { meaningEn: "thus" },
    { meaningEn: "because" },
    { meaningEn: "actually" },
  ],
},
{
  lemma: "relinquō",
  partOfSpeech: "verb",
  principalParts: "relinquō, relinquere, relīquī, relictum",
  conjugation: "3",
  senses: [
    { meaningEn: "to abandon, forsake, desert" },
    { meaningEn: "to relinquish, leave" },
    { meaningEn: "to depart" },
    { meaningEn: "to give up" },
  ],
},
{
  lemma: "semper",
  partOfSpeech: "adverb",
  notes: "not comparable",
  senses: [
    { meaningEn: "always, ever, forever, at all times", exampleLa: "Spero ut pacem semper habeant.", exampleEn: "I hope that they always have peace." },
  ],
},
{
  lemma: "dēfendō",
  partOfSpeech: "verb",
  principalParts: "dēfendō, dēfendere, dēfendī, dēfēnsum",
  conjugation: "3",
  senses: [
    { meaningEn: "to defend, guard or protect" },
    { meaningEn: "to drive away" },
  ],
},
{
  lemma: "perveniō",
  partOfSpeech: "verb",
  principalParts: "perveniō, pervenīre, pervēnī, perventum",
  conjugation: "4",
  notes: "impersonal in the passive",
  senses: [
    { meaningEn: "to come, arrive" },
    { meaningEn: "to reach, attain, come to" },
  ],
},
{
  lemma: "cūrō",
  partOfSpeech: "verb",
  principalParts: "cūrō, cūrāre, cūrāvī, cūrātum",
  conjugation: "1",
  senses: [
    { meaningEn: "to arrange, see to, attend to, take care of, look after" },
    { meaningEn: "to heal, cure" },
    { meaningEn: "to govern, command, preside over" },
    { meaningEn: "to undertake, procure" },
  ],
},
{
  lemma: "ignis",
  partOfSpeech: "noun",
  principalParts: "ignis",
  gender: "m",
  declension: "3",
  senses: [
    { meaningEn: "fire" },
  ],
},
{
  lemma: "amor",
  partOfSpeech: "noun",
  principalParts: "amōris",
  gender: "m",
  declension: "3",
  senses: [
    { meaningEn: "love, affection, devotion" },
    { meaningEn: "strong and passionate longing for something, desire, lust" },
    { meaningEn: "beloved, loved person" },
    { meaningEn: "sex" },
    { meaningEn: "love affair", usage: "plural only" },
  ],
},
{
  lemma: "habitō",
  partOfSpeech: "verb",
  principalParts: "habitō, habitāre, habitāvī, habitātum",
  conjugation: "1",
  senses: [
    { meaningEn: "to reside, inhabit, remain, dwell, live" },
    { meaningEn: "to linger", usage: "figuratively" },
  ],
},
{
  lemma: "urbs",
  partOfSpeech: "noun",
  principalParts: "urbis",
  gender: "f",
  declension: "3",
  senses: [
    { meaningEn: "a city, walled town" },
    { meaningEn: "the City, Rome" },
  ],
},
{
  lemma: "vincō",
  partOfSpeech: "verb",
  principalParts: "vincō, vincere, vīcī, victum",
  conjugation: "3",
  senses: [
    { meaningEn: "to win" },
    { meaningEn: "to conquer, to defeat, to vanquish" },
  ],
},
{
  lemma: "scrībō",
  partOfSpeech: "verb",
  principalParts: "scrībō, scrībere, scrīpsī, scrīptum",
  conjugation: "3",
  senses: [
    { meaningEn: "to write" },
  ],
},
{
  lemma: "stilus",
  partOfSpeech: "noun",
  principalParts: "stilī",
  gender: "m",
  declension: "2",
  senses: [
    { meaningEn: "a stake, pale, spike", usage: "in general" },
    { meaningEn: "a stylus or pencil used for writing on waxen tablets", usage: "in particular" },
  ],
},
{
  lemma: "cum",
  partOfSpeech: "preposition",
  notes: "takes the ablative",
  senses: [
    { meaningEn: "with, along with", exampleLa: "magnā cum laude", exampleEn: "With great praise" },
    { meaningEn: "at (denoting a point in time)", exampleLa: "cum prīmā lūce vēnērunt", exampleEn: "they arrived at the first light" },
  ],
},
{
  lemma: "silva",
  partOfSpeech: "noun",
  principalParts: "silvae",
  gender: "f",
  declension: "1",
  senses: [
    { meaningEn: "wood; forest" },
    { meaningEn: "orchard; grove" },
  ],
},
{
  lemma: "tabula",
  partOfSpeech: "noun",
  principalParts: "tabulae",
  gender: "f",
  declension: "1",
  senses: [
    { meaningEn: "tablet, sometimes a tablet covered with wax for writing" },
    { meaningEn: "board or plank" },
  ],
},
{
  lemma: "ex",
  partOfSpeech: "preposition",
  notes: "takes the ablative. Alternative form: ē. ē and ex are chosen for sound alone: ē silvā but ex hortō.",
  senses: [
    { meaningEn: "out of, from", usage: "expressing elativity" },
    { meaningEn: "out of, out from, of, among", usage: "indicates part of a multitude", exampleLa: "Ex omnibus rēbus, ācerrimī bellō Rōmānī sunt.", exampleEn: "Out of all peoples, Romans are the fiercest warriors." },
    { meaningEn: "from", usage: "expressing distance" },
    { meaningEn: "since, from", usage: "temporal uses" },
    { meaningEn: "by, through, with the help of", exampleLa: "Ex īnsidiīs", exampleEn: "Through trickery" },
  ],
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
},
{
  lemma: 'septem',
  partOfSpeech: 'numeral',
  declension: 'indeclinable',
  senses: [{ meaningEn: 'seven' }],
},
{
  lemma: "valeō",
  partOfSpeech: "verb",
  principalParts: "valeō, valēre, valuī, valitum",
  conjugation: "2",
  senses: [
    { meaningEn: "to have strength, influence, power" },
    { meaningEn: "to be well, healthy, sound" },
    { meaningEn: "be worthy" },
  ],
},
{
  lemma: "salveō",
  partOfSpeech: "verb",
  principalParts: "salveō, salvēre",
  conjugation: "2",
  notes: "no passive",
  senses: [
    { meaningEn: "to be well, healthy" },
    { meaningEn: "hail! hello! cheers! farewell!", usage: "imperative" },
  ],
},
{
  lemma: "taceō",
  partOfSpeech: "verb",
  principalParts: "taceō, tacēre, tacuī, tacitum",
  conjugation: "2",
  senses: [
    { meaningEn: "to be silent, say nothing" },
    { meaningEn: "to be still or at rest" },
  ],
},
{
  lemma: "sententia",
  partOfSpeech: "noun",
  principalParts: "sententiae",
  gender: "f",
  declension: "1",
  senses: [
    { meaningEn: "a way of thinking, view, opinion, judgement or sentence" },
    { meaningEn: "a purpose, intention, will" },
    { meaningEn: "a vote of opinion", usage: "politics" },
    { meaningEn: "an authoritative decision, pronouncement, judgement, decree", usage: "politics" },
    { meaningEn: "a feeling, sense, idea, notion" },
  ],
},
{
  lemma: "veniō",
  partOfSpeech: "verb",
  principalParts: "veniō, venīre, vēnī, ventum",
  conjugation: "4",
  notes: "impersonal in the passive",
  senses: [
    { meaningEn: "to come (to a place), come in, arrive, reach" },
    { meaningEn: "to approach" },
  ],
},]

await db
  .insert(entries)
  .values(
    words.map(({ senses: _senses, ...columns }) => ({
      ...columns,
      lemmaPlain: normalizeLemma(columns.lemma),
    })),
  )
  // The seed is what a word IS, so a re-run has to overwrite the row it finds.
  // excluded.* is the row this statement tried to insert, which stops a column
  // the seed has cleared from surviving as its old value.
  .onConflictDoUpdate({
    target: [entries.lemma],
    set: {
      lemmaPlain: sql`excluded.lemma_plain`,
      partOfSpeech: sql`excluded.part_of_speech`,
      principalParts: sql`excluded.principal_parts`,
      gender: sql`excluded.gender`,
      declension: sql`excluded.declension`,
      conjugation: sql`excluded.conjugation`,
      notes: sql`excluded.notes`,
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
