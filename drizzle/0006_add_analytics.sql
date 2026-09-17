CREATE TABLE `search_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`query` text NOT NULL,
	`result_count` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `search_events_created_at` ON `search_events` (`created_at`);--> statement-breakpoint
CREATE TABLE `view_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`lemma` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `view_events_created_at` ON `view_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `view_events_lemma` ON `view_events` (`lemma`);