-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR', 'ORDER_MANAGER', 'INVENTORY_MANAGER', 'CUSTOMER_SUPPORT', 'SEO_EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AdminAccountStatus" AS ENUM ('ACTIVE', 'DISABLED', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINE', 'FEMININE', 'UNISEX');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IN_STOCK', 'OUT_OF_STOCK', 'PREORDER', 'HIDDEN', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "InventoryStockStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'RESERVED', 'HIDDEN', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('INITIAL_STOCK', 'MANUAL_ADDITION', 'MANUAL_REDUCTION', 'ORDER_RESERVED', 'ORDER_SHIPPED', 'ORDER_CANCELLED', 'ORDER_RETURNED', 'DAMAGED_PRODUCT', 'MISSING_PRODUCT', 'STOCK_CORRECTION', 'RETURN_TO_STOCK', 'DISCONTINUED_PRODUCT');

-- CreateEnum
CREATE TYPE "InventoryNotificationType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'HIGH_RESERVED', 'HIGH_VIEWS_NO_STOCK', 'FAST_MOVING_RESTOCK');

-- CreateEnum
CREATE TYPE "PerformanceRating" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NoteTier" AS ENUM ('TOP', 'HEART', 'BASE');

-- CreateEnum
CREATE TYPE "CollectionType" AS ENUM ('MANUAL', 'DYNAMIC', 'HYBRID');

