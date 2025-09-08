import "./Dashboard.css";
import products from "../data/products.json";

function Dashboard() {
  
  const totalProducts = products.length;
  const lowStock = products.filter((p) => p.quantity < 5).length;

  return (
    <div className="dashboard">
      <h1>Welcome to Wings Cafe Stock Management</h1>
      <p className="dashboard-subtitle">Here is a Quick overview</p>

     
      <div className="dashboard-cards">
        
        <div className="dash-card inventory-card">
          <h2>Inventory</h2>
          <p>Total Products: <strong>{totalProducts}</strong></p>
          <p>Low Stock: <strong>{lowStock}</strong></p>
        </div>

       
        <div className="dash-card sales-card">
          <h2>Sales</h2>
          <p>Today’s Sales: <strong>M0.00</strong></p>
          <p className="coming-soon">On its way</p>
        </div>

        
        <div className="dash-card customers-card">
          <h2>Customers</h2>
          <p>Registered: <strong>0</strong></p>
          <p className="coming-soon">On its way</p>
        </div>

        
        <div className="dash-card reports-card">
          <h2>Reports</h2>
          <p>Generated: <strong>0</strong></p>
          <p className="coming-soon">On its way</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
