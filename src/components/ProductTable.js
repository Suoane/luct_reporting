import "./ProductTable.css";

function ProductTable({ products, onDelete }) {
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
        {products.map((p, index) => (
          <tr key={index}>
            <td>{p.name}</td>
            <td>{p.category}</td>
            <td>{p.price}</td>
            <td>{p.quantity}</td>
            <td>
              <button onClick={() => onDelete(index)}>Delete</button>
              
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductTable;
