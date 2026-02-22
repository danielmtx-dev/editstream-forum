CREATE TABLE `forumComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forumComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forumLikes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`targetType` varchar(16) NOT NULL,
	`targetId` int NOT NULL,
	`userId` int NOT NULL,
	`value` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forumLikes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forumThreads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`content` text NOT NULL,
	`tag` varchar(64) NOT NULL DEFAULT 'discussion',
	`isPinned` boolean NOT NULL DEFAULT false,
	`isLocked` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forumThreads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT '#6B7280',
	`icon` varchar(64) NOT NULL DEFAULT '⭐',
	`permissions` text NOT NULL DEFAULT ('[]'),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `roles_id` PRIMARY KEY(`id`),
	CONSTRAINT `roles_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `userRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`roleId` int NOT NULL,
	`assignedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `categories` ADD `section` varchar(256) DEFAULT 'Geral' NOT NULL;