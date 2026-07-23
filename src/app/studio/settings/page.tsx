import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { saveHomepageSection } from '@/actions/setup';
import MaintenanceControls from '@/components/studio/MaintenanceControls';
import { getMaintenanceState } from '@/services/maintenance.service';

export const dynamic = 'force-dynamic';
const inputClass =
  'w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment focus:border-gold/40 focus:outline-none';

export default async function StudioSettingsPage() {
  const [settings, sections, maintenance] = await Promise.all([
    prisma.siteSetting.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] }),
    prisma.homepageSection.findMany({ orderBy: { sortOrder: 'asc' } }),
    getMaintenanceState(),
  ]);
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Store configuration</p>
          <h1 className="font-display text-3xl text-parchment">Settings</h1>
          <p className="mt-2 text-xs text-smoke">
            Identity, currency, language, and launch status are managed by the guided setup. Homepage sections can be
            arranged here.
          </p>
        </div>
        <Link href="/studio/setup" className="rounded-md border border-gold/30 px-4 py-2 text-xs text-gold-bright">
          Open Store Setup
        </Link>
      </div>
      <MaintenanceControls state={maintenance} />
      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl text-parchment">Homepage sections</h2>
          <p className="mt-1 text-xs text-smoke">
            Edit labels, visibility, and order. Empty storefront sections already render safe empty states.
          </p>
        </div>
        <div className="space-y-3">
          {sections.map((section) => (
            <form
              key={section.id}
              action={saveHomepageSection.bind(null, section.id)}
              className="grid gap-3 rounded-xl border border-white/10 p-4 lg:grid-cols-[150px_1fr_1fr_90px_90px]"
            >
              <div>
                <p className="text-xs text-parchment">{section.type.replaceAll('_', ' ')}</p>
                <p className="mt-1 text-[9px] text-smoke">Section type</p>
              </div>
              <div className="space-y-2">
                <input
                  name="titleAr"
                  dir="rtl"
                  defaultValue={section.titleAr ?? ''}
                  placeholder="العنوان العربي"
                  className={inputClass}
                />
                <input
                  name="descriptionAr"
                  dir="rtl"
                  defaultValue={section.descriptionAr ?? ''}
                  placeholder="الوصف العربي"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <input
                  name="titleEn"
                  defaultValue={section.titleEn ?? ''}
                  placeholder="English title"
                  className={inputClass}
                />
                <input
                  name="descriptionEn"
                  defaultValue={section.descriptionEn ?? ''}
                  placeholder="English description"
                  className={inputClass}
                />
              </div>
              <input
                name="sortOrder"
                type="number"
                min="0"
                max="1000"
                defaultValue={section.sortOrder}
                aria-label="Sort order"
                className={inputClass}
              />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] text-smoke">
                  <input name="enabled" type="checkbox" defaultChecked={section.enabled} className="accent-gold" />
                  Enabled
                </label>
                <button className="rounded-md bg-gold px-3 py-2 text-xs font-medium text-ink">Save</button>
              </div>
            </form>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl text-parchment">Stored settings</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="border-b border-white/10 text-smoke">
              <tr>
                <th className="p-3 font-normal">Group</th>
                <th className="p-3 font-normal">Key</th>
                <th className="p-3 font-normal">Value</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3 text-smoke">{setting.group}</td>
                  <td className="p-3 text-parchment">{setting.key}</td>
                  <td className="max-w-xl p-3 text-smoke">
                    <code className="break-all">
                      {typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value)}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
