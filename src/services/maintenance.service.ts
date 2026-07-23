import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export type MaintenanceMode = 'OFF' | 'ORDERING' | 'STOREFRONT';

export type MaintenanceState = {
  mode: MaintenanceMode;
  messageAr: string;
  messageEn: string;
  updatedAt: string | null;
  source: 'database' | 'environment' | 'default';
};

export const DEFAULT_MAINTENANCE_STATE: MaintenanceState = {
  mode: 'OFF',
  messageAr: 'نجري تحديثات بسيطة على ScentIQ. نرجع قريبًا، وشكرًا لصبرك.',
  messageEn: 'ScentIQ is receiving a short update. We will be back soon. Thank you for your patience.',
  updatedAt: null,
  source: 'default',
};

export function parseMaintenanceSetting(value: unknown): MaintenanceState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_MAINTENANCE_STATE;
  const input = value as Record<string, unknown>;
  const mode =
    typeof input.mode === 'string' && ['OFF', 'ORDERING', 'STOREFRONT'].includes(input.mode.toUpperCase())
      ? (input.mode.toUpperCase() as MaintenanceMode)
      : 'OFF';
  return {
    mode,
    messageAr:
      typeof input.messageAr === 'string' && input.messageAr.trim()
        ? input.messageAr.trim()
        : DEFAULT_MAINTENANCE_STATE.messageAr,
    messageEn:
      typeof input.messageEn === 'string' && input.messageEn.trim()
        ? input.messageEn.trim()
        : DEFAULT_MAINTENANCE_STATE.messageEn,
    updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : null,
    source: 'database',
  };
}

export function applyMaintenanceEnvironment(
  state: MaintenanceState,
  env: NodeJS.ProcessEnv = process.env
): MaintenanceState {
  const emergencyMode = (env.MAINTENANCE_MODE ?? 'off').toLowerCase();
  if (emergencyMode === 'storefront') return { ...state, mode: 'STOREFRONT', source: 'environment' };
  if (emergencyMode === 'ordering' || env.ORDERING_DISABLED?.toLowerCase() === 'true') {
    return state.mode === 'STOREFRONT' ? state : { ...state, mode: 'ORDERING', source: 'environment' };
  }
  return state;
}

const readMaintenanceSetting = unstable_cache(
  async () => {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'store.maintenance' },
      select: { value: true },
    });
    return parseMaintenanceSetting(setting?.value);
  },
  ['store-maintenance-v1'],
  { tags: ['store-maintenance'], revalidate: 60 }
);

export async function getMaintenanceState(): Promise<MaintenanceState> {
  try {
    return applyMaintenanceEnvironment(await readMaintenanceSetting());
  } catch {
    return applyMaintenanceEnvironment(DEFAULT_MAINTENANCE_STATE);
  }
}

export function isOrderingAvailable(state: MaintenanceState) {
  return state.mode === 'OFF';
}
