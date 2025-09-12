const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// === ✅ CORS FIX ===
const allowedOrigins = [
  "https://inventory-system-front-git-6316a0-divinechukwudi-3003s-projects.vercel.app",
  "http://localhost:3000" // Optional: allow local dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow requests with no origin (e.g., mobile apps, curl)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS policy does not allow access from this origin."), false);
  }
}));

app.use(express.json());

const PRODUCTS_FILE = __dirname + "/products.json";
const SALES_FILE = __dirname + "/sales.json";

const readFile = (file, cb) => {
  fs.readFile(file, (err, data) => {
    if (err) return cb(err);
    cb(null, JSON.parse(data));
  });
};

app.get("/api/products", (req, res) => {
  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });
    res.json(products);
  });
});

app.post("/api/products", (req, res) => {
  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });
    const newProduct = { id: Date.now(), ...req.body };
    products.push(newProduct);
    fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), () => {
      res.json(newProduct);
    });
  });
});

app.put("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });

    const updatedProducts = products.map((p) =>
      p.id === id ? { ...p, ...req.body } : p
    );

    fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2), () => {
      res.json({ success: true });
    });
  });
});

app.delete("/api/products/:id", (req, res) => {
  const id = parseInt(req.params.id);
  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });

    const updatedProducts = products.filter((p) => p.id !== id);

    fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2), () => {
      res.json({ success: true });
    });
  });
});

app.get("/api/sales", (req, res) => {
  readFile(SALES_FILE, (err, sales) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });
    res.json(sales);
  });
});

app.post("/api/sales", (req, res) => {
  readFile(SALES_FILE, (err, sales) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });

    const newSale = { id: Date.now(), date: new Date().toISOString(), ...req.body };
    sales.push(newSale);

    fs.writeFile(SALES_FILE, JSON.stringify(sales, null, 2), () => {
      res.json(newSale);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
