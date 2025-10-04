import React, { useState, useEffect } from "react";
import "./PrincipalLecturer.css";

export default function PrincipalLecturer({ user }) {
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [ratings, setRatings] = useState({ ratings: [], summary: [] });
  const [feedbacks, setFeedbacks] = useState({});
  const [replies, setReplies] = useState({});
  const [msg, setMsg] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reports", { 
          headers: authHeaders() 
        });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    if (activeTab === "complaints") {
      const fetchComplaints = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/complaints/prl", {
            headers: authHeaders()
          });
          const data = await res.json();
          setComplaints(data.success && Array.isArray(data.complaints) ? data.complaints : []);
        } catch (err) {
          console.error("Error fetching complaints:", err);
          setComplaints([]);
        }
      };
      fetchComplaints();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "ratings") {
      const fetchRatings = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/ratings/prl", {
            headers: authHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setRatings({
              ratings: data.ratings || [],
              summary: data.summary || []
            });
          }
        } catch (err) {
          console.error("Error fetching ratings:", err);
          setRatings({ ratings: [], summary: [] });
        }
      };
      fetchRatings();
    }
  }, [activeTab]);

  const submitFeedback = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${id}/feedback`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ feedback: feedbacks[id] || "" }),
      });
      const data = await res.json();
      if (data.success) { 
        setMsg("Feedback saved successfully"); 
        // Update the report in state
        setReports(prev => prev.map(r => 
          r.id === id ? { ...r, feedback: feedbacks[id] } : r
        ));
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg(data.message || "Failed to save feedback");
      }
    } catch (err) { 
      setMsg("Server error"); 
    }
  };

  const submitReply = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/complaints/${id}/reply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reply: replies[id] || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Reply sent successfully");
        setTimeout(() => setMsg(""), 3000);
        // Refresh complaints
        const updatedComplaints = complaints.map(c =>
          c.id === id ? { ...c, status: 'resolved', reply: replies[id] } : c
        );
        setComplaints(updatedComplaints);
        setReplies(prev => ({ ...prev, [id]: "" }));
      } else {
        setMsg(data.message || "Failed to send reply");
      }
    } catch (err) {
      setMsg("Server error");
    }
  };

  return (
    <div className="page-container">
      <h1>Principal Lecturer Portal</h1>
      <p className="welcome-text">
        Welcome, {user.lecturer_info?.name} {user.lecturer_info?.surname}
      </p>
      {msg && <p className="info-message">{msg}</p>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Lecturer Reports
        </button>
        <button 
          className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          Student Complaints
        </button>
        <button 
          className={`tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('ratings')}
        >
          Lecturer Ratings
        </button>
      </div>

      {activeTab === "reports" && (
        <div className="reports-section">
          <h2>Lecturer Reports from Your Stream</h2>
          {reports.length === 0 ? (
            <p>No reports submitted yet.</p>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Lecturer</th>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Topic</th>
                  <th>Students</th>
                  <th>Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.lecturer_name ?? r.lecturername}</td>
                    <td>{r.course_name ?? r.coursename}</td>
                    <td>{new Date(r.date_of_lecture ?? r.dateoflecture).toLocaleDateString()}</td>
                    <td>{r.topic}</td>
                    <td>{r.actual_students ?? r.actualstudents}/{r.total_students ?? r.totalstudents}</td>
                    <td>
                      <textarea
                        value={feedbacks[r.id] ?? r.feedback ?? ""}
                        onChange={(e) => setFeedbacks((p) => ({ ...p, [r.id]: e.target.value }))}
                        placeholder="Add feedback..."
                        rows="2"
                      />
                    </td>
                    <td>
                      <button onClick={() => submitFeedback(r.id)}>Save</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "complaints" && (
        <div className="complaints-section">
          <h2>Student Complaints & Reports</h2>
          {complaints.length === 0 ? (
            <p>No complaints submitted yet.</p>
          ) : (
            <table className="complaints-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Student Number</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Reply</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c.id} className={c.status}>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>{c.student_name} {c.student_surname}</td>
                    <td>{c.student_number}</td>
                    <td>{c.subject || '-'}</td>
                    <td className="message-cell">{c.message}</td>
                    <td>
                      <span className={`status-badge ${c.status}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      {c.status === 'resolved' ? (
                        <div className="reply-display">{c.reply}</div>
                      ) : (
                        <textarea
                          value={replies[c.id] || ""}
                          onChange={(e) => setReplies(p => ({ ...p, [c.id]: e.target.value }))}
                          placeholder="Type your reply..."
                          rows="2"
                        />
                      )}
                    </td>
                    <td>
                      {c.status !== 'resolved' && (
                        <button onClick={() => submitReply(c.id)}>Send Reply</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "ratings" && (
        <div className="ratings-section">
          <h2>Lecturer Ratings Overview</h2>
          
          {ratings.summary.length > 0 && (
            <div className="ratings-summary">
              <h3>Summary by Lecturer & Course</h3>
              <div className="summary-grid">
                {ratings.summary.map((s, idx) => (
                  <div key={idx} className="summary-card">
                    <h4>{s.lecturer_name} {s.lecturer_surname}</h4>
                    <p><strong>Course:</strong> {s.course}</p>
                    <p className="rating-score">
                      <strong>Average Rating:</strong>
                      <span className={`rating ${
                        s.average_rating >= 4 ? 'excellent' :
                        s.average_rating >= 3 ? 'good' :
                        s.average_rating >= 2 ? 'fair' : 'poor'
                      }`}>
                        {parseFloat(s.average_rating).toFixed(2)} / 5
                      </span>
                    </p>
                    <p><strong>Total Ratings:</strong> {s.total_ratings}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h3>All Ratings Details</h3>
          {ratings.ratings.length === 0 ? (
            <p>No ratings submitted yet.</p>
          ) : (
            <table className="ratings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Lecturer</th>
                  <th>Course</th>
                  <th>Student</th>
                  <th>Rating</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {ratings.ratings.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>{r.lecturer_name} {r.lecturer_surname}</td>
                    <td>{r.course}</td>
                    <td>{r.student_name} {r.student_surname}</td>
                    <td>
                      <span className={`rating-badge ${
                        r.rating >= 4 ? 'excellent' :
                        r.rating >= 3 ? 'good' :
                        r.rating >= 2 ? 'fair' : 'poor'
                      }`}>
                        {r.rating} / 5
                      </span>
                    </td>
                    <td>{r.comments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}