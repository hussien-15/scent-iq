-- Step 23 only expands the homepage section vocabulary. PostgreSQL enum
-- additions are additive and preserve every existing row.
ALTER TYPE "HomepageSectionType" ADD VALUE IF NOT EXISTS 'SMART_SEARCH';
ALTER TYPE "HomepageSectionType" ADD VALUE IF NOT EXISTS 'FEATURE_HIGHLIGHTS';
ALTER TYPE "HomepageSectionType" ADD VALUE IF NOT EXISTS 'CATEGORIES';
ALTER TYPE "HomepageSectionType" ADD VALUE IF NOT EXISTS 'OCCASIONS';
ALTER TYPE "HomepageSectionType" ADD VALUE IF NOT EXISTS 'FRAGRANCE_FAMILIES';
ALTER TYPE "HomepageSectionType" ADD VALUE IF NOT EXISTS 'FOOTER';
