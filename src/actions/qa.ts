'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requirePermission } from '@/lib/authorization';
import type { AdminPermission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { isLaunchApprovalArea } from '@/services/qa.service';

export type QaActionState = { success?: boolean; error?: string };

const checkSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['NOT_TESTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'NOT_APPLICABLE']),
  environment: z.string().trim().max(80),
  device: z.string().trim().max(120),
  browser: z.string().trim().max(120),
  evidence: z.string().trim().max(2000),
  notes: z.string().trim().max(3000),
});

function refreshQa() {
  for (const path of ['/studio/qa', '/studio/setup', '/studio/system-health', '/studio/activity']) {
    revalidatePath(path);
  }
}

function message(error: unknown, fallback: string) {
  if (error instanceof z.ZodError) return error.issues[0]?.message ?? fallback;
  return error instanceof Error ? error.message : fallback;
}

export async function updateQaCheck(_state: QaActionState, formData: FormData): Promise<QaActionState> {
  const admin = await requirePermission('qa.manage');
  try {
    const parsed = checkSchema.parse({
      id: String(formData.get('id') ?? ''),
      status: String(formData.get('status') ?? ''),
      environment: String(formData.get('environment') ?? ''),
      device: String(formData.get('device') ?? ''),
      browser: String(formData.get('browser') ?? ''),
      evidence: String(formData.get('evidence') ?? ''),
      notes: String(formData.get('notes') ?? ''),
    });
    const current = await prisma.qaCheck.findUniqueOrThrow({ where: { id: parsed.id } });
    const reset = parsed.status === 'NOT_TESTED';
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.qaCheck.update({
        where: { id: parsed.id },
        data: {
          status: parsed.status,
          environment: parsed.environment || null,
          device: parsed.device || null,
          browser: parsed.browser || null,
          evidence: parsed.evidence || null,
          notes: parsed.notes || null,
          testedById: reset ? null : admin.id,
          testedAt: reset ? null : new Date(),
        },
      });
      await tx.activityLog.create({
        data: {
          adminId: admin.id,
          actorName: admin.name ?? admin.email,
          action: 'qa.check.updated',
          affectedType: 'QaCheck',
          affectedId: row.id,
          affectedName: row.title,
          previousValue: { status: current.status },
          newValue: { status: row.status, environment: row.environment },
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'QA_CHECK_UPDATED',
          entityType: 'QaCheck',
          entityId: row.id,
          previousValue: { status: current.status },
          newValue: { status: row.status, evidence: Boolean(row.evidence) },
        },
      });
      return row;
    });
    refreshQa();
    return { success: Boolean(updated.id) };
  } catch (error) {
    return { error: message(error, 'The QA check could not be updated.') };
  }
}

const bugCreateSchema = z.object({
  title: z.string().trim().min(5).max(180),
  description: z.string().trim().min(10).max(3000),
  reproductionSteps: z.string().trim().min(10).max(5000),
  expectedResult: z.string().trim().min(3).max(3000),
  actualResult: z.string().trim().min(3).max(3000),
  screenshotUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  environment: z.string().trim().min(2).max(80),
  device: z.string().trim().max(120),
  browser: z.string().trim().max(120),
  route: z.string().trim().max(300),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
});

export async function createQaBug(_state: QaActionState, formData: FormData): Promise<QaActionState> {
  const admin = await requirePermission('qa.manage');
  try {
    const parsed = bugCreateSchema.parse(Object.fromEntries(formData));
    if (parsed.assigneeId) {
      const assignee = await prisma.user.count({ where: { id: parsed.assigneeId, role: 'ADMIN' } });
      if (!assignee) return { error: 'Choose an active admin assignee.' };
    }
    const bug = await prisma.$transaction(async (tx) => {
      const created = await tx.qaBug.create({
        data: {
          title: parsed.title,
          description: parsed.description,
          reproductionSteps: parsed.reproductionSteps,
          expectedResult: parsed.expectedResult,
          actualResult: parsed.actualResult,
          screenshotUrl: parsed.screenshotUrl || null,
          severity: parsed.severity,
          environment: parsed.environment,
          device: parsed.device || null,
          browser: parsed.browser || null,
          route: parsed.route || null,
          reporterId: admin.id,
          assigneeId: parsed.assigneeId || null,
        },
      });
      await tx.activityLog.create({
        data: {
          adminId: admin.id,
          actorName: admin.name ?? admin.email,
          action: 'qa.bug.reported',
          affectedType: 'QaBug',
          affectedId: created.id,
          affectedName: created.title,
          previousValue: Prisma.JsonNull,
          newValue: { severity: created.severity, status: created.status },
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'QA_BUG_REPORTED',
          entityType: 'QaBug',
          entityId: created.id,
          previousValue: Prisma.JsonNull,
          newValue: { severity: created.severity, status: created.status },
        },
      });
      return created;
    });
    refreshQa();
    return { success: Boolean(bug.id) };
  } catch (error) {
    return { error: message(error, 'The bug report could not be created.') };
  }
}

const bugUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'FIXED', 'NEEDS_REVIEW', 'VERIFIED', 'CLOSED']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  assigneeId: z.string().uuid().optional().or(z.literal('')),
});

export async function updateQaBug(_state: QaActionState, formData: FormData): Promise<QaActionState> {
  const admin = await requirePermission('qa.manage');
  try {
    const parsed = bugUpdateSchema.parse(Object.fromEntries(formData));
    const current = await prisma.qaBug.findUniqueOrThrow({ where: { id: parsed.id } });
    if (parsed.assigneeId) {
      const assignee = await prisma.user.count({ where: { id: parsed.assigneeId, role: 'ADMIN' } });
      if (!assignee) return { error: 'Choose a valid admin assignee.' };
    }
    const now = new Date();
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.qaBug.update({
        where: { id: parsed.id },
        data: {
          status: parsed.status,
          severity: parsed.severity,
          assigneeId: parsed.assigneeId || null,
          verifiedAt: ['VERIFIED', 'CLOSED'].includes(parsed.status) ? now : null,
          closedAt: parsed.status === 'CLOSED' ? now : null,
        },
      });
      await tx.activityLog.create({
        data: {
          adminId: admin.id,
          actorName: admin.name ?? admin.email,
          action: 'qa.bug.updated',
          affectedType: 'QaBug',
          affectedId: row.id,
          affectedName: row.title,
          previousValue: { status: current.status, severity: current.severity },
          newValue: { status: row.status, severity: row.severity },
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'QA_BUG_UPDATED',
          entityType: 'QaBug',
          entityId: row.id,
          previousValue: { status: current.status, severity: current.severity },
          newValue: { status: row.status, severity: row.severity },
        },
      });
      return row;
    });
    refreshQa();
    return { success: Boolean(updated.id) };
  } catch (error) {
    return { error: message(error, 'The bug could not be updated.') };
  }
}

const approvalPermissions: Record<string, AdminPermission> = {
  BUSINESS_OWNER: 'admin_users.manage',
  DEVELOPER: 'admin_users.manage',
  QA: 'qa.approve',
  SEO: 'seo.edit',
  SECURITY: 'admin_users.manage',
  CONTENT: 'products.publish',
  INVENTORY: 'inventory.adjust',
  DELIVERY: 'delivery.edit',
};

export async function updateLaunchApproval(_state: QaActionState, formData: FormData): Promise<QaActionState> {
  const area = String(formData.get('area') ?? '');
  if (!isLaunchApprovalArea(area)) return { error: 'Invalid approval area.' };
  const admin = await requirePermission(approvalPermissions[area]);
  const parsed = z.object({ approved: z.boolean(), notes: z.string().trim().max(1500) }).safeParse({
    approved: formData.get('approved') === 'on',
    notes: String(formData.get('notes') ?? ''),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Review the approval.' };
  try {
    const current = await prisma.launchApproval.findUnique({ where: { area } });
    const approval = await prisma.$transaction(async (tx) => {
      const row = await tx.launchApproval.upsert({
        where: { area },
        create: {
          area,
          approved: parsed.data.approved,
          notes: parsed.data.notes || null,
          approvedById: parsed.data.approved ? admin.id : null,
          approvedAt: parsed.data.approved ? new Date() : null,
        },
        update: {
          approved: parsed.data.approved,
          notes: parsed.data.notes || null,
          approvedById: parsed.data.approved ? admin.id : null,
          approvedAt: parsed.data.approved ? new Date() : null,
        },
      });
      await tx.activityLog.create({
        data: {
          adminId: admin.id,
          actorName: admin.name ?? admin.email,
          action: 'launch.approval.updated',
          affectedType: 'LaunchApproval',
          affectedId: row.id,
          affectedName: area,
          previousValue: current ? { approved: current.approved } : Prisma.JsonNull,
          newValue: { approved: row.approved },
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: 'LAUNCH_APPROVAL_UPDATED',
          entityType: 'LaunchApproval',
          entityId: row.id,
          previousValue: current ? { approved: current.approved } : Prisma.JsonNull,
          newValue: { approved: row.approved, area },
        },
      });
      return row;
    });
    refreshQa();
    return { success: Boolean(approval.id) };
  } catch (error) {
    return { error: message(error, 'The launch approval could not be updated.') };
  }
}
