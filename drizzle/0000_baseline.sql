CREATE TABLE `entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lemma` text NOT NULL,
	`lemma_plain` text NOT NULL,
	`part_of_speech` text NOT NULL,
	`principal_parts` text,
	`gender` text,
	`declension` text,
	`conjugation` text,
	`meaning_en` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_lemma_unique` ON `entries` (`lemma`);