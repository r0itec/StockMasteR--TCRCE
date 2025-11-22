/**
 * IMS backend - Milestone 1-3 features (in-memory)
 * - Products, Warehouses, Stocks
 * - Receipts (create + validate)
 * - Deliveries (pick, pack, validate)
 * - Internal Transfers (create + execute)
 * - Adjustments (count corrections)
 * - Ledger entries for every stock change
 *
 * Port: 4000
 */
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

// In-memory stores
const products = {};       // id -> product
const warehouses = {};     // code -> warehouse
const stocks = {};         // key productId::warehouse::location -> {productId,warehouse,location,quantity}
const receipts = {};       // id -> receipt
const deliveries = {};     // id -> delivery
const transfers = {};      // id -> transfer
const adjustments = {};    // id -> adjustment
const ledger = [];         // array of ledger entries

// helpers
function stockKey(productId, warehouse, location) {
  return `${productId}::${warehouse}::${location || ""}`;
}
function ensureWarehouse(code) {
  if (!warehouses[code]) warehouses[code] = { code, name: code, address: "" };
}
function setStock(productId, warehouse, location, qty) {
  const key = stockKey(productId, warehouse, location);
  stocks[key] = { productId, warehouse, location: location || "", quantity: Number(qty) };
}
function adjustStock(productId, warehouse, location, delta, docType, docId) {
  const key = stockKey(productId, warehouse, location);
  if (!stocks[key]) stocks[key] = { productId, warehouse, location: location || "", quantity: 0 };
  const before = Number(stocks[key].quantity || 0);
  const after = before + Number(delta);
  stocks[key].quantity = after;
  const entry = {
    id: uuidv4(),
    productId,
    change: Number(delta),
    before,
    after,
    docType,
    docId,
    warehouse,
    location: location || null,
    createdAt: new Date().toISOString()
  };
  ledger.push(entry);
  return entry;
}
function totalStock(productId) {
  return Object.values(stocks).filter(s => s.productId === productId).reduce((a,b)=>a+Number(b.quantity||0),0);
}
function byWarehouse(productId) {
  const map = {};
  Object.values(stocks).forEach(s => {
    if (s.productId !== productId) return;
    map[s.warehouse] = (map[s.warehouse] || 0) + Number(s.quantity||0);
  });
  return map;
}

// seed
function seed() {
  const p1 = "p1", p2 = "p2", p3 = "p3";
  products[p1] = { id:p1, sku:"SR-001", name:"Steel Rod", category:"Raw", uom:"kg", reorderLevel:10 };
  products[p2] = { id:p2, sku:"CH-082", name:"Chair", category:"Finished", uom:"pcs", reorderLevel:5 };
  products[p3] = { id:p3, sku:"CB-022", name:"CHEESE BALLS", category:"Food", uom:"pcs", reorderLevel:2 };

  warehouses["MAIN"] = { code:"MAIN", name:"Main Warehouse", address:"HQ" };
  warehouses["PROD"] = { code:"PROD", name:"Production Floor", address:"Plant" };
  warehouses["CDC"]  = { code:"CDC", name:"Central DC", address:"DC 1" };

  setStock(p1,"MAIN","",200);
  setStock(p1,"PROD","",120);
  setStock(p2,"MAIN","",42);
  setStock(p3,"MAIN","",0);
}
seed();

// serve built frontend if present
const frontendStatic = path.join(process.cwd(), "frontend");
if (fs.existsSync(frontendStatic)) app.use(express.static(frontendStatic));

// --- Routes ---

app.get("/health", (req,res)=>res.json({status:"ok"}));

// Warehouses
app.get("/api/warehouses", (req,res) => res.json(Object.values(warehouses)));
app.post("/api/warehouses", (req,res) => {
  const { code, name, address } = req.body || {};
  if (!code || !name) return res.status(400).json({ error:"code & name required" });
  const c = String(code).toUpperCase().trim();
  if (warehouses[c]) return res.status(400).json({ error:"warehouse code exists" });
  warehouses[c] = { code:c, name, address: address||"" };
  res.status(201).json(warehouses[c]);
});

