"use client";
import { useEffect, useState } from "react";
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/api";
import { Ticket, Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: string;
  minimum_order_amount: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string;
}

const emptyForm = { code: "", discount_type: "percentage", discount_value: "", minimum_order_amount: "", max_uses: "", is_active: true, expires_at: "" };

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const pageSize = 5;
  const totalPages = Math.ceil(count / pageSize);

  const load = () => {
    setLoading(true);
    getCoupons()
      .then((r) => { setCoupons(Array.isArray(r.data) ? r.data : r.data.results ?? []); setCount(r.data.count ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); load(); };
  const goToPage = (p: number) => { setPage(p); load(); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSaveError(""); setModal(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, minimum_order_amount: c.minimum_order_amount, max_uses: String(c.max_uses), is_active: c.is_active, expires_at: c.expires_at?.slice(0, 16) ?? "" });
    setSaveError(""); setModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setSaveError("");
    try {
      const payload = { ...form, max_uses: parseInt(form.max_uses), minimum_order_amount: form.minimum_order_amount || "0" };
      if (editing) await updateCoupon(editing.id, payload);
      else await createCoupon(payload);
      setModal(false); load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      setSaveError(data ? JSON.stringify(data) : "Failed to save.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this coupon?")) return;
    await deleteCoupon(id); load();
  };

  const label = (text: string) => (
    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>{text}</label>
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Coupons</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{count} total coupons</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "var(--card)", background: "var(--accent)", border: "none", cursor: "pointer" }}>
          <Plus size={18} /> New Coupon
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "stretch", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by code..." style={{ paddingLeft: "46px", height: "50px" }} />
        </div>
        <button type="submit" style={{ padding: "0 24px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "var(--card)", background: "var(--accent)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Search</button>
        {search && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(); }} style={{ padding: "0 20px", borderRadius: "14px", fontSize: "16px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", border: "none", cursor: "pointer" }}>Clear</button>}
      </form>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <>
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)" }}>
            <table>
              <thead>
                <tr>{["Code", "Type", "Value", "Min Order", "Uses", "Active", "Expires", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--text)", fontWeight: 600 }}>{c.code}</td>
                    <td style={{ color: "var(--text-2)" }}>{c.discount_type}</td>
                    <td style={{ color: "var(--green)", fontWeight: 600 }}>{c.discount_type === "percentage" ? `${c.discount_value}%` : `Rs. ${c.discount_value}`}</td>
                    <td style={{ color: "var(--text-2)" }}>Rs. {c.minimum_order_amount}</td>
                    <td style={{ color: "var(--text-2)" }}>{c.used_count}/{c.max_uses}</td>
                    <td>
                      <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, background: c.is_active ? "rgba(52,211,153,0.12)" : "rgba(107,114,128,0.12)", color: c.is_active ? "var(--green)" : "var(--text-2)" }}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-2)" }}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => openEdit(c)} style={{ padding: "6px", borderRadius: "8px", color: "var(--blue)", background: "transparent", border: "none", cursor: "pointer" }} title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(c.id)} style={{ padding: "6px", borderRadius: "8px", color: "var(--red)", background: "transparent", border: "none", cursor: "pointer" }} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && <tr><td colSpan={8} style={{ padding: "64px 20px", textAlign: "center", color: "var(--text-3)" }}>No coupons found.</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
              <span style={{ fontSize: "14px", color: "var(--text-3)" }}>Page {page} of {totalPages}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} style={{ padding: "6px", borderRadius: "8px", color: page === 1 ? "var(--border-strong)" : "var(--text-2)", background: "transparent", border: "none", cursor: page === 1 ? "default" : "pointer" }}><ChevronLeft size={18} /></button>
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} style={{ padding: "6px", borderRadius: "8px", color: page === totalPages ? "var(--border-strong)" : "var(--text-2)", background: "transparent", border: "none", cursor: page === totalPages ? "default" : "pointer" }}><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div style={{ width: "100%", maxWidth: "460px", borderRadius: "20px", padding: "28px", background: "var(--card)", border: "1px solid var(--border-strong)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>{editing ? "Edit Coupon" : "New Coupon"}</h2>
              <button onClick={() => setModal(false)} style={{ padding: "6px", borderRadius: "8px", color: "var(--text-2)", background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            {saveError && <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "var(--red)", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>{saveError}</div>}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>{label("Code")}<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. SAVE20" required /></div>
              <div>{label("Discount Type")}<select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></div>
              <div>{label("Discount Value")}<input type="number" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required /></div>
              <div>{label("Minimum Order Amount")}<input type="number" step="0.01" value={form.minimum_order_amount} onChange={(e) => setForm({ ...form, minimum_order_amount: e.target.value })} /></div>
              <div>{label("Max Uses")}<input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} required /></div>
              <div>{label("Expires At")}<input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                <label htmlFor="is_active" style={{ fontSize: "15px", color: "var(--text-2)", cursor: "pointer" }}>Active</label>
              </div>
              <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", border: "none", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "var(--card)", background: "var(--accent)", border: "none", cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
