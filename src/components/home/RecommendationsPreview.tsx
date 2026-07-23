import NotesPyramid from '@/components/NotesPyramid';
import type ar from '@/dictionaries/ar';

export default function RecommendationsPreview({ dict }: { dict: typeof ar }) {
  return (
    <section className="content-auto border-t border-ink-line bg-vignette px-4 py-16 text-center sm:px-6 sm:py-20">
      <p className="eyebrow mb-3">{dict.home.recommendations.eyebrow}</p>
      <h2 className="mx-auto max-w-2xl font-display text-2xl text-parchment md:text-3xl">
        {dict.home.recommendations.title}
      </h2>
      <p className="mx-auto mt-5 max-w-xl text-sm text-smoke">
        {dict.home.recommendations.description}
      </p>
      <NotesPyramid className="mx-auto mt-10" />
    </section>
  );
}
