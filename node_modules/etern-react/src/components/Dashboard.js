import "./Dashboard.css";
import { useContext } from "react";
import { ProductContext } from "../context/ProductContext";
import { SalesContext } from "../context/SalesContext";
import Pork from "../assets/pork.jpeg";
import Rice from "../assets/rice.jpeg";
import Mutton from "../assets/mutton.jpeg";

function Dashboard() {
  const { products: liveProducts, updateProduct } = useContext(ProductContext);
  const { sales } = useContext(SalesContext);

  const allProducts = liveProducts;

  const totalProducts = allProducts.length;
  const lowStock = allProducts.filter((p) => p.quantity < 5).length;

  const today = new Date().toISOString().split("T")[0];
  const todaysSales = sales.filter((s) => s.date.startsWith(today));
  const totalSalesAmount = todaysSales.reduce(
    (sum, s) => sum + (s.totalPrice || 0),
    0
  );

  const reportsGenerated = todaysSales.length;

  const specials = [
    { name: "Grilled Pork", img: Pork },
    { name: "Chicken and Rice", img: Rice },
    { name: "Beef Stew", img: Mutton },
  ];

  const getProduct = (name) =>
    allProducts.find(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

  const handleRestock = (product) => {
    const qty = parseInt(
      prompt(`Enter quantity to restock for "${product.name}":`, 1)
    );

    if (!isNaN(qty) && qty > 0) {
      const newQuantity = product.quantity + qty;
      updateProduct(product.id, { quantity: newQuantity });
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome to Wings Cafe Stock Management</h1>
      <p className="dashboard-subtitle">
        Here is a Quick overview, for info on our products visit the Inventory
        tab.
      </p>

      <div className="dashboard-cards">
        <div className="dash-card inventory-card">
          <h2>Inventory</h2>
          <p>
            Total Products: <strong>{totalProducts}</strong>
          </p>
          <p>
            Low Stock: <strong>{lowStock}</strong>
          </p>
        </div>

        <div className="dash-card sales-card">
          <h2>Sales</h2>
          <p>
            Today’s Sales: <strong>M{totalSalesAmount.toFixed(2)}</strong>
          </p>
          <p>{todaysSales.length} sale(s)</p>
        </div>

        <div className="dash-card reports-card">
          <h2>Reports</h2>
          <p>
            Generated: <strong>{reportsGenerated}</strong>
          </p>
          <p className="coming-soon">Daily summary</p>
        </div>
      </div>

      <div className="specials">
        <h2>Today's Specials</h2>
        <div className="special-items-cards">
          {specials.map((special) => {
            const product = getProduct(special.name);
            const isOutOfStock = product && product.quantity <= 0;

            return (
              <div
                key={special.name}
                className={`special-item ${isOutOfStock ? "out-of-stock" : ""}`}
              >
                <div className="special-name">{special.name}</div>
                <div className="special-image-wrapper">
                  <img src={special.img} alt={special.name} />
                  {isOutOfStock && (
                    <>
                      <div className="out-of-stock-overlay">OUT OF STOCK</div>
                      <button
                        className="restock-btn"
                        onClick={() => handleRestock(product)}
                      >
                        Restock
                      </button>
                    </>
                  )}
                </div>
                {product ? (
                  <div className="special-details">
                    <div>
                      Price: <strong>M{product.price}</strong>
                    </div>
                    <div>
                      Quantity: <strong>{product.quantity}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="special-details out-text">Not in stock</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
