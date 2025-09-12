import { useContext } from "react";
import { SalesContext } from "../context/SalesContext";
import { ProductContext } from "../context/ProductContext";
import "./Reports.css";

function Reports() {
  const { sales } = useContext(SalesContext);
  const { products } = useContext(ProductContext);

  const today = new Date().toISOString().split("T")[0];
  const todaysSales = sales.filter((s) => s.date.startsWith(today));

  const totalSalesAmount = todaysSales.reduce(
    (sum, s) => sum + (s.totalPrice || 0),
    0
  );
  const avgSaleValue =
    todaysSales.length > 0 ? totalSalesAmount / todaysSales.length : 0;

  const productTotals = todaysSales.reduce((acc, s) => {
    acc[s.productName] = (acc[s.productName] || 0) + s.quantity;
    return acc;
  }, {});
  const bestSeller =
    Object.entries(productTotals).sort((a, b) => b[1] - a[1])[0];

  const lowStockProducts = products.filter((p) => p.quantity < 5);

  return (
    <div className="reports">
      <h1>Report</h1>

      <section className="daily-summary">
        <h2>Daily Sales Summary</h2>
        <div className="summary-cards">
          <div className="summary-card total">
            <h3>Total Sales</h3>
            <p>M{totalSalesAmount.toFixed(2)}</p>
          </div>
          <div className="summary-card transactions">
            <h3>Transactions</h3>
            <p>{todaysSales.length}</p>
          </div>
          <div className="summary-card average">
            <h3>Avg Sale Value</h3>
            <p>M{avgSaleValue.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="extra-info">
        <h2>Additional Insights</h2>
        {bestSeller ? (
          <p>
            Top Seller: <strong>{bestSeller[0]}</strong> ({bestSeller[1]} sold)
          </p>
        ) : (
          <p>No top seller yet.</p>
        )}
        <h3>Low Stock Products</h3>
        {lowStockProducts.length === 0 ? (
          <p>All stock levels are healthy.</p>
        ) : (
          <ul>
            {lowStockProducts.map((p) => (
              <li key={p.id}>
                {p.name} - {p.quantity} left
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sales-list">
        <h2>Sales Records</h2>
        {todaysSales.length === 0 ? (
          <p>No sales made today.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {todaysSales.map((s) => (
                <tr key={s.id}>
                  <td>{s.productName}</td>
                  <td>{s.quantity}</td>
                  <td>M{s.price}</td>
                  <td>M{s.totalPrice}</td>
                  <td>{new Date(s.date).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default Reports;