import React, { useState, useEffect } from "react";
import ReportForm from "./ReportForm";
import "./LecturerPage.css";

export default function LecturerPage({ user, authHeaders }) {
  const [reports, setReports] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/lecturer/reports", { headers: authHeaders() });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (err) {
        console.error(err);
        setReports([]);
      }
    };
    fetchMyReports();
  }, [authHeaders]);

  return (
    <div className="page-container">
      <h1>Lecturer Portal</h1>
      <h2>Create Report</h2>
      <ReportForm user={user} onSubmitted={() => { setMsg("Report submitted"); }} />
      {msg && <p className="info">{msg}</p>}

      <h2>My Reports</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Course</th>
            <th>Topic</th>
            <th>Students Present</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.date_of_lecture ?? r.dateOfLecture}</td>
              <td>{r.course_name ?? r.courseName}</td>
              <td>{r.topic}</td>
              <td>{r.actual_students ?? r.actualStudents}</td>
              <td>{r.total_students ?? r.totalStudents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
