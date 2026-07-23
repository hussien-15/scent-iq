import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalRedirectUrl, getDeploymentEnvironment } from '../src/lib/deployment';
import {
  applyMaintenanceEnvironment,
  isOrderingAvailable,
  parseMaintenanceSetting,
} from '../src/services/maintenance.service';

test('canonical redirects are production-only and preserve path and query', () => {
  const production = {
    NODE_ENV: 'production',
    SCENTIQ_ENVIRONMENT: 'production',
    NEXT_PUBLIC_SITE_URL: 'https://scentiq.iq',
  } as NodeJS.ProcessEnv;
  assert.equal(
    canonicalRedirectUrl('https://scentiq.vercel.app/ar/shop?q=oud', production),
    'https://scentiq.iq/ar/shop?q=oud'
  );
  assert.equal(canonicalRedirectUrl('https://scentiq.iq/ar', production), null);
  assert.equal(
    canonicalRedirectUrl('https://preview.vercel.app/ar', { ...production, SCENTIQ_ENVIRONMENT: 'staging' }),
    null
  );
  assert.equal(getDeploymentEnvironment({ NODE_ENV: 'test', SCENTIQ_ENVIRONMENT: 'unexpected' }), 'development');
});

test('maintenance parsing uses safe defaults and controls ordering', () => {
  const off = parseMaintenanceSetting(null);
  assert.equal(off.mode, 'OFF');
  assert.equal(isOrderingAvailable(off), true);

  const ordering = parseMaintenanceSetting({
    mode: 'ordering',
    messageAr: 'رسالة صيانة واضحة للعميل',
    messageEn: 'A clear maintenance message.',
  });
  assert.equal(ordering.mode, 'ORDERING');
  assert.equal(isOrderingAvailable(ordering), false);
});

test('environment emergency switches override the stored state', () => {
  const off = parseMaintenanceSetting({ mode: 'OFF' });
  const emergency = applyMaintenanceEnvironment(off, { NODE_ENV: 'test', MAINTENANCE_MODE: 'storefront' });
  assert.equal(emergency.mode, 'STOREFRONT');
  assert.equal(emergency.source, 'environment');
});
