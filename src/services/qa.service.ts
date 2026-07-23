import type { LaunchApprovalArea, QaBugSeverity, QaBugStatus, QaCheckStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { LAUNCH_APPROVAL_AREAS, QA_CATEGORIES, type QaCategoryKey } from '@/lib/qa-catalog';

export type ReadinessCheckInput = {
  key: string;
  category: string;
  title: string;
  critical: boolean;
  weight: number;
  status: QaCheckStatus;
};

export type ReadinessBugInput = {
  id: string;
  title: string;
  severity: QaBugSeverity;
  status: QaBugStatus;
};

export type ReadinessApprovalInput = {
  area: LaunchApprovalArea;
  approved: boolean;
};

const resolvedBugStatuses = new Set<QaBugStatus>(['VERIFIED', 'CLOSED']);

export function calculateLaunchReadiness(
  checks: ReadinessCheckInput[],
  bugs: ReadinessBugInput[],
  approvals: ReadinessApprovalInput[]
) {
  const categoryScores = QA_CATEGORIES.map((category) => {
    const rows = checks.filter((check) => check.category === category.key);
    const eligible = rows.filter((check) => check.status !== 'NOT_APPLICABLE' || check.critical || category.critical);
    const possible = eligible.reduce((sum, check) => sum + Math.max(1, check.weight), 0);
    const earned = eligible.reduce(
      (sum, check) => sum + (check.status === 'PASSED' ? Math.max(1, check.weight) : 0),
      0
    );
    return {
      ...category,
      score: possible ? Math.round((earned / possible) * 100) : 0,
      passed: rows.filter((check) => check.status === 'PASSED').length,
      total: rows.length,
    };
  });
  const overallScore = Math.round(
    categoryScores.reduce((sum, category) => sum + category.score, 0) / categoryScores.length
  );
  const criticalChecks = checks.filter((check) => check.critical);
  const failedCriticalChecks = criticalChecks.filter((check) => check.status !== 'PASSED');
  const criticalCategoriesReady = categoryScores
    .filter((category) => category.critical)
    .every((category) => category.score === 100);
  const blockingBugs = bugs.filter(
    (bug) => (bug.severity === 'CRITICAL' || bug.severity === 'HIGH') && !resolvedBugStatuses.has(bug.status)
  );
  const approvalsByArea = new Map(approvals.map((approval) => [approval.area, approval.approved]));
  const missingApprovals = LAUNCH_APPROVAL_AREAS.filter((approval) => approvalsByArea.get(approval.key) !== true);
  const blockers = [
    overallScore < 90 ? `Overall readiness is ${overallScore}%; launch requires at least 90%.` : null,
    !criticalCategoriesReady ? 'Every critical system category must score 100%.' : null,
    ...failedCriticalChecks.slice(0, 5).map((check) => `Critical check not passed: ${check.title}.`),
    ...blockingBugs.slice(0, 5).map((bug) => `${bug.severity} bug unresolved: ${bug.title}.`),
    missingApprovals.length
      ? `Missing launch approvals: ${missingApprovals.map((approval) => approval.label).join(', ')}.`
      : null,
  ].filter((item): item is string => Boolean(item));

  return {
    ready:
      overallScore >= 90 &&
      criticalCategoriesReady &&
      failedCriticalChecks.length === 0 &&
      blockingBugs.length === 0 &&
      missingApprovals.length === 0,
    overallScore,
    categoryScores,
    criticalCategoriesReady,
    criticalChecksTotal: criticalChecks.length,
    criticalChecksPassed: criticalChecks.length - failedCriticalChecks.length,
    failedCriticalChecks,
    blockingBugs,
    missingApprovals,
    blockers,
  };
}

export async function getLaunchReadiness() {
  const [checks, bugs, approvals] = await Promise.all([
    prisma.qaCheck.findMany({
      orderBy: [{ category: 'asc' }, { critical: 'desc' }, { title: 'asc' }],
      include: { testedBy: { select: { id: true, name: true, email: true } } },
    }),
    prisma.qaBug.findMany({
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.launchApproval.findMany({
      orderBy: { area: 'asc' },
      include: { approvedBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);
  return { checks, bugs, approvals, ...calculateLaunchReadiness(checks, bugs, approvals) };
}

export function isQaCategory(value: string): value is QaCategoryKey {
  return QA_CATEGORIES.some((category) => category.key === value);
}

export function isLaunchApprovalArea(value: string): value is LaunchApprovalArea {
  return LAUNCH_APPROVAL_AREAS.some((area) => area.key === value);
}
