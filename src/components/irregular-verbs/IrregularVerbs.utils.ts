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

export const IRREGULAR_VERBS: IrregularVerb[] = [SUM];
