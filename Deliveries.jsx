import React from 'react';
import { Link } from 'react-router-dom';

function PageHeader({title, subtitle, onAdd, addLabel}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <input placeholder="Search deliveries..." className="px-3 py-2 rounded-md bg-black/20 border border-white/6 text-sm text-slate-200" />
        <button className="btn-ghost">Filters</button>
        <button className="btn-primary" onClick={onAdd}>{addLabel || 'New delivery'}</button>
      </div>
    </div>
  );
}

export default function Deliveries() {
  function handleAdd(){ alert('Create delivery - open form'); }
  return (
    <div className="space-y-6">
      <PageHeader title="Deliveries" subtitle="Outbound shipments and dispatches" onAdd={handleAdd} addLabel="Create delivery" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card-glass p-5">
            <h3 className="text-lg font-semibold text-white">Pending deliveries</h3>
            <p className="text-slate-300 text-sm mt-2">Shipments waiting to be dispatched.</p>

            <div className="mt-3 overflow-x-auto">
              <table className="table w-full">
                <thead className="text-slate-300 text-sm">
                  <tr>
                    <th className="px-4 py-2 text-left">Delivery #</th>
                    <th className="px-4 py-2 text-left">Customer</th>
                    <th className="px-4 py-2 text-left">Items</th>
                    <th className="px-4 py-2 text-left">ETA</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-200 text-sm">
                  <tr className="border-b border-white/6">
                    <td className="px-4 py-3">DLV-1023</td>
                    <td className="px-4 py-3">Retail Corp</td>
                    <td className="px-4 py-3">8</td>
                    <td className="px-4 py-3">Today</td>
                    <td className="px-4 py-3"><button className="btn-ghost">Track</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        <aside className="space-y-4">
          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Quick actions</h4>
            <div className="mt-3 flex flex-col gap-2">
              <button className="btn-ghost text-sm">Create shipment</button>
              <button className="btn-ghost text-sm">Print labels</button>
            </div>
          </div>

          <div className="card-glass p-4">
            <h4 className="text-sm font-semibold text-white">Filters</h4>
            <p className="text-slate-300 text-sm mt-2">By carrier, date, status</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
