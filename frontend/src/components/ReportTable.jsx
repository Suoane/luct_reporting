import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useLocation } from "react-router-dom";
import API_BASE_URL from '../config/api';
import "./ReportTable.css";

export default function ReportTable() {
  const location = useLocation();
  const user = location.state?.user;

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE_URL}/api/reports`)
      .then(res => res.json())
      .then(data => {
        if (user.role === "admin") setReports(data);
        else setReports(data.filter(r => r.lecturerName === user.username));
      })
      .catch(err => console.error(err));
  }, [user]);

  const filtered = reports.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "Reports.xlsx");
  };

  return (
    <div className="report-table">
      <h2>{user?.role === "admin" ? "All Reports" : "My Reports"}</h2>
      <input
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <button onClick={exportExcel}>Export to Excel</button>
      <table>
        <thead>
          <tr>
            <th>Lecturer</th>
            <th>Course</th>
            <th>Date</th>
            <th>Students Present</th>
            <th>Total Students</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id}>
              <td>{r.lecturerName}</td>
              <td>{r.courseName}</td>
              <td>{r.dateOfLecture}</td>
              <td>{r.actualStudents}</td>
              <td>{r.totalStudents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}