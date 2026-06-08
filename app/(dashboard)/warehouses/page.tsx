"use client";
import { useEffect, useState } from "react";
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from "@/lib/api";
import { Plus, Pencil, Trash2, X, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Warehouse { id: number; name: string; city: string; location?: string; }

const emptyForm = { name: "", city: "", location: "" };

const label = (text: string) => (
  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>{text}</label>
);

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const pageSize = 5;
  const totalPages = Math.ceil(count / pageSize);

  const load = () => {
    setLoading(true);
    getWarehouses()
      .then((r) => { setWarehouses(Array.isArray(r.data) ? r.data : r.data.results ?? []); setCount(r.data.count ?? 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); load(); };
  const goToPage = (p: number) => { setPage(p); load(); };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (w: Warehouse) => {
    setEditing(w);
    setForm({ name: w.name, city: w.city ?? "", location: w.location ?? "" });
    setModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) await updateWarehouse(editing.id, form);
      else await createWarehouse(form);
      setModal(false); load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this warehouse?")) return;
    await deleteWarehouse(id); load();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Warehouses</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{count} total warehouses</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(14,116,144,0.35)" }}>
          <Plus size={18} /> Add Warehouse
        </button>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", alignItems: "stretch", marginBottom: "24px" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search warehouses..." style={{ paddingLeft: "46px", height: "50px" }} />
        </div>
        <button type="submit" style={{ padding: "0 24px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Search</button>
        {search && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); load(); }} style={{ padding: "0 20px", borderRadius: "14px", fontSize: "16px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", border: "none", cursor: "pointer" }}>Clear</button>}
      </form>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <>
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)" }}>
            <table>
              <thead>
                <tr>{["ID", "Name", "City", "Location", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {warehouses.map((w) => (
                  <tr key={w.id}>
                    <td style={{ color: "var(--text-3)", fontFamily: "monospace" }}>#{w.id}</td>
                    <td style={{ color: "var(--text)", fontWeight: 500 }}>{w.name}</td>
                    <td style={{ color: "var(--text-2)" }}>{w.city}</td>
                    <td style={{ color: "var(--text-2)" }}>{w.location ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button onClick={() => openEdit(w)} style={{ padding: "6px", borderRadius: "8px", color: "#60a5fa", background: "transparent", border: "none", cursor: "pointer" }} title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(w.id)} style={{ padding: "6px", borderRadius: "8px", color: "#f87171", background: "transparent", border: "none", cursor: "pointer" }} title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {warehouses.length === 0 && <tr><td colSpan={5} style={{ padding: "64px 20px", textAlign: "center", color: "var(--text-3)" }}>No warehouses found.</td></tr>}
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
          <div style={{ width: "100%", maxWidth: "440px", borderRadius: "20px", padding: "28px", background: "var(--card)", border: "1px solid var(--border-strong)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>{editing ? "Edit Warehouse" : "Add Warehouse"}</h2>
              <button onClick={() => setModal(false)} style={{ padding: "6px", borderRadius: "8px", color: "var(--text-2)", background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>{label("Name")}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Warehouse" required /></div>
              <div>{label("City")}<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Kathmandu" required /></div>
              <div>{label("Location")}<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Thamel, Kathmandu" /></div>
              <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
                <button type="button" onClick={() => setModal(false)} style={{ flex: 1, height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", border: "none", cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ flex: 1, height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", cursor: "pointer" }}>{saving ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
