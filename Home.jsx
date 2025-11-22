// frontend/src/pages/Home.jsx
import React from "react";
import Hero from "../components/Hero";

export default function Home(){
  return (
    <div className="min-h-screen bg-[#07080a]">
      <Hero />

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 card-glass border border-white/6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white">Key Features</h3>
            <ul className="mt-4 space-y-3 text-slate-300 text-sm">
              <li>• Real-time tracking</li>
              <li>• Automated transfers & approvals</li>
              <li>• Reporting & analytics</li>
              <li>• Multi-warehouse support</li>
            </ul>

            <h4 className="mt-6 text-sm text-slate-400">Core Modules</h4>
            <p className="text-slate-300 text-sm mt-2">Products • Receipts • Deliveries • Transfers • Adjustments • Warehouses</p>
          </div>

          <div className="p-6 card-glass border border-white/6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white">Dashboard Overview</h3>
            <p className="mt-3 text-slate-300 text-sm">
              Beautiful charts and insights to help you make fast decisions. Customizable widgets, trend lines and KPI cards.
            </p>

            <div className="mt-6 bg-black/30 p-4 rounded-lg grid grid-cols-2 gap-3">
              <div className="text-slate-200 text-sm">Sales</div>
              <div className="text-slate-300 text-sm">1,240</div>
              <div className="text-slate-200 text-sm">Low stock</div>
              <div className="text-slate-300 text-sm">46 items</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-12 py-8">
        <div className="max-w-7xl mx-auto px-6 text-slate-500 text-sm">
          © {new Date().getFullYear()} StockMaster · Terms of Service
        </div>
      </footer>
    </div>
  );
}
