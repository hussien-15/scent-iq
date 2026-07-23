import Link from 'next/link';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  Gauge,
  Lightbulb,
  Package,
  Search,
  ShoppingCart,
  Star,
  Target,
  Truck,
  Users,
} from 'lucide-react';
import {
  AnalyticsBarChart,
  AnalyticsDonutChart,
  RevenueTrendChart,
} from '@/components/studio/charts/DeferredAnalyticsCharts';
import { getBusinessAnalytics, resolveAnalyticsRange, type BusinessInsight } from '@/services/analytics.service';
import EmptyState from '@/components/ui/EmptyState';
import { formatPrice } from '@/utils/format-price';

export const dynamic = 'force-dynamic';

const PRESETS = [
  ['today', 'Today'],
  ['yesterday', 'Yesterday'],
  ['7d', '7 days'],
  ['30d', '30 days'],
  ['this-month', 'This month'],
  ['last-month', 'Last month'],
] as const;

function money(value: number) {
  return formatPrice(value);
}

function number(value: number, digits = 0) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  note?: string;
  icon: typeof BarChart3;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${accent ? 'border-gold/30 bg-gold/[0.04]' : 'border-white/10 bg-white/[0.02]'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-smoke">{label}</p>
        <Icon size={15} className={accent ? 'text-gold' : 'text-studioBlue'} />
      </div>
      <p className="mt-3 font-display text-2xl text-parchment">{value}</p>
      {note && <p className="mt-1 text-[10px] leading-4 text-smoke">{note}</p>}
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
  open = false,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details open={open} className="group rounded-xl border border-white/10 bg-white/[0.01]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
        <div>
          {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
          <h2 className="font-display text-xl text-parchment">{title}</h2>
        </div>
        <span className="text-xl text-smoke transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-white/10 p-5">{children}</div>
    </details>
  );
}

const priorityStyle: Record<BusinessInsight['priority'], string> = {
  CRITICAL: 'border-red-400/30 bg-red-400/[0.05] text-red-200',
  HIGH: 'border-amber-300/30 bg-amber-300/[0.04] text-amber-100',
  MEDIUM: 'border-studioBlue/30 bg-studioBlue/[0.04] text-blue-100',
  LOW: 'border-white/10 bg-white/[0.02] text-smoke',
};

