"use client";
import { useEffect, useState } from "react";
import { getReviews, createReview, updateReview, deleteReview, getProducts } from "@/lib/api";
import { Star, Plus, Pencil, Trash2, X } from "lucide-react";

interface Review {
  id: number;
  product: number;
  product_name: string;
  username: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Product { id: number; name: string; }

const ratingLabels: Record<number, string> = { 1: "Very Bad", 2: "Bad", 3: "Average", 4: "Good", 5: "Excellent" };
const ratingColor: Record<number, string> = { 1: "#f87171", 2: "#fb923c", 3: "#fbbf24", 4: "#34d399", 5: "#10b981" };

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ background: "none", border: "none", cursor: readonly ? "default" : "pointer", padding: "2px" }}
        >
          <Star
            size={readonly ? 16 : 24}
            fill={(hover || value) >= s ? "#fbbf24" : "none"}
            color={(hover || value) >= s ? "#fbbf24" : "var(--border-strong)"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

const emptyForm = { product: "", rating: 0, comment: "" };

const label = (text: string) => (
  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "8px" }}>{text}</label>
);

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    getReviews()
      .then((r) => setReviews(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getProducts().then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? []));
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSaveError(""); setModal(true); };
  const openEdit = (r: Review) => {
    setEditing(r);
    setForm({ product: String(r.product), rating: r.rating, comment: r.comment ?? "" });
    setSaveError(""); setModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.rating === 0) { setSaveError("Please select a rating."); return; }
    setSaving(true); setSaveError("");
    try {
      if (editing) {
        await updateReview(editing.id, { rating: form.rating, comment: form.comment || undefined });
      } else {
        await createReview({ product: parseInt(form.product), rating: form.rating, comment: form.comment || undefined });
      }
      setModal(false); load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      setSaveError(data ? JSON.stringify(data) : "Failed to save review.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    await deleteReview(id); load();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>My Reviews</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{reviews.length} {reviews.length === 1 ? "review" : "reviews"} written</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "44px", borderRadius: "4px", fontSize: "15px", fontWeight: 600, color: "rgba(0,113,227,1)", background: "transparent", border: "1.5px solid rgba(0,113,227,0.6)", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,0.06)"; e.currentTarget.style.borderColor = "rgba(0,113,227,1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(0,113,227,0.6)"; }}>
          <Plus size={16} /> Write Review
        </button>
      </div>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", borderRadius: "20px", background: "var(--card)", border: "1px solid var(--border)" }}>
          <Star size={44} color="var(--border-strong)" style={{ margin: "0 auto 16px" }} />
          <p style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>No reviews yet</p>
          <p style={{ fontSize: "15px", color: "var(--text-3)", marginBottom: "24px" }}>Share your experience with products you&apos;ve ordered</p>
          <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "46px", borderRadius: "12px", fontSize: "15px", fontWeight: 600, color: "#fff", background: "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,113,227,1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; }}>
            <Plus size={16} /> Write your first review
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ borderRadius: "16px", padding: "20px 24px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{r.product_name}</p>
                    <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 10px", borderRadius: "99px", background: `${ratingColor[r.rating]}18`, color: ratingColor[r.rating] }}>
                      {ratingLabels[r.rating]}
                    </span>
                  </div>
                  <StarRating value={r.rating} readonly />
                  {r.comment && (
                    <p style={{ fontSize: "15px", color: "var(--text-2)", marginTop: "10px", lineHeight: 1.6 }}>{r.comment}</p>
                  )}
                  <p style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "10px" }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  <button onClick={() => openEdit(r)} style={{ padding: "8px", borderRadius: "10px", color: "#60a5fa", background: "transparent", border: "none", cursor: "pointer" }} title="Edit"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(r.id)} style={{ padding: "8px", borderRadius: "10px", color: "#f87171", background: "transparent", border: "none", cursor: "pointer" }} title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(16px)" }}>
          <div style={{ width: "100%", maxWidth: "480px", borderRadius: "24px", padding: "28px", background: "var(--bg-elevated)", border: "1px solid var(--border)", boxShadow: "0 40px 80px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.3px" }}>{editing ? "Edit Review" : "Write a Review"}</h2>
              <button onClick={() => setModal(false)} style={{ width: "30px", height: "30px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--card-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-2)" }}><X size={15} /></button>
            </div>

            {saveError && <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "var(--red)", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>{saveError}</div>}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {!editing && (
                <div>
                  {label("Product")}
                  <select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
                    <option value="">Select a product...</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              {editing && (
                <div style={{ padding: "14px 16px", borderRadius: "12px", background: "var(--card-2)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-3)", marginBottom: "2px" }}>Product</p>
                  <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--text)" }}>{editing.product_name}</p>
                </div>
              )}

              <div>
                {label("Rating")}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
                  {form.rating > 0 && (
                    <span style={{ fontSize: "14px", fontWeight: 600, color: ratingColor[form.rating] }}>
                      {ratingLabels[form.rating]}
                    </span>
                  )}
                </div>
              </div>

              <div>
                {label("Comment (optional)")}
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 500, color: "var(--text)", background: "var(--card-2)", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--card-2)"}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, height: "48px", borderRadius: "99px", fontSize: "15px", fontWeight: 600, color: "#fff", background: saving ? "#c7c7cc" : "rgba(0,113,227,0.85)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(0,113,227,0.4)", boxShadow: saving ? "none" : "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", cursor: saving ? "not-allowed" : "pointer", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,113,227,1)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,113,227,0.4), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}
                  onMouseLeave={e => { if (!saving) { e.currentTarget.style.background = "rgba(0,113,227,0.85)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,113,227,0.3), inset 0 1px 0 rgba(255,255,255,0.2)"; } }}>
                  {saving ? "Saving..." : editing ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
