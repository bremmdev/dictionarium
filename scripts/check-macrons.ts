/**
 * Guards the rule in vault/a11y.md: Latin text must use precomposed Latin
 * characters. A macron built from a combining mark, or a lookalike letter from
 * another script, renders identically but makes `lang="la"` a lie to assistive
 * tech and breaks find-in-page and copy-paste.
 */
import { globSync, readFileSync } from "node:fs";

const SUSPECT = [
	{
		name: "combining mark",
		test: (c: number) => c >= 0x0300 && c <= 0x036f,
		hint: "use the precomposed character instead",
	},
	{
		name: "Greek",
		test: (c: number) => c >= 0x0370 && c <= 0x03ff,
		hint: "looks Latin, is not",
	},
	{
		name: "Cyrillic",
		test: (c: number) => c >= 0x0400 && c <= 0x04ff,
		hint: "looks Latin, is not",
	},
];

const files = globSync("src/**/*.{ts,tsx}", {
	exclude: (p) => p.endsWith("routeTree.gen.ts"),
});

let found = 0;

for (const file of files.sort()) {
	const lines = readFileSync(file, "utf8").split(/\r?\n/);

	lines.forEach((line, i) => {
		// Column counted in code points, so a caret lands under the character.
		Array.from(line).forEach((ch, col) => {
			const code = ch.codePointAt(0) as number;
			const kind = SUSPECT.find((s) => s.test(code));
			if (!kind) return;

			found++;
			const point = `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;
			const fixed = line.normalize("NFC");

			console.error(`${file}:${i + 1}:${col + 1}  ${kind.name} ${point} — ${kind.hint}`);
			console.error(`  ${line.trim()}`);
			if (fixed !== line) console.error(`  NFC would give: ${fixed.trim()}`);
			console.error("");
		});
	});
}

if (found > 0) {
	console.error(`${found} suspect character(s). See vault/a11y.md.`);
	process.exit(1);
}

console.log(`Macrons OK — scanned ${files.length} files.`);
