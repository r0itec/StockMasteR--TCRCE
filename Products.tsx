// Products.tsx
import React, { useState, useMemo } from "react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { toCSV, downloadCSV, parseCSVFile } from "../utils/csv";

function ProductForm({initial = {}, onSave, onCancel}) {
  const [sku, setSku] = useState(initial.sku || "");
  const [name, setName] = useState(initial.name || "");
  const [stock, setStock] = useState(initial.stock ?? 0);
  const [price, setPrice] = useState(initial.price ?? 0);

  function submit(e){
    e.preventDefault();
    onSave({ id: initial.id ?? Date.now(), sku, name, stock: Number(stock), price: Number(price) });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={sku} onChange={e=>setSku(e.target.value)} required placeholder="SKU" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <input value={name} onChange={e=>setName(e.target.value)} required placeholder="Name" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <div className="grid grid-cols-2 gap-3">
        <input value={stock} onChange={e=>setStock(e.target.value)} placeholder="Stock" type="number" className="px-3 py-2 rounded bg-transparent border border-white/6" />
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price" type="number" className="px-3 py-2 rounded bg-transparent border border-white/6" />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export default function ProductsPage(){
  // sample initial data - replace with API fetch in real app
  const [items, setItems] = useState([
    {id:1, sku:"WM-001", name:"Widget Model A", stock:120, price:249},
    {id:2, sku:"WM-002", name:"Widget Model B", stock:4, price:199},
    {id:3, sku:"WM-003", name:"Widget Model C", stock:2, price:159},
  ]);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Derived filtered list
  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    if(!q) return items;
    return items.filter(it =>
      String(it.sku).toLowerCase().includes(q) ||
      String(it.name).toLowerCase().includes(q)
    );
  }, [items, search]);

  // Handlers
  function handleAdd(){
    setEditing(null);
    setModalOpen(true);
  }
  function handleEdit(item){
    setEditing(item);
    setModalOpen(true);
  }
  function handleSave(saved){
    setItems(prev => {
      const exist = prev.find(p=>p.id===saved.id);
      if(exist) return prev.map(p=>p.id===saved.id ? saved : p);
      return [saved, ...prev];
    });
    setModalOpen(false);
  }
  function handleDeleteConfirm(){
    setItems(prev => prev.filter(p => p.id !== toDelete?.id));
    setConfirmOpen(false);
    setToDelete(null);
  }
  function handleImport(e){
    const file = e?.target?.files?.[0];
    if(!file) return;
    parseCSVFile(file).then(rows=>{
      // naive mapping: try to map columns
      const newItems = rows.map(r=>({
        id: Date.now() + Math.random(),
        sku: r.SKU || r.sku || r.Sku || r.SKUCode || "",
        name: r.Name || r.name || r.product || "",
        stock: Number(r.Stock || r.stock || 0),
        price: Number(r.Price || r.price || 0),
      })).filter(r=>r.name || r.sku);
      setItems(prev => [...newItems, ...prev]);
      e.target.value = null;
      alert("Imported " + newItems.length + " rows");
    }).catch(err=>{
      console.error(err);
      alert("Failed to parse CSV");
    });
  }
  function handleExport(){
    if(!items.length){ alert("No items to export"); return; }
    const csv = toCSV(items, ["sku","name","stock","price"]);
    downloadCSV(csv, "products_export.csv");
  }

  function handleQuick(action){
    if(action === "export") handleExport();
    if(action === "import") document.getElementById("file-import")?.click();
    if(action === "clear") {
      if(!confirm("Clear all products?")) return;
      setItems([]);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="All products in inventory"
        searchValue={search}
        onSearch={setSearch}
        onAdd={handleAdd}
        addLabel="Add product"
        onImport={handleImport}
        onExport={handleExport}
        showFilters={showFilters}
        onToggleFilters={()=>setShowFilters(s=>!s)}
      />

      {showFilters && (
        <div className="card-glass p-4 mb-4">
          <div className="flex gap-3 items-center">
            <select className="px-3 py-2 bg-transparent border border-white/6 rounded">
              <option>All categories</option>
              <option>Electronics</option>
            </select>
            <input placeholder="Min stock" className="px-3 py-2 bg-transparent border border-white/6 rounded" />
            <button className="btn-ghost">Apply</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-glass p-5">
            <h3 className="text-lg font-semibold text-white">Products list</h3>
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
                        <button className="btn-ghost mr-2" onClick={()=>handleEdit(it)}>Edit</button>
                        <button className="btn-ghost" onClick={()=>{ setToDelete(it); setConfirmOpen(true); }}>Delete</button>
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
                {items.filter(i=>i.stock<=5).length === 0 && <li>No low stock items</li>}
                {items.filter(i=>i.stock<=5).map(i=>(
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
              <button className="btn-ghost text-sm" onClick={()=>handleQuick('import')}>Import products</button>
              <button className="btn-ghost text-sm" onClick={()=>handleQuick('export')}>Export products</button>
              <button className="btn-ghost text-sm" onClick={()=>handleQuick('clear')}>Clear all</button>
            </div>
          </div>

          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Categories</h4>
            <p className="text-slate-300 text-sm mt-2">Electronics, Consumables, Accessories</p>
          </div>
        </aside>
      </div>

      {/* Add / Edit modal */}
      <Modal open={modalOpen} title={editing ? "Edit product" : "Add product"} onClose={()=>setModalOpen(false)}>
        <ProductForm
          initial={editing || {}}
          onSave={handleSave}
          onCancel={()=>setModalOpen(false)}
        />
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog open={confirmOpen}
        title="Delete product"
        message={`Delete "${toDelete?.name}"? This cannot be undone.`}
        onCancel={()=>{ setConfirmOpen(false); setToDelete(null); }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
