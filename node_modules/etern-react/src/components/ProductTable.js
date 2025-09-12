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

    const parsedValue =
      name === "price" || name === "quantity" ? Number(value) : value;

    console.log(`Changed ${name}:`, parsedValue, typeof parsedValue);

    setEditForm((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSave = () => {
    console.log("Saving product:", editForm);
    onUpdate(editingId, editForm);
    setEditingId(null);
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
                  value={editForm.name}
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
                  value={editForm.category}
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
                  value={editForm.price}
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
                  value={editForm.quantity}
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