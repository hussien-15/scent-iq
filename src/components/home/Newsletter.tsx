import type ar from '@/dictionaries/ar';

export default function Newsletter({ dict }: { dict: typeof ar }) {
  return (
    <section className="content-auto border-t border-ink-line px-4 py-16 text-center sm:px-6 sm:py-20">
      <h2 className="font-display text-2xl text-parchment md:text-3xl">
        {dict.home.newsletter.title}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-smoke">{dict.home.newsletter.subtitle}</p>
      <form
        className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          required
          placeholder={dict.home.newsletter.placeholder}
          className="flex-1 rounded-full border border-ink-line bg-transparent px-5 py-3 text-sm text-parchment placeholder:text-smoke focus:border-gold/50 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-bright"
        >
          {dict.home.newsletter.button}
        </button>
      </form>
    </section>
  );
}
