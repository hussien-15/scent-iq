import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { requirePermission } from '@/lib/authorization';
import { LAUNCH_APPROVAL_AREAS, QA_CATEGORIES } from '@/lib/qa-catalog';
import { prisma } from '@/lib/prisma';
import { getLaunchReadiness } from '@/services/qa.service';
import { CreateBugForm, LaunchApprovalForm, QaCheckForm, UpdateBugForm } from '@/components/studio/QaControls';

export const dynamic = 'force-dynamic';

const text = (value: string | string[] | undefined) => (Array.isArray(value) ? (value[0] ?? '') : (value ?? ''));

function badge(value: string) {
  if (['PASSED', 'VERIFIED', 'CLOSED'].includes(value)) return 'border-emerald-300/30 text-emerald-300';
  if (['FAILED', 'BLOCKED', 'CRITICAL', 'HIGH', 'OPEN'].includes(value)) return 'border-red-300/30 text-red-200';
  if (['IN_PROGRESS', 'FIXED', 'NEEDS_REVIEW', 'MEDIUM'].includes(value)) return 'border-amber-300/30 text-amber-200';
  return 'border-white/10 text-smoke';
}

export default async function QaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requirePermission('qa.view');
  const [report, admins] = await Promise.all([
    getLaunchReadiness(),
    prisma.user.findMany({
      where: { role: 'ADMIN', OR: [{ adminStatus: 'ACTIVE' }, { adminStatus: null }] },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      select: { id: true, name: true, email: true },
    }),
  ]);
  const query = text(searchParams.q).toLowerCase();
  const category = text(searchParams.category);
  const checkStatus = text(searchParams.checkStatus);
  const bugStatus = text(searchParams.bugStatus);
  const severity = text(searchParams.severity);
  const visibleChecks = report.checks.filter(
    (check) =>
      (!query || `${check.title} ${check.description} ${check.key}`.toLowerCase().includes(query)) &&
      (!category || check.category === category) &&
      (!checkStatus || check.status === checkStatus)
  );
  const visibleBugs = report.bugs.filter(
    (bug) =>
      (!query || `${bug.title} ${bug.description} ${bug.route ?? ''}`.toLowerCase().includes(query)) &&
      (!bugStatus || bug.status === bugStatus) &&
      (!severity || bug.severity === severity)
  );
  const approvalMap = new Map(report.approvals.map((approval) => [approval.area, approval]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Step 26 · evidence-based launch</p>
          <h1 className="font-display text-3xl text-parchment">Final QA & Launch Readiness</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-smoke">
            Record staging evidence, triage reproducible defects, collect accountable approvals, and keep Live Mode
            blocked until the launch standard is genuinely met.
          </p>
        </div>
        <div
          className={`rounded-xl border px-5 py-4 text-center ${report.ready ? 'border-emerald-300/30' : 'border-red-300/30'}`}
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-smoke">Readiness</p>
          <p className={`mt-1 font-display text-4xl ${report.ready ? 'text-emerald-300' : 'text-red-200'}`}>
            {report.overallScore}%
          </p>
          <p className="mt-1 text-[10px] text-smoke">90% overall · critical systems 100%</p>
        </div>
      </div>

      {!report.ready && (
        <section className="rounded-xl border border-red-300/20 bg-red-950/10 p-5">
          <div className="flex items-center gap-2 text-red-200">
            <ShieldAlert size={18} />
            <h2 className="font-medium">Launch is blocked</h2>
          </div>
          <ul className="mt-3 grid gap-2 text-xs leading-5 text-smoke md:grid-cols-2">
            {report.blockers.map((blocker) => (
              <li key={blocker}>• {blocker}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow mb-1">Coverage</p>
            <h2 className="font-display text-2xl text-parchment">System scores</h2>
          </div>
          <p className="text-xs text-smoke">
            {report.criticalChecksPassed}/{report.criticalChecksTotal} critical checks passed
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {report.categoryScores.map((item) => (
            <div
              key={item.key}
              className={`rounded-xl border p-4 ${item.critical && item.score < 100 ? 'border-red-300/25' : 'border-white/10'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium text-parchment">{item.label}</p>
                <span className={item.score === 100 ? 'text-emerald-300' : 'text-gold-bright'}>{item.score}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div className="h-full bg-gold" style={{ width: `${item.score}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-smoke">
                {item.passed}/{item.total} passed {item.critical ? '· critical' : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="eyebrow mb-1">Accountability</p>
          <h2 className="font-display text-2xl text-parchment">Launch approvals</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {LAUNCH_APPROVAL_AREAS.map((area) => {
            const approval = approvalMap.get(area.key) ?? {
              area: area.key,
              approved: false,
              notes: null,
              approvedAt: null,
              approvedBy: null,
            };
            return (
              <details key={area.key} className="rounded-xl border border-white/10 p-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="text-xs font-medium text-parchment">{area.label}</span>
                  {approval.approved ? (
                    <CheckCircle2 size={17} className="text-emerald-300" />
                  ) : (
                    <AlertTriangle size={17} className="text-amber-200" />
                  )}
                </summary>
                <p className="mt-2 text-[10px] leading-4 text-smoke">
                  {approval.approvedAt
                    ? `Approved ${approval.approvedAt.toLocaleString()} by ${approval.approvedBy?.name ?? approval.approvedBy?.email ?? 'admin'}.`
                    : 'Not yet approved.'}
                </p>
                <LaunchApprovalForm approval={approval} />
              </details>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="eyebrow mb-1">Test evidence</p>
          <h2 className="font-display text-2xl text-parchment">QA checklist</h2>
        </div>
        <form className="mb-4 grid gap-3 rounded-xl border border-white/10 p-4 md:grid-cols-4">
          <input
            name="q"
            defaultValue={text(searchParams.q)}
            placeholder="Search checks and bugs"
            className="rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment outline-none"
          />
          <select
            name="category"
            defaultValue={category}
            className="rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment"
          >
            <option value="">All categories</option>
            {QA_CATEGORIES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            name="checkStatus"
            defaultValue={checkStatus}
            className="rounded-md border border-white/10 bg-ink px-3 py-2.5 text-xs text-parchment"
          >
            <option value="">All test results</option>
            {['NOT_TESTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'BLOCKED', 'NOT_APPLICABLE'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button className="min-h-11 flex-1 rounded-md bg-gold px-4 text-xs font-medium text-ink">Filter</button>
            <Link
              href="/studio/qa"
              className="grid min-h-11 place-items-center rounded-md border border-white/10 px-3 text-xs text-smoke"
            >
              Clear
            </Link>
          </div>
        </form>
        <div className="space-y-3">
          {visibleChecks.map((check) => (
            <details key={check.id} className="rounded-xl border border-white/10 p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[9px] ${badge(check.status)}`}>
                      {check.status}
                    </span>
                    {check.critical && (
                      <span className="rounded-full border border-red-300/30 px-2 py-1 text-[9px] text-red-200">
                        CRITICAL
                      </span>
                    )}
                    <span className="text-[10px] text-smoke">{check.category}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-parchment">{check.title}</h3>
                  <p className="mt-1 max-w-4xl text-xs leading-5 text-smoke">{check.description}</p>
                </div>
                <ClipboardCheck size={18} className="text-gold" />
              </summary>
              {check.testedAt && (
                <p className="mt-3 text-[10px] text-smoke">
                  Last tested {check.testedAt.toLocaleString()} by{' '}
                  {check.testedBy?.name ?? check.testedBy?.email ?? 'admin'}.
                </p>
              )}
              <QaCheckForm check={check} />
            </details>
          ))}
          {!visibleChecks.length && (
            <p className="rounded-xl border border-white/10 p-8 text-center text-xs text-smoke">
              No QA checks match these filters.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-white/10 p-5">
          <p className="eyebrow mb-1">Reproducible reports</p>
          <h2 className="mb-4 font-display text-2xl text-parchment">Report a bug</h2>
          <CreateBugForm admins={admins} />
        </div>
        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Triage</p>
              <h2 className="font-display text-2xl text-parchment">Bug manager</h2>
            </div>
            <form className="flex flex-wrap gap-2">
              <input type="hidden" name="q" value={text(searchParams.q)} />
              <select
                name="severity"
                defaultValue={severity}
                className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
              >
                <option value="">All severity</option>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <select
                name="bugStatus"
                defaultValue={bugStatus}
                className="rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
              >
                <option value="">All status</option>
                {['OPEN', 'IN_PROGRESS', 'FIXED', 'NEEDS_REVIEW', 'VERIFIED', 'CLOSED'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
              <button className="rounded-md border border-gold/30 px-3 py-2 text-xs text-gold">Apply</button>
            </form>
          </div>
          <div className="space-y-3">
            {visibleBugs.map((bug) => (
              <details key={bug.id} className="rounded-xl border border-white/10 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-1 text-[9px] ${badge(bug.severity)}`}>
                      {bug.severity}
                    </span>
                    <span className={`rounded-full border px-2 py-1 text-[9px] ${badge(bug.status)}`}>
                      {bug.status}
                    </span>
                    <span className="text-[10px] text-smoke">{bug.environment}</span>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-parchment">{bug.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-smoke">{bug.description}</p>
                </summary>
                <div className="mt-4 grid gap-3 text-xs leading-5 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gold">Reproduce</p>
                    <p className="whitespace-pre-wrap text-smoke">{bug.reproductionSteps}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gold">Expected / actual</p>
                    <p className="text-smoke">Expected: {bug.expectedResult}</p>
                    <p className="mt-2 text-smoke">Actual: {bug.actualResult}</p>
                  </div>
                </div>
                {bug.screenshotUrl && (
                  <a
                    href={bug.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs text-gold underline"
                  >
                    Open screenshot evidence
                  </a>
                )}
                <p className="mt-3 text-[10px] text-smoke">
                  Reported by {bug.reporter.name ?? bug.reporter.email}; assigned to{' '}
                  {bug.assignee?.name ?? bug.assignee?.email ?? 'nobody'}.
                </p>
                <UpdateBugForm bug={bug} admins={admins} />
              </details>
            ))}
            {!visibleBugs.length && (
              <p className="rounded-xl border border-white/10 p-8 text-center text-xs text-smoke">
                No bugs match these filters.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 p-5">
        <h2 className="font-display text-xl text-parchment">Automated and staging workflow</h2>
        <div className="mt-3 grid gap-3 text-xs leading-5 text-smoke md:grid-cols-3">
          <p>
            <strong className="text-parchment">Before every release:</strong> run <code>pnpm qa:check</code> in the
            release environment.
          </p>
          <p>
            <strong className="text-parchment">Against staging:</strong> set <code>QA_BASE_URL</code> and run{' '}
            <code>pnpm qa:smoke</code>, then record device/browser evidence above.
          </p>
          <p>
            <strong className="text-parchment">After launch:</strong> monitor orders, failures, inventory and Core Web
            Vitals for the first 24–72 hours.
          </p>
        </div>
      </section>
    </div>
  );
}
