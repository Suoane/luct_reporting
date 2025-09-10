import { useContext } from "react";
import { ProductContext } from "../context/ProductContext";
import staticProducts from "../data/products.json";
import "./Inventory.css";

function Inventory() {
  const { products: liveProducts } = useContext(ProductContext);

  // Merge static + live
  const allProducts = [...staticProducts, ...liveProducts];

  return (
    <div className="inventory">
      <h1>Inventory Management</h1>

      <div>
        <h2>Inventory</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>
                  {p.quantity < 5 ? (
                    <span className="stock-badge low-stock">{p.quantity} (Low)</span>
                  ) : p.quantity < 20 ? (
                    <span className="stock-badge medium-stock">{p.quantity} (Medium)</span>
                  ) : (
                    <span className="stock-badge high-stock">{p.quantity} (High)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Inventory;