export default async function StudioAnalyticsPage({
  searchParams,
}: {
  searchParams: { range?: string; from?: string; to?: string };
}) {
  const range = resolveAnalyticsRange(searchParams);
  const data = await getBusinessAnalytics(range);
  const topProduct = data.productPerformance[0];
  const topBrand = data.brandPerformance[0];
  const topCollection = data.collectionPerformance[0];
  const query = new URLSearchParams({ range: range.key, from: range.from, to: range.to });
  const changePositive = data.summary.revenueChange >= 0;

  return (
    <div className="space-y-7 pb-12">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="eyebrow mb-2">Business intelligence · trusted server data</p>
          <h1 className="font-display text-3xl text-parchment">ScentIQ Analytics</h1>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-smoke">
            Delivered orders are recognized as revenue. Pending, cancelled, and returned orders remain separate.
            Storefront sessions use a random session ID and never store an IP address.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(([key, label]) => (
            <Link
              key={key}
              href={`?range=${key}`}
              className={`rounded-full border px-3 py-2 text-[11px] ${range.key === key ? 'border-gold bg-gold/10 text-gold-bright' : 'border-white/10 text-smoke hover:text-parchment'}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      {data.summary.orders === 0 && data.summary.visitors === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Storefront visits, searches, carts, and orders will build this dashboard from real first-party activity. No sample metrics are shown."
          action={{ label: 'Review store setup', href: '/studio/setup' }}
          compact
        />
      )}

      <form className="grid gap-3 rounded-xl border border-white/10 p-4 sm:grid-cols-[1fr_1fr_auto]" method="get">
        <input type="hidden" name="range" value="custom" />
        <label className="text-[10px] text-smoke">
          From
          <input
            type="date"
            name="from"
            defaultValue={range.from}
            className="mt-1 block w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
          />
        </label>
        <label className="text-[10px] text-smoke">
          To
          <input
            type="date"
            name="to"
            defaultValue={range.to}
            className="mt-1 block w-full rounded-md border border-white/10 bg-ink px-3 py-2 text-xs text-parchment"
          />
        </label>
        <button className="self-end rounded-md bg-gold px-5 py-2.5 text-xs font-medium text-ink">
          Apply custom range
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-smoke">
        <span>
          Showing <strong className="text-parchment">{range.label}</strong>
        </span>
        <span>Previous-period comparison uses the same number of days.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Delivered revenue"
          value={money(data.summary.deliveredRevenue)}
          icon={CircleDollarSign}
          accent
          note={`${changePositive ? '+' : ''}${data.summary.revenueChange.toFixed(1)}% vs previous period`}
        />
        <MetricCard
          label="Active order value"
          value={money(data.summary.activeOrderValue)}
          icon={Gauge}
          note="Confirmed through delivered"
        />
        <MetricCard
          label="Total orders"
          value={data.summary.orders}
          icon={ShoppingCart}
          note={`${data.summary.deliveredOrders} delivered`}
        />
        <MetricCard
          label="Average order value"
          value={money(data.summary.averageOrderValue)}
          icon={Target}
          note="Delivered orders only"
        />
        <MetricCard
          label="Tracked visitors"
          value={data.summary.visitors}
          icon={Users}
          note="Unique storefront sessions"
        />
        <MetricCard
          label="Order conversion"
          value={`${data.summary.conversionRate.toFixed(1)}%`}
          icon={ArrowUpRight}
          note="Tracked visit → order placed"
        />
        <MetricCard label="Products" value={data.summary.products} icon={Package} />
        <MetricCard
          label="Low / out of stock"
          value={`${data.summary.lowStock} / ${data.summary.outOfStock}`}
          icon={Boxes}
        />
        <MetricCard
          label="Best delivered product"
          value={topProduct?.name ?? 'No sales yet'}
          icon={Star}
          note={topProduct ? `${topProduct.units} units · ${money(topProduct.revenue)}` : undefined}
        />
        <MetricCard
          label="Top brand"
          value={topBrand?.name ?? 'No signal yet'}
          icon={BarChart3}
          note={topBrand ? `${money(topBrand.revenue)} delivered revenue` : undefined}
        />
        <MetricCard
          label="Top collection"
          value={topCollection?.name ?? 'No signal yet'}
          icon={Target}
          note={
            topCollection
              ? `${topCollection.views} views · ${topCollection.conversion.toFixed(1)}% attributed conversion`
              : undefined
          }
        />
        <MetricCard
          label="Searches"
          value={data.summary.searchCount}
          icon={Search}
          note={`${data.searchPerformance.filter((row) => row.noResults > 0).length} terms had no-result searches`}
        />
      </div>

      <Section title="Smart business insights" eyebrow="Rule-based · no paid AI API" open>
        {data.insights.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.insights.map((insight, index) => (
              <article
                key={`${insight.title}-${index}`}
                className={`rounded-lg border p-4 ${priorityStyle[insight.priority]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-semibold tracking-[0.18em]">{insight.priority}</span>
                    <h3 className="mt-2 text-sm font-medium text-parchment">{insight.title}</h3>
                  </div>
                  <Lightbulb size={16} className="shrink-0 text-gold" />
                </div>
                <p className="mt-2 text-xs leading-5 text-smoke">{insight.explanation}</p>
                <p className="mt-3 text-xs text-parchment">
                  <strong>Recommended:</strong> {insight.action}
                </p>
                <Link
                  href={insight.href}
                  className="mt-4 inline-flex rounded-full border border-current/30 px-3 py-1.5 text-[10px] hover:bg-white/5"
                >
                  Take action
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.03] p-4 text-xs text-smoke">
            <CheckCircle2 size={16} className="text-emerald-300" />
            No rule-based issue has crossed its evidence threshold in this period. Keep collecting real traffic and
            order data.
          </div>
        )}
      </Section>

      <Section title="Revenue & order performance" eyebrow="Recognized revenue = delivered" open>
        <div className="grid gap-5 xl:grid-cols-[2fr_1fr]">
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Delivered revenue trend</h3>
            <RevenueTrendChart data={data.revenueTrend} />
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Orders by status</h3>
            <AnalyticsBarChart data={data.orderStatuses} color="#D4A94E" />
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.orderStatuses.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between rounded-md border border-white/10 p-3 text-xs"
            >
              <span className="text-smoke">{row.label}</span>
              <strong className="text-parchment">{row.value}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-white/10 p-3 text-xs text-smoke">
            Peak order hour <strong className="ms-2 text-parchment">{data.orderTiming.peakHour}</strong> ·{' '}
            {data.orderTiming.peakHourOrders} orders
          </div>
          <div className="rounded-md border border-white/10 p-3 text-xs text-smoke">
            Top order day <strong className="ms-2 text-parchment">{data.orderTiming.topDay}</strong> ·{' '}
            {data.orderTiming.topDayOrders} orders
          </div>
        </div>
      </Section>

      <Section title="Conversion funnel & cart abandonment" eyebrow="Anonymous first-party events" open>
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-3">
            {data.funnel.map((stage, index) => {
              const max = Math.max(1, data.funnel[0].value);
              return (
                <div key={stage.label}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-parchment">{stage.label}</span>
                    <span className="text-smoke">
                      {stage.value}
                      {index > 0 ? ` · ${stage.dropoff.toFixed(1)}% drop-off` : ''}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-studioBlue"
                      style={{ width: `${Math.max(stage.value ? 4 : 0, percentWidth(stage.value, max))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Abandonment rate"
              value={`${data.cart.abandonmentRate.toFixed(1)}%`}
              icon={ArrowDownRight}
            />
            <MetricCard label="Abandoned carts" value={data.cart.abandonedCarts} icon={ShoppingCart} />
            <MetricCard
              label="Average tracked cart"
              value={money(data.cart.averageCartValue)}
              icon={CircleDollarSign}
            />
            <MetricCard
              label="Bounce rate"
              value={`${data.traffic.bounceRate.toFixed(1)}%`}
              icon={Eye}
              note="One-page tracked sessions"
            />
          </div>
        </div>
        {data.cart.abandonedProducts.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Products most often left in abandoned carts</h3>
            <AnalyticsBarChart data={data.cart.abandonedProducts} color="#E07A5F" />
          </div>
        )}
      </Section>

      <Section title="Product & brand intelligence" eyebrow="Views, demand, delivered sales, trust">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-[11px]">
            <thead className="text-smoke">
              <tr>
                {[
                  'Product',
                  'Views',
                  'Cart',
                  'Wishlist',
                  'Units',
                  'Revenue',
                  'Conversion',
                  'Rating',
                  'Returns',
                  'Available',
                ].map((head) => (
                  <th key={head} className="border-b border-white/10 px-3 py-2 font-normal">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.productPerformance.slice(0, 15).map((product) => (
                <tr key={product.id} className="text-smoke">
                  <td className="border-b border-white/5 px-3 py-3">
                    <Link
                      href={`/studio/products?q=${encodeURIComponent(product.name)}`}
                      className="text-parchment hover:text-gold"
                    >
                      {product.name}
                    </Link>
                    <span className="block text-[9px]">{product.brand}</span>
                  </td>
                  <td className="border-b border-white/5 px-3">{product.views}</td>
                  <td className="border-b border-white/5 px-3">{product.carts}</td>
                  <td className="border-b border-white/5 px-3">{product.wishlists}</td>
                  <td className="border-b border-white/5 px-3">{product.units}</td>
                  <td className="border-b border-white/5 px-3 text-parchment">{money(product.revenue)}</td>
                  <td className="border-b border-white/5 px-3">{product.conversion.toFixed(1)}%</td>
                  <td className="border-b border-white/5 px-3">
                    {product.reviews ? `${product.rating.toFixed(1)} (${product.reviews})` : '—'}
                  </td>
                  <td className="border-b border-white/5 px-3">{product.returns}</td>
                  <td className="border-b border-white/5 px-3">{product.availableStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.productPerformance.length === 0 && (
          <p className="text-xs text-smoke">No products are available to analyze.</p>
        )}
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Revenue by brand</h3>
            <AnalyticsBarChart
              data={data.brandPerformance.slice(0, 10).map((row) => ({ label: row.name, value: row.revenue }))}
              color="#52B788"
              money
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Revenue by category</h3>
            <AnalyticsBarChart
              data={data.categoryPerformance.slice(0, 10).map((row) => ({ label: row.name, value: row.revenue }))}
              color="#9B8AFB"
              money
            />
          </div>
        </div>
      </Section>

      <Section title="Collections & search demand" eyebrow="Editorial performance and customer intent">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Collection views</h3>
            <AnalyticsBarChart
              data={data.collectionPerformance.slice(0, 10).map((row) => ({ label: row.name, value: row.views }))}
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Searches by language</h3>
            <AnalyticsDonutChart data={data.searchLanguages} />
          </div>
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[11px]">
              <thead className="text-smoke">
                <tr>
                  {['Collection', 'Views', 'Clicks', 'Cart', 'Orders', 'Conversion', 'Attributed value'].map((head) => (
                    <th key={head} className="border-b border-white/10 px-2 py-2 font-normal">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.collectionPerformance.slice(0, 12).map((row) => (
                  <tr key={row.id}>
                    <td className="border-b border-white/5 px-2 py-3">
                      <Link href={`/studio/collections/${row.id}`} className="text-parchment">
                        {row.name}
                      </Link>
                    </td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.views}</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.clicks}</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.carts}</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.purchases}</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.conversion.toFixed(1)}%</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{money(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.collectionPerformance.length === 0 && (
              <p className="py-5 text-xs text-smoke">No collection activity in this period.</p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[11px]">
              <thead className="text-smoke">
                <tr>
                  {['Keyword', 'Language', 'Searches', 'No result', 'Clicks'].map((head) => (
                    <th key={head} className="border-b border-white/10 px-2 py-2 font-normal">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.searchPerformance.slice(0, 15).map((row) => (
                  <tr key={`${row.language}-${row.keyword}`}>
                    <td className="border-b border-white/5 px-2 py-3 text-parchment">{row.keyword}</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.language}</td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.searches}</td>
                    <td className={`border-b border-white/5 px-2 ${row.noResults ? 'text-amber-200' : 'text-smoke'}`}>
                      {row.noResults}
                    </td>
                    <td className="border-b border-white/5 px-2 text-smoke">{row.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.searchPerformance.length === 0 && (
              <p className="py-5 text-xs text-smoke">No searches recorded in this period.</p>
            )}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Popular brands', data.searchFacets.brands],
            ['Popular notes', data.searchFacets.notes],
            ['Popular seasons', data.searchFacets.seasons],
            ['Popular occasions', data.searchFacets.occasions],
          ].map(([label, rows]) => (
            <div key={String(label)} className="rounded-lg border border-white/10 p-4">
              <h3 className="text-xs text-parchment">{String(label)}</h3>
              <ul className="mt-3 space-y-2 text-[11px]">
                {(rows as { label: string; value: number }[]).map((row) => (
                  <li key={row.label} className="flex justify-between text-smoke">
                    <span>{row.label}</span>
                    <strong className="text-parchment">{row.value}</strong>
                  </li>
                ))}
                {!(rows as { label: string; value: number }[]).length && (
                  <li className="text-smoke">No matching search intent yet.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Customers, cities & delivery" eyebrow="Iraq market operations">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <MetricCard label="Period customers" value={data.customerSummary.total} icon={Users} />
          <MetricCard label="Returning customers" value={data.customerSummary.returning} icon={ArrowUpRight} />
          <MetricCard label="New customers" value={data.customerSummary.new} icon={Users} />
          <MetricCard
            label="Avg period spending"
            value={money(data.customerSummary.averageSpending)}
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Average lifetime value"
            value={money(data.customerSummary.averageLifetimeValue)}
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Orders per customer"
            value={data.customerSummary.ordersPerCustomer.toFixed(1)}
            icon={ShoppingCart}
          />
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Orders by city</h3>
            <AnalyticsBarChart
              data={data.cityPerformance.slice(0, 10).map((row) => ({ label: row.city, value: row.orders }))}
              color="#9B8AFB"
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Delivered revenue by city</h3>
            <AnalyticsBarChart
              data={data.cityPerformance.slice(0, 10).map((row) => ({ label: row.city, value: row.revenue }))}
              color="#52B788"
              money
            />
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <h3 className="mb-3 text-xs text-parchment">Top customers in the selected period</h3>
          <table className="w-full min-w-[820px] text-left text-[11px]">
            <thead className="text-smoke">
              <tr>
                {[
                  'Customer',
                  'City',
                  'Period orders',
                  'Period spending',
                  'Lifetime value',
                  'Favorite brand',
                  'Favorite category',
                ].map((head) => (
                  <th key={head} className="border-b border-white/10 px-3 py-2 font-normal">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.customers.slice(0, 10).map((row) => (
                <tr key={row.phone}>
                  <td className="border-b border-white/5 px-3 py-3 text-parchment">{row.name}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.city}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.orders}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{money(row.spending)}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{money(row.lifetimeSpending)}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.favoriteBrand}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.favoriteCategory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 overflow-x-auto">
          <h3 className="mb-3 text-xs text-parchment">Delivery partner performance</h3>
          <table className="w-full min-w-[820px] text-left text-[11px]">
            <thead className="text-smoke">
              <tr>
                {[
                  'Delivery company',
                  'Orders',
                  'Delivered',
                  'Cancelled',
                  'Returned',
                  'Success',
                  'Issue rate',
                  'Avg delivery',
                ].map((head) => (
                  <th key={head} className="border-b border-white/10 px-3 py-2 font-normal">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.deliveryPerformance.map((row) => (
                <tr key={row.name}>
                  <td className="border-b border-white/5 px-3 py-3 text-parchment">{row.name}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.orders}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.delivered}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.cancelled}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.returned}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.successRate.toFixed(1)}%</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.issueRate.toFixed(1)}%</td>
                  <td className="border-b border-white/5 px-3 text-smoke">
                    {row.averageDeliveryDays ? `${row.averageDeliveryDays.toFixed(1)} days` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Inventory & review intelligence" eyebrow="Demand, stock value, and customer confidence">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Stock selling value" value={money(data.inventory.stockSellingValue)} icon={Boxes} />
          <MetricCard label="Stock cost value" value={money(data.inventory.stockCostValue)} icon={CircleDollarSign} />
          <MetricCard
            label="Average approved rating"
            value={data.reviews.total ? `${data.reviews.average.toFixed(1)} / 5` : 'No reviews'}
            icon={Star}
          />
          <MetricCard
            label="Products without reviews"
            value={data.reviews.productsWithoutReviews}
            icon={AlertTriangle}
          />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-xs text-parchment">Fast moving</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {data.inventory.fastMoving.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 text-smoke">
                  <span className="text-parchment">{row.name}</span>
                  <span>
                    {row.units} delivered · {row.availableStock} available
                  </span>
                </li>
              ))}
              {!data.inventory.fastMoving.length && (
                <li className="text-smoke">No shipped movement signal in this period.</li>
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-xs text-parchment">Slow moving</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {data.inventory.slowMoving.map((row) => (
                <li key={row.id} className="flex justify-between gap-3 text-smoke">
                  <span className="text-parchment">{row.name}</span>
                  <span>{row.availableStock} available · no shipped movement</span>
                </li>
              ))}
              {!data.inventory.slowMoving.length && <li className="text-smoke">No slow-moving signal.</li>}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-xs text-parchment">Common review concerns</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {data.reviews.commonComplaints.map((row) => (
                <li key={row.label} className="flex justify-between text-smoke">
                  <span>{row.label}</span>
                  <strong className="text-parchment">{row.value}</strong>
                </li>
              ))}
              {!data.reviews.commonComplaints.length && (
                <li className="text-smoke">No repeated complaint term detected.</li>
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-xs text-parchment">Common praise</h3>
            <ul className="mt-3 space-y-2 text-xs">
              {data.reviews.commonPraise.map((row) => (
                <li key={row.label} className="flex justify-between text-smoke">
                  <span>{row.label}</span>
                  <strong className="text-parchment">{row.value}</strong>
                </li>
              ))}
              {!data.reviews.commonPraise.length && <li className="text-smoke">No repeated praise term detected.</li>}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Traffic, devices & recommendations" eyebrow="First-party storefront behavior">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Sessions by source</h3>
            <AnalyticsBarChart
              data={data.traffic.sources.slice(0, 10).map((row) => ({ label: row.label, value: row.sessions }))}
            />
          </div>
          <div className="overflow-x-auto rounded-lg border border-white/10 p-4">
            <h3 className="mb-3 text-xs text-parchment">Sessions by device</h3>
            <AnalyticsDonutChart
              data={data.traffic.devices.map((row) => ({ label: row.label, value: row.sessions }))}
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <MetricCard label="Recommendation impressions" value={data.recommendations.impressions} icon={Eye} />
          <MetricCard label="Recommendation clicks" value={data.recommendations.clicks} icon={Target} />
          <MetricCard
            label="Recommendation click rate"
            value={`${data.recommendations.clickRate.toFixed(1)}%`}
            icon={ArrowUpRight}
          />
          <MetricCard
            label="Recommendation conversion"
            value={`${data.recommendations.conversionRate.toFixed(1)}%`}
            icon={ShoppingCart}
            note={`${data.recommendations.attributedOrderSessions} ordering sessions`}
          />
          <MetricCard
            label="Avg session duration"
            value={`${number(data.traffic.averageSessionSeconds)} sec`}
            icon={Gauge}
          />
        </div>
        {data.recommendations.types.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.recommendations.types.map((row) => (
              <div key={row.label} className="rounded-lg border border-white/10 p-3">
                <p className="text-xs text-parchment">{row.label}</p>
                <p className="mt-2 text-[10px] text-smoke">
                  {row.impressions} impressions · {row.clicks} clicks · {row.clickRate.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="SEO readiness" eyebrow="On-site signals only · no fake index data">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Published product pages"
            value={data.seo.eligiblePages}
            icon={Search}
            note="Eligible; actual indexing needs Search Console"
          />
          <MetricCard label="Pages needing SEO work" value={data.seo.gaps.length} icon={AlertTriangle} />
          <MetricCard
            label="Tracked organic landings"
            value={data.seo.organicLandingPages.reduce((sum, row) => sum + row.value, 0)}
            icon={ArrowUpRight}
          />
          <MetricCard label="Arabic + English metadata" value="Audited" icon={CheckCircle2} />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[11px]">
            <thead className="text-smoke">
              <tr>
                <th className="border-b border-white/10 px-3 py-2 font-normal">Product</th>
                <th className="border-b border-white/10 px-3 py-2 font-normal">Missing signals</th>
                <th className="border-b border-white/10 px-3 py-2 font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.seo.gaps.slice(0, 12).map((row) => (
                <tr key={row.id}>
                  <td className="border-b border-white/5 px-3 py-3 text-parchment">{row.name}</td>
                  <td className="border-b border-white/5 px-3 text-smoke">{row.seoMissing}</td>
                  <td className="border-b border-white/5 px-3">
                    <Link href="/studio/seo" className="text-studioBlue hover:underline">
                      Open SEO Manager
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.seo.gaps.length && (
            <p className="py-5 text-xs text-smoke">No catalog SEO gap detected by the current checklist.</p>
          )}
        </div>
      </Section>

      <Section title="Export business reports" eyebrow="CSV and Excel-compatible files">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['orders', 'Orders report', ShoppingCart],
            ['revenue', 'Revenue report', CircleDollarSign],
            ['inventory', 'Inventory report', Boxes],
            ['products', 'Products report', Package],
            ['search', 'Search report', Search],
            ['customers', 'Customer report', Users],
          ].map(([report, label, Icon]) => (
            <div key={String(report)} className="rounded-lg border border-white/10 p-4">
              <div className="flex items-center gap-2">
                <Icon size={15} className="text-gold" />
                <p className="text-xs text-parchment">{String(label)}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={`/api/studio/analytics/export?report=${report}&format=csv&${query}`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-smoke hover:text-parchment"
                >
                  <Download size={11} />
                  CSV
                </a>
                <a
                  href={`/api/studio/analytics/export?report=${report}&format=excel&${query}`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-smoke hover:text-parchment"
                >
                  <Download size={11} />
                  Excel
                </a>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {(data.dataLimits.ordersCapped || data.dataLimits.eventsCapped || data.dataLimits.searchesCapped) && (
        <div className="flex gap-3 rounded-lg border border-amber-300/20 bg-amber-300/[0.03] p-4 text-xs leading-5 text-smoke">
          <AlertTriangle size={16} className="shrink-0 text-amber-200" />
          <p>
            This period crossed the first-version query safety cap. Narrow the date range for exact detail, then move
            monthly aggregation into a scheduled background job before production scale.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-smoke">
        <Truck size={12} />
        Financial metrics come only from server-calculated Order totals; client event values never contribute to
        recognized revenue.
      </div>
    </div>
  );
}

function percentWidth(value: number, maximum: number) {
  return maximum > 0 ? (value / maximum) * 100 : 0;
}
