import { Shuffle, Table2, TableProperties } from "lucide-react";

// Shared by the resources menu and the /grammar index.
export const GRAMMAR_TOPICS = [
	{
		to: "/grammar/conjugations",
		label: "Conjugations",
		description: "Verbs by person and tense",
		Icon: TableProperties,
	},
	{
		to: "/grammar/declensions",
		label: "Declensions",
		description: "Nouns and adjectives by case",
		Icon: Table2,
	},
	{
		to: "/grammar/irregular-verbs",
		label: "Irregular verbs",
		description: "Verbs that break the pattern",
		Icon: Shuffle,
	},
] as const;
