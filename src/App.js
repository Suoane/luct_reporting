import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Inventory from "./tabs/Inventory";
import Sales from "./tabs/Sales";
import Customers from "./tabs/Customers";
import Reports from "./tabs/Reports";
import Logo from "./assets/logo.jpeg";
import "./App.css";

function App() {
  return (
    <>
      <Router>
        <div className="app">
          {/* Sidebar */}
          <nav>
            <div className="nav-header">
              {/* Optional: Add a logo image here if you have one */}
              {<img src={Logo} alt="Wings Cafe Logo" className="logo" /> }
              <h2>Wings Cafe</h2>
            </div>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/inventory">Inventory</Link></li>
              <li><Link to="/sales">Sales</Link></li>
              <li><Link to="/customers">Customers</Link></li>
              <li><Link to="/reports">Reports</Link></li>
            </ul>
          </nav>

          {/* Page content */}
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </div>
      </Router>

      {/* Global footer */}
      <footer className="footer">
        <p>© 2025 Wings Cafe Inventory System | Designed by eterncodes</p>
      </footer>
    </>
  );
}

export default App;
