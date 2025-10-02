import React, { useState, useEffect } from "react";
import "./PrincipalLecturer.css";

export default function PrincipalLecturer({ authHeaders }) {
  const [reports, setReports] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [msg, setMsg] = useState("");

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

  const submitFeedback = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${id}/feedback`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ feedback: feedbacks[id] || "" }),
      });
      const data = await res.json();
      if (data.success) { setMsg("Feedback saved"); }
      else setMsg(data.message || "Failed");
    } catch { setMsg("Server error"); }
  };

  return (
    <div className="page-container">
      <h1>Principal Lecturer Portal</h1>
      {msg && <p className="info">{msg}</p>}
      <h2>All Reports (PRL)</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Lecturer</th><th>Course</th><th>Date</th><th>Topic</th><th>Feedback</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{r.lecturer_name ?? r.lecturerName}</td>
              <td>{r.course_name ?? r.courseName}</td>
              <td>{r.date_of_lecture ?? r.dateOfLecture}</td>
              <td>{r.topic}</td>
              <td>
                <input
                  value={feedbacks[r.id] ?? r.feedback ?? ""}
                  onChange={(e) => setFeedbacks((p) => ({ ...p, [r.id]: e.target.value }))}
                  placeholder="Add feedback"
                />
              </td>
              <td><button onClick={() => submitFeedback(r.id)}>Save</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
