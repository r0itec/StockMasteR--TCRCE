// src/pages/Products.tsx
import React, { useState, useMemo, useEffect } from "react";
import client from "../api/client";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { toCSV, downloadCSV, parseCSVFile } from "../utils/csv";

function ProductForm({ initial = {}, onSave, onCancel }) {
  const [sku, setSku] = useState(initial.sku || "");
  const [name, setName] = useState(initial.name || "");
  const [stock, setStock] = useState(initial.stock ?? 0);
  const [price, setPrice] = useState(initial.price ?? 0);

  useEffect(() => {
    setSku(initial.sku || "");
    setName(initial.name || "");
    setStock(initial.stock ?? 0);
    setPrice(initial.price ?? 0);
  }, [initial]);

  function submit(e) {
    e.preventDefault();
    onSave({ id: initial.id ?? undefined, sku, name, stock: Number(stock), price: Number(price) });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={sku} onChange={e => setSku(e.target.value)} required placeholder="SKU" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <input value={name} onChange={e => setName(e.target.value)} required placeholder="Name" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <div className="grid grid-cols-2 gap-3">
        <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" type="number" className="px-3 py-2 rounded bg-transparent border border-white/6" />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" className="px-3 py-2 rounded bg-transparent border border-white/6" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await client.get("/products");
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load products", err);
      alert("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return items;
    return items.filter(it =>
      String(it.sku || "").toLowerCase().includes(q) ||
      String(it.name || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(it) {
    setEditing(it);
    setModalOpen(true);
  }

  async function saveItem(payload) {
    try {
      if (payload.id) {
        // update
        const res = await client.put(`/products/${payload.id}`, payload);
        setItems(prev => prev.map(p => p.id === payload.id ? res.data : p));
      } else {
        const res = await client.post("/products", payload);
        setItems(prev => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Save failed");
    }
  }

  function confirmDelete(it) {
    setToDelete(it);
    setConfirmOpen(true);
  }

  async function doDelete() {
    if (!toDelete) return;
    try {
      await client.delete(`/products/${toDelete.id}`);
      setItems(prev => prev.filter(p => p.id !== toDelete.id));
      setConfirmOpen(false);
      setToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  }

  async function onImport(e) {
    const file = e?.target?.files?.[0];
    if (!file) return;
    try {
      const rows = await parseCSVFile(file);
      // If backend supports bulk, call it
      if (rows.length) {
        // Try bulk first, fallback to per-item create
        try {
          await client.post("/products/bulk", { rows });
          await fetchList();
          alert(`Imported ${rows.length} rows`);
        } catch (bulkErr) {
          // fallback: map and post
          for (const r of rows) {
            const payload = {
              sku: r.SKU || r.sku || r.Sku || "",
              name: r.Name || r.name || r.product || "",
              stock: Number(r.Stock || r.stock || 0),
              price: Number(r.Price || r.price || 0)
            };
            if (payload.name || payload.sku) {
              await client.post("/products", payload);
            }
          }
          await fetchList();
          alert(`Imported ${rows.length} rows (fallback)`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Import failed");
    } finally {
      e.target.value = null;
    }
  }

  async function onExport() {
    try {
      // fetch latest from backend
      const res = await client.get("/products");
      const data = res.data || [];
      if (!data.length) { alert("No data to export"); return; }
      const csv = toCSV(data, ["sku", "name", "stock", "price"]);
      downloadCSV(csv, "products_export.csv");
    } catch (err) {
      console.error(err);
      alert("Export failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="All products in inventory"
        searchValue={search}
        onSearch={setSearch}
        onAdd={openAdd}
        addLabel="Add product"
        onImport={onImport}
        onExport={onExport}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(s => !s)}
      />

      {showFilters && (
        <div className="card-glass p-4 mb-4">
          <div className="flex gap-3 items-center">
            <select className="px-3 py-2 bg-transparent border border-white/6 rounded">
              <option value="">All categories</option>
            </select>
            <input placeholder="Min stock" className="px-3 py-2 bg-transparent border border-white/6 rounded" />
            <button className="btn-ghost">Apply</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-glass p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Products list</h3>
              {loading && <div className="text-sm text-slate-400">Loading...</div>}
            </div>
            <p className="text-slate-300 text-sm mt-2">Manage SKUs, prices and stock levels.</p>

            <div className="mt-3 overflow-x-auto">
              <table className="table w-full">
                <thead className="text-slate-300 text-sm">
                  <tr>
                    <th className="px-4 py-2 text-left">SKU</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Stock</th>
                    <th className="px-4 py-2 text-left">Price</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200 text-sm">
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No results</td></tr>
                  )}
                  {filtered.map(it => (
                    <tr key={it.id} className="border-b border-white/6">
                      <td className="px-4 py-3">{it.sku}</td>
                      <td className="px-4 py-3">{it.name}</td>
                      <td className="px-4 py-3">{it.stock}</td>
                      <td className="px-4 py-3">₹{it.price}</td>
                      <td className="px-4 py-3">
                        <button className="btn-ghost mr-2" onClick={() => openEdit(it)}>Edit</button>
                        <button className="btn-ghost" onClick={() => { setToDelete(it); setConfirmOpen(true); }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          <div className="card-glass p-5">
            <h3 className="text-lg font-semibold text-white">Low stock</h3>
            <div className="mt-3">
              <ul className="text-slate-200 text-sm space-y-2">
                {items.filter(i => i.stock <= 5).length === 0 && <li>No low stock items</li>}
                {items.filter(i => i.stock <= 5).map(i => (
                  <li key={i.id}>• {i.name} — {i.stock} left</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Quick actions</h4>
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn-ghost text-sm" onClick={() => document.getElementById("file-import")?.click()}>Import products</button>
              <button className="btn-ghost text-sm" onClick={onExport}>Export products</button>
              <button className="btn-ghost text-sm" onClick={async () => { if (!confirm("Clear all products?")) return; await client.delete("/products"); fetchList(); }}>Clear all</button>
            </div>
          </div>

          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Categories</h4>
            <p className="text-slate-300 text-sm mt-2">Electronics, Consumables, Accessories</p>
          </div>
        </aside>
      </div>

      <Modal open={modalOpen} title={editing ? "Edit product" : "Add product"} onClose={() => setModalOpen(false)}>
        <ProductForm initial={editing || {}} onSave={saveItem} onCancel={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog open={confirmOpen}
        title="Delete product"
        message={`Delete "${toDelete?.name}"? This cannot be undone.`}
        onCancel={() => { setConfirmOpen(false); setToDelete(null); }}
        onConfirm={doDelete}
      />
    </div>
  );
}
