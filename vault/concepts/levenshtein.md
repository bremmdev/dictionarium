# Levenshtein distance (edit distance)

When a search finds nothing, the dictionary offers "Did you mean …?". To do that it needs a number for **how close two words are**: _amcius_ is very close to _amīcus_, _xyzzy_ is close to nothing. The standard number for this is the **Levenshtein distance**: the smallest number of single-letter edits that turns one word into the other. This document explains what it counts, how to work it out by hand with a table, the variant this app uses (which also counts swapped letters), how to make it fast, and how to turn a distance into a useful list of suggestions.

| Term | Meaning |
| --- | --- |
| Edit | One change to one letter: an insertion, a deletion or a substitution |
| Insertion | Adding a letter: _puela_ → _puella_ |
| Deletion | Removing a letter: _puellla_ → _puella_ |
| Substitution | Replacing one letter with another: _habto_ → _habeo_ |
| Transposition | Swapping two neighbouring letters: _amcius_ → _amicus_. Not an edit in plain Levenshtein |
| Edit distance | The general name for "the fewest edits between two strings". Levenshtein is the most common kind |
| OSA | Optimal string alignment: Levenshtein plus transposition as one edit. What this app uses |
| Damerau–Levenshtein | Like OSA, but a swapped pair may be edited again afterwards. Slightly different from OSA, see [section 5](#5-swapped-letters-damerau-and-osa) |
| ε (empty string) | A word with no letters. The table starts from it |
| Dynamic programming | Solving a big problem by first solving the small problems inside it and storing their answers in a table |
| Threshold | The largest distance still worth suggesting |
| Key | The search form of a word: lower-case, no macrons. What `normalizeLemma` produces |

---

## Contents

1. [The problem](#1-the-problem)
2. [The three edits](#2-the-three-edits)
3. [The idea: solve small problems first](#3-the-idea-solve-small-problems-first)
4. [Filling the table by hand](#4-filling-the-table-by-hand)
5. [Swapped letters: Damerau and OSA](#5-swapped-letters-damerau-and-osa)
6. [How fast is it](#6-how-fast-is-it)
7. [Choosing a threshold](#7-choosing-a-threshold)
8. [Our implementation](#8-our-implementation)
9. [Alternatives](#9-alternatives)
10. [Pitfalls](#10-pitfalls)
11. [Sources](#11-sources)

---

## 1. The problem

A student types _rgina_. The dictionary has _rēgīna_. To a person it's obvious that one letter is missing. To a program, two strings are either equal or not, and these aren't.

The first idea is to compare letter by letter and count the differences:

```
r g i n a
r e g i n a
✓ ✗ ✗ ✗ ✗ +1 extra
```

That gives 5, for a word with **one** missing letter. Comparing by position falls apart as soon as one letter is missing or added, because everything after it shifts one place.

What we actually want is to ask: **what is the cheapest way to repair the typed word?** Here the answer is "insert an _e_ after the _r_", so one edit. Counting repairs instead of comparing positions is the whole idea behind Levenshtein distance.

---

## 2. The three edits

Levenshtein distance allows three kinds of edit, and each one costs 1:

| Edit | Example | Distance |
| --- | --- | --- |
| Insert a letter | _puela_ → _puella_ | 1 |
| Delete a letter | _puellla_ → _puella_ | 1 |
| Substitute a letter | _habto_ → _habeo_ (_t_ → _e_) | 1 |
| Two of them | _mors_ → _amor_ (insert _a_, delete _s_) | 2 |

**The distance is the smallest number of edits**, not just any number. You can always turn _mors_ into _amor_ by replacing all four letters and adding one (5 edits), but the cheapest route is 2, so the distance is 2.

Some useful facts that follow from the definition:

- **0 means equal.** Only identical strings are 0 apart.
- **It is symmetric.** _a_ → _b_ costs the same as _b_ → _a_: every insertion one way is a deletion the other way.
- **At least the length difference.** _puela_ (5) and _puella_ (6) can never be less than 1 apart, because something has to add a letter. This gives a free shortcut, see [section 6](#6-how-fast-is-it).
- **At most the longer length.** Substitute everything, then insert or delete the rest.
- **The triangle inequality holds.** Going from _a_ to _c_ is never more expensive than going via _b_. Some fast lookup structures depend on this, see [section 9](#9-alternatives).

---

## 3. The idea: solve small problems first

Trying every possible series of edits would take forever. The trick is to look only at the **last letter** of each word.

Say we want the distance between _mors_ and _amor_. However the cheapest repair goes, it has to deal with the final _s_ of _mors_ and the final _r_ of _amor_ in one of three ways:

1. **Delete the _s_.** Then what's left is the distance from _mor_ to _amor_, plus 1.
2. **Insert the _r_ at the end.** Then what's left is the distance from _mors_ to _amo_, plus 1.
3. **Line the _s_ up with the _r_.** If they are the same letter this costs 0, otherwise it's a substitution and costs 1. What's left is the distance from _mor_ to _amo_.

The answer is the cheapest of the three. Each of those is the same question about **shorter words**, and those can be split the same way, down to the empty word. The distance from the empty word to any word is simply its length: you have to insert every letter.

The same small question comes up again and again (the distance from _mo_ to _am_ is needed by several bigger ones). So instead of recomputing, we **store every answer in a table** and fill it from the top-left corner. That is dynamic programming, and this particular table is known as the Wagner–Fischer algorithm.

---

## 4. Filling the table by hand

This section builds the table for _mors_ → _amor_ one step at a time. The answer is 2 (insert _a_, delete _s_), so you can check every step against that.

### What one cell means

Write the typed word down the left side and the dictionary word across the top, each with an empty slot (ε) in front:

|   | ε | a | m | o | r |
| --- | --- | --- | --- | --- | --- |
| **ε** |   |   |   |   |   |
| **m** |   |   |   |   |   |
| **o** |   |   |   |   |   |
| **r** |   |   |   |   |   |
| **s** |   |   |   |   |   |

**Each cell answers one small question:** how many edits turn the typed letters _up to and including this row_ into the target letters _up to and including this column_? A few examples:

| Cell | Small question | Answer |
| --- | --- | --- |
| row **ε**, column **m** | nothing → _am_ | 2: insert _a_ and _m_ |
| row **m**, column **a** | _m_ → _a_ | 1: substitute |
| row **o**, column **o** | _mo_ → _amo_ | 1: insert _a_ |
| row **s**, column **r** | _mors_ → _amor_ | the whole question |

The bottom-right cell covers both whole words, so that is the answer we want. Every other cell is a stepping stone towards it.

### Moving through the table

Picture a walk from the top-left corner to the bottom-right corner. You read both words as you go, and every step uses up letters:

| Step | Uses up | Means | Cost |
| --- | --- | --- | --- |
| Down ↓ | the next typed letter only | **delete** that typed letter | 1 |
| Right → | the next target letter only | **insert** that target letter | 1 |
| Diagonal ↘ | the next letter of both | **match** them if they're the same, otherwise **substitute** | 0 or 1 |

Each walk is one way to repair the word, and the walk's total cost is the number of edits it uses. **The distance is the cost of the cheapest walk**, and the number in a cell is the cheapest way to reach that cell.

### The one rule

You can only reach a cell in three ways: by stepping down from the cell above, right from the cell on the left, or diagonally from the cell up-left. So a cell's value is the smallest of:

- the cell **above** + 1
- the cell on the **left** + 1
- the cell **up-left** + 0 if this row's letter and this column's letter are the same, + 1 if not

That's the whole algorithm. Each cell only needs cells above it and to its left, so if you fill the table row by row, left to right, the numbers you need are always there already.

### Step 1: the edges

The top row can only be reached by stepping right, so it is all insertions: nothing → _a_, _am_, _amo_, _amor_ costs 1, 2, 3, 4. The left column can only be reached by stepping down, so it is all deletions: _m_, _mo_, _mor_, _mors_ → nothing costs 1, 2, 3, 4.

|   | ε | a | m | o | r |
| --- | --- | --- | --- | --- | --- |
| **ε** | 0 | 1 | 2 | 3 | 4 |
| **m** | 1 |   |   |   |   |
| **o** | 2 |   |   |   |   |
| **r** | 3 |   |   |   |   |
| **s** | 4 |   |   |   |   |

### Step 2: row m, cell by cell

| Column | Small question | Above + 1 | Left + 1 | Up-left + 0/1 | Smallest |
| --- | --- | --- | --- | --- | --- |
| **a** | _m_ → _a_ | 1 + 1 = 2 | 1 + 1 = 2 | 0 + 1 = 1 (_m_ ≠ _a_) | **1** |
| **m** | _m_ → _am_ | 2 + 1 = 3 | 1 + 1 = 2 | 1 + 0 = 1 (_m_ = _m_) | **1** |
| **o** | _m_ → _amo_ | 3 + 1 = 4 | 1 + 1 = 2 | 2 + 1 = 3 (_m_ ≠ _o_) | **2** |
| **r** | _m_ → _amor_ | 4 + 1 = 5 | 2 + 1 = 3 | 3 + 1 = 4 (_m_ ≠ _r_) | **3** |

Check them in your head: _m_ → _am_ is 1 (insert _a_), _m_ → _amo_ is 2 (insert _a_ and _o_). The rule gets the same answers without having to think about it.

|   | ε | a | m | o | r |
| --- | --- | --- | --- | --- | --- |
| **ε** | 0 | 1 | 2 | 3 | 4 |
| **m** | 1 | 1 | 1 | 2 | 3 |
| **o** | 2 |   |   |   |   |
| **r** | 3 |   |   |   |   |
| **s** | 4 |   |   |   |   |

### Step 3: the other rows

Rows **o**, **r** and **s** use exactly the same rule. The finished table:

|   | ε | a | m | o | r |
| --- | --- | --- | --- | --- | --- |
| **ε** | 0 | 1 | 2 | 3 | 4 |
| **m** | 1 | 1 | 1 | 2 | 3 |
| **o** | 2 | 2 | 2 | 1 | 2 |
| **r** | 3 | 3 | 3 | 2 | 1 |
| **s** | 4 | 4 | 4 | 3 | **2** |

The last cell, worked out in full (_mors_ → _amor_):

| From | Value there | + | Total |
| --- | --- | --- | --- |
| Above (row **r**, column **r**) | 1 | 1 (delete _s_) | **2** |
| Left (row **s**, column **o**) | 3 | 1 (insert _r_) | 4 |
| Up-left (row **r**, column **o**) | 2 | 1 (_s_ ≠ _r_) | 3 |

The smallest is 2, so the distance is **2**.

### Which edits did it find?

The table gives the number, not the edits. To see the edits, start in the bottom-right corner and go back to whichever neighbour each value came from:

| At | Came from | Step | Edit |
| --- | --- | --- | --- |
| row **s**, column **r** (2) | above, row **r**, column **r** (1) | ↓ | delete _s_ (+1) |
| row **r**, column **r** (1) | up-left, row **o**, column **o** (1) | ↘ | _r_ matches _r_ |
| row **o**, column **o** (1) | up-left, row **m**, column **m** (1) | ↘ | _o_ matches _o_ |
| row **m**, column **m** (1) | up-left, row **ε**, column **a** (1) | ↘ | _m_ matches _m_ |
| row **ε**, column **a** (1) | left, row **ε**, column **ε** (0) | → | insert _a_ (+1) |

Read from the bottom up, that's the repair in order: insert _a_, keep _m_, _o_, _r_, delete _s_. Two edits, the same as the corner. You never need to do this to get the distance; it just shows the table really found the cheapest repair.

### A second example: _habto_ → _habeo_

|   | ε | h | a | b | e | o |
| --- | --- | --- | --- | --- | --- | --- |
| **ε** | 0 | 1 | 2 | 3 | 4 | 5 |
| **h** | 1 | 0 | 1 | 2 | 3 | 4 |
| **a** | 2 | 1 | 0 | 1 | 2 | 3 |
| **b** | 3 | 2 | 1 | 0 | 1 | 2 |
| **t** | 4 | 3 | 2 | 1 | 1 | 2 |
| **o** | 5 | 4 | 3 | 2 | 2 | **1** |

Follow the cheapest walk diagonally from the top-left corner:

- **0, 0, 0**: _h_, _a_ and _b_ match, so those steps are free.
- **1** at row **t**, column **e**: _t_ ≠ _e_, so this diagonal step is a substitution and costs 1.
- **1** at the corner: _o_ matches _o_, so the last step is free.

Distance 1: one substitution.

---

## 5. Swapped letters: Damerau and OSA

Fast typists swap two letters all the time: _amcius_ for _amicus_. To a person that is one mistake. Plain Levenshtein doesn't know about swaps, so it has to substitute both letters:

|   | ε | a | m | i | c | u | s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **ε** | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| **a** | 1 | 0 | 1 | 2 | 3 | 4 | 5 |
| **m** | 2 | 1 | 0 | 1 | 2 | 3 | 4 |
| **c** | 3 | 2 | 1 | 1 | 1 | 2 | 3 |
| **i** | 4 | 3 | 2 | 1 | 2 | 2 | 3 |
| **u** | 5 | 4 | 3 | 2 | 2 | 2 | 3 |
| **s** | 6 | 5 | 4 | 3 | 3 | 3 | **2** |

Levenshtein: 2. With a limit of one edit, _amicus_ would not be suggested at all.

Frederick Damerau looked at real spelling errors in 1964 and found that most of them were exactly one insertion, deletion, substitution **or swap of two neighbouring letters**. So the fix is a fourth rule: if the last two letters of one prefix are the last two letters of the other, swapped, you can also come from **two rows up and two columns left, +1**:

The same table with that rule:

|   | ε | a | m | i | c | u | s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **ε** | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| **a** | 1 | 0 | 1 | 2 | 3 | 4 | 5 |
| **m** | 2 | 1 | 0 | 1 | 2 | 3 | 4 |
| **c** | 3 | 2 | 1 | 1 | 1 | 2 | 3 |
| **i** | 4 | 3 | 2 | 1 | **1** | 2 | 3 |
| **u** | 5 | 4 | 3 | 2 | 2 | 1 | 2 |
| **s** | 6 | 5 | 4 | 3 | 3 | 2 | **1** |

Row **i**, column **c** is where it happens: _amci_ ends in _ci_, _amic_ ends in _ic_. The cell two up and two left (row **m**, column **m**) is 0, so this cell becomes 0 + 1 = 1 instead of 2. From there _u_ and _s_ match for free. Distance 1.

### OSA is not quite Damerau–Levenshtein

There are two versions of "Levenshtein with swaps", and the names get mixed up a lot:

| | Swap counts as 1 | Can edit a swapped pair again | _ca_ → _abc_ |
| --- | --- | --- | --- |
| **Levenshtein** | No | – | 3 |
| **OSA** (optimal string alignment) | Yes | No | 3 |
| **Damerau–Levenshtein** (unrestricted) | Yes | Yes | 2 |

_ca_ → _abc_ is the classic example: swap to _ac_, then insert _b_ between them. Real Damerau–Levenshtein allows that and gets 2. OSA doesn't allow inserting a letter between the two it just swapped, so it gets 3.

The rule above, the one in this app, is **OSA**. It is much simpler (one extra line, two rows of memory) and the difference only shows up when someone swaps two letters and **also** types something between them. For typo suggestions that's rare enough not to matter.

---

## 6. How fast is it

Measured on this machine with 20,000 random 4–11 letter words, comparing a query against all of them:

| Query | Limit | Time for 20,000 words |
| --- | --- | --- |
| _amcius_ | 1 | ≈ 4 ms |
| _perfenio_ | 2 | ≈ 9 ms |

That's at the expected size of the dictionary, and it only runs when a search found nothing. See [search.md](../search.md#did-you-mean-) for why that's fine here.

---

## 7. Choosing a threshold

The distance alone doesn't decide what to suggest. You also need a limit, and one fixed limit doesn't fit all words:

- **Short words are close to everything.** _es_ is one edit from _et_, _ex_, _ēn_, _is_, _as_ and many more. One edit on a 2-letter word changes half of it.
- **Long words often have two mistakes.** _sententai_ (swap) is fine at one edit, but _felcitre_ for _fēlīciter_ needs two. At that length, two edits rarely land on a different real word.

So the limit grows with the length of the query:

| Query length | Limit | Why |
| --- | --- | --- |
| 1–3 letters | none | One edit reaches too many words to guess |
| 4–7 letters | 1 | Catches one typo without pulling in unrelated words |
| 8+ letters | 2 | Long words survive two edits without becoming ambiguous |

Two more rules make the list short and sensible:

1. **Only the closest distance found counts.** If anything is 1 edit away, nothing 2 edits away is shown, even for long queries. A two-edit suggestion only appears when there's nothing better.
2. **Ties are sorted**: lemmas that start with the same letter as the query first (people rarely mistype the first letter), then alphabetically. At most 5 are shown.

Another common approach is a **relative** limit, such as "at most 25% of the letters may be wrong" (`distance ≤ length × 0.25`, rounded down). Up to 11 letters that gives exactly the limits in the table above. They only part at 12 letters, where 25% allows a third edit. The table caps it at 2 and spells out each step, which is easier to reason about.

---

## 8. Our implementation

The code lives in `src/utils/search/suggestions.ts`. The distance function:

```ts
export function editDistance(a: string, b: string, max: number) {
	if (Math.abs(a.length - b.length) > max) return max + 1;

	let beforePrevious: Array<number> = [];
	let previous = Array.from({ length: b.length + 1 }, (_, j) => j);

	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		let rowMin = i;
		for (let j = 1; j <= b.length; j++) {
			const substitution = a[i - 1] === b[j - 1] ? 0 : 1;
			let distance = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + substitution,
			);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				distance = Math.min(distance, beforePrevious[j - 2] + 1);
			}
			current[j] = distance;
			rowMin = Math.min(rowMin, distance);
		}
		if (rowMin > max) return max + 1;
		beforePrevious = previous;
		previous = current;
	}

	return Math.min(previous[b.length], max + 1);
}
```

How it works:

1. **The length check** throws out anything that can't be within `max` before any work is done.
2. **`previous`** starts as the first row of the table: 0, 1, 2, … (inserting every letter of `b`).
3. **`current = [i]`** is the first column: turning the first `i` letters of `a` into nothing.
4. **The three `Math.min` arguments** are above +1, left +1 and diagonal +0/+1, the same as in the hand-worked tables. JavaScript strings are 0-based, so letter `i` of the table is `a[i - 1]`.
5. **The `if` with four comparisons** is the swap rule from [section 5](#5-swapped-letters-damerau-and-osa). It reads `beforePrevious`, the row two up.
6. **`rowMin`** tracks the smallest cell in this row, for the early exit from [section 6](#6-how-fast-is-it).
7. **The return** is capped at `max + 1`, so callers only ever see "a distance within the limit" or "too far".

Choosing what to suggest is `suggestLemmas(key, candidates)`:

1. `maxEditsFor(key)` gives the limit from [section 7](#7-choosing-a-threshold). 0 means don't suggest anything.
2. Every candidate gets a distance. 0 is skipped (that word would have been found by the search). Anything over the limit is skipped.
3. A smaller distance than any seen so far **starts the list over**. That's how "only the closest distance counts" is implemented in one pass.
4. The list is sorted by first letter, then alphabetically, homographs are collapsed into one lemma, and the first 5 are returned.

The distances are always measured between **keys**, never display forms. `searchEntries` only calls this when a search found nothing: `findSuggestions` in `src/server/search.ts` reads every distinct `lemma` with its `lemma_plain` and passes them in.

---

## 9. Alternatives

| Option | When it fits | Pros | Cons |
| --- | --- | --- | --- |
| **A. Levenshtein** | General "how different are these strings" | Simple, well known, a true distance | A swap costs 2, so the most common typo needs a bigger limit |
| **B. OSA** (this app) | Typo suggestions | One extra rule, swaps cost 1 | Not a true distance (see _ca_/_abc_). Rarely matters |
| **C. Full Damerau–Levenshtein** | When swaps combined with other edits matter | Exact, a true distance | Needs a table indexed by alphabet, noticeably more complex |
| **D. Weighted edits** | Specific error patterns are known | E.g. neighbouring keys or vowel swaps cost 0.5 | More decisions to tune, harder to explain |
| **E. Jaro–Winkler** | Short strings like names | Score 0–1, rewards a shared start | Not an edit count, so harder to pick a limit for |
| **F. Trigrams** (SQLite FTS5 trigram, Postgres `pg_trgm`) | Large tables that need an index | Fast with an index, also finds partial matches | Weak on short words, which have few trigrams |
| **G. SQLite `spellfix1`** | Doing it all inside SQLite | Edit distance plus a phonetic index, in SQL | A loadable extension, not in the standard build. More moving parts |

At this dictionary's size, comparing every lemma ([section 6](#6-how-fast-is-it)) costs a few milliseconds, so B with no index is the simplest thing that works. F or G become worth it if suggestions ever run on every keystroke, or the dictionary grows well past its expected size.

---

## 10. Pitfalls

- **Forgetting the empty row and column.**
  - The table is (length + 1) × (length + 1). Without the ε row and column there's nowhere to start, and every distance comes out one too low or too high.
  - Fix: the first row is `0, 1, 2, …` and each row starts with its row number.
- **Using the "too far" value as a real distance.**
  - `editDistance` returns `max + 1` for "too far". `suggestLemmas` first started its "closest so far" at `max + 1` as well, so a word that was too far compared **equal** to it and was added to the list. Every word in the dictionary would have been suggested.
  - Fix: skip `distance > max` explicitly, before comparing with the closest so far. The current code does.
- **Stopping on the wrong number.**
  - The early exit has to check the **smallest** cell in the row. The last cell of a row can be large while another cell in the same row still leads to a small answer.
  - Fix: track `rowMin` over the whole row.
- **Comparing display forms.**
  - _amo_ and _amō_ are 1 apart, because _ō_ is a different character from _o_. Written as _o_ + a combining macron, it's even two characters.
  - Fix: compare keys from `normalizeLemma`, never `lemma`.
- **Characters that are two code units.**
  - `a[i]` reads a UTF-16 code unit, not a character. An emoji or a rare symbol is two code units, so it would count as two letters.
  - Fix: nothing to do here, because keys only contain _a_–_z_ and spaces. Anywhere else, split with `Array.from(string)` first.
- **Calling OSA "Damerau–Levenshtein".**
  - They give different answers for cases like _ca_ → _abc_ ([section 5](#5-swapped-letters-damerau-and-osa)). Code or tests copied from a source that means the other one will disagree.
  - Fix: name it OSA, as the code does.
- **A fixed limit for every length.**
  - One edit on a 3-letter word suggests half the short words in the dictionary.
  - Fix: scale the limit with the length ([section 7](#7-choosing-a-threshold)).
- **Running it on every search.**
  - The cost grows with the number of lemmas. On every keystroke, or on a much bigger dictionary, that adds up, and `better-sqlite3` blocks the server while it works.
  - Fix: only on a search that found nothing, as now.

---



---

## 11. Sources

**Papers**
- V. I. Levenshtein, "Binary codes capable of correcting deletions, insertions, and reversals", _Soviet Physics Doklady_ 10(8), 1966 (Russian original 1965): the distance itself
- F. J. Damerau, ["A technique for computer detection and correction of spelling errors"](https://doi.org/10.1145/363958.363994), _Communications of the ACM_ 7(3), 1964: swaps, and the finding that most misspellings are a single error
- R. A. Wagner and M. J. Fischer, ["The string-to-string correction problem"](https://doi.org/10.1145/321796.321811), _Journal of the ACM_ 21(1), 1974: the table method

**Reference**
- [Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance), [Damerau–Levenshtein distance](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance) (including the OSA variant and the _ca_/_abc_ example) and [Wagner–Fischer algorithm](https://en.wikipedia.org/wiki/Wagner%E2%80%93Fischer_algorithm) on Wikipedia
- Peter Norvig, [How to Write a Spelling Corrector](https://norvig.com/spell-correct.html): a short, readable spelling corrector built on edit distance
- [SQLite spellfix1](https://sqlite.org/spellfix1.html): the SQLite extension mentioned in [section 9](#9-alternatives)

**In this vault**
- [search.md](../search.md#did-you-mean-): where suggestions fit in the search flow, and why comparing every lemma is affordable

**In the code**
- `src/utils/search/suggestions.ts`: `editDistance`, `maxEditsFor`, `suggestLemmas`
- `src/server/search.ts`: `findSuggestions`, called by `searchEntries` when nothing matched
- `src/components/search/Results.tsx`: the "Did you mean …?" line and its announcement
