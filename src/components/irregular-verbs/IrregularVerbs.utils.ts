// Data only, like Conjugations.utils.ts: the prose about each verb lives in
// IrregularVerbs.tsx, where it can carry lang="la".
//
// There is no base + ending to rebuild the present system from, so
// scripts/check-conjugations.ts checks only the perfect system, against
// PERFECT_ENDINGS. A perfect-system form that does not follow it is marked
// irregular.

import type { VerbParadigm } from "#/components/conjugations/Conjugations.utils";

export type Compound = {
	principalParts: string;
	english: string;
};

export type IrregularVerb = VerbParadigm & {
	/** The section's anchor, the lemma without macrons: /grammar/irregular-verbs#sum. */
	id: string;
	compounds?: Compound[];
};

const SUM: IrregularVerb = {
	id: "sum",
	principalParts: ["sum", "esse", "fuī", "futūrus"],
	english: "be",
	perfectStem: "fu",
	indicative: {
		active: {
			present: {
				"1sg": { form: "sum" },
				"2sg": { form: "es" },
				"3sg": { form: "est" },
				"1pl": { form: "sumus" },
				"2pl": { form: "estis" },
				"3pl": { form: "sunt" },
			},
			imperfect: {
				"1sg": { form: "eram" },
				"2sg": { form: "erās" },
				"3sg": { form: "erat" },
				"1pl": { form: "erāmus" },
				"2pl": { form: "erātis" },
				"3pl": { form: "erant" },
			},
			future: {
				"1sg": { form: "erō" },
				"2sg": { form: "eris" },
				"3sg": { form: "erit" },
				"1pl": { form: "erimus" },
				"2pl": { form: "eritis" },
				"3pl": { form: "erunt" },
			},
			perfect: {
				"1sg": { form: "fuī" },
				"2sg": { form: "fuistī" },
				"3sg": { form: "fuit" },
				"1pl": { form: "fuimus" },
				"2pl": { form: "fuistis" },
				"3pl": { form: "fuērunt", alt: "fuēre" },
			},
			pluperfect: {
				"1sg": { form: "fueram" },
				"2sg": { form: "fuerās" },
				"3sg": { form: "fuerat" },
				"1pl": { form: "fuerāmus" },
				"2pl": { form: "fuerātis" },
				"3pl": { form: "fuerant" },
			},
			futurePerfect: {
				"1sg": { form: "fuerō" },
				"2sg": { form: "fueris" },
				"3sg": { form: "fuerit" },
				"1pl": { form: "fuerimus" },
				"2pl": { form: "fueritis" },
				"3pl": { form: "fuerint" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "sim" },
				"2sg": { form: "sīs" },
				"3sg": { form: "sit" },
				"1pl": { form: "sīmus" },
				"2pl": { form: "sītis" },
				"3pl": { form: "sint" },
			},
			imperfect: {
				"1sg": { form: "essem" },
				"2sg": { form: "essēs" },
				"3sg": { form: "esset" },
				"1pl": { form: "essēmus" },
				"2pl": { form: "essētis" },
				"3pl": { form: "essent" },
			},
			perfect: {
				"1sg": { form: "fuerim" },
				"2sg": { form: "fuerīs" },
				"3sg": { form: "fuerit" },
				"1pl": { form: "fuerīmus" },
				"2pl": { form: "fuerītis" },
				"3pl": { form: "fuerint" },
			},
			pluperfect: {
				"1sg": { form: "fuissem" },
				"2sg": { form: "fuissēs" },
				"3sg": { form: "fuisset" },
				"1pl": { form: "fuissēmus" },
				"2pl": { form: "fuissētis" },
				"3pl": { form: "fuissent" },
			},
		},
	},
	// possum is a compound too, but gets its own section.
	cetera: {
		imperative: {
			active: {
				present: { "2sg": { form: "es" }, "2pl": { form: "este" } },
				future: {
					"2sg": { form: "estō" },
					"3sg": { form: "estō" },
					"2pl": { form: "estōte" },
					"3pl": { form: "suntō" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "esse" } },
			perfect: { active: { form: "fuisse" } },
			future: { active: { form: "futūrus esse", alt: "fore" } },
		},
		participle: { future: { form: "futūrus, futūra, futūrum" } },
	},
	compounds: [
		{
			principalParts: "absum, abesse, āfuī, āfutūrus",
			english: "be away, be absent",
		},
		{
			principalParts: "adsum, adesse, adfuī, adfutūrus",
			english: "be here, be present",
		},
		{
			principalParts: "dēsum, dēesse, dēfuī, dēfutūrus",
			english: "be missing, fail",
		},
		{
			principalParts: "intersum, interesse, interfuī, interfutūrus",
			english: "be between, take part in",
		},
		{
			principalParts: "obsum, obesse, obfuī, obfutūrus",
			english: "be in the way, harm",
		},
		{
			principalParts: "praesum, praeesse, praefuī, praefutūrus",
			english: "be in charge of",
		},
		{
			principalParts: "prōsum, prōdesse, prōfuī, prōfutūrus",
			english: "be useful, benefit",
		},
		{
			principalParts: "supersum, superesse, superfuī, superfutūrus",
			english: "be left over, survive",
		},
	],
};

const POSSUM: IrregularVerb = {
	id: "possum",
	principalParts: ["possum", "posse", "potuī"],
	english: "be able",
	perfectStem: "potu",
	indicative: {
		active: {
			present: {
				"1sg": { form: "possum" },
				"2sg": { form: "potes" },
				"3sg": { form: "potest" },
				"1pl": { form: "possumus" },
				"2pl": { form: "potestis" },
				"3pl": { form: "possunt" },
			},
			imperfect: {
				"1sg": { form: "poteram" },
				"2sg": { form: "poterās" },
				"3sg": { form: "poterat" },
				"1pl": { form: "poterāmus" },
				"2pl": { form: "poterātis" },
				"3pl": { form: "poterant" },
			},
			future: {
				"1sg": { form: "poterō" },
				"2sg": { form: "poteris" },
				"3sg": { form: "poterit" },
				"1pl": { form: "poterimus" },
				"2pl": { form: "poteritis" },
				"3pl": { form: "poterunt" },
			},
			perfect: {
				"1sg": { form: "potuī" },
				"2sg": { form: "potuistī" },
				"3sg": { form: "potuit" },
				"1pl": { form: "potuimus" },
				"2pl": { form: "potuistis" },
				"3pl": { form: "potuērunt", alt: "potuēre" },
			},
			pluperfect: {
				"1sg": { form: "potueram" },
				"2sg": { form: "potuerās" },
				"3sg": { form: "potuerat" },
				"1pl": { form: "potuerāmus" },
				"2pl": { form: "potuerātis" },
				"3pl": { form: "potuerant" },
			},
			futurePerfect: {
				"1sg": { form: "potuerō" },
				"2sg": { form: "potueris" },
				"3sg": { form: "potuerit" },
				"1pl": { form: "potuerimus" },
				"2pl": { form: "potueritis" },
				"3pl": { form: "potuerint" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "possim" },
				"2sg": { form: "possīs" },
				"3sg": { form: "possit" },
				"1pl": { form: "possīmus" },
				"2pl": { form: "possītis" },
				"3pl": { form: "possint" },
			},
			imperfect: {
				"1sg": { form: "possem" },
				"2sg": { form: "possēs" },
				"3sg": { form: "posset" },
				"1pl": { form: "possēmus" },
				"2pl": { form: "possētis" },
				"3pl": { form: "possent" },
			},
			perfect: {
				"1sg": { form: "potuerim" },
				"2sg": { form: "potuerīs" },
				"3sg": { form: "potuerit" },
				"1pl": { form: "potuerīmus" },
				"2pl": { form: "potuerītis" },
				"3pl": { form: "potuerint" },
			},
			pluperfect: {
				"1sg": { form: "potuissem" },
				"2sg": { form: "potuissēs" },
				"3sg": { form: "potuisset" },
				"1pl": { form: "potuissēmus" },
				"2pl": { form: "potuissētis" },
				"3pl": { form: "potuissent" },
			},
		},
	},
	cetera: {
		imperative: {},
		infinitive: {
			present: { active: { form: "posse" } },
			perfect: { active: { form: "potuisse" } },
		},
		participle: { present: { form: "potēns, potentis" } },
	},
};

const EO: IrregularVerb = {
	id: "eo",
	principalParts: ["eō", "īre", "iī", "itum"],
	english: "go",
	perfectStem: "i",
	indicative: {
		active: {
			present: {
				"1sg": { form: "eō" },
				"2sg": { form: "īs" },
				"3sg": { form: "it" },
				"1pl": { form: "īmus" },
				"2pl": { form: "ītis" },
				"3pl": { form: "eunt" },
			},
			imperfect: {
				"1sg": { form: "ībam" },
				"2sg": { form: "ībās" },
				"3sg": { form: "ībat" },
				"1pl": { form: "ībāmus" },
				"2pl": { form: "ībātis" },
				"3pl": { form: "ībant" },
			},
			future: {
				"1sg": { form: "ībō" },
				"2sg": { form: "ībis" },
				"3sg": { form: "ībit" },
				"1pl": { form: "ībimus" },
				"2pl": { form: "ībitis" },
				"3pl": { form: "ībunt" },
			},
			// ii + s contracts to ī (A&G §203.c).
			perfect: {
				"1sg": { form: "iī" },
				"2sg": { form: "īstī", alt: "iistī", irregular: true },
				"3sg": { form: "iit" },
				"1pl": { form: "iimus" },
				"2pl": { form: "īstis", alt: "iistis", irregular: true },
				"3pl": { form: "iērunt", alt: "iēre" },
			},
			pluperfect: {
				"1sg": { form: "ieram" },
				"2sg": { form: "ierās" },
				"3sg": { form: "ierat" },
				"1pl": { form: "ierāmus" },
				"2pl": { form: "ierātis" },
				"3pl": { form: "ierant" },
			},
			futurePerfect: {
				"1sg": { form: "ierō" },
				"2sg": { form: "ieris" },
				"3sg": { form: "ierit" },
				"1pl": { form: "ierimus" },
				"2pl": { form: "ieritis" },
				"3pl": { form: "ierint" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "eam" },
				"2sg": { form: "eās" },
				"3sg": { form: "eat" },
				"1pl": { form: "eāmus" },
				"2pl": { form: "eātis" },
				"3pl": { form: "eant" },
			},
			imperfect: {
				"1sg": { form: "īrem" },
				"2sg": { form: "īrēs" },
				"3sg": { form: "īret" },
				"1pl": { form: "īrēmus" },
				"2pl": { form: "īrētis" },
				"3pl": { form: "īrent" },
			},
			perfect: {
				"1sg": { form: "ierim" },
				"2sg": { form: "ierīs" },
				"3sg": { form: "ierit" },
				"1pl": { form: "ierīmus" },
				"2pl": { form: "ierītis" },
				"3pl": { form: "ierint" },
			},
			pluperfect: {
				"1sg": { form: "īssem", alt: "iissem", irregular: true },
				"2sg": { form: "īssēs", alt: "iissēs", irregular: true },
				"3sg": { form: "īsset", alt: "iisset", irregular: true },
				"1pl": { form: "īssēmus", alt: "iissēmus", irregular: true },
				"2pl": { form: "īssētis", alt: "iissētis", irregular: true },
				"3pl": { form: "īssent", alt: "iissent", irregular: true },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: { "2sg": { form: "ī" }, "2pl": { form: "īte" } },
				future: {
					"2sg": { form: "ītō" },
					"3sg": { form: "ītō" },
					"2pl": { form: "ītōte" },
					"3pl": { form: "euntō" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "īre" }, passive: { form: "īrī" } },
			perfect: { active: { form: "īsse", alt: "iisse" } },
			future: { active: { form: "itūrus esse" } },
		},
		participle: {
			present: { form: "iēns, euntis" },
			future: { form: "itūrus, itūra, itūrum" },
		},
		gerund: {
			genitive: { form: "eundī" },
			dative: { form: "eundō" },
			accusative: { form: "eundum" },
			ablative: { form: "eundō" },
		},
		supine: { accusative: { form: "itum" }, ablative: { form: "itū" } },
	},
	compounds: [
		{
			principalParts: "abeō, abīre, abiī, abitum",
			english: "go away",
		},
		{
			principalParts: "adeō, adīre, adiī, aditum",
			english: "go to, approach",
		},
		{
			principalParts: "exeō, exīre, exiī, exitum",
			english: "go out, leave",
		},
		{
			principalParts: "ineō, inīre, iniī, initum",
			english: "go into, begin",
		},
		{
			principalParts: "obeō, obīre, obiī, obitum",
			english: "go to meet, meet (death)",
		},
		{
			principalParts: "pereō, perīre, periī, peritum",
			english: "perish, be lost",
		},
		{
			principalParts: "praetereō, praeterīre, praeteriī, praeteritum",
			english: "go past, pass over",
		},
		{
			principalParts: "prōdeō, prōdīre, prōdiī, prōditum",
			english: "come forth, advance",
		},
		{
			principalParts: "redeō, redīre, rediī, reditum",
			english: "go back, return",
		},
		{
			principalParts: "subeō, subīre, subiī, subitum",
			english: "go under, undergo",
		},
		{
			principalParts: "trānseō, trānsīre, trānsiī, trānsitum",
			english: "go across, cross",
		},
	],
};

const FERO: IrregularVerb = {
	id: "fero",
	principalParts: ["ferō", "ferre", "tulī", "lātum"],
	english: "carry",
	perfectStem: "tul",
	indicative: {
		active: {
			present: {
				"1sg": { form: "ferō" },
				"2sg": { form: "fers" },
				"3sg": { form: "fert" },
				"1pl": { form: "ferimus" },
				"2pl": { form: "fertis" },
				"3pl": { form: "ferunt" },
			},
			imperfect: {
				"1sg": { form: "ferēbam" },
				"2sg": { form: "ferēbās" },
				"3sg": { form: "ferēbat" },
				"1pl": { form: "ferēbāmus" },
				"2pl": { form: "ferēbātis" },
				"3pl": { form: "ferēbant" },
			},
			future: {
				"1sg": { form: "feram" },
				"2sg": { form: "ferēs" },
				"3sg": { form: "feret" },
				"1pl": { form: "ferēmus" },
				"2pl": { form: "ferētis" },
				"3pl": { form: "ferent" },
			},
			perfect: {
				"1sg": { form: "tulī" },
				"2sg": { form: "tulistī" },
				"3sg": { form: "tulit" },
				"1pl": { form: "tulimus" },
				"2pl": { form: "tulistis" },
				"3pl": { form: "tulērunt", alt: "tulēre" },
			},
			pluperfect: {
				"1sg": { form: "tuleram" },
				"2sg": { form: "tulerās" },
				"3sg": { form: "tulerat" },
				"1pl": { form: "tulerāmus" },
				"2pl": { form: "tulerātis" },
				"3pl": { form: "tulerant" },
			},
			futurePerfect: {
				"1sg": { form: "tulerō" },
				"2sg": { form: "tuleris" },
				"3sg": { form: "tulerit" },
				"1pl": { form: "tulerimus" },
				"2pl": { form: "tuleritis" },
				"3pl": { form: "tulerint" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "feror" },
				"2sg": { form: "ferris", alt: "ferre" },
				"3sg": { form: "fertur" },
				"1pl": { form: "ferimur" },
				"2pl": { form: "feriminī" },
				"3pl": { form: "feruntur" },
			},
			imperfect: {
				"1sg": { form: "ferēbar" },
				"2sg": { form: "ferēbāris", alt: "ferēbāre" },
				"3sg": { form: "ferēbātur" },
				"1pl": { form: "ferēbāmur" },
				"2pl": { form: "ferēbāminī" },
				"3pl": { form: "ferēbantur" },
			},
			future: {
				"1sg": { form: "ferar" },
				"2sg": { form: "ferēris", alt: "ferēre" },
				"3sg": { form: "ferētur" },
				"1pl": { form: "ferēmur" },
				"2pl": { form: "ferēminī" },
				"3pl": { form: "ferentur" },
			},
			perfect: {
				"1sg": { form: "lātus sum" },
				"2sg": { form: "lātus es" },
				"3sg": { form: "lātus est" },
				"1pl": { form: "lātī sumus" },
				"2pl": { form: "lātī estis" },
				"3pl": { form: "lātī sunt" },
			},
			pluperfect: {
				"1sg": { form: "lātus eram" },
				"2sg": { form: "lātus erās" },
				"3sg": { form: "lātus erat" },
				"1pl": { form: "lātī erāmus" },
				"2pl": { form: "lātī erātis" },
				"3pl": { form: "lātī erant" },
			},
			futurePerfect: {
				"1sg": { form: "lātus erō" },
				"2sg": { form: "lātus eris" },
				"3sg": { form: "lātus erit" },
				"1pl": { form: "lātī erimus" },
				"2pl": { form: "lātī eritis" },
				"3pl": { form: "lātī erunt" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "feram" },
				"2sg": { form: "ferās" },
				"3sg": { form: "ferat" },
				"1pl": { form: "ferāmus" },
				"2pl": { form: "ferātis" },
				"3pl": { form: "ferant" },
			},
			imperfect: {
				"1sg": { form: "ferrem" },
				"2sg": { form: "ferrēs" },
				"3sg": { form: "ferret" },
				"1pl": { form: "ferrēmus" },
				"2pl": { form: "ferrētis" },
				"3pl": { form: "ferrent" },
			},
			perfect: {
				"1sg": { form: "tulerim" },
				"2sg": { form: "tulerīs" },
				"3sg": { form: "tulerit" },
				"1pl": { form: "tulerīmus" },
				"2pl": { form: "tulerītis" },
				"3pl": { form: "tulerint" },
			},
			pluperfect: {
				"1sg": { form: "tulissem" },
				"2sg": { form: "tulissēs" },
				"3sg": { form: "tulisset" },
				"1pl": { form: "tulissēmus" },
				"2pl": { form: "tulissētis" },
				"3pl": { form: "tulissent" },
			},
		},
		passive: {
			present: {
				"1sg": { form: "ferar" },
				"2sg": { form: "ferāris", alt: "ferāre" },
				"3sg": { form: "ferātur" },
				"1pl": { form: "ferāmur" },
				"2pl": { form: "ferāminī" },
				"3pl": { form: "ferantur" },
			},
			imperfect: {
				"1sg": { form: "ferrer" },
				"2sg": { form: "ferrēris", alt: "ferrēre" },
				"3sg": { form: "ferrētur" },
				"1pl": { form: "ferrēmur" },
				"2pl": { form: "ferrēminī" },
				"3pl": { form: "ferrentur" },
			},
			perfect: {
				"1sg": { form: "lātus sim" },
				"2sg": { form: "lātus sīs" },
				"3sg": { form: "lātus sit" },
				"1pl": { form: "lātī sīmus" },
				"2pl": { form: "lātī sītis" },
				"3pl": { form: "lātī sint" },
			},
			pluperfect: {
				"1sg": { form: "lātus essem" },
				"2sg": { form: "lātus essēs" },
				"3sg": { form: "lātus esset" },
				"1pl": { form: "lātī essēmus" },
				"2pl": { form: "lātī essētis" },
				"3pl": { form: "lātī essent" },
			},
		},
	},
	// sufferō is left out: its sustulī, sublātum also serve tollō.
	cetera: {
		imperative: {
			active: {
				present: { "2sg": { form: "fer" }, "2pl": { form: "ferte" } },
				future: {
					"2sg": { form: "fertō" },
					"3sg": { form: "fertō" },
					"2pl": { form: "fertōte" },
					"3pl": { form: "feruntō" },
				},
			},
			passive: {
				present: { "2sg": { form: "ferre" }, "2pl": { form: "feriminī" } },
				future: {
					"2sg": { form: "fertor" },
					"3sg": { form: "fertor" },
					"3pl": { form: "feruntor" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "ferre" }, passive: { form: "ferrī" } },
			perfect: { active: { form: "tulisse" }, passive: { form: "lātus esse" } },
			future: {
				active: { form: "lātūrus esse" },
				passive: { form: "lātum īrī" },
			},
		},
		participle: {
			present: { form: "ferēns, ferentis" },
			perfect: { form: "lātus, lāta, lātum" },
			future: { form: "lātūrus, lātūra, lātūrum" },
		},
		gerundive: { form: "ferendus, ferenda, ferendum" },
		gerund: {
			genitive: { form: "ferendī" },
			dative: { form: "ferendō" },
			accusative: { form: "ferendum" },
			ablative: { form: "ferendō" },
		},
		supine: { accusative: { form: "lātum" }, ablative: { form: "lātū" } },
	},
	compounds: [
		{
			principalParts: "afferō, afferre, attulī, allātum",
			english: "bring to, bring (news)",
		},
		{
			principalParts: "auferō, auferre, abstulī, ablātum",
			english: "carry off, take away",
		},
		{
			principalParts: "cōnferō, cōnferre, contulī, collātum",
			english: "bring together, compare",
		},
		{
			principalParts: "dēferō, dēferre, dētulī, dēlātum",
			english: "carry down, report",
		},
		{
			principalParts: "differō, differre, distulī, dīlātum",
			english: "spread, put off",
		},
		{
			principalParts: "efferō, efferre, extulī, ēlātum",
			english: "carry out, lift up",
		},
		{
			principalParts: "īnferō, īnferre, intulī, illātum",
			english: "bring in, inflict",
		},
		{
			principalParts: "offerō, offerre, obtulī, oblātum",
			english: "offer, present",
		},
		{
			principalParts: "perferō, perferre, pertulī, perlātum",
			english: "carry through, endure",
		},
		{
			principalParts: "praeferō, praeferre, praetulī, praelātum",
			english: "carry before, prefer",
		},
		{
			principalParts: "prōferō, prōferre, prōtulī, prōlātum",
			english: "bring forward, extend",
		},
		{
			principalParts: "referō, referre, rettulī, relātum",
			english: "bring back, report",
		},
		{
			principalParts: "trānsferō, trānsferre, trānstulī, trānslātum",
			english: "carry across, transfer",
		},
	],
};

const VOLO: IrregularVerb = {
	id: "volo",
	principalParts: ["volō", "velle", "voluī"],
	english: "want, be willing",
	perfectStem: "volu",
	indicative: {
		active: {
			present: {
				"1sg": { form: "volō" },
				"2sg": { form: "vīs" },
				"3sg": { form: "vult", alt: "volt" },
				"1pl": { form: "volumus" },
				"2pl": { form: "vultis", alt: "voltis" },
				"3pl": { form: "volunt" },
			},
			imperfect: {
				"1sg": { form: "volēbam" },
				"2sg": { form: "volēbās" },
				"3sg": { form: "volēbat" },
				"1pl": { form: "volēbāmus" },
				"2pl": { form: "volēbātis" },
				"3pl": { form: "volēbant" },
			},
			future: {
				"1sg": { form: "volam" },
				"2sg": { form: "volēs" },
				"3sg": { form: "volet" },
				"1pl": { form: "volēmus" },
				"2pl": { form: "volētis" },
				"3pl": { form: "volent" },
			},
			perfect: {
				"1sg": { form: "voluī" },
				"2sg": { form: "voluistī" },
				"3sg": { form: "voluit" },
				"1pl": { form: "voluimus" },
				"2pl": { form: "voluistis" },
				"3pl": { form: "voluērunt", alt: "voluēre" },
			},
			pluperfect: {
				"1sg": { form: "volueram" },
				"2sg": { form: "voluerās" },
				"3sg": { form: "voluerat" },
				"1pl": { form: "voluerāmus" },
				"2pl": { form: "voluerātis" },
				"3pl": { form: "voluerant" },
			},
			futurePerfect: {
				"1sg": { form: "voluerō" },
				"2sg": { form: "volueris" },
				"3sg": { form: "voluerit" },
				"1pl": { form: "voluerimus" },
				"2pl": { form: "volueritis" },
				"3pl": { form: "voluerint" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "velim" },
				"2sg": { form: "velīs" },
				"3sg": { form: "velit" },
				"1pl": { form: "velīmus" },
				"2pl": { form: "velītis" },
				"3pl": { form: "velint" },
			},
			imperfect: {
				"1sg": { form: "vellem" },
				"2sg": { form: "vellēs" },
				"3sg": { form: "vellet" },
				"1pl": { form: "vellēmus" },
				"2pl": { form: "vellētis" },
				"3pl": { form: "vellent" },
			},
			perfect: {
				"1sg": { form: "voluerim" },
				"2sg": { form: "voluerīs" },
				"3sg": { form: "voluerit" },
				"1pl": { form: "voluerīmus" },
				"2pl": { form: "voluerītis" },
				"3pl": { form: "voluerint" },
			},
			pluperfect: {
				"1sg": { form: "voluissem" },
				"2sg": { form: "voluissēs" },
				"3sg": { form: "voluisset" },
				"1pl": { form: "voluissēmus" },
				"2pl": { form: "voluissētis" },
				"3pl": { form: "voluissent" },
			},
		},
	},
	cetera: {
		imperative: {},
		infinitive: {
			present: { active: { form: "velle" } },
			perfect: { active: { form: "voluisse" } },
		},
		participle: { present: { form: "volēns, volentis" } },
	},
};

const NOLO: IrregularVerb = {
	id: "nolo",
	principalParts: ["nōlō", "nōlle", "nōluī"],
	english: "not want, be unwilling",
	perfectStem: "nōlu",
	indicative: {
		active: {
			present: {
				"1sg": { form: "nōlō" },
				"2sg": { form: "nōn vīs" },
				"3sg": { form: "nōn vult" },
				"1pl": { form: "nōlumus" },
				"2pl": { form: "nōn vultis" },
				"3pl": { form: "nōlunt" },
			},
			imperfect: {
				"1sg": { form: "nōlēbam" },
				"2sg": { form: "nōlēbās" },
				"3sg": { form: "nōlēbat" },
				"1pl": { form: "nōlēbāmus" },
				"2pl": { form: "nōlēbātis" },
				"3pl": { form: "nōlēbant" },
			},
			future: {
				"1sg": { form: "nōlam" },
				"2sg": { form: "nōlēs" },
				"3sg": { form: "nōlet" },
				"1pl": { form: "nōlēmus" },
				"2pl": { form: "nōlētis" },
				"3pl": { form: "nōlent" },
			},
			perfect: {
				"1sg": { form: "nōluī" },
				"2sg": { form: "nōluistī" },
				"3sg": { form: "nōluit" },
				"1pl": { form: "nōluimus" },
				"2pl": { form: "nōluistis" },
				"3pl": { form: "nōluērunt", alt: "nōluēre" },
			},
			pluperfect: {
				"1sg": { form: "nōlueram" },
				"2sg": { form: "nōluerās" },
				"3sg": { form: "nōluerat" },
				"1pl": { form: "nōluerāmus" },
				"2pl": { form: "nōluerātis" },
				"3pl": { form: "nōluerant" },
			},
			futurePerfect: {
				"1sg": { form: "nōluerō" },
				"2sg": { form: "nōlueris" },
				"3sg": { form: "nōluerit" },
				"1pl": { form: "nōluerimus" },
				"2pl": { form: "nōlueritis" },
				"3pl": { form: "nōluerint" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "nōlim" },
				"2sg": { form: "nōlīs" },
				"3sg": { form: "nōlit" },
				"1pl": { form: "nōlīmus" },
				"2pl": { form: "nōlītis" },
				"3pl": { form: "nōlint" },
			},
			imperfect: {
				"1sg": { form: "nōllem" },
				"2sg": { form: "nōllēs" },
				"3sg": { form: "nōllet" },
				"1pl": { form: "nōllēmus" },
				"2pl": { form: "nōllētis" },
				"3pl": { form: "nōllent" },
			},
			perfect: {
				"1sg": { form: "nōluerim" },
				"2sg": { form: "nōluerīs" },
				"3sg": { form: "nōluerit" },
				"1pl": { form: "nōluerīmus" },
				"2pl": { form: "nōluerītis" },
				"3pl": { form: "nōluerint" },
			},
			pluperfect: {
				"1sg": { form: "nōluissem" },
				"2sg": { form: "nōluissēs" },
				"3sg": { form: "nōluisset" },
				"1pl": { form: "nōluissēmus" },
				"2pl": { form: "nōluissētis" },
				"3pl": { form: "nōluissent" },
			},
		},
	},
	cetera: {
		imperative: {
			active: {
				present: { "2sg": { form: "nōlī" }, "2pl": { form: "nōlīte" } },
				future: {
					"2sg": { form: "nōlītō" },
					"3sg": { form: "nōlītō" },
					"2pl": { form: "nōlītōte" },
					"3pl": { form: "nōluntō" },
				},
			},
		},
		infinitive: {
			present: { active: { form: "nōlle" } },
			perfect: { active: { form: "nōluisse" } },
		},
		participle: { present: { form: "nōlēns, nōlentis" } },
	},
};

const MALO: IrregularVerb = {
	id: "malo",
	principalParts: ["mālō", "mālle", "māluī"],
	english: "prefer",
	perfectStem: "mālu",
	indicative: {
		active: {
			present: {
				"1sg": { form: "mālō" },
				"2sg": { form: "māvīs" },
				"3sg": { form: "māvult" },
				"1pl": { form: "mālumus" },
				"2pl": { form: "māvultis" },
				"3pl": { form: "mālunt" },
			},
			imperfect: {
				"1sg": { form: "mālēbam" },
				"2sg": { form: "mālēbās" },
				"3sg": { form: "mālēbat" },
				"1pl": { form: "mālēbāmus" },
				"2pl": { form: "mālēbātis" },
				"3pl": { form: "mālēbant" },
			},
			future: {
				"1sg": { form: "mālam" },
				"2sg": { form: "mālēs" },
				"3sg": { form: "mālet" },
				"1pl": { form: "mālēmus" },
				"2pl": { form: "mālētis" },
				"3pl": { form: "mālent" },
			},
			perfect: {
				"1sg": { form: "māluī" },
				"2sg": { form: "māluistī" },
				"3sg": { form: "māluit" },
				"1pl": { form: "māluimus" },
				"2pl": { form: "māluistis" },
				"3pl": { form: "māluērunt", alt: "māluēre" },
			},
			pluperfect: {
				"1sg": { form: "mālueram" },
				"2sg": { form: "māluerās" },
				"3sg": { form: "māluerat" },
				"1pl": { form: "māluerāmus" },
				"2pl": { form: "māluerātis" },
				"3pl": { form: "māluerant" },
			},
			futurePerfect: {
				"1sg": { form: "māluerō" },
				"2sg": { form: "mālueris" },
				"3sg": { form: "māluerit" },
				"1pl": { form: "māluerimus" },
				"2pl": { form: "mālueritis" },
				"3pl": { form: "māluerint" },
			},
		},
	},
	subjunctive: {
		active: {
			present: {
				"1sg": { form: "mālim" },
				"2sg": { form: "mālīs" },
				"3sg": { form: "mālit" },
				"1pl": { form: "mālīmus" },
				"2pl": { form: "mālītis" },
				"3pl": { form: "mālint" },
			},
			imperfect: {
				"1sg": { form: "māllem" },
				"2sg": { form: "māllēs" },
				"3sg": { form: "māllet" },
				"1pl": { form: "māllēmus" },
				"2pl": { form: "māllētis" },
				"3pl": { form: "māllent" },
			},
			perfect: {
				"1sg": { form: "māluerim" },
				"2sg": { form: "māluerīs" },
				"3sg": { form: "māluerit" },
				"1pl": { form: "māluerīmus" },
				"2pl": { form: "māluerītis" },
				"3pl": { form: "māluerint" },
			},
			pluperfect: {
				"1sg": { form: "māluissem" },
				"2sg": { form: "māluissēs" },
				"3sg": { form: "māluisset" },
				"1pl": { form: "māluissēmus" },
				"2pl": { form: "māluissētis" },
				"3pl": { form: "māluissent" },
			},
		},
	},
	cetera: {
		imperative: {},
		infinitive: {
			present: { active: { form: "mālle" } },
			perfect: { active: { form: "māluisse" } },
		},
		participle: {},
	},
};

export const IRREGULAR_VERBS: IrregularVerb[] = [
	SUM,
	POSSUM,
	EO,
	FERO,
	VOLO,
	NOLO,
	MALO,
];
