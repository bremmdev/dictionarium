// Data only — no JSX, so this stays a .ts module. NumberTheory wraps the Latin
// in <LatinWord> when it builds the table rows.

export const NUMERAL_COLUMNS = [
	{ key: "symbol", label: "Symbol" },
	{ key: "value", label: "Value" },
	{ key: "word", label: "Latin word" },
];

export const NUMERALS = [
	{ symbol: "I", value: "1", word: "ūnus" },
	{ symbol: "V", value: "5", word: "quīnque" },
	{ symbol: "X", value: "10", word: "decem" },
	{ symbol: "L", value: "50", word: "quīnquāgintā" },
	{ symbol: "C", value: "100", word: "centum" },
	{ symbol: "D", value: "500", word: "quīngentī" },
	{ symbol: "M", value: "1000", word: "mīlle" },
];

export const SUBTRACTIVE_COLUMNS = [
	{ key: "form", label: "Form" },
	{ key: "reads", label: "Reads as" },
	{ key: "value", label: "Value" },
	{ key: "instead", label: "Instead of" },
];

export const SUBTRACTIVE_FORMS = [
	{ form: "IV", reads: "1 before 5", value: "4", instead: "IIII" },
	{ form: "IX", reads: "1 before 10", value: "9", instead: "VIIII" },
	{ form: "XL", reads: "10 before 50", value: "40", instead: "XXXX" },
	{ form: "XC", reads: "10 before 100", value: "90", instead: "LXXXX" },
	{ form: "CD", reads: "100 before 500", value: "400", instead: "CCCC" },
	{ form: "CM", reads: "100 before 1000", value: "900", instead: "DCCCC" },
];

export const SUBTRACTIVE_WORD_COLUMNS = [
	{ key: "number", label: "Number" },
	{ key: "word", label: "Latin" },
	{ key: "literally", label: "Literally" },
];

export const SUBTRACTIVE_WORDS = [
	{ number: "18", word: "duodēvīgintī", literally: "two from twenty" },
	{ number: "19", word: "ūndēvīgintī", literally: "one from twenty" },
	{ number: "28", word: "duodētrīgintā", literally: "two from thirty" },
	{ number: "99", word: "ūndēcentum", literally: "one from a hundred" },
];

export const CARDINAL_COLUMNS = [
	{ key: "number", label: "Number" },
	{ key: "numeral", label: "Numeral" },
	{ key: "word", label: "Latin" },
];

// The first three are the only cardinals with gender, so they carry all three
// nominative forms here; the rest are one fixed word.
export const CARDINALS_1_10 = [
	{ number: "1", numeral: "I", word: "ūnus, ūna, ūnum" },
	{ number: "2", numeral: "II", word: "duo, duae, duo" },
	{ number: "3", numeral: "III", word: "trēs, tria" },
	{ number: "4", numeral: "IV", word: "quattuor" },
	{ number: "5", numeral: "V", word: "quīnque" },
	{ number: "6", numeral: "VI", word: "sex" },
	{ number: "7", numeral: "VII", word: "septem" },
	{ number: "8", numeral: "VIII", word: "octō" },
	{ number: "9", numeral: "IX", word: "novem" },
	{ number: "10", numeral: "X", word: "decem" },
];

export const CARDINALS_11_20 = [
	{ number: "11", numeral: "XI", word: "ūndecim" },
	{ number: "12", numeral: "XII", word: "duodecim" },
	{ number: "13", numeral: "XIII", word: "trēdecim" },
	{ number: "14", numeral: "XIV", word: "quattuordecim" },
	{ number: "15", numeral: "XV", word: "quīndecim" },
	{ number: "16", numeral: "XVI", word: "sēdecim" },
	{ number: "17", numeral: "XVII", word: "septendecim" },
	{ number: "18", numeral: "XVIII", word: "duodēvīgintī" },
	{ number: "19", numeral: "XIX", word: "ūndēvīgintī" },
	{ number: "20", numeral: "XX", word: "vīgintī" },
];

