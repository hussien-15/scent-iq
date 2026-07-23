'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function BarChartCard({
  title,
  data,
  dataKey = 'value',
  labelKey = 'label',
}: {
  title: string;
  data: Record<string, string | number>[];
  dataKey?: string;
  labelKey?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 p-5">
      <h2 className="mb-4 text-sm text-parchment">{title}</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey={labelKey} tick={{ fill: '#8B8578', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8B8578', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: '#141311',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: '#F4F1EA' }}
              cursor={{ fill: 'rgba(91,141,239,0.08)' }}
            />
            <Bar dataKey={dataKey} fill="#5B8DEF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
