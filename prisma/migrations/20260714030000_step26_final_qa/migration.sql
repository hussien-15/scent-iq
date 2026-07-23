-- Step 26 adds evidence-backed QA, defect triage and launch approvals.
-- It is intentionally additive: every new check starts untested and every
-- approval starts false, so a migration can never manufacture launch trust.

CREATE TYPE "QaCheckStatus" AS ENUM ('NOT_TESTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'NOT_APPLICABLE');
CREATE TYPE "QaBugSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "QaBugStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FIXED', 'NEEDS_REVIEW', 'VERIFIED', 'CLOSED');
CREATE TYPE "LaunchApprovalArea" AS ENUM ('BUSINESS_OWNER', 'DEVELOPER', 'QA', 'SEO', 'SECURITY', 'CONTENT', 'INVENTORY', 'DELIVERY');

CREATE TABLE "QaCheck" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "critical" BOOLEAN NOT NULL DEFAULT false,
  "weight" INTEGER NOT NULL DEFAULT 1,
  "status" "QaCheckStatus" NOT NULL DEFAULT 'NOT_TESTED',
  "environment" TEXT,
  "device" TEXT,
  "browser" TEXT,
  "evidence" TEXT,
  "notes" TEXT,
  "testedById" TEXT,
  "testedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QaCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QaBug" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "reproductionSteps" TEXT NOT NULL,
  "expectedResult" TEXT NOT NULL,
  "actualResult" TEXT NOT NULL,
  "screenshotUrl" TEXT,
  "severity" "QaBugSeverity" NOT NULL,
  "status" "QaBugStatus" NOT NULL DEFAULT 'OPEN',
  "environment" TEXT NOT NULL,
  "device" TEXT,
  "browser" TEXT,
  "route" TEXT,
  "reporterId" TEXT NOT NULL,
  "assigneeId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QaBug_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LaunchApproval" (
  "id" TEXT NOT NULL,
  "area" "LaunchApprovalArea" NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaunchApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QaCheck_key_key" ON "QaCheck"("key");
CREATE INDEX "QaCheck_category_status_idx" ON "QaCheck"("category", "status");
CREATE INDEX "QaCheck_critical_status_idx" ON "QaCheck"("critical", "status");
CREATE INDEX "QaCheck_testedById_idx" ON "QaCheck"("testedById");
CREATE INDEX "QaBug_severity_status_idx" ON "QaBug"("severity", "status");
CREATE INDEX "QaBug_environment_status_idx" ON "QaBug"("environment", "status");
CREATE INDEX "QaBug_reporterId_idx" ON "QaBug"("reporterId");
CREATE INDEX "QaBug_assigneeId_idx" ON "QaBug"("assigneeId");
CREATE INDEX "QaBug_createdAt_idx" ON "QaBug"("createdAt");
CREATE UNIQUE INDEX "LaunchApproval_area_key" ON "LaunchApproval"("area");
CREATE INDEX "LaunchApproval_approved_area_idx" ON "LaunchApproval"("approved", "area");
CREATE INDEX "LaunchApproval_approvedById_idx" ON "LaunchApproval"("approvedById");

ALTER TABLE "QaCheck" ADD CONSTRAINT "QaCheck_testedById_fkey"
  FOREIGN KEY ("testedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QaBug" ADD CONSTRAINT "QaBug_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "QaBug" ADD CONSTRAINT "QaBug_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LaunchApproval" ADD CONSTRAINT "LaunchApproval_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
