CREATE TABLE `accepted_disagreements` (
	`entry_id` integer NOT NULL,
	`field` text NOT NULL,
	`ours` text NOT NULL,
	`theirs` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`entry_id`, `field`),
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE cascade
);
