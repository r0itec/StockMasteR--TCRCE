// src/pages/Transfers.jsx
import React, { useState, useEffect, useMemo } from "react";
import client from "../api/client";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import { toCSV, downloadCSV, parseCSVFile } from "../utils/csv";

function TransferForm({ initial = {}, onSave, onCancel }) {
  const [from, setFrom] = useState(initial.from || "");
  const [to, setTo] = useState(initial.to || "");
  const [items, setItems] = useState(initial.items || "");
  useEffect(()=>{ setFrom(initial.from||""); setTo(initial.to||""); setItems(initial.items||""); }, [initial]);
  function submit(e){ e.preventDefault(); onSave({ id: initial.id, from, to, items }); }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={from} onChange={e=>setFrom(e.target.value)} required placeholder="From (warehouse code)" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <input value={to} onChange={e=>setTo(e.target.value)} required placeholder="To (warehouse code)" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <textarea value={items} onChange={e=>setItems(e.target.value)} placeholder="Items" className="w-full px-3 py-2 rounded bg-transparent border border-white/6" />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Save</button>
      </div>
    </form>
  );
}

export default function TransfersPage(){
  const [items,setItems]=useState([]);
  const [loading,setLoading]=useState(false);
  const [search,setSearch]=useState("");
  const [modalOpen,setModalOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [toDelete,setToDelete]=useState(null);

  useEffect(()=>{ fetchList(); }, []);
  async function fetchList(){ setLoading(true); try{ const res=await client.get("/transfers"); setItems(res.data||[]);}catch(e){console.error(e);alert("Failed to load transfers");}finally{setLoading(false);} }

  const filtered = useMemo(()=> {
    const q=(search||"").trim().toLowerCase();
    if(!q) return items;
    return items.filter(it => (it.from||"").toLowerCase().includes(q) || (it.to||"").toLowerCase().includes(q));
  }, [items, search]);

  function openAdd(){ setEditing(null); setModalOpen(true); }
  function openEdit(it){ setEditing(it); setModalOpen(true); }

  async function saveItem(payload){
    try{
      if(payload.id){ const res=await client.put(`/transfers/${payload.id}`, payload); setItems(prev=>prev.map(p=>p.id===payload.id?res.data:p)); }
      else { const res=await client.post("/transfers", payload); setItems(prev=>[res.data, ...prev]); }
      setModalOpen(false);
    }catch(e){ console.error(e); alert("Save failed"); }
  }

  function confirmDelete(it){ setToDelete(it); setConfirmOpen(true); }
  async function doDelete(){ if(!toDelete) return; await client.delete(`/transfers/${toDelete.id}`); setItems(prev=>prev.filter(p=>p.id!==toDelete.id)); setConfirmOpen(false); setToDelete(null); }

  async function onImport(e){
    const file = e?.target?.files?.[0];
    if(!file) return;
    try{
      const rows = await parseCSVFile(file);
      try{ await client.post("/transfers/bulk", { rows }); await fetchList(); } catch(err) {
        for(const r of rows) await client.post("/transfers", { from: r.From||r.from||"", to: r.To||r.to||"", items: r.Items||r.items||"" });
        await fetchList();
      }
      alert("Imported "+rows.length);
    }catch(err){ console.error(err); alert("Import failed"); } finally { e.target.value = null; }
  }

  async function onExport(){
    try{ const res = await client.get("/transfers"); const data = res.data || []; if(!data.length){ alert("No data to export"); return; } const csv = toCSV(data, ["from","to","items"]); downloadCSV(csv, "transfers_export.csv"); }catch(err){ console.error(err); alert("Export failed"); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transfers" subtitle="Move stock between warehouses" searchValue={search} onSearch={setSearch} onAdd={openAdd} addLabel="Create transfer" onImport={onImport} onExport={onExport} showFilters={false} onToggleFilters={()=>{}} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-glass p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent transfers</h3>
              {loading && <div className="text-sm text-slate-400">Loading...</div>}
            </div>
            <p className="text-slate-300 text-sm mt-2">Track transfers in-progress and history.</p>

            <div className="mt-3 overflow-x-auto">
              <table className="table w-full">
                <thead className="text-slate-300 text-sm">
                  <tr>
                    <th className="px-4 py-2 text-left">Transfer #</th>
                    <th className="px-4 py-2 text-left">From</th>
                    <th className="px-4 py-2 text-left">To</th>
                    <th className="px-4 py-2 text-left">Items</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200 text-sm">
                  {filtered.length===0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No results</td></tr>}
                  {filtered.map(it=>(
                    <tr key={it.id} className="border-b border-white/6">
                      <td className="px-4 py-3">{it.id}</td>
                      <td className="px-4 py-3">{it.from}</td>
                      <td className="px-4 py-3">{it.to}</td>
                      <td className="px-4 py-3">{it.items}</td>
                      <td className="px-4 py-3">{it.status||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
        <aside className="space-y-4">
          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Tools</h4>
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn-ghost" onClick={()=>document.getElementById("file-import")?.click()}>Bulk transfer</button>
              <button className="btn-ghost">Import plan</button>
            </div>
          </div>
          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Filters</h4>
            <p className="text-slate-300 text-sm mt-2">From warehouse, To warehouse, Status</p>
          </div>
        </aside>
      </div>

      <Modal open={modalOpen} title={editing ? "Edit transfer" : "Create transfer"} onClose={()=>setModalOpen(false)}>
        <TransferForm initial={editing||{}} onSave={saveItem} onCancel={()=>setModalOpen(false)} />
      </Modal>

      <ConfirmDialog open={confirmOpen} title="Delete transfer" message={`Delete this transfer?`} onCancel={()=>{setConfirmOpen(false); setToDelete(null);}} onConfirm={doDelete} />
    </div>
  );
}
