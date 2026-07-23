import DeliveryCompanyEditor from '@/components/studio/DeliveryCompanyEditor';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function StudioDeliveryPage() {
  const companies = await prisma.deliveryCompany.findMany({
    include: { fees: { orderBy: [{ city: 'asc' }, { area: 'asc' }] } },
    orderBy: { createdAt: 'asc' },
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-2">Iraq delivery configuration</p>
        <h1 className="font-display text-3xl text-parchment">Delivery Companies</h1>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-smoke">
          Seeded providers are disabled placeholders, not business contracts. Rename them, enter verified service areas
          and fees, then activate only the provider you actually use.
        </p>
      </div>
      <div className="space-y-3">
        <DeliveryCompanyEditor
          open
          company={{
            name: '',
            contactNumber: '',
            estimatedDays: '',
            status: 'DISABLED',
            notes: '',
            baseFee: '',
            fees: [],
          }}
        />
        {companies.map((company) => (
          <DeliveryCompanyEditor
            key={company.id}
            company={{
              id: company.id,
              name: company.name,
              contactNumber: company.contactNumber ?? '',
              estimatedDays: company.estimatedDays ?? '',
              status: company.status,
              notes: company.notes ?? '',
              baseFee: company.baseFee?.toString() ?? '',
              fees: company.fees.map((fee) => ({ city: fee.city, area: fee.area, fee: fee.fee.toString() })),
            }}
          />
        ))}
      </div>
    </div>
  );
}
