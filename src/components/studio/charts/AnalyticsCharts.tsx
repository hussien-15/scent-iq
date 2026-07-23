'use client';

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const COLORS = ['#D4A94E', '#5B8DEF', '#52B788', '#E07A5F', '#9B8AFB', '#8B8578'];
const tooltipStyle = {
  background: '#141311', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12,
};

export function RevenueTrendChart({ data }: { data: { label: string; revenue: number; orders: number }[] }) {
  return (
    <div className="h-64 min-w-[560px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D4A94E" stopOpacity={0.35} /><stop offset="95%" stopColor="#D4A94E" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#8B8578', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={20} />
          <YAxis tick={{ fill: '#8B8578', fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F4F1EA' }} formatter={(value, name) => name === 'revenue' ? [`$${Number(value).toFixed(2)}`, 'Delivered revenue'] : [value, 'Orders']} />
          <Area type="monotone" dataKey="revenue" stroke="#D4A94E" strokeWidth={2} fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsBarChart({
  data, dataKey = 'value', labelKey = 'label', color = '#5B8DEF', money = false,
}: {
  data: Record<string, string | number>[]; dataKey?: string; labelKey?: string; color?: string; money?: boolean;
}) {
  return (
    <div className="h-60 min-w-[440px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: money ? 6 : -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
          <XAxis dataKey={labelKey} tick={{ fill: '#8B8578', fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={12} />
          <YAxis tick={{ fill: '#8B8578', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F4F1EA' }} formatter={(value) => money ? `$${Number(value).toFixed(2)}` : value} cursor={{ fill: 'rgba(91,141,239,0.07)' }} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsDonutChart({ data }: { data: { label: string; value: number }[] }) {
  const visible = data.filter((row) => row.value > 0);
  if (!visible.length) return <div className="flex h-60 items-center justify-center text-xs text-smoke">No tracked data in this period.</div>;
  return (
    <div className="h-60 min-w-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={visible} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {visible.map((entry, index) => <Cell key={entry.label} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#F4F1EA' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

