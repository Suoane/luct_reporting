import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Dashboard.css";

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/"); // redirect if not logged in
      return;
    }

    fetch("http://localhost:5000/api/reports")
      .then(res => res.json())
      .then(data => setReports(data));
  }, [user, navigate]);

  const totalReports = reports.length;
  const totalStudents = reports.reduce((sum, r) => sum + Number(r.actualStudents || 0), 0);

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="stats">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <p>{totalReports}</p>
        </div>
        <div className="stat-card">
          <h3>Total Students Present</h3>
          <p>{totalStudents}</p>
        </div>
      </div>
      <div className="links">
        <Link to="/reports/new">New Report</Link>
        <Link to="/reports">View Reports</Link>
      </div>
    </div>
  );
}
