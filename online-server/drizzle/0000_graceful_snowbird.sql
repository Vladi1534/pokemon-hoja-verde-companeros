CREATE TABLE `limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `presence` (
	`id` text PRIMARY KEY NOT NULL,
	`room` text NOT NULL,
	`seq` integer DEFAULT 0 NOT NULL,
	`position` text NOT NULL,
	`seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `presence_room` ON `presence` (`room`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`invite` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`state` text NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_invite_unique` ON `rooms` (`invite`);