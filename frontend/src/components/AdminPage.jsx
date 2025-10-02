import React, { useState, useEffect } from "react";
import "./AdminPage.css";

export default function AdminPage({ authHeaders }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reports", { headers: authHeaders() });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (err) {
        console.error(err);
        setReports([]);
      }
    };
    fetchReports();
  }, [authHeaders]);

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      <h2>All Reports</h2>
      <table>
        <thead>
          <tr><th>ID</th><th>Faculty</th><th>Course</th><th>Lecturer</th><th>Date</th><th>Topic</th></tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.faculty_name ?? r.facultyName}</td>
              <td>{r.course_name ?? r.courseName}</td>
              <td>{r.lecturer_name ?? r.lecturerName}</td>
              <td>{r.date_of_lecture ?? r.dateOfLecture}</td>
              <td>{r.topic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
