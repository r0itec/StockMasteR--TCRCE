// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import client from "../api/client";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{ load(); }, []);
  async function load(){
    setLoading(true);
    try{
      const res = await client.get("/dashboard");
      setData(res.data);
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Overview and quick insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-glass p-5">
          <h3 className="text-lg font-semibold text-white">KPIs</h3>
          {loading && <div className="text-sm text-slate-400">Loading...</div>}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-4 bg-black/30 rounded-lg">
              <div className="text-slate-200 text-sm font-semibold">Total Value</div>
              <div className="text-slate-300 text-xs mt-1">₹{data?.totalValue ?? "—"}</div>
            </div>
            <div className="p-4 bg-black/30 rounded-lg">
              <div className="text-slate-200 text-sm font-semibold">Low Stock</div>
              <div className="text-slate-300 text-xs mt-1">{data?.lowStockCount ?? "—"}</div>
            </div>
            <div className="p-4 bg-black/30 rounded-lg">
              <div className="text-slate-200 text-sm font-semibold">Pending Orders</div>
              <div className="text-slate-300 text-xs mt-1">{data?.pendingOrders ?? "—"}</div>
            </div>
          </div>
        </div>

        <div className="card-glass p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Recent activity</h3>
          <div className="mt-3 text-slate-300 text-sm">
            {data?.recent?.length ? data.recent.map((r,i)=> <div key={i} className="py-2 border-b border-white/6">{r.message}</div>) : <div className="py-4">No recent activity</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
