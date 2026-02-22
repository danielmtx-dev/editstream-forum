CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`icon` varchar(64) NOT NULL DEFAULT '📦',
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`description` text NOT NULL,
	`priceCents` int NOT NULL DEFAULT 0,
	`isFree` boolean NOT NULL DEFAULT false,
	`categoryId` int NOT NULL,
	`imageUrl` text,
	`imageKey` varchar(512),
	`fileUrl` text,
	`fileKey` varchar(512),
	`fileName` varchar(512),
	`fileSize` bigint,
	`paymentMethods` varchar(256) NOT NULL DEFAULT '',
	`pixKey` varchar(512),
	`paymentInstructions` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`isPinned` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`downloadCount` int NOT NULL DEFAULT 0,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `files`;