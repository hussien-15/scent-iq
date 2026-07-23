-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BrandStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'ALL_SEASONS');

-- CreateEnum
CREATE TYPE "Occasion" AS ENUM ('DAILY', 'OFFICE', 'FORMAL', 'DATE_NIGHT', 'WEDDING', 'TRAVEL', 'EVENING', 'CASUAL');

-- CreateEnum
CREATE TYPE "FragranceFamily" AS ENUM ('WOODY', 'FRESH', 'ORIENTAL', 'AMBER', 'FLORAL', 'SWEET', 'LEATHER', 'OUD', 'VANILLA', 'CITRUS', 'SPICY', 'AQUATIC', 'GREEN', 'FRUITY', 'POWDERY', 'MUSKY');

-- CreateEnum
CREATE TYPE "Style" AS ENUM ('ELEGANT', 'LUXURY', 'FRESH', 'SWEET', 'DARK', 'MODERN', 'CLASSIC');

-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('CONFIDENT', 'ROMANTIC', 'CALM', 'BOLD', 'ENERGETIC', 'MYSTERIOUS');

-- CreateEnum
CREATE TYPE "HomepageSectionType" AS ENUM ('HERO', 'FEATURED_BRANDS', 'BEST_SELLERS', 'COLLECTIONS', 'SMART_RECOMMENDATIONS', 'REVIEWS', 'NEWSLETTER');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RecommendationBlockType" AS ENUM ('SIMILAR_FRAGRANCES', 'BUDGET_ALTERNATIVES', 'LUXURY_ALTERNATIVES', 'SAME_BRAND', 'SEASONAL_PICKS', 'TRENDING', 'EDITOR_PICK');

