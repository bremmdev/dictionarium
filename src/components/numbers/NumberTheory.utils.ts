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
