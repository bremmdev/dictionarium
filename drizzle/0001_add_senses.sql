CREATE TABLE `senses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`rank` integer NOT NULL,
	`meaning_en` text NOT NULL,
	`usage` text,
	`example_la` text,
	`example_en` text,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `senses_entry_rank_unique` ON `senses` (`entry_id`,`rank`);