DROP INDEX `entries_lemma_unique`;--> statement-breakpoint
ALTER TABLE `entries` ADD `homonym` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `entries_lemma_homonym_unique` ON `entries` (`lemma`,`homonym`);--> statement-breakpoint
ALTER TABLE `view_events` ADD `homonym` integer DEFAULT 1 NOT NULL;