-- CreateEnum
CREATE TYPE "RecommendationAction" AS ENUM ('IMPRESSION', 'CLICK', 'ADD_TO_CART', 'PURCHASE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Gender" ADD VALUE 'MEN';
ALTER TYPE "Gender" ADD VALUE 'WOMEN';

-- AlterEnum
ALTER TYPE "InventoryMovementType" ADD VALUE 'ORDER_RELEASED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductStatus" ADD VALUE 'HIDDEN';
ALTER TYPE "ProductStatus" ADD VALUE 'DISCONTINUED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MediaType" ADD VALUE 'DOCUMENT';
ALTER TYPE "MediaType" ADD VALUE 'LOGO';
ALTER TYPE "MediaType" ADD VALUE 'BANNER';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AnalyticsEventType" ADD VALUE 'BRAND_VIEW';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'SEARCH';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'ORDER_CREATED';
ALTER TYPE "AnalyticsEventType" ADD VALUE 'WISHLIST_ADD';

-- AlterEnum
ALTER TYPE "DeliveryCompanyStatus" ADD VALUE 'ARCHIVED';

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_perfumeId_fkey";

-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "VerificationToken"
SET "id" = SUBSTRING(MD5("identifier" || ':' || "token"), 1, 8) || '-' ||
           SUBSTRING(MD5("identifier" || ':' || "token"), 9, 4) || '-' ||
           SUBSTRING(MD5("identifier" || ':' || "token"), 13, 4) || '-' ||
           SUBSTRING(MD5("identifier" || ':' || "token"), 17, 4) || '-' ||
           SUBSTRING(MD5("identifier" || ':' || "token"), 21, 12);

ALTER TABLE "VerificationToken" ALTER COLUMN "id" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ADD CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "CategoryStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "bannerId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "logoId" TEXT,
ADD COLUMN     "status" "BrandStatus" NOT NULL DEFAULT 'PUBLISHED';

-- AlterTable
ALTER TABLE "Perfume" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "mainImageId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoId" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IQD',
ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "oldPrice" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "imageId" TEXT;

-- AlterTable
ALTER TABLE "PerfumeNote" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "strength" INTEGER;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "descriptionAr" TEXT,
ADD COLUMN     "descriptionEn" TEXT,
ADD COLUMN     "nameAr" TEXT,
ADD COLUMN     "nameEn" TEXT,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "coverImageId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "altTextAr" TEXT,
ADD COLUMN     "altTextEn" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "folder" TEXT,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "storagePath" TEXT,
ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "uploadedById" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "group" TEXT NOT NULL DEFAULT 'general',
ALTER COLUMN "value" TYPE JSONB USING TO_JSONB("value");

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "CoreWebVital" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "CoreWebVital" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IQD',
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerNameSnapshot" TEXT,
ADD COLUMN     "customerPhoneSnapshot" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "paymentMethodType" "PaymentMethod" NOT NULL DEFAULT 'CASH_ON_DELIVERY';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "brandNameSnapshot" TEXT,
ADD COLUMN     "productNameSnapshot" TEXT,
ADD COLUMN     "skuSnapshot" TEXT;

-- AlterTable
ALTER TABLE "DeliveryCompany" ADD COLUMN     "baseFee" DECIMAL(65,30),
ADD COLUMN     "logoId" TEXT,
ADD COLUMN     "supportedAreas" JSONB,
ADD COLUMN     "supportedCities" JSONB;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "orderId" TEXT;

-- AlterTable
ALTER TABLE "ReviewVote" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "sessionId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SearchHistory" ADD COLUMN     "clickedCollectionId" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "sessionId" TEXT;

-- CreateTable
CREATE TABLE "AdminRoleDefinition" (
    "id" TEXT NOT NULL,
    "key" "AdminRole" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRoleDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminRolePermission" (
    "id" TEXT NOT NULL,
    "adminRoleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUserRole" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "adminRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSection" (
    "id" TEXT NOT NULL,
    "type" "HomepageSectionType" NOT NULL,
    "titleAr" TEXT,
    "titleEn" TEXT,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "backgroundMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternativePhone" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "address" TEXT NOT NULL,
    "nearestLandmark" TEXT,
    "notes" TEXT,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpending" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerId" TEXT,
    "sessionId" TEXT,
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "customerId" TEXT,
    "sourceProductId" TEXT,
    "recommendedProductId" TEXT NOT NULL,
    "blockType" "RecommendationBlockType" NOT NULL,
    "action" "RecommendationAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Backfill existing business data before unique indexes and foreign keys are
-- enforced. This keeps databases created by Steps 1-21 deployable without a
-- reset or loss of orders/settings.
WITH latest_customer AS (
    SELECT DISTINCT ON ("phone")
        "phone", "customerName", "alternativePhone", "city", "area", "address", "landmark", "createdAt"
    FROM "Order"
    WHERE "phone" IS NOT NULL AND BTRIM("phone") <> ''
    ORDER BY "phone", "createdAt" DESC
), customer_uuid AS (
    SELECT *, MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT || "phone") AS hash
    FROM latest_customer
)
INSERT INTO "Customer" (
    "id", "name", "phone", "alternativePhone", "city", "area", "address",
    "nearestLandmark", "orderCount", "totalSpending", "createdAt", "updatedAt"
)
SELECT
    SUBSTRING(hash, 1, 8) || '-' || SUBSTRING(hash, 9, 4) || '-' ||
    SUBSTRING(hash, 13, 4) || '-' || SUBSTRING(hash, 17, 4) || '-' || SUBSTRING(hash, 21, 12),
    "customerName", "phone", "alternativePhone", "city", "area", "address", "landmark",
    0, 0, "createdAt", CURRENT_TIMESTAMP
FROM customer_uuid
;

UPDATE "Customer" customer
SET "orderCount" = summary.order_count,
    "totalSpending" = summary.total_spending,
    "updatedAt" = CURRENT_TIMESTAMP
FROM (
    SELECT "phone", COUNT(*)::INTEGER AS order_count, COALESCE(SUM("total"), 0) AS total_spending
    FROM "Order"
    GROUP BY "phone"
) summary
WHERE customer."phone" = summary."phone";

UPDATE "Order" orders
SET "customerId" = customer."id",
    "customerNameSnapshot" = orders."customerName",
    "customerPhoneSnapshot" = orders."phone",
    "orderNumber" = 'SIQ-LEGACY-' || UPPER(REPLACE(orders."id", '-', ''))
FROM "Customer" customer
WHERE customer."phone" = orders."phone";

UPDATE "Order"
SET "customerNameSnapshot" = COALESCE("customerNameSnapshot", "customerName"),
    "customerPhoneSnapshot" = COALESCE("customerPhoneSnapshot", "phone"),
    "orderNumber" = COALESCE("orderNumber", 'SIQ-LEGACY-' || UPPER(REPLACE("id", '-', '')));

UPDATE "OrderItem" item
SET "productNameSnapshot" = COALESCE(product."nameAr", product."nameEn"),
    "brandNameSnapshot" = COALESCE(brand."nameAr", brand."name"),
    "skuSnapshot" = COALESCE(
        (SELECT variant."sku" FROM "ProductVariant" variant WHERE variant."id" = item."variantId"),
        product."sku"
    )
FROM "Perfume" product
JOIN "Brand" brand ON brand."id" = product."brandId"
WHERE product."id" = item."perfumeId";

UPDATE "Perfume"
SET "publishedAt" = COALESCE("publishedAt", "updatedAt")
WHERE "status" = 'PUBLISHED';

UPDATE "Perfume" product
SET "averageRating" = review_summary.average_rating,
    "reviewCount" = review_summary.review_count
FROM (
    SELECT "perfumeId", AVG("rating")::DOUBLE PRECISION AS average_rating, COUNT(*)::INTEGER AS review_count
    FROM "Review"
    WHERE "approvalStatus" = 'APPROVED'
    GROUP BY "perfumeId"
) review_summary
WHERE product."id" = review_summary."perfumeId";

INSERT INTO "ProductMedia" ("id", "productId", "mediaId", "sortOrder", "isPrimary", "createdAt", "updatedAt")
SELECT
    SUBSTRING(hash, 1, 8) || '-' || SUBSTRING(hash, 9, 4) || '-' ||
    SUBSTRING(hash, 13, 4) || '-' || SUBSTRING(hash, 17, 4) || '-' || SUBSTRING(hash, 21, 12),
    "perfumeId", "id", (ROW_NUMBER() OVER (PARTITION BY "perfumeId" ORDER BY "isPrimary" DESC, "createdAt") - 1)::INTEGER,
    "isPrimary", "createdAt", "updatedAt"
FROM (
    SELECT media.*, MD5(media."id" || ':' || media."perfumeId") AS hash
    FROM "Media" media
    WHERE media."perfumeId" IS NOT NULL
) legacy_media
;

UPDATE "SearchHistory" search
SET "clickedPerfumeId" = NULL
WHERE "clickedPerfumeId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Perfume" product WHERE product."id" = search."clickedPerfumeId");

UPDATE "SearchHistory" search
SET "clickedBrandId" = NULL
WHERE "clickedBrandId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Brand" brand WHERE brand."id" = search."clickedBrandId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRoleDefinition_key_key" ON "AdminRoleDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "AdminRolePermission_permissionId_idx" ON "AdminRolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminRolePermission_adminRoleId_permissionId_key" ON "AdminRolePermission"("adminRoleId", "permissionId");

-- CreateIndex
CREATE INDEX "AdminUserRole_adminRoleId_idx" ON "AdminUserRole"("adminRoleId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserRole_adminUserId_adminRoleId_key" ON "AdminUserRole"("adminUserId", "adminRoleId");

-- CreateIndex
CREATE INDEX "ProductMedia_productId_sortOrder_idx" ON "ProductMedia"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductMedia_mediaId_idx" ON "ProductMedia"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMedia_productId_mediaId_key" ON "ProductMedia"("productId", "mediaId");

-- CreateIndex
CREATE INDEX "HomepageSection_enabled_sortOrder_idx" ON "HomepageSection"("enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_city_idx" ON "Customer"("city");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- CreateIndex
CREATE INDEX "Cart_userId_status_idx" ON "Cart"("userId", "status");

-- CreateIndex
CREATE INDEX "Cart_customerId_status_idx" ON "Cart"("customerId", "status");

-- CreateIndex
CREATE INDEX "Cart_sessionId_status_idx" ON "Cart"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Cart_expiresAt_idx" ON "Cart"("expiresAt");

-- CreateIndex
CREATE INDEX "CartItem_perfumeId_idx" ON "CartItem"("perfumeId");

-- CreateIndex
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_perfumeId_variantId_key" ON "CartItem"("cartId", "perfumeId", "variantId");

-- CreateIndex
CREATE INDEX "RecommendationLog_sessionId_createdAt_idx" ON "RecommendationLog"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationLog_customerId_createdAt_idx" ON "RecommendationLog"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationLog_sourceProductId_createdAt_idx" ON "RecommendationLog"("sourceProductId", "createdAt");

-- CreateIndex
CREATE INDEX "RecommendationLog_recommendedProductId_action_createdAt_idx" ON "RecommendationLog"("recommendedProductId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_createdAt_idx" ON "AuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "Category_status_sortOrder_idx" ON "Category"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_deletedAt_idx" ON "Category"("deletedAt");

-- CreateIndex
CREATE INDEX "Brand_status_isFeatured_idx" ON "Brand"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "Brand_deletedAt_idx" ON "Brand"("deletedAt");

-- CreateIndex
CREATE INDEX "Perfume_deletedAt_idx" ON "Perfume"("deletedAt");

-- CreateIndex
CREATE INDEX "Perfume_publishedAt_idx" ON "Perfume"("publishedAt");

-- CreateIndex
CREATE INDEX "PerfumeNote_perfumeId_tier_sortOrder_idx" ON "PerfumeNote"("perfumeId", "tier", "sortOrder");

-- CreateIndex
CREATE INDEX "Collection_deletedAt_idx" ON "Collection"("deletedAt");

-- CreateIndex
CREATE INDEX "Media_uploadedById_createdAt_idx" ON "Media"("uploadedById", "createdAt");

-- CreateIndex
CREATE INDEX "Settings_group_idx" ON "Settings"("group");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_customerId_createdAt_idx" ON "AnalyticsEvent"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_orderId_idx" ON "Review"("orderId");

-- CreateIndex
CREATE INDEX "ReviewVote_customerId_idx" ON "ReviewVote"("customerId");

-- CreateIndex
CREATE INDEX "Wishlist_sessionId_createdAt_idx" ON "Wishlist"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_customerId_perfumeId_key" ON "Wishlist"("customerId", "perfumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_sessionId_perfumeId_key" ON "Wishlist"("sessionId", "perfumeId");

-- CreateIndex
CREATE INDEX "SearchHistory_customerId_idx" ON "SearchHistory"("customerId");

-- CreateIndex
CREATE INDEX "SearchHistory_sessionId_createdAt_idx" ON "SearchHistory"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchHistory_clickedCollectionId_createdAt_idx" ON "SearchHistory"("clickedCollectionId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_adminRoleId_fkey" FOREIGN KEY ("adminRoleId") REFERENCES "AdminRoleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRolePermission" ADD CONSTRAINT "AdminRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserRole" ADD CONSTRAINT "AdminUserRole_adminRoleId_fkey" FOREIGN KEY ("adminRoleId") REFERENCES "AdminRoleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfume" ADD CONSTRAINT "Perfume_mainImageId_fkey" FOREIGN KEY ("mainImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfume" ADD CONSTRAINT "Perfume_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMedia" ADD CONSTRAINT "ProductMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageSection" ADD CONSTRAINT "HomepageSection_backgroundMediaId_fkey" FOREIGN KEY ("backgroundMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryCompany" ADD CONSTRAINT "DeliveryCompany_logoId_fkey" FOREIGN KEY ("logoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_clickedPerfumeId_fkey" FOREIGN KEY ("clickedPerfumeId") REFERENCES "Perfume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_clickedBrandId_fkey" FOREIGN KEY ("clickedBrandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_clickedCollectionId_fkey" FOREIGN KEY ("clickedCollectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationLog" ADD CONSTRAINT "RecommendationLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationLog" ADD CONSTRAINT "RecommendationLog_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Perfume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationLog" ADD CONSTRAINT "RecommendationLog_recommendedProductId_fkey" FOREIGN KEY ("recommendedProductId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
