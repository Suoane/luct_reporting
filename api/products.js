import fs from "fs";
import path from "path";

const PRODUCTS_FILE = path.join(process.cwd(), "api", "products.json");

function readProducts() {
  return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
}

function writeProducts(data) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json(readProducts());
  } else if (req.method === "POST") {
    const products = readProducts();
    const newProduct = { id: Date.now(), ...req.body };
    products.push(newProduct);
    writeProducts(products);
    res.status(201).json(newProduct);
  } else if (req.method === "PUT") {
    const { id } = req.query;
    const products = readProducts();
    const updated = products.map((p) =>
      p.id === parseInt(id) ? { ...p, ...req.body } : p
    );
    writeProducts(updated);
    res.status(200).json({ success: true });
  } else if (req.method === "DELETE") {
    const { id } = req.query;
    const products = readProducts().filter((p) => p.id !== parseInt(id));
    writeProducts(products);
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
