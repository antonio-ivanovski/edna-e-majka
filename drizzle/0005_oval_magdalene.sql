ALTER TABLE `product` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `product_slug_unique` ON `product` (`slug`);--> statement-breakpoint
ALTER TABLE `store` ADD `slug` text;--> statement-breakpoint
CREATE UNIQUE INDEX `store_slug_unique` ON `store` (`slug`);