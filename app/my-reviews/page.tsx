'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, PenLine, RefreshCw, Trash2 } from 'lucide-react'
import Navbar from '@/components/navbar'
import SecondaryNav from '@/components/secondary-nav'
import Footer from '@/components/footer'
import { getReviews, deleteReview } from '@/lib/api'
import { GridBackground } from '@/components/ui/grid-background'

interface Review {
  id: number
  product?: { id: number; name: string } | number
  product_name?: string
  rating: number
  comment?: string
  text?: string
  created_at?: string
  date?: string
  user?: { username: string; first_name?: string }
  user_name?: string
}

const getProductName = (r: Review) =>
  r.product_name ?? (typeof r.product === 'object' && r.product?.name ? r.product.name : 'Product')

const getComment = (r: Review) => r.comment ?? r.text ?? ''

const getUserInitials = (r: Review) => {
  const name = r.user?.first_name ?? r.user?.username ?? r.user_name ?? '?'
  return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
}

const formatDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} className={s <= rating ? 'text-[var(--yellow)] fill-[var(--yellow)]' : 'text-muted-foreground fill-muted'} />
      ))}
    </div>
  )
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100),
  }))
  return (
    <div className="bg-card rounded-3xl border border-border p-6 flex flex-col md:flex-row gap-6 mb-8">
      <div className="flex flex-col items-center justify-center gap-1 md:border-r md:border-border md:pr-8">
        <p className="font-heading text-6xl font-bold text-foreground">{avg.toFixed(1)}</p>
        <StarRating rating={Math.round(avg)} size={20} />
        <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 space-y-2">
        {counts.map(({ star, pct }) => (
          <div key={star} className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 w-16">
              <span className="text-xs text-muted-foreground w-2">{star}</span>
              <Star size={11} className="text-[var(--yellow)] fill-[var(--yellow)]" />
            </div>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: (5 - star) * 0.08 }}
                className="h-full bg-[var(--yellow)] rounded-full"
              />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReviews = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getReviews()
      setReviews(Array.isArray(res.data) ? res.data : res.data.results ?? [])
    } catch { setError('Failed to load reviews.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [])

  const handleDelete = async (id: number) => {
    try {
      await deleteReview(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch {}
  }

  return (
    <GridBackground className="min-h-screen bg-background">
      <Navbar />
      <SecondaryNav />
      <div className="pt-32 max-w-2xl mx-auto px-4 py-10 relative z-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--yellow)_14%,transparent)] flex items-center justify-center">
                <Star size={20} className="text-[var(--yellow)]" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">My Reviews</h1>
            </div>
            <p className="text-muted-foreground text-sm ml-[52px]">
              {reviews.length} product {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            <PenLine size={14} /> Write a Review
          </button>
        </motion.div>

        <RatingSummary reviews={reviews} />

        {loading && (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border border-border p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/5" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-4/5 mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-muted-foreground text-sm">{error}</p>
            <button onClick={fetchReviews} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center"><Star size={28} className="text-muted-foreground" /></div>
            <h3 className="font-heading text-xl font-bold text-foreground">No reviews yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">Share your experience with products you&apos;ve purchased.</p>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-sm font-bold">{getUserInitials(review)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{getProductName(review)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-muted-foreground">{formatDate(review.created_at ?? review.date)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:border-destructive/40 hover:text-destructive transition-all flex-shrink-0 flex items-center gap-1"
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                    {getComment(review) && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{getComment(review)}</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </GridBackground>
  )
}
