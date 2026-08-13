CREATE TABLE `broker_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalWeight` decimal(18,3) NOT NULL DEFAULT '0',
	`totalCash` decimal(18,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `broker_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `broker_accounts_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `sheet_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brokerAccountId` int NOT NULL,
	`businessDate` timestamp NOT NULL,
	`weight` decimal(18,3) NOT NULL,
	`description` varchar(500) NOT NULL,
	`cash` decimal(18,2) NOT NULL,
	`notes` text,
	`type` enum('work','breakage') NOT NULL,
	`createdBy` int NOT NULL,
	`updatedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sheet_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) NOT NULL DEFAULT 'phone';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','broker') NOT NULL DEFAULT 'broker';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);--> statement-breakpoint
CREATE INDEX `broker_accounts_user_idx` ON `broker_accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `sheet_entries_broker_date_idx` ON `sheet_entries` (`brokerAccountId`,`businessDate`);