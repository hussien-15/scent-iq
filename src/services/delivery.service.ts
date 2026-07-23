import { prisma } from '@/lib/prisma';

/**
 * Looks up the delivery fee for a company/city/area combination. Area-level
 * rows win over city-level ones when both exist — that's a lookup-order
 * decision, not something a database constraint can express (see the
 * schema comment on DeliveryFee), so it lives here.
 */
export async function getDeliveryFee(
  deliveryCompanyId: string,
  city: string,
  area?: string | null
): Promise<number | null> {
  if (area) {
    const areaMatch = await prisma.deliveryFee.findFirst({
      where: { deliveryCompanyId, city, area },
    });
    if (areaMatch) return Number(areaMatch.fee);
  }

  const cityMatch = await prisma.deliveryFee.findFirst({
    where: { deliveryCompanyId, city, area: null },
  });
  return cityMatch ? Number(cityMatch.fee) : null;
}

/** Active companies that deliver to a given city, with their city-level fee. */
export async function getAvailableDeliveryOptions(city: string) {
  const companies = await prisma.deliveryCompany.findMany({
    where: { status: 'ACTIVE', fees: { some: { city } } },
    include: { fees: { where: { city } } },
  });

  return companies.map((c: { id: string; name: string; estimatedDays: string | null; fees: { area: string | null; fee: unknown }[] }) => ({
    id: c.id,
    name: c.name,
    estimatedDays: c.estimatedDays,
    fee: Number(c.fees.find((f) => f.area === null)?.fee ?? c.fees[0]?.fee ?? 0),
  }));
}

/** Free-delivery threshold — a Settings row, per the flexible-config pattern. */
export async function getFreeDeliveryThreshold(): Promise<number | null> {
  const row = await prisma.siteSetting.findUnique({ where: { key: 'delivery.freeThreshold' } });
  return row ? Number(row.value) : null;
}
