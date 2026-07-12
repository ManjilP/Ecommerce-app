"use client";
import { useEffect, useState } from "react";
import { getInventory, getProducts, getWarehouses, createInventoryItem, updateInventoryItem, deleteInventoryItem } from "@/lib/api";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface InventoryItem { id: number; product: number; product_name: string; warehouse: number; warehouse_name: string; quantity: number; stock_status: string; }
interface Product { id: number; name: string; }
interface WarehouseItem { id: number; name: string; }

const statusColor: Record<string, string> = { in_stock: "#34d399", low_stock: "#fb923c", out_of_stock: "#f87171" };
const statusBg: Record<string, string> = { in_stock: "rgba(52,211,153,0.12)", low_stock: "rgba(251,146,60,0.12)", out_of_stock: "rgba(248,113,113,0.12)" };
const emptyForm = { product: "", warehouse: "", quantity: "" };

const label = (text: string) => (
  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-2)", marginBottom: "6px" }}>{text}</label>
);

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = () => {
    setLoading(true);
    getInventory()
      .then((r) => setItems(Array.isArray(r.data) ? r.data : r.data.results ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getProducts().then((r) => setProducts(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => {});
    getWarehouses().then((r) => setWarehouses(Array.isArray(r.data) ? r.data : r.data.results ?? [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setSaveError(""); setModal(true); };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this inventory item?")) return;
    await deleteInventoryItem(id);
    load();
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ product: String(item.product), warehouse: String(item.warehouse), quantity: String(item.quantity) });
    setSaveError(""); setModal(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setSaveError("");
    try {
      const payload = { product: parseInt(form.product), warehouse: parseInt(form.warehouse), quantity: parseInt(form.quantity) };
      if (editing) await updateInventoryItem(editing.id, payload);
      else await createInventoryItem(payload);
      setModal(false); load();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown; status?: number } })?.response;
      setSaveError(`${data?.status}: ${JSON.stringify(data?.data)}`);
    } finally { setSaving(false); }
  };

  const filtered = items.filter((i) =>
    (!productFilter || String(i.product) === productFilter) &&
    (!warehouseFilter || String(i.warehouse) === warehouseFilter)
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-0.5px", color: "var(--text)", lineHeight: 1.1 }}>Inventory</h1>
          <p style={{ fontSize: "16px", color: "var(--text-2)", marginTop: "6px" }}>{items.length} items tracked</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 24px", height: "48px", borderRadius: "14px", fontSize: "16px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", cursor: "pointer", boxShadow: "0 0 24px rgba(14,116,144,0.35)" }}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} style={{ maxWidth: "240px" }}>
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} style={{ maxWidth: "240px" }}>
          <option value="">All Warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        {(productFilter || warehouseFilter) && (
          <button onClick={() => { setProductFilter(""); setWarehouseFilter(""); }} style={{ padding: "0 20px", borderRadius: "14px", fontSize: "15px", fontWeight: 500, color: "var(--text-2)", background: "var(--card-2)", border: "none", cursor: "pointer" }}>Clear</button>
        )}
      </div>

      {loading ? <p style={{ color: "var(--text-3)" }}>Loading...</p> : (
        <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)" }}>
          <table>
            <thead>
              <tr>{["ID", "Product", "Warehouse", "Quantity", "Status", "Actions"].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: "var(--text-3)", fontFamily: "monospace" }}>#{item.id}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>{item.product_name}</td>
                  <td style={{ color: "var(--text-2)" }}>{item.warehouse_name}</td>
                  <td style={{ color: "var(--text)", fontWeight: 600 }}>{item.quantity}</td>
                  <td>
                    <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "13px", fontWeight: 500, background: statusBg[item.stock_status] ?? "rgba(107,114,128,0.12)", color: statusColor[item.stock_status] ?? "#9ca3af" }}>
                      {item.stock_status?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <button onClick={() => openEdit(item)} style={{ padding: "6px", borderRadius: "8px", color: "#60a5fa", background: "transparent", border: "none", cursor: "pointer" }} title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(item.id)} style={{ padding: "6px", borderRadius: "8px", color: "#f87171", background: "transparent", border: "none", cursor: "pointer" }} title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: "64px 20px", textAlign: "center", color: "var(--text-3)" }}>No inventory data.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div style={{ width: "100%", maxWidth: "440px", borderRadius: "20px", padding: "28px", background: "var(--card)", border: "1px solid var(--border-strong)", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>{editing ? "Update Quantity" : "Add to Inventory"}</h2>
              <button onClick={() => setModal(false)} style={{ padding: "6px", borderRadius: "8px", color: "var(--text-2)", background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            {saveError && <div style={{ marginBottom: "16px", padding: "12px 16px", borderRadius: "12px", fontSize: "14px", color: "#f87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>{saveError}</div>}
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>{label("Product")}<select value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required disabled={!!editing}><option value="">Select product...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div>{label("Warehouse")}<select value={form.warehouse} onChange={(e) => setForm({ ...form, warehouse: e.target.value })} required disabled={!!editing}><option value="">Select warehouse...</option>{warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
              <div>{label("Quantity")}<input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></div>
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
