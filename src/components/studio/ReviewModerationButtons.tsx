'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, EyeOff, Flag, MessageSquareReply, Sparkles, Trash2, X } from 'lucide-react';
import {
  deleteSpamReview,
  saveAdminReply,
  setReviewImageStatus,
  setReviewStatus,
  toggleReviewFeatured,
} from '@/actions/review';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/ToastProvider';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' | 'REPORTED';

export default function ReviewModerationButtons({
  reviewId,
  status,
  featured,
  reply,
  images,
}: {
  reviewId: string;
  status: Status;
  featured: boolean;
  reply: string | null;
  images: { id: string; url: string; approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' }[];
}) {
  const router = useRouter();
  const [replyText, setReplyText] = useState(reply ?? '');
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { showToast } = useToast();
  const button =
    'flex min-h-8 items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[11px] text-smoke transition-colors hover:border-gold/40 hover:text-parchment disabled:opacity-40';

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await action();
        showToast({ message: 'Review changes saved.' });
        router.refresh();
      } catch {
        showToast({ message: 'Review action failed. Try again.', type: 'error' });
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status !== 'APPROVED' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => setReviewStatus(reviewId, 'APPROVED'))}
            className={`${button} border-studioBlue/40 text-studioBlue`}
          >
            <Check size={12} />
            Approve
          </button>
        )}
        {status !== 'REJECTED' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => setReviewStatus(reviewId, 'REJECTED'))}
            className={button}
          >
            <X size={12} />
            Reject
          </button>
        )}
        {status !== 'HIDDEN' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => setReviewStatus(reviewId, 'HIDDEN'))}
            className={button}
          >
            <EyeOff size={12} />
            Hide
          </button>
        )}
        {status !== 'REPORTED' && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => setReviewStatus(reviewId, 'REPORTED'))}
            className={button}
          >
            <Flag size={12} />
            Report
          </button>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => toggleReviewFeatured(reviewId))}
          className={`${button} ${featured ? 'border-gold/50 text-gold-bright' : ''}`}
        >
          <Sparkles size={12} />
          {featured ? 'Unfeature' : 'Feature'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setDeleteOpen(true)}
          className={`${button} hover:border-red-300/40 hover:text-red-200`}
        >
          <Trash2 size={12} />
          Delete spam
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          maxLength={500}
          placeholder="Short professional reply…"
          className="min-w-0 flex-1 rounded-md border border-white/10 bg-transparent px-3 py-2 text-xs text-parchment placeholder:text-smoke focus:border-gold/40 focus:outline-none"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => saveAdminReply(reviewId, replyText))}
          className={button}
        >
          <MessageSquareReply size={12} />
          Save reply
        </button>
      </div>

      {images.map((image) => (
        <div key={image.id} className="flex items-center gap-3 rounded-md border border-white/10 p-2">
          <a
            href={image.url}
            target="_blank"
            rel="noreferrer"
            className="relative block h-12 w-12 overflow-hidden rounded"
          >
            <Image src={image.url} alt="Review upload" fill quality={60} sizes="48px" className="object-cover" />
          </a>
          <span className="text-[10px] text-smoke">Image: {image.approvalStatus}</span>
          <div className="ms-auto flex gap-1">
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => setReviewImageStatus(image.id, 'APPROVED'))}
              className={button}
            >
              <Check size={12} />
              Approve
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => run(() => setReviewImageStatus(image.id, 'REJECTED'))}
              className={button}
            >
              <X size={12} />
              Reject
            </button>
          </div>
        </div>
      ))}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this review as spam?"
        description="This permanently removes the review and its moderation record. This action cannot be undone."
        confirmLabel="Delete review"
        cancelLabel="Keep review"
        danger
        busy={isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          run(async () => {
            await deleteSpamReview(reviewId);
            setDeleteOpen(false);
          });
        }}
      />
    </div>
  );
}
