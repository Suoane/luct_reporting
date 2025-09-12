import { useState } from "react";
import "./ProductTable.css";

function ProductTable({ products, onDelete, onUpdate }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Prevent NaN when input is cleared
    const parsedValue =
      (name === "price" || name === "quantity") && value !== ""
        ? Number(value)
        : value;

    setEditForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSave = () => {
    onUpdate(editingId, editForm);
    setEditingId(null);
  };

  const handleRestock = (product) => {
    const qty = parseInt(
      prompt(`Enter quantity to restock for "${product.name}":`, 1)
    );
    if (!isNaN(qty) && qty > 0) {
      const newQuantity = Number(product.quantity) + qty;
      onUpdate(product.id, { quantity: newQuantity });
      alert(
        `"${product.name}" restocked successfully. New quantity: ${newQuantity}`
      );
    }
  };

  return (
    <table className="product-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price (M)</th>
          <th>Quantity</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>
              {editingId === p.id ? (
                <input
                  type="text"
                  name="name"
                  value={editForm.name || ""}
                  onChange={handleChange}
                />
              ) : (
                p.name
              )}
            </td>
            <td>
              {editingId === p.id ? (
                <input
                  type="text"
                  name="category"
                  value={editForm.category || ""}
                  onChange={handleChange}
                />
              ) : (
                p.category
              )}
            </td>
            <td>
              {editingId === p.id ? (
                <input
                  type="number"
                  name="price"
                  value={editForm.price || ""}
                  onChange={handleChange}
                />
              ) : (
                p.price
              )}
            </td>
            <td>
              {editingId === p.id ? (
                <input
                  type="number"
                  name="quantity"
                  value={editForm.quantity || ""}
                  onChange={handleChange}
                />
              ) : (
                p.quantity
              )}
            </td>
            <td>
              {editingId === p.id ? (
                <>
                  <button onClick={handleSave}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEdit(p)}>Edit</button>
                  <button onClick={() => handleRestock(p)}>Restock</button>
                  <button onClick={() => onDelete(p.id)}>Delete</button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductTable;
