import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Inventory from "./tabs/Inventory";
import Sales from "./tabs/Sales";
import Reports from "./tabs/Reports";
import { ProductProvider } from "./context/ProductContext";
import Logo from "./assets/logo.png";
import "./App.css";

function App() {
  return (
    <ProductProvider>
      <Router>
        <div className="app">
          
          <nav>
            <div className="nav-header">
              <img src={Logo} alt="Wings Cafe Logo" className="logo" />
              <h2>Wings Cafe</h2>
            </div>
            <ul>
              <li><Link to="/">Dashboard</Link></li>
              <li><Link to="/inventory">Inventory</Link></li>
              <li><Link to="/sales">Sales</Link></li>
              <li><Link to="/reports">Reports</Link></li>
            </ul>
          </nav>

         
          <div className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/reports" element={<Reports />} />
             
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>

        
        <footer className="footer">
          <p>© 2025 Wings Cafe Inventory System | Designed by eterncodes</p>
        </footer>
      </Router>
    </ProductProvider>
  );
}

export default App;
