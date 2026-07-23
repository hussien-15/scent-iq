'use client';

import { useCallback, useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { FlaskConical, Tags } from 'lucide-react';
import { createNote, createTag, deleteNote, deleteTag, updateNote, updateTag, type TaxonomyActionState } from '@/actions/taxonomy';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

const input = 'w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-parchment focus:border-studioBlue/60 focus:outline-none';
const empty: TaxonomyActionState = {};
const label = 'mb-1 block text-[10px] text-smoke';

export type NoteRow = { id: string; nameEn: string; nameAr: string; slug: string; category: string | null; descriptionEn: string | null; descriptionAr: string | null; keywords: string[]; productCount: number; favoriteCount: number };
export type TagRow = { id: string; name: string; nameEn: string | null; nameAr: string | null; slug: string; type: string | null; descriptionEn: string | null; descriptionAr: string | null; productCount: number };

function Submit({ labelText }: { labelText: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-md bg-gold px-4 py-2 text-xs font-medium text-ink disabled:opacity-50">{pending ? 'Saving…' : labelText}</button>;
}

function Message({ state }: { state: TaxonomyActionState }) {
  if (state.error) return <p className="md:col-span-2 rounded-md bg-red-300/10 p-2 text-xs text-red-200">{state.error}</p>;
  if (state.success) return <p className="md:col-span-2 rounded-md bg-emerald-300/10 p-2 text-xs text-emerald-200">{state.success}</p>;
  return null;
}

function useSlug(initialName: string, initialSlug: string) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [touched, setTouched] = useState(Boolean(initialSlug));
  return {
    name, slug,
    updateName(value: string) { setName(value); if (!touched) setSlug(value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); },
    updateSlug(value: string) { setTouched(true); setSlug(value.toLowerCase()); },
  };
}

function DeleteButton({ id, kind, disabled, reason }: { id: string; kind: 'note' | 'tag'; disabled: boolean; reason: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();
  const close = useCallback(() => setOpen(false), []);
  const remove = () => startTransition(async () => {
    const result = kind === 'note' ? await deleteNote(id) : await deleteTag(id);
    if (result.error) showToast({ message: result.error, type: 'error' });
    else { showToast({ message: result.success ?? 'Deleted.', type: 'success' }); setOpen(false); router.refresh(); }
  });
  return <><button type="button" disabled={disabled} title={disabled ? reason : undefined} onClick={() => setOpen(true)} className="rounded-md border border-red-300/20 px-3 py-2 text-xs text-red-200 disabled:cursor-not-allowed disabled:opacity-35">Delete</button><ConfirmDialog open={open} title={`Delete this ${kind}?`} description={`Only unused ${kind}s can be deleted. This action cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" onConfirm={remove} onClose={close} busy={pending} danger /></>;
}

function NoteEditor({ note }: { note?: NoteRow }) {
  const action = note ? updateNote.bind(null, note.id) : createNote;
  const [state, formAction] = useFormState(action, empty);
  const naming = useSlug(note?.nameEn ?? '', note?.slug ?? '');
  const inUse = Boolean(note && (note.productCount > 0 || note.favoriteCount > 0));
  return <details open={!note} className="rounded-lg border border-white/10 bg-white/[0.02]">
    <summary className="cursor-pointer list-none px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-parchment">{note?.nameEn ?? 'Create fragrance note'}</p><p dir="rtl" className="mt-1 text-[10px] text-smoke">{note?.nameAr ?? 'نوتة عطرية جديدة'}{note ? ` · ${note.productCount} products` : ''}</p></div><span className="text-[10px] text-gold-bright">{note ? 'Edit' : 'New'}</span></div></summary>
    <form action={formAction} className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
      <Message state={state} />
      <label><span className={label}>Name (EN) *</span><input name="nameEn" value={naming.name} onChange={(event) => naming.updateName(event.target.value)} className={input} /></label>
      <label><span className={label}>الاسم بالعربي *</span><input dir="rtl" name="nameAr" defaultValue={note?.nameAr ?? ''} className={input} /></label>
      <label><span className={label}>Slug *</span><input name="slug" value={naming.slug} onChange={(event) => naming.updateSlug(event.target.value)} className={input} /></label>
      <label><span className={label}>Fragrance family</span><input name="category" placeholder="woody, citrus, floral…" defaultValue={note?.category ?? ''} className={input} /></label>
      <label><span className={label}>Description</span><textarea name="descriptionEn" rows={3} defaultValue={note?.descriptionEn ?? ''} className={input} /></label>
      <label><span className={label}>الوصف</span><textarea dir="rtl" name="descriptionAr" rows={3} defaultValue={note?.descriptionAr ?? ''} className={input} /></label>
      <label className="md:col-span-2"><span className={label}>SEO keywords (comma separated)</span><input name="keywords" defaultValue={note?.keywords.join(', ')} className={input} /></label>
      <div className="flex justify-end gap-2 md:col-span-2">{note && <DeleteButton id={note.id} kind="note" disabled={inUse} reason="Remove this note from products and preferences first." />}<Submit labelText={note ? 'Update note' : 'Create note'} /></div>
    </form>
  </details>;
}

function TagEditor({ tag }: { tag?: TagRow }) {
  const action = tag ? updateTag.bind(null, tag.id) : createTag;
  const [state, formAction] = useFormState(action, empty);
  const naming = useSlug(tag?.nameEn ?? tag?.name ?? '', tag?.slug ?? '');
  return <details open={!tag} className="rounded-lg border border-white/10 bg-white/[0.02]">
    <summary className="cursor-pointer list-none px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm text-parchment">{tag?.nameEn ?? tag?.name ?? 'Create product tag'}</p><p dir="rtl" className="mt-1 text-[10px] text-smoke">{tag?.nameAr ?? 'تاغ جديد'}{tag ? ` · ${tag.productCount} products` : ''}</p></div><span className="text-[10px] text-gold-bright">{tag ? 'Edit' : 'New'}</span></div></summary>
    <form action={formAction} className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
      <Message state={state} />
      <label><span className={label}>Name (EN) *</span><input name="nameEn" value={naming.name} onChange={(event) => naming.updateName(event.target.value)} className={input} /></label>
      <label><span className={label}>الاسم بالعربي</span><input dir="rtl" name="nameAr" defaultValue={tag?.nameAr ?? ''} className={input} /></label>
      <label><span className={label}>Slug *</span><input name="slug" value={naming.slug} onChange={(event) => naming.updateSlug(event.target.value)} className={input} /></label>
      <label><span className={label}>Type</span><input name="type" placeholder="Marketing, Season, Style…" defaultValue={tag?.type ?? ''} className={input} /></label>
      <label><span className={label}>Description</span><textarea name="descriptionEn" rows={3} defaultValue={tag?.descriptionEn ?? ''} className={input} /></label>
      <label><span className={label}>الوصف</span><textarea dir="rtl" name="descriptionAr" rows={3} defaultValue={tag?.descriptionAr ?? ''} className={input} /></label>
      <div className="flex justify-end gap-2 md:col-span-2">{tag && <DeleteButton id={tag.id} kind="tag" disabled={tag.productCount > 0} reason="Remove this tag from products first." />}<Submit labelText={tag ? 'Update tag' : 'Create tag'} /></div>
    </form>
  </details>;
}

export default function TaxonomyManager({ notes, tags }: { notes: NoteRow[]; tags: TagRow[] }) {
  return <div className="grid gap-8 xl:grid-cols-2">
    <section><div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-gold/10 p-2 text-gold-bright"><FlaskConical size={18} /></span><div><h2 className="text-sm font-medium text-parchment">Fragrance notes</h2><p className="text-[10px] text-smoke">Reusable top, heart and base ingredients.</p></div></div><div className="space-y-3"><NoteEditor />{notes.map((note) => <NoteEditor key={note.id} note={note} />)}</div></section>
    <section><div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-studioBlue/10 p-2 text-studioBlue"><Tags size={18} /></span><div><h2 className="text-sm font-medium text-parchment">Product tags</h2><p className="text-[10px] text-smoke">Controlled merchandising and discovery labels.</p></div></div><div className="space-y-3"><TagEditor />{tags.map((tag) => <TagEditor key={tag.id} tag={tag} />)}</div></section>
  </div>;
}
