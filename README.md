
IMS fullstack combined package (prototype)

Structure:
  /frontend   -> React + Vite frontend (extracted from your zip)
  /backend    -> Node prototype server (in-memory) listening on port 4000

Quick start (no Docker):
  1. In one terminal: cd backend && npm install && npm start
  2. In another terminal: cd frontend && npm install && npm run dev
  3. Open http://localhost:5173 (frontend). Frontend calls backend at http://localhost:4000 by default.

If diagram not visible, copy your diagram PNG to one of these paths on your machine:
  - /mnt/data/StockMaster - 8 hours.png
  - backend/diagram.png
  - frontend/public/diagram.png
