export default function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-ink-line px-3 py-1 text-xs text-parchment">
      {children}
    </span>
  );
}
