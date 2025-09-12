import { createContext, useState, useEffect } from "react";

export const SalesContext = createContext();

export function SalesProvider({ children }) {
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/sales")
      .then((res) => res.json())
      .then((data) => setSales(data))
      .catch((err) => console.error("Failed to fetch sales:", err));
  }, []);

  const addSale = (sale) => {
    fetch("http://localhost:5000/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sale),
    })
      .then((res) => res.json())
      .then((newSale) =>
        setSales((prevSales) => [...prevSales, newSale])
      )
      .catch((err) => console.error("Failed to add sale:", err));
  };

  return (
    <SalesContext.Provider value={{ sales, addSale }}>
      {children}
    </SalesContext.Provider>
  );
}