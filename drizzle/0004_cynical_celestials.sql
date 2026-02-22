CREATE TABLE `productFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileSize` bigint NOT NULL DEFAULT 0,
	`fileMimeType` varchar(256),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settingKey` varchar(128) NOT NULL,
	`settingValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `siteSettings_settingKey_unique` UNIQUE(`settingKey`)
);
--> statement-breakpoint
ALTER TABLE `customUsers` ADD `banStatus` enum('active','restricted','temp_banned','banned') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `customUsers` ADD `banReason` text;--> statement-breakpoint
ALTER TABLE `customUsers` ADD `banExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `customUsers` ADD `telegramId` varchar(64);--> statement-breakpoint
ALTER TABLE `customUsers` ADD `telegramUsername` varchar(128);--> statement-breakpoint
ALTER TABLE `customUsers` ADD `telegramFirstName` varchar(256);--> statement-breakpoint
ALTER TABLE `customUsers` ADD `telegramPhotoUrl` text;--> statement-breakpoint
ALTER TABLE `customUsers` ADD `telegramVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `externalLinks` text;--> statement-breakpoint
ALTER TABLE `customUsers` ADD CONSTRAINT `customUsers_telegramId_unique` UNIQUE(`telegramId`);