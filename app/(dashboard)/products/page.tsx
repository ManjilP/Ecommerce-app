"use client";
import { useEffect, useState, useRef } from "react";
import { getProducts, deleteProduct, createProduct, updateProduct, uploadProductImage, fetchProductImage } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Package, Search, ChevronLeft, ChevronRight, Upload, ImageIcon } from "lucide-react";

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  price: number | string;
  image?: string;
  created_at: string;
}

const emptyForm = { name: "", sku: "", category: "", price: "" };

export default function ProductsPage() {
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
    setForm({ name: p.name, sku: p.sku, category: p.category, price: String(p.price) });
    setSaveError("");
    setModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const payload = { name: form.name, sku: form.sku, category: form.category, price: parseFloat(form.price) };
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
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
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(14,116,144,0.35)" }}>
          <Plus size={18} /> Add Product
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "stretch", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)" }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by name or SKU..." style={{ paddingLeft: "46px", height: "50px" }} />
        </div>
        <button type="submit" style={{ padding: "0 24px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Search</button>
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
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-9 h-9 rounded-xl object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--card-2)" }}>
                          <ImageIcon size={14} color="var(--text-3)" />
                        </div>
                      )}
                    </td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-3)" }}>{p.sku}</td>
                    <td className="font-medium" style={{ color: "var(--text)" }}>{p.name}</td>
                    <td style={{ color: "var(--text-2)" }}>{p.category}</td>
                    <td className="font-semibold" style={{ color: "#34d399" }}>Rs. {parseFloat(String(p.price)).toFixed(2)}</td>
                    <td>
                      <div className="flex gap-1 items-center">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "#60a5fa" }} title="Edit"><Pencil size={13} /></button>
                        <button onClick={() => handleUploadClick(p.id)} disabled={uploadingId === p.id} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "#a78bfa" }} title="Upload image">
                          {uploadingId === p.id ? <span className="text-xs" style={{ color: "var(--text-3)" }}>...</span> : <Upload size={13} />}
                        </button>
                        <button onClick={() => handleFetchImage(p.id)} disabled={fetchingId === p.id} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "#34d399" }} title="Auto-fetch image">
                          {fetchingId === p.id ? <span className="text-xs" style={{ color: "var(--text-3)" }}>...</span> : <ImageIcon size={13} />}
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg transition-colors hover:bg-white/5" style={{ color: "#f87171" }} title="Delete"><Trash2 size={13} /></button>
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
              <span className="text-sm" style={{ color: "#6b7280" }}>Page {page} of {totalPages} ({count} total)</span>
              <div className="flex gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="p-1 rounded" style={{ color: page === 1 ? "#3e3e42" : "#9ca3af" }}><ChevronLeft size={18} /></button>
                <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="p-1 rounded" style={{ color: page === totalPages ? "#3e3e42" : "#9ca3af" }}><ChevronRight size={18} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border-strong)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: "var(--text)" }}>{editing ? "Edit Product" : "Add Product"}</h2>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "var(--text-2)" }}><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {saveError && <div className="text-sm rounded p-3" style={{ background: "rgba(248,113,113,0.08)", color: "#f87171", border: "1px solid rgba(248,113,113,0.2)" }}>{saveError}</div>}
              <div><label className="block text-sm mb-1" style={{ color: "#9ca3af" }}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><label className="block text-sm mb-1" style={{ color: "#9ca3af" }}>SKU</label><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PROD-001" required /></div>
              <div><label className="block text-sm mb-1" style={{ color: "#9ca3af" }}>Category</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" required /></div>
              <div><label className="block text-sm mb-1" style={{ color: "#9ca3af" }}>Price</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2 rounded-md text-sm" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-md text-sm text-white" style={{ background: "#0e7490" }}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
