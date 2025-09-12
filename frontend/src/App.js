import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Checkout from "./components/Checkout";
import Inventory from "./tabs/Inventory";
import Sales from "./tabs/Sales";
import Reports from "./tabs/Reports";
import { ProductProvider } from "./context/ProductContext";
import { SalesProvider } from "./context/SalesContext";
import Logo from "./assets/logo.png";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  return (
    <ProductProvider>
      <SalesProvider>
        <Router>
          <div className="app">
            <nav>
              <div className="nav-header">
                <img src={Logo} alt="Wings Cafe Logo" className="logo" />
                <h2>Wings Cafe</h2>
              </div>
              <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/checkout">Checkout</Link></li>
                <li><Link to="/inventory">Inventory</Link></li>
                <li><Link to="/sales">Sales</Link></li>
                <li><Link to="/reports">Reports</Link></li>
              </ul>
            </nav>

            <div className="content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>

         <Footer />
        </Router>
      </SalesProvider>
    </ProductProvider>
  );
}

export default App;