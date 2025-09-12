import { useContext } from "react";
import { ProductContext } from "../context/ProductContext";
import "./Inventory.css";

function Inventory() {
  const { products: liveProducts, updateProduct } = useContext(ProductContext);

  const allProducts = liveProducts;

  const handleRestock = (product) => {
    const qty = parseInt(prompt(`Enter quantity to restock for "${product.name}":`, 1));
    if (!isNaN(qty) && qty > 0) {
      updateProduct(product.id, qty);
    }
  };

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
              <th>Restock</th>
            </tr>
          </thead>
          <tbody>
            {allProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>
                  {p.quantity < 5 ? (
                    <span className={`stock-badge ${p.quantity <= 0 ? 'out-stock' : p.quantity < 5 ? 'low-stock' : 'medium-stock'}`}>
                      {p.quantity} {p.quantity <= 0 ? '(Out)' : p.quantity < 5 ? '(Low)' : '(Medium)'}
                    </span>
                  ) : (
                    <span className="stock-badge high-stock">{p.quantity} (High)</span>
                  )}
                </td>
                <td>
                  <button onClick={() => handleRestock(p)}>Restock</button>
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