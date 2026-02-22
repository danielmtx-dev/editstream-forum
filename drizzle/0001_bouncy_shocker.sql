CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`filename` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` bigint NOT NULL,
	`categorySlug` varchar(128) NOT NULL,
	`description` text,
	`uploadedById` int NOT NULL,
	`uploaderName` varchar(256),
	`downloadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
