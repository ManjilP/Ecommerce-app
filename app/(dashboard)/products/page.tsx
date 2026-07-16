"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getProducts, deleteProduct, createProduct, updateProduct, uploadProductImage, fetchProductImage } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Package, Search, ChevronLeft, ChevronRight, Upload, ImageIcon, AlertCircle } from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number | string;
  description?: string;
  image?: string;
  requires_prescription?: boolean;
  created_at: string;
}

const emptyForm = { name: "", sku: "", category: "", price: "", description: "", requires_prescription: false };

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<number | null>(null);
  const [stockBanner, setStockBanner] = useState<{ id: number; name: string } | null>(null);

  const pageSize = 5;
  const totalPages = Math.ceil((count || products.length) / pageSize);
  const paginatedProducts = products.slice((page - 1) * pageSize, page * pageSize);

  const load = () => {
    setLoading(true);
    getProducts()
      .then((r) => {
        setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? []);
        setCount(r.data.count ?? 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    load();
  };

  const goToPage = (p: number) => { setPage(p); load(); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSaveError(""); setModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, price: String(p.price), description: p.description ?? "", requires_prescription: p.requires_prescription ?? false });
    setSaveError("");
    setModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const payload = { name: form.name, sku: form.sku, category: form.category, price: parseFloat(form.price), description: form.description || undefined, requires_prescription: form.requires_prescription };
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        const res = await createProduct(payload);
        const newProduct = res.data;
        setModal(false);
        load();
        setStockBanner({ id: newProduct.id, name: newProduct.name });
        return;
      }
      setModal(false);
      load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown; status?: number } })?.response;
      setSaveError(`${data?.status}: ${JSON.stringify(data?.data)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    load();
  };

  const handleUploadClick = (id: number) => {
    setUploadTargetId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    setUploadingId(uploadTargetId);
    try {
      await uploadProductImage(uploadTargetId, file);
      load();
    } finally {
      setUploadingId(null);
      setUploadTargetId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFetchImage = async (id: number) => {
    setFetchingId(id);
    try {
      await fetchProductImage(id);
      load();
    } finally {
      setFetchingId(null);
    }
  };

  return (
    <div>
      <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleFileChange} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Products</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{count} total products</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 20px", height: "40px", borderRadius: "4px", fontSize: "14px", fontWeight: 600, color: "var(--accent)", background: "transparent", border: "1.5px solid rgba(14,143,156,0.6)", cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(14,143,156,0.06)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(14,143,156,0.6)"; }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {stockBanner && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 18px", marginBottom: "20px", borderRadius: "14px", background: "color-mix(in srgb, var(--orange) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--orange) 30%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertCircle size={16} color="var(--orange)" />
            <span style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>
              <strong>&quot;{stockBanner.name}&quot;</strong> was created but has no stock — customers can&apos;t order it yet.
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => router.push(`/inventory?product=${stockBanner.id}`)}
              style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "var(--card)", background: "var(--orange)", border: "none", cursor: "pointer" }}
            >
              Add Stock
            </button>
            <button
              onClick={() => setStockBanner(null)}
              style={{ padding: "6px", borderRadius: "8px", color: "var(--text-3)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "stretch", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or SKU..." style={{ paddingLeft: "46px", height: "50px" }} />
        </div>
        <button type="submit" style={{ padding: "0 24px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "var(--card)", background: "var(--accent)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Search</button>
        {search && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(); }} style={{ padding: "0 20px", borderRadius: "14px", fontSize: "16px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", border: "none", cursor: "pointer" }}>Clear</button>}
      </form>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr>{["Image", "SKU", "Name", "Category", "Price", "Actions"].map((h) => (
                  <th key={h}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.image && /^(https?:\/\/|\/)/.test(p.image) ? (
                        <img src={p.image} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--card-2)" }}>
                          <ImageIcon size={14} color="var(--text-3)" />
                        </div>
                      )}
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-3)" }}>{p.sku}</td>
                    <td className="font-medium" style={{ color: "var(--text)" }}>
                      <div className="flex items-center gap-2">
                        {p.name}
                        {p.requires_prescription && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "color-mix(in srgb, var(--orange) 12%, transparent)", color: "var(--orange)" }}>Rx</span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-2)" }}>{p.category}</td>
                    <td className="font-semibold" style={{ color: "var(--green)" }}>Rs. {parseFloat(String(p.price)).toFixed(2)}</td>
                    <td>
                      <div className="flex gap-1 items-center">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--card-2)]" style={{ color: "var(--blue)" }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => handleUploadClick(p.id)} disabled={uploadingId === p.id} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--card-2)]" style={{ color: "var(--purple)" }} title="Upload image">
                          {uploadingId === p.id ? <span className="text-xs" style={{ color: "var(--text-3)" }}>...</span> : <Upload size={13} />}
                        </button>
                        <button onClick={() => handleFetchImage(p.id)} disabled={fetchingId === p.id} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--card-2)]" style={{ color: "var(--green)" }} title="Auto-fetch image">
                          {fetchingId === p.id ? <span className="text-xs" style={{ color: "var(--text-3)" }}>...</span> : <ImageIcon size={13} />}
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--card-2)]" style={{ color: "var(--red)" }} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && <tr><td colSpan={6} className="py-16 text-center" style={{ color: "var(--text-3)" }}>No products found.</td></tr>}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm" style={{ color: "var(--text-2)" }}>Page {page} of {totalPages} ({count} total)</span>
              <div className="flex gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="p-1 rounded" style={{ color: page === 1 ? "var(--border-strong)" : "var(--text-3)" }}><ChevronLeft size={18} /></button>
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="p-1 rounded" style={{ color: page === totalPages ? "var(--border-strong)" : "var(--text-3)" }}><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border shadow-xl rounded-3xl p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-bold text-foreground">{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl hover:bg-accent text-muted-foreground transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {saveError && <div className="text-sm rounded-xl p-3 bg-red-50 border border-red-200 text-red-600">{saveError}</div>}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Name</label>
                <input className="w-full px-4 py-3 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:border-primary/50 transition-colors text-foreground" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">SKU</label>
                <input className="w-full px-4 py-3 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:border-primary/50 transition-colors text-foreground" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PROD-001" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
                <input className="w-full px-4 py-3 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:border-primary/50 transition-colors text-foreground" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Medicine" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Price (Rs.)</label>
                <input type="number" step="0.01" className="w-full px-4 py-3 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:border-primary/50 transition-colors text-foreground" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description <span className="font-normal">(optional)</span></label>
                <textarea className="w-full px-4 py-3 bg-accent/30 border border-border rounded-xl text-sm outline-none focus:border-primary/50 transition-colors resize-y text-foreground" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short product description..." rows={2} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.requires_prescription} onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })} className="w-4 h-4 accent-primary cursor-pointer" />
                <span className="text-sm font-medium text-foreground">Requires prescription</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-transparent border-2 border-border text-foreground hover:bg-accent transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-70 flex items-center justify-center">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
