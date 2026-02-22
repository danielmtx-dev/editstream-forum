CREATE TABLE `customUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(128) NOT NULL,
	`email` varchar(320),
	`phone` varchar(32),
	`passwordHash` varchar(256) NOT NULL,
	`displayName` varchar(256),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`isGroupMember` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`failedLoginAttempts` int NOT NULL DEFAULT 0,
	`lockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `customUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customUsers_username_unique` UNIQUE(`username`),
	CONSTRAINT `customUsers_email_unique` UNIQUE(`email`),
	CONSTRAINT `customUsers_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` int NOT NULL,
	`amountCents` int NOT NULL,
	`status` enum('pending','approved','rejected','refunded','cancelled') NOT NULL DEFAULT 'pending',
	`mpPreferenceId` varchar(256),
	`mpPaymentId` varchar(256),
	`externalReference` varchar(128),
	`paymentMethod` varchar(64),
	`downloadCount` int NOT NULL DEFAULT 0,
	`maxDownloads` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_externalReference_unique` UNIQUE(`externalReference`)
);
