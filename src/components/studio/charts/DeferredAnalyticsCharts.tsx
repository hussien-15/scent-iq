'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Revenue = dynamic(() => import('./AnalyticsCharts').then((module) => module.RevenueTrendChart), { ssr: false });
const Bars = dynamic(() => import('./AnalyticsCharts').then((module) => module.AnalyticsBarChart), { ssr: false });
const Donut = dynamic(() => import('./AnalyticsCharts').then((module) => module.AnalyticsDonutChart), { ssr: false });

function Gate({ children, minWidth = 440 }: { children: React.ReactNode; minWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '320px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="h-64 overflow-hidden" style={{ minWidth }}>{visible ? children : <div className="h-full animate-pulse rounded-md bg-white/[0.03]" aria-label="Chart loading" />}</div>;
}

export function RevenueTrendChart(props: { data: { label: string; revenue: number; orders: number }[] }) {
  return <Gate minWidth={560}><Revenue {...props} /></Gate>;
}

export function AnalyticsBarChart(props: { data: Record<string, string | number>[]; dataKey?: string; labelKey?: string; color?: string; money?: boolean }) {
  return <Gate><Bars {...props} /></Gate>;
}

export function AnalyticsDonutChart(props: { data: { label: string; value: number }[] }) {
  return <Gate minWidth={360}><Donut {...props} /></Gate>;
}
