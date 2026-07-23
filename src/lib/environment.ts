export type EnvironmentCheck = {
  key: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
};

const hostedEnvironments = new Set(['staging', 'production']);
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

function isPlaceholder(value: string) {
  return /replace-with|change-me|example\.com|STAGING_|PRODUCTION_/i.test(value);
}

function urlCheck(key: string, value: string | undefined, protocols: string[]): EnvironmentCheck {
  if (!value?.trim()) return { key, label: key, status: 'fail', message: `${key} is missing.` };
  try {
    const url = new URL(value);
    if (!protocols.includes(url.protocol))
      return { key, label: key, status: 'fail', message: `${key} uses an unsupported protocol.` };
    if (isPlaceholder(value))
      return { key, label: key, status: 'fail', message: `${key} still contains an example placeholder.` };
    return { key, label: key, status: 'pass', message: 'Configured with a valid URL.' };
  } catch {
    return { key, label: key, status: 'fail', message: `${key} is not a valid URL.` };
  }
}

export function inspectEnvironment(env: NodeJS.ProcessEnv = process.env): EnvironmentCheck[] {
  const environment = (env.SCENTIQ_ENVIRONMENT ?? 'development').toLowerCase();
  const hosted = hostedEnvironments.has(environment);
  const checks: EnvironmentCheck[] = [
    {
      key: 'SCENTIQ_ENVIRONMENT',
      label: 'Deployment environment',
      status: ['development', 'staging', 'production'].includes(environment) ? 'pass' : 'fail',
      message: ['development', 'staging', 'production'].includes(environment)
        ? `${environment} environment selected.`
        : 'Use development, staging, or production.',
    },
    urlCheck('DATABASE_URL', env.DATABASE_URL, ['postgresql:', 'postgres:']),
    urlCheck('DIRECT_URL', env.DIRECT_URL, ['postgresql:', 'postgres:']),
    urlCheck('AUTH_URL', env.AUTH_URL, ['http:', 'https:']),
    urlCheck('NEXT_PUBLIC_SITE_URL', env.NEXT_PUBLIC_SITE_URL, ['http:', 'https:']),
  ];

  const secret = env.AUTH_SECRET ?? '';
  const secretIsValid = secret.length >= 32 && !isPlaceholder(secret);
  checks.push({
    key: 'AUTH_SECRET',
    label: 'AUTH_SECRET',
    status: secretIsValid ? 'pass' : 'fail',
    message: secretIsValid
      ? 'Configured with acceptable length.'
      : secret
        ? 'Must be a unique, non-placeholder value of at least 32 characters.'
        : 'AUTH_SECRET is missing.',
  });

  if (hosted) {
    for (const key of ['AUTH_URL', 'NEXT_PUBLIC_SITE_URL'] as const) {
      const check = checks.find((item) => item.key === key);
      if (check?.status === 'pass' && !env[key]?.startsWith('https://')) {
        check.status = 'fail';
        check.message = `${key} must use HTTPS in ${environment}.`;
      }
    }
    try {
      const authOrigin = new URL(env.AUTH_URL ?? '').origin;
      const siteOrigin = new URL(env.NEXT_PUBLIC_SITE_URL ?? '').origin;
      checks.push({
        key: 'CANONICAL_ORIGIN',
        label: 'Canonical origin',
        status: authOrigin === siteOrigin ? 'pass' : 'fail',
        message:
          authOrigin === siteOrigin
            ? 'Authentication and storefront use one origin.'
            : 'AUTH_URL and NEXT_PUBLIC_SITE_URL must match.',
      });
    } catch {
      // The individual URL checks already explain the invalid value.
    }
    for (const key of ['DATABASE_URL', 'DIRECT_URL'] as const) {
      try {
        const url = new URL(env[key] ?? '');
        if (localHosts.has(url.hostname)) {
          const check = checks.find((item) => item.key === key);
          if (check) {
            check.status = 'fail';
            check.message = `${key} cannot target a local database in ${environment}.`;
          }
        }
      } catch {
        // The individual URL check already reports the failure.
      }
    }
  }

  const revalidationSecret = env.REVALIDATION_SECRET ?? '';
  checks.push({
    key: 'REVALIDATION_SECRET',
    label: 'On-demand revalidation',
    status:
      revalidationSecret.length >= 32 && !isPlaceholder(revalidationSecret) ? 'pass' : hosted ? 'fail' : 'warning',
    message:
      revalidationSecret.length >= 32 && !isPlaceholder(revalidationSecret)
        ? 'Protected revalidation is configured.'
        : hosted
          ? 'A unique value of at least 32 characters is required.'
          : 'Optional until a hosted environment is configured.',
  });

  const supportChannels = [
    env.NEXT_PUBLIC_SUPPORT_WHATSAPP,
    env.NEXT_PUBLIC_SUPPORT_PHONE,
    env.NEXT_PUBLIC_SUPPORT_EMAIL,
  ].filter((value) => Boolean(value?.trim()) && !isPlaceholder(value ?? ''));
  checks.push({
    key: 'PUBLIC_SUPPORT_CHANNEL',
    label: 'Public customer support',
    status: supportChannels.length ? 'pass' : hosted ? 'fail' : 'warning',
    message: supportChannels.length
      ? `${supportChannels.length} verified public support channel${supportChannels.length === 1 ? '' : 's'} configured.`
      : hosted
        ? 'Configure a real public WhatsApp, phone, or email before deployment.'
        : 'Optional locally; required before hosted review.',
  });

  const seedParts = ['SEED_ADMIN_NAME', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'].filter((key) =>
    Boolean(env[key]?.trim())
  );
  checks.push({
    key: 'SEED_ADMIN',
    label: 'Seed admin variables',
    status: seedParts.length === 0 || seedParts.length === 3 ? 'pass' : 'fail',
    message:
      seedParts.length === 0
        ? 'No seed credentials are present in the runtime environment.'
        : `${seedParts.length}/3 values are configured; use all three only for an intentional first-admin seed.`,
  });

  const cloudinaryParts = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].filter(
    (key) => Boolean(env[key]?.trim()) && !isPlaceholder(env[key] ?? '')
  );
  const storageProvider = (env.STORAGE_PROVIDER ?? '').toLowerCase();
  checks.push({
    key: 'CLOUDINARY',
    label: 'Persistent media storage',
    status:
      cloudinaryParts.length === 3 && (!hosted || storageProvider === 'cloudinary')
        ? 'pass'
        : hosted
          ? 'fail'
          : cloudinaryParts.length === 0
            ? 'warning'
            : 'fail',
    message:
      cloudinaryParts.length === 3 && (!hosted || storageProvider === 'cloudinary')
        ? 'Cloudinary media storage is configured.'
        : hosted
          ? 'Set STORAGE_PROVIDER=cloudinary and all three Cloudinary credentials.'
          : cloudinaryParts.length === 0
            ? 'Optional locally; image uploads remain unavailable.'
            : `${cloudinaryParts.length}/3 Cloudinary values are configured.`,
  });

  const maintenanceMode = (env.MAINTENANCE_MODE ?? 'off').toLowerCase();
  checks.push({
    key: 'MAINTENANCE_MODE',
    label: 'Emergency maintenance switch',
    status: ['off', 'ordering', 'storefront'].includes(maintenanceMode) ? 'pass' : 'fail',
    message: ['off', 'ordering', 'storefront'].includes(maintenanceMode)
      ? `${maintenanceMode} mode configured.`
      : 'Use off, ordering, or storefront.',
  });
  const orderingDisabled = (env.ORDERING_DISABLED ?? 'false').toLowerCase();
  checks.push({
    key: 'ORDERING_DISABLED',
    label: 'Emergency ordering switch',
    status: ['true', 'false'].includes(orderingDisabled) ? 'pass' : 'fail',
    message: ['true', 'false'].includes(orderingDisabled) ? 'Ordering switch is valid.' : 'Use true or false.',
  });

  if (hosted) {
    checks.push({
      key: 'DEPLOYMENT_ID',
      label: 'Deployment identity',
      status: env.VERCEL_GIT_COMMIT_SHA || env.DEPLOYMENT_ID ? 'pass' : 'warning',
      message:
        env.VERCEL_GIT_COMMIT_SHA || env.DEPLOYMENT_ID
          ? 'A deployment identifier is available.'
          : 'Set DEPLOYMENT_ID when the host does not expose a commit SHA.',
    });
  }
  return checks;
}

export function assertServerEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const failures = inspectEnvironment(env).filter((check) => check.status === 'fail');
  if (failures.length) {
    throw new Error(
      `ScentIQ environment is incomplete: ${failures.map((check) => check.key).join(', ')}. Copy the matching environment template, fill the missing values, then restart the server. Secret values were not logged.`
    );
  }
}
