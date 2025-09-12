import { createContext, useState, useEffect } from "react";

export const ProductContext = createContext();

// Load base URL from .env file (or fallback)
const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);

  // Fetch all products
  useEffect(() => {
    fetch(`${BASE_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        // Force quantity to number
        const normalized = data.map((p) => ({
          ...p,
          quantity: Number(p.quantity),
          price: Number(p.price),
        }));
        setProducts(normalized);
      })
      .catch((err) => console.error("Failed to fetch products:", err));
  }, []);

  // Add a new product
  const addProduct = (product) => {
    fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    })
      .then((res) => res.json())
      .then((newProduct) =>
        setProducts([...products, { ...newProduct, quantity: Number(newProduct.quantity), price: Number(newProduct.price) }])
      )
      .catch((err) => console.error("Failed to add product:", err));
  };

  // Delete a product
  const deleteProduct = (id) => {
    fetch(`${BASE_URL}/api/products/${id}`, {
      method: "DELETE",
    })
      .then(() => setProducts(products.filter((p) => p.id !== id)))
      .catch((err) => console.error("Failed to delete product:", err));
  };

  // Update a product
  const updateProduct = (id, updatedData) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const updatedProduct = {
      ...product,
      ...updatedData,
      quantity: updatedData.quantity !== undefined ? Number(updatedData.quantity) : product.quantity,
      price: updatedData.price !== undefined ? Number(updatedData.price) : product.price,
    };

    fetch(`${BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    })
      .then((res) => res.json())
      .then(() =>
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? updatedProduct : p))
        )
      )
      .catch((err) => console.error("Failed to update product:", err));
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        deleteProduct,
        updateProduct,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}
