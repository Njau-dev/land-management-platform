-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionPlan` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `priceKes` INTEGER UNSIGNED NOT NULL,
    `interval` ENUM('WEEK', 'MONTH', 'YEAR') NOT NULL,
    `intervalCount` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPlan_name_key`(`name`),
    INDEX `SubscriptionPlan_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `planId` VARCHAR(30) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Subscription_userId_status_endsAt_idx`(`userId`, `status`, `endsAt`),
    INDEX `Subscription_planId_idx`(`planId`),
    INDEX `Subscription_status_endsAt_idx`(`status`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `planId` VARCHAR(30) NOT NULL,
    `subscriptionId` VARCHAR(30) NULL,
    `provider` ENUM('MPESA') NOT NULL DEFAULT 'MPESA',
    `amountKes` INTEGER UNSIGNED NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `merchantRequestId` VARCHAR(100) NULL,
    `checkoutRequestId` VARCHAR(100) NULL,
    `mpesaReceiptNumber` VARCHAR(100) NULL,
    `status` ENUM('INITIATED', 'PENDING', 'SUCCESSFUL', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'INITIATED',
    `resultCode` INTEGER NULL,
    `resultDescription` VARCHAR(500) NULL,
    `providerMetadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Payment_merchantRequestId_key`(`merchantRequestId`),
    UNIQUE INDEX `Payment_checkoutRequestId_key`(`checkoutRequestId`),
    UNIQUE INDEX `Payment_mpesaReceiptNumber_key`(`mpesaReceiptNumber`),
    INDEX `Payment_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `Payment_planId_idx`(`planId`),
    INDEX `Payment_subscriptionId_idx`(`subscriptionId`),
    INDEX `Payment_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TitleDeed` (
    `id` VARCHAR(30) NOT NULL,
    `titleDeedNumber` VARCHAR(100) NOT NULL,
    `ownerName` VARCHAR(191) NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `size` DECIMAL(14, 4) NOT NULL,
    `availabilityStatus` ENUM('AVAILABLE', 'SOLD', 'UNDER_TRANSACTION') NOT NULL DEFAULT 'AVAILABLE',
    `landRate` DECIMAL(15, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TitleDeed_titleDeedNumber_key`(`titleDeedNumber`),
    INDEX `TitleDeed_availabilityStatus_idx`(`availabilityStatus`),
    INDEX `TitleDeed_location_idx`(`location`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ZoningInfo` (
    `id` VARCHAR(30) NOT NULL,
    `titleDeedId` VARCHAR(30) NOT NULL,
    `zoneType` ENUM('RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'MIXED_USE', 'OTHER') NOT NULL,
    `notes` TEXT NULL,
    `restrictions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ZoningInfo_titleDeedId_key`(`titleDeedId`),
    INDEX `ZoningInfo_zoneType_idx`(`zoneType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoanLien` (
    `id` VARCHAR(30) NOT NULL,
    `titleDeedId` VARCHAR(30) NOT NULL,
    `type` ENUM('LOAN', 'LIEN', 'OTHER') NOT NULL,
    `lender` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('CLEAR', 'ACTIVE', 'OVERDUE') NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LoanLien_titleDeedId_status_idx`(`titleDeedId`, `status`),
    INDEX `LoanLien_status_dueDate_idx`(`status`, `dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OwnershipHistory` (
    `id` VARCHAR(30) NOT NULL,
    `titleDeedId` VARCHAR(30) NOT NULL,
    `ownerName` VARCHAR(191) NOT NULL,
    `transferDate` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OwnershipHistory_titleDeedId_transferDate_idx`(`titleDeedId`, `transferDate`),
    INDEX `OwnershipHistory_transferDate_idx`(`transferDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchLog` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `titleDeedId` VARCHAR(30) NULL,
    `searchedTitleNumber` VARCHAR(100) NOT NULL,
    `searchedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SearchLog_userId_searchedAt_idx`(`userId`, `searchedAt`),
    INDEX `SearchLog_titleDeedId_searchedAt_idx`(`titleDeedId`, `searchedAt`),
    INDEX `SearchLog_searchedAt_idx`(`searchedAt`),
    INDEX `SearchLog_searchedTitleNumber_idx`(`searchedTitleNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ZoningInfo` ADD CONSTRAINT `ZoningInfo_titleDeedId_fkey` FOREIGN KEY (`titleDeedId`) REFERENCES `TitleDeed`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoanLien` ADD CONSTRAINT `LoanLien_titleDeedId_fkey` FOREIGN KEY (`titleDeedId`) REFERENCES `TitleDeed`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OwnershipHistory` ADD CONSTRAINT `OwnershipHistory_titleDeedId_fkey` FOREIGN KEY (`titleDeedId`) REFERENCES `TitleDeed`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchLog` ADD CONSTRAINT `SearchLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SearchLog` ADD CONSTRAINT `SearchLog_titleDeedId_fkey` FOREIGN KEY (`titleDeedId`) REFERENCES `TitleDeed`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
