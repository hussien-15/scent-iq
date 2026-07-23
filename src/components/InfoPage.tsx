export default function InfoPage({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="mb-6 font-display text-3xl text-parchment">{title}</h1>
      <p className="text-sm leading-7 text-smoke">{body}</p>
      {children}
    </div>
  );
}
