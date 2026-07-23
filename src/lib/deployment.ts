export type ScentIQEnvironment = 'development' | 'staging' | 'production';

export function getDeploymentEnvironment(env: NodeJS.ProcessEnv = process.env): ScentIQEnvironment {
  const value = env.SCENTIQ_ENVIRONMENT?.toLowerCase();
  return value === 'staging' || value === 'production' ? value : 'development';
}

export function getCanonicalOrigin(env: NodeJS.ProcessEnv = process.env) {
  try {
    return new URL(env.NEXT_PUBLIC_SITE_URL ?? '').origin;
  } catch {
    return null;
  }
}

export function canonicalRedirectUrl(requestUrl: string, env: NodeJS.ProcessEnv = process.env) {
  if (getDeploymentEnvironment(env) !== 'production') return null;
  const canonicalOrigin = getCanonicalOrigin(env);
  if (!canonicalOrigin) return null;
  const request = new URL(requestUrl);
  if (request.origin === canonicalOrigin) return null;
  return new URL(`${request.pathname}${request.search}`, canonicalOrigin).toString();
}

export function getDeploymentId(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL_GIT_COMMIT_SHA || env.DEPLOYMENT_ID || null;
}
