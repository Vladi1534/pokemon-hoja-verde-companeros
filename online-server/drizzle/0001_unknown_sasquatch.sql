CREATE TABLE `friend_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`sender` text NOT NULL,
	`recipient` text NOT NULL,
	`room` text NOT NULL,
	`expires` integer NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `friend_invite_pair` ON `friend_invitations` (`sender`,`recipient`);--> statement-breakpoint
CREATE INDEX `friend_invite_recipient` ON `friend_invitations` (`recipient`);--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` text PRIMARY KEY NOT NULL,
	`a` text NOT NULL,
	`b` text NOT NULL,
	`sender` text NOT NULL,
	`status` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `friends_a` ON `friendships` (`a`);--> statement-breakpoint
CREATE INDEX `friends_b` ON `friendships` (`b`);--> statement-breakpoint
CREATE TABLE `social_trainers` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`avatar` text NOT NULL,
	`starter` integer NOT NULL,
	`seen` integer DEFAULT 0 NOT NULL,
	`room` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_trainers_code_unique` ON `social_trainers` (`code`);