-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "CollectionInteractionType" AS ENUM ('VIEW', 'PRODUCT_CLICK', 'ADD_TO_CART', 'PURCHASE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "SeoTemplatePageType" AS ENUM ('PRODUCT', 'BRAND', 'COLLECTION', 'CATEGORY', 'NOTE');

-- CreateEnum
CREATE TYPE "EditorialType" AS ENUM ('PERFUME_GUIDE', 'BUYING_GUIDE', 'COMPARISON', 'SEASONAL_GUIDE', 'BRAND_GUIDE', 'NOTE_GUIDE');

-- CreateEnum
CREATE TYPE "EditorialStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('PAGE_VIEW', 'PRODUCT_VIEW', 'ADD_TO_CART', 'REMOVE_FROM_CART', 'CHECKOUT_STARTED', 'ORDER_PLACED', 'ORDER_CONFIRMED', 'ORDER_DELIVERED', 'ORDER_CANCELLED', 'ORDER_RETURNED', 'WISHLIST_ADDED', 'WISHLIST_REMOVED', 'COLLECTION_VIEW', 'COLLECTION_PRODUCT_CLICK', 'COLLECTION_ADD_TO_CART', 'RECOMMENDATION_IMPRESSION', 'RECOMMENDATION_CLICK');

-- CreateEnum
CREATE TYPE "TrafficSource" AS ENUM ('DIRECT', 'GOOGLE', 'INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'WHATSAPP', 'SOCIAL', 'REFERRAL', 'CAMPAIGN', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('MOBILE', 'DESKTOP', 'TABLET', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OrderInventoryState" AS ENUM ('RESERVED', 'DEDUCTED', 'RELEASED', 'RETURNED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "DeliveryCompanyStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "ReviewApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN', 'REPORTED');

-- CreateEnum
CREATE TYPE "ReviewImageApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewVoteValue" AS ENUM ('HELPFUL', 'NOT_HELPFUL');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('VIEW', 'WISHLIST', 'PURCHASE', 'SEARCH');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "adminRole" "AdminRole",
    "adminStatus" "AdminAccountStatus",
    "permissionOverrides" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deniedPermissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "passwordChangedAt" TIMESTAMP(3),
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecretEncrypted" TEXT,
    "recoveryCodeHashes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "city" TEXT,
    "address" TEXT,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "totalSpending" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "seoContentEn" TEXT,
    "seoContentAr" TEXT,
    "metaTitleEn" TEXT,
    "metaTitleAr" TEXT,
    "metaDescriptionEn" TEXT,
    "metaDescriptionAr" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "ogImage" TEXT,
    "foundedYear" INTEGER,
    "website" TEXT,
    "headquarters" TEXT,
    "industry" TEXT,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "story" TEXT,
    "storyAr" TEXT,
    "signatureStyleEn" TEXT,
    "signatureStyleAr" TEXT,
    "characteristics" TEXT[],
    "searchAliases" TEXT[],
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "originCountry" TEXT,
    "metaTitleEn" TEXT,
    "metaTitleAr" TEXT,
    "metaDescriptionEn" TEXT,
    "metaDescriptionAr" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandSimilarity" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "similarBrandId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfume" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "brandId" TEXT NOT NULL,
    "categoryId" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "costPrice" DECIMAL(65,30),
    "price" DECIMAL(65,30) NOT NULL,
    "oldPrice" DECIMAL(65,30),
    "discountPercent" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "availableStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "availability" "Availability" NOT NULL DEFAULT 'IN_STOCK',
    "inventoryStatus" "InventoryStockStatus" NOT NULL DEFAULT 'OUT_OF_STOCK',
    "inventoryUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warehouseLocation" TEXT,
    "shortDescriptionEn" TEXT,
    "shortDescriptionAr" TEXT,
    "descriptionEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "storyEn" TEXT,
    "storyAr" TEXT,
    "concentration" TEXT,
    "gender" "Gender" NOT NULL,
    "bottleSize" TEXT,
    "releaseYear" INTEGER,
    "countryOfOrigin" TEXT,
    "scentFamilies" TEXT[],
    "longevity" "PerformanceRating",
    "projection" "PerformanceRating",
    "sillage" "PerformanceRating",
    "season" TEXT[],
    "occasion" TEXT[],
    "style" TEXT[],
    "mood" TEXT[],
    "metaTitleEn" TEXT,
    "metaTitleAr" TEXT,
    "metaDescriptionEn" TEXT,
    "metaDescriptionAr" TEXT,
    "keywords" TEXT[],
    "searchAliases" TEXT[],
    "ogImage" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "purchaseCount" INTEGER NOT NULL DEFAULT 0,
    "wishlistCount" INTEGER NOT NULL DEFAULT 0,
    "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bottleSize" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "costPrice" DECIMAL(65,30),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "availableStock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "availability" "Availability" NOT NULL DEFAULT 'IN_STOCK',
    "inventoryStatus" "InventoryStockStatus" NOT NULL DEFAULT 'OUT_OF_STOCK',
    "warehouseLocation" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "variantId" TEXT,
    "orderId" TEXT,
    "adminId" TEXT,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "previousReserved" INTEGER NOT NULL,
    "newReserved" INTEGER NOT NULL,
    "quantityChanged" INTEGER NOT NULL,
    "movementType" "InventoryMovementType" NOT NULL,
    "reason" TEXT NOT NULL,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryNotification" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "type" "InventoryNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAlertSubscription" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAlertSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "category" TEXT,
    "metaTitleEn" TEXT,
    "metaTitleAr" TEXT,
    "metaDescriptionEn" TEXT,
    "metaDescriptionAr" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFaq" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "questionEn" TEXT,
    "answerEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandFaq" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "questionEn" TEXT,
    "answerEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryFaq" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "questionEn" TEXT,
    "answerEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteFaq" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "questionEn" TEXT,
    "answerEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfumeNote" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "tier" "NoteTier" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfumeNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfumeTag" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfumeTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "shortDescriptionAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "buyingGuide" TEXT,
    "buyingGuideAr" TEXT,
    "coverImage" TEXT,
    "coverAlt" TEXT,
    "coverAltAr" TEXT,
    "type" "CollectionType" NOT NULL DEFAULT 'MANUAL',
    "status" "CollectionStatus" NOT NULL DEFAULT 'DRAFT',
    "rules" JSONB,
    "manualOrdering" BOOLEAN NOT NULL DEFAULT true,
    "featuredOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "homepageOrder" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "metaTitleEn" TEXT,
    "metaTitleAr" TEXT,
    "metaDescriptionEn" TEXT,
    "metaDescriptionAr" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ogImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfumeCollection" (
    "id" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "featuredLabelEn" TEXT,
    "featuredLabelAr" TEXT,
    "featuredReasonEn" TEXT,
    "featuredReasonAr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfumeCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionFaq" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "questionEn" TEXT NOT NULL,
    "questionAr" TEXT,
    "answerEn" TEXT NOT NULL,
    "answerAr" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionRelation" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "relatedCollectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionDailyAnalytics" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "productClicks" INTEGER NOT NULL DEFAULT 0,
    "addToCarts" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionDailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionInteraction" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "userId" TEXT,
    "perfumeId" TEXT,
    "actionType" "CollectionInteractionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT,
    "contentHash" TEXT,
    "perfumeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoTemplate" (
    "id" TEXT NOT NULL,
    "pageType" "SeoTemplatePageType" NOT NULL,
    "titleTemplateAr" TEXT NOT NULL,
    "titleTemplateEn" TEXT,
    "descriptionTemplateAr" TEXT NOT NULL,
    "descriptionTemplateEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoRedirect" (
    "id" TEXT NOT NULL,
    "oldPath" TEXT NOT NULL,
    "newPath" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL DEFAULT 308,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoRedirect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialArticle" (
    "id" TEXT NOT NULL,
    "type" "EditorialType" NOT NULL DEFAULT 'PERFUME_GUIDE',
    "status" "EditorialStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT,
    "excerptAr" TEXT,
    "excerptEn" TEXT,
    "contentAr" TEXT NOT NULL,
    "contentEn" TEXT,
    "coverImage" TEXT,
    "coverAltAr" TEXT,
    "coverAltEn" TEXT,
    "metaTitleAr" TEXT,
    "metaTitleEn" TEXT,
    "metaDescriptionAr" TEXT,
    "metaDescriptionEn" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditorialFaq" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "questionAr" TEXT NOT NULL,
    "answerAr" TEXT NOT NULL,
    "questionEn" TEXT,
    "answerEn" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorialFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visitors" INTEGER NOT NULL DEFAULT 0,
    "productViews" INTEGER NOT NULL DEFAULT 0,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cartAbandonment" INTEGER NOT NULL DEFAULT 0,
    "lowStockAlerts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" "AnalyticsEventType" NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT,
    "perfumeId" TEXT,
    "brandId" TEXT,
    "collectionId" TEXT,
    "orderId" TEXT,
    "pathname" TEXT,
    "source" "TrafficSource" NOT NULL DEFAULT 'DIRECT',
    "sourceDetail" TEXT,
    "device" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "value" DECIMAL(65,30),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreWebVital" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "device" "DeviceType" NOT NULL DEFAULT 'UNKNOWN',
    "navigationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoreWebVital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternativePhone" TEXT,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "deliveryNotes" TEXT,
    "internalNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "inventoryState" "OrderInventoryState" NOT NULL DEFAULT 'RESERVED',
    "subtotal" DECIMAL(65,30) NOT NULL,
    "deliveryFee" DECIMAL(65,30) NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "deliveryCompanyId" TEXT,
    "stripeId" TEXT,
    "reviewRequestMarkedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) DEFAULT 0,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "previousStatus" "OrderStatus",
    "newStatus" "OrderStatus" NOT NULL,
    "adminId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "contactNumber" TEXT,
    "estimatedDays" TEXT,
    "status" "DeliveryCompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryFee" (
    "id" TEXT NOT NULL,
    "deliveryCompanyId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "fee" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "reviewerName" TEXT,
    "reviewerFingerprint" TEXT,
    "perfumeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "longevityRating" INTEGER,
    "projectionRating" INTEGER,
    "sillageRating" INTEGER,
    "valueRating" INTEGER,
    "smellQualityRating" INTEGER,
    "packagingQualityRating" INTEGER,
    "deliveryRating" INTEGER,
    "comment" TEXT,
    "wouldRecommend" BOOLEAN,
    "wouldBuyAgain" BOOLEAN,
    "ageRange" TEXT,
    "reviewerGender" TEXT,
    "usageOccasion" TEXT,
    "seasonUsed" TEXT,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "adminReply" TEXT,
    "adminReplyById" TEXT,
    "adminRepliedAt" TIMESTAMP(3),
    "approvalStatus" "ReviewApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewImage" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "approvalStatus" "ReviewImageApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT,
    "voterFingerprint" TEXT NOT NULL,
    "value" "ReviewVoteValue" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewReport" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT,
    "reporterFingerprint" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "perfumeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "perfumeId" TEXT NOT NULL,
    "actionType" "ActionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "normalizedKeyword" TEXT NOT NULL,
    "userId" TEXT,
    "resultsCount" INTEGER NOT NULL,
    "clickedPerfumeId" TEXT,
    "clickedBrandId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "affectedType" TEXT NOT NULL,
    "affectedId" TEXT NOT NULL,
    "affectedName" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "identifierHash" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimitBucket" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookReceipt" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "processedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredFamilies" TEXT[],
    "favoriteSeasons" TEXT[],
    "favoriteStyles" TEXT[],
    "intensity" TEXT,
    "priceRange" TEXT,
    "occasions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TasteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavoriteNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavoriteNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavoriteBrand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavoriteBrand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_nameEn_idx" ON "Category"("nameEn");

-- CreateIndex
CREATE INDEX "Category_nameAr_idx" ON "Category"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_name_idx" ON "Brand"("name");

-- CreateIndex
CREATE INDEX "Brand_nameAr_idx" ON "Brand"("nameAr");

-- CreateIndex
CREATE INDEX "Brand_isFeatured_idx" ON "Brand"("isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "BrandSimilarity_brandId_similarBrandId_key" ON "BrandSimilarity"("brandId", "similarBrandId");

-- CreateIndex
CREATE UNIQUE INDEX "Perfume_slug_key" ON "Perfume"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Perfume_sku_key" ON "Perfume"("sku");

-- CreateIndex
CREATE INDEX "Perfume_brandId_idx" ON "Perfume"("brandId");

-- CreateIndex
CREATE INDEX "Perfume_categoryId_idx" ON "Perfume"("categoryId");

-- CreateIndex
CREATE INDEX "Perfume_price_idx" ON "Perfume"("price");

-- CreateIndex
CREATE INDEX "Perfume_stock_idx" ON "Perfume"("stock");

-- CreateIndex
CREATE INDEX "Perfume_inventoryStatus_idx" ON "Perfume"("inventoryStatus");

-- CreateIndex
CREATE INDEX "Perfume_inventoryStatus_availableStock_idx" ON "Perfume"("inventoryStatus", "availableStock");

-- CreateIndex
CREATE INDEX "Perfume_availability_idx" ON "Perfume"("availability");

-- CreateIndex
CREATE INDEX "Perfume_barcode_idx" ON "Perfume"("barcode");

-- CreateIndex
CREATE INDEX "Perfume_status_idx" ON "Perfume"("status");

-- CreateIndex
CREATE INDEX "Perfume_nameEn_idx" ON "Perfume"("nameEn");

-- CreateIndex
CREATE INDEX "Perfume_nameAr_idx" ON "Perfume"("nameAr");

-- CreateIndex
CREATE INDEX "Perfume_createdAt_idx" ON "Perfume"("createdAt");

-- CreateIndex
CREATE INDEX "Perfume_status_availability_createdAt_idx" ON "Perfume"("status", "availability", "createdAt");

-- CreateIndex
CREATE INDEX "Perfume_brandId_status_availability_idx" ON "Perfume"("brandId", "status", "availability");

-- CreateIndex
CREATE INDEX "Perfume_categoryId_status_availability_idx" ON "Perfume"("categoryId", "status", "availability");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "ProductVariant"("barcode");

-- CreateIndex
CREATE INDEX "ProductVariant_perfumeId_availability_idx" ON "ProductVariant"("perfumeId", "availability");

-- CreateIndex
CREATE INDEX "ProductVariant_stock_idx" ON "ProductVariant"("stock");

-- CreateIndex
CREATE INDEX "ProductVariant_inventoryStatus_idx" ON "ProductVariant"("inventoryStatus");

-- CreateIndex
CREATE INDEX "ProductVariant_inventoryStatus_availableStock_idx" ON "ProductVariant"("inventoryStatus", "availableStock");

-- CreateIndex
CREATE INDEX "InventoryMovement_perfumeId_createdAt_idx" ON "InventoryMovement"("perfumeId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_variantId_createdAt_idx" ON "InventoryMovement"("variantId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_orderId_idx" ON "InventoryMovement"("orderId");

-- CreateIndex
CREATE INDEX "InventoryMovement_movementType_createdAt_idx" ON "InventoryMovement"("movementType", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryNotification_resolvedAt_createdAt_idx" ON "InventoryNotification"("resolvedAt", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryNotification_perfumeId_type_idx" ON "InventoryNotification"("perfumeId", "type");

-- CreateIndex
CREATE INDEX "StockAlertSubscription_perfumeId_notifiedAt_idx" ON "StockAlertSubscription"("perfumeId", "notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockAlertSubscription_perfumeId_phone_email_key" ON "StockAlertSubscription"("perfumeId", "phone", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Note_nameEn_key" ON "Note"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Note_slug_key" ON "Note"("slug");

-- CreateIndex
CREATE INDEX "ProductFaq_perfumeId_position_idx" ON "ProductFaq"("perfumeId", "position");

-- CreateIndex
CREATE INDEX "BrandFaq_brandId_position_idx" ON "BrandFaq"("brandId", "position");

-- CreateIndex
CREATE INDEX "CategoryFaq_categoryId_position_idx" ON "CategoryFaq"("categoryId", "position");

-- CreateIndex
CREATE INDEX "NoteFaq_noteId_position_idx" ON "NoteFaq"("noteId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PerfumeNote_perfumeId_noteId_tier_key" ON "PerfumeNote"("perfumeId", "noteId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PerfumeTag_perfumeId_tagId_key" ON "PerfumeTag"("perfumeId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_status_idx" ON "Collection"("status");

-- CreateIndex
CREATE INDEX "Collection_name_idx" ON "Collection"("name");

-- CreateIndex
CREATE INDEX "Collection_nameAr_idx" ON "Collection"("nameAr");

-- CreateIndex
CREATE INDEX "Collection_status_scheduledAt_idx" ON "Collection"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Collection_featuredOnHomepage_homepageOrder_idx" ON "Collection"("featuredOnHomepage", "homepageOrder");

-- CreateIndex
CREATE INDEX "PerfumeCollection_collectionId_position_idx" ON "PerfumeCollection"("collectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "PerfumeCollection_perfumeId_collectionId_key" ON "PerfumeCollection"("perfumeId", "collectionId");

-- CreateIndex
CREATE INDEX "CollectionFaq_collectionId_position_idx" ON "CollectionFaq"("collectionId", "position");

-- CreateIndex
CREATE INDEX "CollectionRelation_collectionId_position_idx" ON "CollectionRelation"("collectionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionRelation_collectionId_relatedCollectionId_key" ON "CollectionRelation"("collectionId", "relatedCollectionId");

-- CreateIndex
CREATE INDEX "CollectionDailyAnalytics_date_idx" ON "CollectionDailyAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionDailyAnalytics_collectionId_date_key" ON "CollectionDailyAnalytics"("collectionId", "date");

-- CreateIndex
CREATE INDEX "CollectionInteraction_collectionId_actionType_createdAt_idx" ON "CollectionInteraction"("collectionId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "CollectionInteraction_userId_createdAt_idx" ON "CollectionInteraction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Media_contentHash_key" ON "Media"("contentHash");

-- CreateIndex
CREATE INDEX "Media_perfumeId_isPrimary_idx" ON "Media"("perfumeId", "isPrimary");

-- CreateIndex
CREATE INDEX "Media_createdAt_idx" ON "Media"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SeoTemplate_pageType_key" ON "SeoTemplate"("pageType");

-- CreateIndex
CREATE UNIQUE INDEX "SeoRedirect_oldPath_key" ON "SeoRedirect"("oldPath");

-- CreateIndex
CREATE INDEX "SeoRedirect_isActive_oldPath_idx" ON "SeoRedirect"("isActive", "oldPath");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialArticle_slug_key" ON "EditorialArticle"("slug");

-- CreateIndex
CREATE INDEX "EditorialArticle_status_publishedAt_idx" ON "EditorialArticle"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "EditorialArticle_type_idx" ON "EditorialArticle"("type");

-- CreateIndex
CREATE INDEX "EditorialFaq_articleId_position_idx" ON "EditorialFaq"("articleId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "DailyAnalytics_date_key" ON "DailyAnalytics"("date");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_createdAt_idx" ON "AnalyticsEvent"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_perfumeId_eventType_createdAt_idx" ON "AnalyticsEvent"("perfumeId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_brandId_createdAt_idx" ON "AnalyticsEvent"("brandId", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_collectionId_eventType_createdAt_idx" ON "AnalyticsEvent"("collectionId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_orderId_idx" ON "AnalyticsEvent"("orderId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_source_createdAt_idx" ON "AnalyticsEvent"("source", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_device_createdAt_idx" ON "AnalyticsEvent"("device", "createdAt");

-- CreateIndex
CREATE INDEX "CoreWebVital_name_createdAt_idx" ON "CoreWebVital"("name", "createdAt");

-- CreateIndex
CREATE INDEX "CoreWebVital_pathname_createdAt_idx" ON "CoreWebVital"("pathname", "createdAt");

-- CreateIndex
CREATE INDEX "CoreWebVital_device_createdAt_idx" ON "CoreWebVital"("device", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoreWebVital_metricId_name_key" ON "CoreWebVital"("metricId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_submissionId_key" ON "Order"("submissionId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_city_idx" ON "Order"("city");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_perfumeId_idx" ON "OrderItem"("perfumeId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryFee_deliveryCompanyId_city_area_key" ON "DeliveryFee"("deliveryCompanyId", "city", "area");

-- CreateIndex
CREATE INDEX "Review_perfumeId_idx" ON "Review"("perfumeId");

-- CreateIndex
CREATE INDEX "Review_perfumeId_approvalStatus_createdAt_idx" ON "Review"("perfumeId", "approvalStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_approvalStatus_createdAt_idx" ON "Review"("approvalStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Review_verifiedPurchase_helpfulYes_idx" ON "Review"("verifiedPurchase", "helpfulYes");

-- CreateIndex
CREATE UNIQUE INDEX "Review_perfumeId_reviewerFingerprint_key" ON "Review"("perfumeId", "reviewerFingerprint");

-- CreateIndex
CREATE INDEX "ReviewImage_reviewId_approvalStatus_idx" ON "ReviewImage"("reviewId", "approvalStatus");

-- CreateIndex
CREATE INDEX "ReviewVote_reviewId_value_idx" ON "ReviewVote"("reviewId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewVote_reviewId_voterFingerprint_key" ON "ReviewVote"("reviewId", "voterFingerprint");

-- CreateIndex
CREATE INDEX "ReviewReport_reviewId_idx" ON "ReviewReport"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReport_reviewId_reporterFingerprint_key" ON "ReviewReport"("reviewId", "reporterFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_userId_perfumeId_key" ON "Wishlist"("userId", "perfumeId");

-- CreateIndex
CREATE INDEX "UserInteraction_perfumeId_actionType_createdAt_idx" ON "UserInteraction"("perfumeId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "UserInteraction_userId_actionType_createdAt_idx" ON "UserInteraction"("userId", "actionType", "createdAt");

-- CreateIndex
CREATE INDEX "SearchHistory_keyword_idx" ON "SearchHistory"("keyword");

-- CreateIndex
CREATE INDEX "SearchHistory_normalizedKeyword_idx" ON "SearchHistory"("normalizedKeyword");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_idx" ON "SearchHistory"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_resultsCount_createdAt_idx" ON "SearchHistory"("resultsCount", "createdAt");

-- CreateIndex
CREATE INDEX "SearchHistory_clickedPerfumeId_createdAt_idx" ON "SearchHistory"("clickedPerfumeId", "createdAt");

-- CreateIndex
CREATE INDEX "SearchHistory_clickedBrandId_createdAt_idx" ON "SearchHistory"("clickedBrandId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_adminId_idx" ON "ActivityLog"("adminId");

-- CreateIndex
CREATE INDEX "ActivityLog_adminId_createdAt_idx" ON "ActivityLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");

-- CreateIndex
CREATE INDEX "ActivityLog_affectedType_idx" ON "ActivityLog"("affectedType");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifierHash_createdAt_idx" ON "LoginAttempt"("identifierHash", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipHash_createdAt_idx" ON "LoginAttempt"("ipHash", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_success_createdAt_idx" ON "LoginAttempt"("success", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitBucket_action_keyHash_key" ON "RateLimitBucket"("action", "keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPasswordResetToken_tokenHash_key" ON "AdminPasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminPasswordResetToken_userId_expiresAt_idx" ON "AdminPasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "WebhookReceipt_status_createdAt_idx" ON "WebhookReceipt"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookReceipt_provider_eventId_key" ON "WebhookReceipt"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "TasteProfile_userId_key" ON "TasteProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteNote_userId_noteId_key" ON "UserFavoriteNote"("userId", "noteId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavoriteBrand_userId_brandId_key" ON "UserFavoriteBrand"("userId", "brandId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandSimilarity" ADD CONSTRAINT "BrandSimilarity_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandSimilarity" ADD CONSTRAINT "BrandSimilarity_similarBrandId_fkey" FOREIGN KEY ("similarBrandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfume" ADD CONSTRAINT "Perfume_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfume" ADD CONSTRAINT "Perfume_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryNotification" ADD CONSTRAINT "InventoryNotification_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryNotification" ADD CONSTRAINT "InventoryNotification_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlertSubscription" ADD CONSTRAINT "StockAlertSubscription_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFaq" ADD CONSTRAINT "ProductFaq_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandFaq" ADD CONSTRAINT "BrandFaq_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFaq" ADD CONSTRAINT "CategoryFaq_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteFaq" ADD CONSTRAINT "NoteFaq_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfumeNote" ADD CONSTRAINT "PerfumeNote_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfumeNote" ADD CONSTRAINT "PerfumeNote_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfumeTag" ADD CONSTRAINT "PerfumeTag_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfumeTag" ADD CONSTRAINT "PerfumeTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfumeCollection" ADD CONSTRAINT "PerfumeCollection_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfumeCollection" ADD CONSTRAINT "PerfumeCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionFaq" ADD CONSTRAINT "CollectionFaq_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionRelation" ADD CONSTRAINT "CollectionRelation_relatedCollectionId_fkey" FOREIGN KEY ("relatedCollectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionDailyAnalytics" ADD CONSTRAINT "CollectionDailyAnalytics_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionInteraction" ADD CONSTRAINT "CollectionInteraction_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionInteraction" ADD CONSTRAINT "CollectionInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionInteraction" ADD CONSTRAINT "CollectionInteraction_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorialFaq" ADD CONSTRAINT "EditorialFaq_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "EditorialArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryFee" ADD CONSTRAINT "DeliveryFee_deliveryCompanyId_fkey" FOREIGN KEY ("deliveryCompanyId") REFERENCES "DeliveryCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_adminReplyById_fkey" FOREIGN KEY ("adminReplyById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewImage" ADD CONSTRAINT "ReviewImage_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewVote" ADD CONSTRAINT "ReviewVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReport" ADD CONSTRAINT "ReviewReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInteraction" ADD CONSTRAINT "UserInteraction_perfumeId_fkey" FOREIGN KEY ("perfumeId") REFERENCES "Perfume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPasswordResetToken" ADD CONSTRAINT "AdminPasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasteProfile" ADD CONSTRAINT "TasteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteNote" ADD CONSTRAINT "UserFavoriteNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteNote" ADD CONSTRAINT "UserFavoriteNote_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteBrand" ADD CONSTRAINT "UserFavoriteBrand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavoriteBrand" ADD CONSTRAINT "UserFavoriteBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
