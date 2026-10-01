CREATE TABLE `proverbs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`text_la` text NOT NULL,
	`text_plain` text NOT NULL,
	`translation_en` text NOT NULL,
	`meaning_en` text,
	`author` text NOT NULL,
	`source` text,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `proverbs_text_la_unique` ON `proverbs` (`text_la`);