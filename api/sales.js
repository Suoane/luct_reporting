import fs from "fs";
import path from "path";

const SALES_FILE = path.join(process.cwd(), "api", "sales.json");

function readSales() {
  return JSON.parse(fs.readFileSync(SALES_FILE, "utf8"));
}

function writeSales(data) {
  fs.writeFileSync(SALES_FILE, JSON.stringify(data, null, 2));
}

export default function handler(req, res) {
  if (req.method === "GET") {
    res.status(200).json(readSales());
  } else if (req.method === "POST") {
    const sales = readSales();
    const newSale = { id: Date.now(), date: new Date().toISOString(), ...req.body };
    sales.push(newSale);
    writeSales(sales);
    res.status(201).json(newSale);
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
