import products from "../data/products.json";
import './Inventory.css';


function Inventory() {
    return (
        <>
        <div className="inventory">
            <h1>Inventory Management</h1>
            </div>

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
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{p.category}</td>
                                <td>{p.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </>
    )
}

export default Inventory;