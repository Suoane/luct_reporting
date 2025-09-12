const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const PRODUCTS_FILE = __dirname + "/products.json";
const SALES_FILE = __dirname + "/sales.json";

const readFile = (file, cb) => {
  fs.readFile(file, (err, data) => {
    if (err) return cb(err);
    cb(null, JSON.parse(data));
  });
};

// Get products
app.get("/api/products", (req, res) => {
  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });
    res.json(products);
  });
});

// Add product
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

// Update product
app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);

  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });

    const updatedProducts = products.map((p) =>
      Number(p.id) === id ? { ...p, ...req.body } : p
    );

    fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2), () => {
      res.json({ success: true });
    });
  });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);

  readFile(PRODUCTS_FILE, (err, products) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });

    const updatedProducts = products.filter((p) => Number(p.id) !== id);

    fs.writeFile(PRODUCTS_FILE, JSON.stringify(updatedProducts, null, 2), () => {
      res.json({ success: true });
    });
  });
});

// Get sales
app.get("/api/sales", (req, res) => {
  readFile(SALES_FILE, (err, sales) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });
    res.json(sales);
  });
});

// Add sale
app.post("/api/sales", (req, res) => {
  readFile(SALES_FILE, (err, sales) => {
    if (err) return res.status(500).json({ error: "Failed to read file" });

    const newSale = {
      id: Date.now(),
      date: new Date().toISOString(),
      ...req.body,
    };
    sales.push(newSale);

    fs.writeFile(SALES_FILE, JSON.stringify(sales, null, 2), () => {
      res.json(newSale);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
