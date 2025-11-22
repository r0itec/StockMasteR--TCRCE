import React, { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Receipts from "./pages/Receipts";
import Deliveries from "./pages/Deliveries";
import Transfers from "./pages/Transfers";
import Adjustments from "./pages/Adjustments";
import Warehouses from "./pages/Warehouses";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider, AuthContext } from "./context/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ErrorBoundary from "./components/ErrorBoundary";

/* ... inside render */

export default function App(){
  // apply class to root for tailwind dark mode
  useEffect(()=> {
    const stored = localStorage.getItem("sm-theme") || "dark";
    if (stored === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  return (
    <AuthProvider>
    <div className="min-h-screen">
      <header className="py-4 border-b border-white/6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-white font-extrabold text-lg">StockMaster</div>
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="header-link">Dashboard</Link>
              <Link to="/products" className="header-link">Products</Link>
              <Link to="/receipts" className="header-link">Receipts</Link>
              <Link to="/deliveries" className="header-link">Deliveries</Link>
              <Link to="/transfers" className="header-link">Transfers</Link>
              <Link to="/adjustments" className="header-link">Adjustments</Link>
              <Link to="/warehouses" className="header-link">Warehouses</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AuthContext.Consumer>
              {({user, logout})=> (
                user ? (
                  <><button onClick={logout} className="btn-ghost">Logout</button></>
                ) : (
                  <><Link to="/login" className="btn-ghost">Login</Link>
                  <Link to="/signup" className="btn-primary">Sign up</Link></>
                )
              )}
            </AuthContext.Consumer>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<PrivateRoute><Dashboard/></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products/></PrivateRoute>} />
          <Route path="/receipts" element={<PrivateRoute><Receipts/></PrivateRoute>} />
          <Route path="/deliveries" element={<PrivateRoute><Deliveries/></PrivateRoute>} />
          <Route path="/transfers" element={<PrivateRoute><Transfers/></PrivateRoute>} />
          <Route path="/adjustments" element={<PrivateRoute><Adjustments/></PrivateRoute>} />
          <Route path="/warehouses" element={<PrivateRoute><Warehouses/></PrivateRoute>} />

          {/* public auth routes */}
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
        </Routes>
      </main>
    </div>
    </AuthProvider>
  );
}
