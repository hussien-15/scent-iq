import { verifyCloudinaryConnection } from '@/lib/cloudinary';
import { getCanonicalOrigin, getDeploymentEnvironment, getDeploymentId } from '@/lib/deployment';
import { inspectEnvironment, type EnvironmentCheck } from '@/lib/environment';
import { prisma } from '@/lib/prisma';
import { applyMaintenanceEnvironment, parseMaintenanceSetting } from '@/services/maintenance.service';
import { parseStoreLaunch } from '@/services/store-setup.service';
import { getLaunchReadiness } from '@/services/qa.service';

export type HealthCheck = EnvironmentCheck & {
  group: 'environment' | 'database' | 'seed' | 'storage' | 'deployment' | 'quality';
};

export async function getSystemHealth(): Promise<{ checks: HealthCheck[]; checkedAt: Date }> {
  const checks: HealthCheck[] = inspectEnvironment().map((check) => ({ ...check, group: 'environment' }));
  const cloudinaryConfigured = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].every((key) =>
    Boolean(process.env[key]?.trim())
  );
  if (cloudinaryConfigured) {
    const storage = await verifyCloudinaryConnection();
    checks.push({
      key: 'STORAGE_CONNECTION',
      label: 'Cloudinary connection',
      status: storage.ok ? 'pass' : 'fail',
      message: storage.message,
      group: 'storage',
    });
  } else {
    checks.push({
      key: 'STORAGE_CONNECTION',
      label: 'Cloudinary connection',
      status: getDeploymentEnvironment() === 'development' ? 'warning' : 'fail',
      message: 'Connection was not attempted because the persistent storage credentials are incomplete.',
      group: 'storage',
    });
  }

  let launchStatus: 'SETUP' | 'PREVIEW' | 'LIVE' = 'SETUP';
  let maintenance = applyMaintenanceEnvironment(parseMaintenanceSetting(null));
  let databaseAvailable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseAvailable = true;
    checks.push({
      key: 'DATABASE_CONNECTION',
      label: 'PostgreSQL connection',
      status: 'pass',
      message: 'Prisma can reach PostgreSQL.',
      group: 'database',
    });
    const [superAdmins, roles, permissions, settings, homepageSections, seoTemplates, migrations] = await Promise.all([
      prisma.user.count({ where: { role: 'ADMIN', adminRole: 'SUPER_ADMIN', adminStatus: 'ACTIVE' } }),
      prisma.adminRole.count(),
      prisma.permission.count(),
      prisma.siteSetting.findMany({
        where: {
          key: { in: ['site.identity', 'site.languages', 'commerce.currency', 'store.launch', 'store.maintenance'] },
        },
        select: { key: true, value: true },
      }),
      prisma.homepageSection.count(),
      prisma.seoTemplate.count(),
      prisma.$queryRaw<
        Array<{ count: number }>
      >`SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`,
    ]);
    launchStatus = parseStoreLaunch(settings.find((setting) => setting.key === 'store.launch')?.value);
    maintenance = applyMaintenanceEnvironment(
      parseMaintenanceSetting(settings.find((setting) => setting.key === 'store.maintenance')?.value)
    );
    const unfinishedMigrations = Number(migrations[0]?.count ?? 0);
    checks.push({
      key: 'PRISMA_MIGRATIONS',
      label: 'Prisma migration state',
      status: unfinishedMigrations === 0 ? 'pass' : 'fail',
      message:
        unfinishedMigrations === 0
          ? 'No unfinished migrations were found.'
          : `${unfinishedMigrations} migration records are unfinished.`,
      group: 'database',
    });
    checks.push({
      key: 'SUPER_ADMIN',
      label: 'Active Super Admin',
      status: superAdmins > 0 ? 'pass' : 'fail',
      message:
        superAdmins > 0
          ? `${superAdmins} active account${superAdmins === 1 ? '' : 's'} found.`
          : 'Create the first admin with the production seed procedure.',
      group: 'seed',
    });
    checks.push({
      key: 'RBAC',
      label: 'Roles and permissions',
      status: roles >= 8 && permissions > 0 ? 'pass' : 'fail',
      message: `${roles} roles and ${permissions} permissions found.`,
      group: 'seed',
    });
    checks.push({
      key: 'CORE_SETTINGS',
      label: 'Core store settings',
      status: settings.length === 5 ? 'pass' : 'fail',
      message: `${settings.length}/5 required setting groups found.`,
      group: 'seed',
    });
    checks.push({
      key: 'HOMEPAGE_SECTIONS',
      label: 'Homepage sections',
      status: homepageSections > 0 ? 'pass' : 'fail',
      message: `${homepageSections} sections found.`,
      group: 'seed',
    });
    checks.push({
      key: 'SEO_TEMPLATES',
      label: 'SEO templates',
      status: seoTemplates > 0 ? 'pass' : 'fail',
      message: `${seoTemplates} templates found.`,
      group: 'seed',
    });
  } catch (error) {
    checks.push({
      key: 'DATABASE_CONNECTION',
      label: 'PostgreSQL connection',
      status: 'fail',
      message: `Cannot connect to PostgreSQL. Check the runtime and direct database URLs. (${error instanceof Error ? error.name : 'Database error'})`,
      group: 'database',
    });
  }

  if (databaseAvailable) {
    try {
      const readiness = await getLaunchReadiness();
      checks.push({
        key: 'QA_READINESS_SCORE',
        label: 'Final QA readiness score',
        status: readiness.overallScore >= 90 ? 'pass' : 'fail',
        message: `${readiness.overallScore}% recorded; launch requires at least 90%.`,
        group: 'quality',
      });
      checks.push({
        key: 'QA_CRITICAL_SYSTEMS',
        label: 'Critical systems',
        status: readiness.criticalCategoriesReady && readiness.failedCriticalChecks.length === 0 ? 'pass' : 'fail',
        message: `${readiness.criticalChecksPassed}/${readiness.criticalChecksTotal} critical checks passed; every critical category must score 100%.`,
        group: 'quality',
      });
      checks.push({
        key: 'QA_BLOCKING_BUGS',
        label: 'Critical and High defects',
        status: readiness.blockingBugs.length === 0 ? 'pass' : 'fail',
        message: readiness.blockingBugs.length
          ? `${readiness.blockingBugs.length} launch-blocking defect(s) remain.`
          : 'No unresolved Critical or High defects.',
        group: 'quality',
      });
      checks.push({
        key: 'QA_APPROVALS',
        label: 'Launch approvals',
        status: readiness.missingApprovals.length === 0 ? 'pass' : 'fail',
        message: readiness.missingApprovals.length
          ? `${8 - readiness.missingApprovals.length}/8 accountable approvals recorded.`
          : 'All eight accountable approvals are recorded.',
        group: 'quality',
      });
    } catch (error) {
      checks.push({
        key: 'QA_FRAMEWORK',
        label: 'Final QA framework',
        status: 'fail',
        message: `QA tables or safe core records are unavailable. Deploy the Step 26 migration and seed framework. (${error instanceof Error ? error.name : 'Database error'})`,
        group: 'quality',
      });
    }
  }

  const environment = getDeploymentEnvironment();
  const deploymentId = getDeploymentId();
  const canonicalOrigin = getCanonicalOrigin();
  checks.push({
    key: 'DEPLOYMENT_TARGET',
    label: 'Deployment target',
    status: environment === 'development' ? 'warning' : 'pass',
    message:
      environment === 'development'
        ? 'Local development target; do not connect it to production data.'
        : `${environment} target selected.`,
    group: 'deployment',
  });
  checks.push({
    key: 'DEPLOYMENT_ID',
    label: 'Release identifier',
    status: deploymentId ? 'pass' : environment === 'development' ? 'warning' : 'fail',
    message: deploymentId
      ? `Release ${deploymentId.slice(0, 12)} is active.`
      : 'No host commit SHA or DEPLOYMENT_ID is available.',
    group: 'deployment',
  });
  checks.push({
    key: 'CANONICAL_DOMAIN',
    label: 'Canonical HTTPS domain',
    status: canonicalOrigin?.startsWith('https://') ? 'pass' : environment === 'development' ? 'warning' : 'fail',
    message: canonicalOrigin?.startsWith('https://')
      ? 'Canonical HTTPS origin is configured.'
      : 'A production HTTPS canonical origin is not configured.',
    group: 'deployment',
  });
  checks.push({
    key: 'LAUNCH_MODE',
    label: 'Store launch mode',
    status: databaseAvailable && launchStatus === 'LIVE' ? 'pass' : launchStatus === 'PREVIEW' ? 'warning' : 'warning',
    message: databaseAvailable
      ? `${launchStatus} mode is saved.`
      : 'Launch mode could not be confirmed without the database.',
    group: 'deployment',
  });
  checks.push({
    key: 'MAINTENANCE_STATE',
    label: 'Maintenance state',
    status: maintenance.mode === 'OFF' ? 'pass' : 'warning',
    message:
      maintenance.mode === 'OFF'
        ? 'Storefront and ordering are enabled.'
        : `${maintenance.mode} mode is active from ${maintenance.source}.`,
    group: 'deployment',
  });
  checks.push({
    key: 'SITEMAP_READY',
    label: 'Indexing and sitemap readiness',
    status: launchStatus === 'LIVE' && maintenance.mode !== 'STOREFRONT' ? 'pass' : 'warning',
    message:
      launchStatus === 'LIVE' && maintenance.mode !== 'STOREFRONT'
        ? 'Public sitemap may be served to search engines.'
        : 'Robots remain non-indexable until Live Mode is active and full maintenance is off.',
    group: 'deployment',
  });

  return { checks, checkedAt: new Date() };
}
