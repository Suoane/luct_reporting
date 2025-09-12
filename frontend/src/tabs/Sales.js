import { useContext } from "react";
import ProductForm from "../components/ProductForm";
import ProductTable from "../components/ProductTable";
import { ProductContext } from "../context/ProductContext";
import "./Sales.css";

function Sales() {
  const { products, addProduct, deleteProduct, updateProduct } =
    useContext(ProductContext);

  return (
    <div className="sales">
      <h1>Sales Management</h1>
      <ProductForm onAddProduct={addProduct} />
      <ProductTable
        products={products}
        onDelete={deleteProduct}
        onUpdate={updateProduct}
      />
    </div>
  );
}

export default Sales;