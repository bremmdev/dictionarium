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
	/** The section's anchor, the lemma without macrons: /irregular-verbs#sum. */
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
	// possum is a compound too, but gets its own section.
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

export const IRREGULAR_VERBS: IrregularVerb[] = [SUM, POSSUM, EO];
