export default function StudioPlaceholder({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <div className="max-w-lg">
      <h1 className="mb-3 font-display text-2xl text-parchment">{title}</h1>
      <p className="text-sm text-smoke">{reason}</p>
    </div>
  );
}