// Products
app.get("/api/products", (req,res) => {
  const list = Object.values(products).map(p=>({
    ...p,
    totalQty: totalStock(p.id),
    byWarehouse: byWarehouse(p.id)
  }));
  res.json(list);
});
app.post("/api/products", (req,res) => {
  const { name, sku, category, uom, initialStock, warehouse } = req.body || {};
  if (!name || !sku) return res.status(400).json({ error:"name & sku required" });
  const id = uuidv4();
  products[id] = { id, name, sku, category: category||"", uom: uom||"pcs", reorderLevel: 0 };
  if (initialStock && Number(initialStock) !== 0) {
    const wh = (warehouse || "MAIN").toUpperCase();
    ensureWarehouse(wh);
    adjustStock(id, wh, "", Number(initialStock), "init", null);
  }
  res.status(201).json(products[id]);
});

// Stocks
app.get("/api/stocks", (req,res)=>res.json(Object.values(stocks)));
app.get("/api/stocks/:productId", (req,res) => {
  const pid = req.params.productId;
  const rows = Object.values(stocks).filter(s=>s.productId===pid);
  res.json(rows);
});

// Receipts
app.post("/api/receipts", (req,res) => {
  const { supplier, lines } = req.body || {};
  if (!Array.isArray(lines) || lines.length===0) return res.status(400).json({ error:"lines required" });
  const id = uuidv4();
  receipts[id] = { id, supplier: supplier||null, status:"Draft", lines: lines.map(l => ({ id: uuidv4(), ...l, qtyReceived:0 })), createdAt: new Date().toISOString() };
  res.status(201).json(receipts[id]);
});
app.get("/api/receipts", (req,res) => res.json(Object.values(receipts)));
app.post("/api/receipts/:id/validate", (req,res) => {
  const id = req.params.id;
  const rc = receipts[id];
  if (!rc) return res.status(404).json({ error:"receipt not found" });
  if (rc.status === "Done") return res.status(400).json({ error:"already validated" });
  try {
    rc.lines.forEach(line => {
      const qty = Number(line.qtyExpected || 0);
      const wh = (line.warehouse || "MAIN").toUpperCase();
      ensureWarehouse(wh);
      adjustStock(line.productId, wh, line.location || "", qty, "receipt", id);
      line.qtyReceived = qty;
    });
    rc.status = "Done";
    rc.completedAt = new Date().toISOString();
    res.json(rc);
  } catch(e) { console.error(e); res.status(500).json({ error:"validation failed" }) }
});

// Deliveries (outgoing)
app.post("/api/deliveries", (req,res) => {
  const { customer, lines } = req.body || {};
  if (!Array.isArray(lines) || lines.length===0) return res.status(400).json({ error:"lines required" });
  const id = uuidv4();
  deliveries[id] = { id, customer: customer||null, status:"Draft", lines: lines.map(l => ({ id: uuidv4(), ...l, qtyPicked:0, qtyPacked:0 })), createdAt: new Date().toISOString() };
  res.status(201).json(deliveries[id]);
});
app.get("/api/deliveries", (req,res) => res.json(Object.values(deliveries)));

app.put("/api/deliveries/:id/pick", (req,res) => {
  const id = req.params.id;
  const del = deliveries[id];
  if (!del) return res.status(404).json({ error:"delivery not found" });
  const { lineId, qty } = req.body || {};
  const line = del.lines.find(l=>l.id===lineId);
  if (!line) return res.status(404).json({ error:"line not found" });
  line.qtyPicked = Number(qty);
  res.json(del);
});

app.put("/api/deliveries/:id/pack", (req,res) => {
  const id = req.params.id;
  const del = deliveries[id];
  if (!del) return res.status(404).json({ error:"delivery not found" });
  const { lineId, qty } = req.body || {};
  const line = del.lines.find(l=>l.id===lineId);
  if (!line) return res.status(404).json({ error:"line not found" });
  line.qtyPacked = Number(qty);
  res.json(del);
});

