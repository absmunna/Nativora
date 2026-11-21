import { useState, useEffect, useMemo } from 'react';
import { Star, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { ProductReview } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { signInAsGuest, formatFirebaseAuthError } from '@/services/firebase/auth';
import { createProductReview, deleteProductReview } from '@/services/firebase/firestore';
import { formatTimestamp } from '@/utils/format';

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  reviews: ProductReview[];
  loading: boolean;
  error: string | null;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export function ProductReviewsSection({
  productId,
  productName,
  reviews,
  loading,
  error,
}: ProductReviewsSectionProps) {
  const { user, isAdmin, customerProfile } = useAuth();
  const { showToast } = useCart();

  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const suggested = customerProfile?.name || user?.displayName || '';
    if (suggested) {
      setReviewerName((prev) => prev || suggested);
    }
  }, [customerProfile?.name, user?.displayName]);

  const summary = useMemo(() => {
    const count = reviews.length;
    if (count === 0) {
      return {
        average: 0,
        count: 0,
        breakdown: [5, 4, 3, 2, 1].map((stars) => ({ stars, total: 0, percent: 0 })),
      };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const average = Math.round((sum / count) * 10) / 10;
    const breakdown = [5, 4, 3, 2, 1].map((stars) => {
      const total = reviews.filter((r) => Math.round(r.rating) === stars).length;
      return { stars, total, percent: Math.round((total / count) * 100) };
    });
    return { average, count, breakdown };
  }, [reviews]);

  const activeStarPreview = hoveredRating ?? rating;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = reviewerName.trim();
    const trimmedComment = comment.trim();

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setFormError('Please enter your name (2–80 characters).');
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormError('Please select a star rating from 1 to 5.');
      return;
    }
    if (trimmedComment.length < 3 || trimmedComment.length > 600) {
      setFormError('Please write a review between 3 and 600 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const activeUser = user || (await signInAsGuest());
      await createProductReview({
        productId,
        authorUid: activeUser.uid,
        reviewerName: trimmedName,
        rating,
        comment: trimmedComment,
      });
      setComment('');
      setRating(5);
      showToast('Thank you! Your review has been published.');
    } catch (err: unknown) {
      setFormError(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      await deleteProductReview(reviewId);
      showToast('Review removed');
    } catch (err: unknown) {
      setFormError(formatFirebaseAuthError(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      id="product-reviews"
      className="bg-[#FFF6F9] border border-[#E5D5DA] rounded-2xl shadow-[0_2px_12px_-4px_rgba(20,36,28,0.06)] p-5 sm:p-8 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E2E7] pb-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[#164A31]">
            Customer Ratings &amp; Reviews
          </h2>
          <p className="text-xs text-[#4F6156] mt-1">
            Verified shopper feedback for {productName}
          </p>
        </div>
        <span className="text-xs font-medium text-[#4F6156] tabular-nums">
          {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Rating Summary + Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#FAF4F6] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-center pr-4 border-r border-[#E5D5DA]">
                <p className="font-display text-4xl font-semibold text-[#164A31] tabular-nums">
                  {summary.count > 0 ? summary.average.toFixed(1) : '—'}
                </p>
                <p className="text-[11px] text-[#4F6156] mt-0.5">out of 5</p>
              </div>
              <div className="space-y-1">
                <div
                  className="flex items-center gap-1"
                  aria-label={`Average rating ${summary.average} out of 5`}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = summary.count > 0 && star <= Math.round(summary.average);
                    return (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          filled ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#C8D4C9]'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-[#4F6156]">
                  {summary.count > 0
                    ? `Based on ${summary.count} customer ${summary.count === 1 ? 'review' : 'reviews'}`
                    : 'No reviews yet — share your experience below'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {summary.breakdown.map((row) => (
                <div key={row.stars} className="flex items-center gap-2.5 text-xs">
                  <span className="w-8 font-medium text-[#164A31] tabular-nums">
                    {row.stars} ★
                  </span>
                  <div className="flex-1 h-2 bg-[#FFF6F9] border border-[#E5D5DA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] transition-all duration-300"
                      style={{ width: `${row.percent}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-[#4F6156] tabular-nums">{row.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Write a Review Form */}
          <form
            onSubmit={handleSubmitReview}
            className="bg-[#FAF4F6] rounded-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="font-display text-lg font-semibold text-[#164A31]">
                Write a Review
              </h3>
              <p className="text-[11px] text-[#4F6156]">
                Share how this harvest tasted and arrived.
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {formError}
              </div>
            )}

            <div>
              <span className="block text-xs font-semibold text-[#164A31] mb-1.5">
                Your Rating *
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex items-center gap-1"
                  onMouseLeave={() => setHoveredRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= activeStarPreview;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        aria-label={`Rate ${star} out of 5 stars`}
                        aria-pressed={rating === star}
                        className="p-1 rounded-lg hover:bg-[#FFF6F9] transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            active ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-[#C8D4C9]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-medium text-[#C27803]">
                  {RATING_LABELS[activeStarPreview]}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="review-name" className="block text-xs font-semibold text-[#164A31] mb-1">
                Your Name *
              </label>
              <input
                id="review-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="e.g., Farhana Rahman"
                className="w-full px-3.5 py-2.5 bg-[#FFF6F9] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31] min-h-[42px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="review-comment" className="text-xs font-semibold text-[#164A31]">
                  Your Review *
                </label>
                <span className="text-[11px] text-[#4F6156] tabular-nums">
                  {comment.length}/600
                </span>
              </div>
              <textarea
                id="review-comment"
                rows={3}
                required
                minLength={3}
                maxLength={600}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about the aroma, freshness, and packaging..."
                className="w-full px-3.5 py-2.5 bg-[#FFF6F9] border border-[#E0CAD1] rounded-xl text-sm focus:outline-none focus:border-[#164A31]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#164A31] hover:bg-[#103825] disabled:opacity-60 text-[#F6F8F5] text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[44px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing Review...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
          </form>
        </div>

        {/* Reviews Feed */}
        <div className="lg:col-span-7 divide-y divide-[#E6ECE6]">
          {error && (
            <div className="p-3.5 mb-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Unable to load live reviews right now ({error}).
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-28 bg-[#FAF4F6] rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 px-6 text-center bg-[#FAF4F6] rounded-2xl space-y-2">
              <MessageSquare className="w-8 h-8 text-[#C27803] mx-auto opacity-80" />
              <p className="font-display text-lg font-medium text-[#164A31]">
                Be the first to review this product
              </p>
              <p className="text-xs text-[#4F6156] max-w-sm mx-auto">
                Have you tried {productName}? Leave a star rating and a short note to help fellow
                shoppers.
              </p>
            </div>
          ) : (
            reviews.map((review) => {
              const canDelete = Boolean(user && (user.uid === review.authorUid || isAdmin));
              return (
                <article
                  key={review.id}
                  className="py-4 first:pt-0 last:pb-0 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#14241C]">{review.reviewerName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? 'fill-[#F59E0B] text-[#F59E0B]'
                                  : 'text-[#C8D4C9]'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-[#4F6156]">
                          {formatTimestamp(review.createdAt)}
                        </span>
                      </div>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        disabled={deletingId === review.id}
                        onClick={() => void handleDeleteReview(review.id)}
                        aria-label="Delete review"
                        className="p-1.5 text-[#4F6156] hover:text-red-700 hover:bg-[#FAF4F6] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === review.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-[#14241C] leading-relaxed whitespace-pre-line">
                    {review.comment}
                  </p>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
