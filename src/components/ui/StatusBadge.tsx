const statusCopy: Record<string, { label: string; tone: string }> = {
  PUBLISHED: { label: 'Published', tone: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' },
  ACTIVE: { label: 'Active', tone: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' },
  DELIVERED: { label: 'Delivered', tone: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' },
  APPROVED: { label: 'Approved', tone: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-200' },
  PENDING: { label: 'Pending', tone: 'border-amber-300/25 bg-amber-400/10 text-amber-100' },
  LOW_STOCK: { label: 'Low stock', tone: 'border-amber-300/25 bg-amber-400/10 text-amber-100' },
  DRAFT: { label: 'Draft', tone: 'border-white/10 bg-white/5 text-smoke' },
  ARCHIVED: { label: 'Archived', tone: 'border-white/10 bg-white/5 text-smoke' },
  HIDDEN: { label: 'Hidden', tone: 'border-white/10 bg-white/5 text-smoke' },
  CONFIRMED: { label: 'Confirmed', tone: 'border-blue-300/25 bg-blue-400/10 text-blue-100' },
  PREPARING: { label: 'Preparing', tone: 'border-violet-300/25 bg-violet-400/10 text-violet-100' },
  SHIPPED: { label: 'Shipped', tone: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100' },
  CANCELLED: { label: 'Cancelled', tone: 'border-red-300/25 bg-red-400/10 text-red-200' },
  RETURNED: { label: 'Returned', tone: 'border-red-300/25 bg-red-400/10 text-red-200' },
  REJECTED: { label: 'Rejected', tone: 'border-red-300/25 bg-red-400/10 text-red-200' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'border-red-300/25 bg-red-400/10 text-red-200' },
};

export function statusLabel(status: string) {
  return (
    statusCopy[status]?.label ??
    status
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

export default function StatusBadge({ status }: { status: string }) {
  const item = statusCopy[status] ?? { label: statusLabel(status), tone: 'border-white/10 bg-white/5 text-smoke' };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-medium ${item.tone}`}>
      {item.label}
    </span>
  );
}