app.post("/api/deliveries/:id/validate", (req,res) => {
  const id = req.params.id;
  const del = deliveries[id];
  if (!del) return res.status(404).json({ error:"delivery not found" });
  if (del.status === "Done") return res.status(400).json({ error:"already validated" });
  try {
    del.lines.forEach(line => {
      const qty = Number(line.qtyPacked || line.qtyPicked || 0);
      const wh = (line.warehouse || "MAIN").toUpperCase();
      ensureWarehouse(wh);
      adjustStock(line.productId, wh, line.location || "", -Math.abs(qty), "delivery", id);
    });
    del.status = "Done";
    del.completedAt = new Date().toISOString();
    res.json(del);
  } catch(e){ console.error(e); res.status(500).json({ error:"validation failed" }) }
});

// Transfers (internal)
app.post("/api/transfers", (req,res) => {
  const { fromWarehouse, toWarehouse, lines } = req.body || {};
  if (!fromWarehouse || !toWarehouse || !Array.isArray(lines) || lines.length===0) return res.status(400).json({ error:"from, to, lines required" });
  const id = uuidv4();
  transfers[id] = { id, fromWarehouse: fromWarehouse.toUpperCase(), toWarehouse: toWarehouse.toUpperCase(), lines: lines.map(l=>({ id: uuidv4(), ...l })), status:"Draft", createdAt: new Date().toISOString() };
  res.status(201).json(transfers[id]);
});
app.post("/api/transfers/:id/execute", (req,res) => {
  const id = req.params.id;
  const tr = transfers[id];
  if (!tr) return res.status(404).json({ error:"transfer not found" });
  if (tr.status === "Done") return res.status(400).json({ error:"already executed" });
  try {
    tr.lines.forEach(l => {
      const qty = Number(l.qty || 0);
      const from = tr.fromWarehouse;
      const to = tr.toWarehouse;
      ensureWarehouse(from); ensureWarehouse(to);
      adjustStock(l.productId, from, l.fromLocation || "", -Math.abs(qty), "transfer", id);
      adjustStock(l.productId, to, l.toLocation || "", +Math.abs(qty), "transfer", id);
    });
    tr.status = "Done";
    tr.executedAt = new Date().toISOString();
    res.json(tr);
  } catch(e){ console.error(e); res.status(500).json({ error:"execution failed" }) }
});
app.get("/api/transfers", (req,res)=>res.json(Object.values(transfers)));

// Adjustments (count)
app.post("/api/adjustments", (req,res) => {
  const { productId, warehouse, location, countedQty, reason } = req.body || {};
  if (!productId || !warehouse) return res.status(400).json({ error:"productId & warehouse required" });
  const key = stockKey(productId, warehouse.toUpperCase(), location||"");
  const before = Number(stocks[key]?.quantity || 0);
  const change = Number(countedQty) - before;
  adjustStock(productId, warehouse.toUpperCase(), location||"", change, "adjustment", null);
  const id = uuidv4();
  adjustments[id] = { id, productId, warehouse: warehouse.toUpperCase(), location: location||"", countedQty: Number(countedQty), before, change, reason: reason||"", createdAt: new Date().toISOString() };
  res.status(201).json(adjustments[id]);
});
app.get("/api/adjustments", (req,res)=>res.json(Object.values(adjustments)));

// Ledger
app.get("/api/ledger", (req,res) => res.json(ledger.slice().reverse()));

// Serve frontend index.html fallback
app.get("*", (req,res) => {
  const index = path.join(frontendStatic, "index.html");
  if (fs.existsSync(index)) return res.sendFile(index);
  res.status(404).send("Not found");
});

app.listen(PORT, () => {
  console.log(`IMS backend running on http://localhost:${PORT}`);
});
