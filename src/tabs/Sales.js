import { useState } from "react";
import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";
import "./Sales.css";

function Sales() {
  const [products, setProducts] = useState([]);

  const addProduct = (product) => {
    setProducts([...products, product]);
  };

  const deleteProduct = (index) => {
    const updated = [...products];
    updated.splice(index, 1);
    setProducts(updated);
  };

  return (
    <div className="sales">
      <h1>Sales Management</h1>
      <ProductForm onAddProduct={addProduct} />
      <ProductTable products={products} onDelete={deleteProduct} />
    </div>
  );
}

export default Sales;
