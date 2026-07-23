import {
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Cloud,
  Database,
  Rocket,
  ServerCog,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { requireSuperAdmin } from '@/lib/authorization';
import { getSystemHealth } from '@/services/system-health.service';

export const dynamic = 'force-dynamic';

const GROUPS = [
  { key: 'environment', title: 'Environment variables', icon: ServerCog },
  { key: 'database', title: 'Database connection', icon: Database },
  { key: 'seed', title: 'Seed and core data', icon: ShieldCheck },
  { key: 'storage', title: 'Persistent media', icon: Cloud },
  { key: 'quality', title: 'Final QA gate', icon: ClipboardCheck },
  { key: 'deployment', title: 'Deployment and launch', icon: Rocket },
] as const;

export default async function SystemHealthPage() {
  await requireSuperAdmin();
  const report = await getSystemHealth();
  const failures = report.checks.filter((check) => check.status === 'fail').length;
  const warnings = report.checks.filter((check) => check.status === 'warning').length;

  return (
    <div className="space-y-7 pb-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Super Admin only · secret-safe diagnostics</p>
          <h1 className="font-display text-3xl text-parchment">System Health</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-smoke">
            Checks configuration, PostgreSQL and Prisma, the first admin, persistent storage, deployment identity,
            maintenance state, final QA evidence, launch approvals, and sitemap readiness without displaying secret
            values.
          </p>
        </div>
        <div
          className={`rounded-full border px-4 py-2 text-xs ${failures ? 'border-red-300/30 text-red-200' : warnings ? 'border-amber-300/30 text-amber-200' : 'border-emerald-300/30 text-emerald-300'}`}
        >
          {failures
            ? `${failures} failed`
            : warnings
              ? `${warnings} warning${warnings === 1 ? '' : 's'}`
              : 'All checks passed'}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {GROUPS.map(({ key, title, icon: GroupIcon }) => {
          const groupChecks = report.checks.filter((check) => check.group === key);
          return (
            <section key={key} className="rounded-xl border border-white/10 bg-white/[0.015] p-5">
              <h2 className="flex items-center gap-2 font-display text-xl text-parchment">
                <GroupIcon size={18} className="text-gold" />
                {title}
              </h2>
              <div className="mt-4 space-y-3">
                {groupChecks.map((check) => {
                  const Icon =
                    check.status === 'pass' ? CheckCircle2 : check.status === 'warning' ? TriangleAlert : CircleAlert;
                  const color =
                    check.status === 'pass'
                      ? 'text-emerald-300'
                      : check.status === 'warning'
                        ? 'text-amber-200'
                        : 'text-red-200';
                  return (
                    <div key={check.key} className="flex items-start gap-3 rounded-lg border border-white/10 p-3">
                      <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
                      <div>
                        <p className="text-xs text-parchment">{check.label}</p>
                        <p className="mt-1 text-[11px] leading-5 text-smoke">{check.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-[11px] text-smoke">
        Checked {report.checkedAt.toLocaleString('en-IQ', { timeZone: 'Asia/Baghdad' })}. Refresh this page after
        changing .env, migrating, or seeding. Restart the development server after environment changes.
      </p>
    </div>
  );
}