// Only 1, 2 and 3 decline. Each cell lists the forms in the usual gender
// order — masculine, feminine, neuter — collapsed where the genders share
// a form. NumberTheory sets the Latin; the case is the row header.
export const DECLENSION_COLUMNS = [
	{ key: "grammaticalCase", label: "Case" },
	{ key: "one", label: "One" },
	{ key: "two", label: "Two" },
	{ key: "three", label: "Three" },
];

export const DECLENSIONS = [
	{
		grammaticalCase: "Nominative",
		one: "ūnus, ūna, ūnum",
		two: "duo, duae, duo",
		three: "trēs, tria",
	},
	{
		grammaticalCase: "Genitive",
		one: "ūnīus",
		two: "duōrum, duārum, duōrum",
		three: "trium",
	},
	{
		grammaticalCase: "Dative",
		one: "ūnī",
		two: "duōbus, duābus, duōbus",
		three: "tribus",
	},
	{
		grammaticalCase: "Accusative",
		one: "ūnum, ūnam, ūnum",
		two: "duōs, duās, duo",
		three: "trēs, tria",
	},
	{
		grammaticalCase: "Ablative",
		one: "ūnō, ūnā, ūnō",
		two: "duōbus, duābus, duōbus",
		three: "tribus",
	},
];

export const TENS = [
	{ number: "10", numeral: "X", word: "decem" },
	{ number: "20", numeral: "XX", word: "vīgintī" },
	{ number: "30", numeral: "XXX", word: "trīgintā" },
	{ number: "40", numeral: "XL", word: "quadrāgintā" },
	{ number: "50", numeral: "L", word: "quīnquāgintā" },
	{ number: "60", numeral: "LX", word: "sexāgintā" },
	{ number: "70", numeral: "LXX", word: "septuāgintā" },
	{ number: "80", numeral: "LXXX", word: "octōgintā" },
	{ number: "90", numeral: "XC", word: "nōnāgintā" },
	{ number: "100", numeral: "C", word: "centum" },
];

// The hundreds are plural adjectives, so they take gender endings the way
// the first three cardinals do — hence the -ae, -a trailing each one.
export const HUNDREDS = [
	{ number: "100", numeral: "C", word: "centum" },
	{ number: "200", numeral: "CC", word: "ducentī, -ae, -a" },
	{ number: "300", numeral: "CCC", word: "trecentī, -ae, -a" },
	{ number: "400", numeral: "CD", word: "quadringentī, -ae, -a" },
	{ number: "500", numeral: "D", word: "quīngentī, -ae, -a" },
	{ number: "600", numeral: "DC", word: "sescentī, -ae, -a" },
	{ number: "700", numeral: "DCC", word: "septingentī, -ae, -a" },
	{ number: "800", numeral: "DCCC", word: "octingentī, -ae, -a" },
	{ number: "900", numeral: "CM", word: "nōngentī, -ae, -a" },
	{ number: "1000", numeral: "M", word: "mīlle" },
];

export const ORDINAL_COLUMNS = [
	{ key: "number", label: "Number" },
	{ key: "word", label: "Latin" },
	{ key: "english", label: "In English" },
];

// Every ordinal is a plain -us, -a, -um adjective, so only the masculine is
// listed — the prose beside the table carries the other two endings.
export const ORDINALS = [
	{ number: "1st", word: "prīmus", english: "first" },
	{ number: "2nd", word: "secundus", english: "second" },
	{ number: "3rd", word: "tertius", english: "third" },
	{ number: "4th", word: "quārtus", english: "fourth" },
	{ number: "5th", word: "quīntus", english: "fifth" },
	{ number: "6th", word: "sextus", english: "sixth" },
	{ number: "7th", word: "septimus", english: "seventh" },
	{ number: "8th", word: "octāvus", english: "eighth" },
	{ number: "9th", word: "nōnus", english: "ninth" },
	{ number: "10th", word: "decimus", english: "tenth" },
];
