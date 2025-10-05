import React, { useState, useEffect } from "react";
import { exportReportsToExcel } from "../utils/excelExport";
import API_BASE_URL from '../config/api';
import "./PrincipalLecturer.css";

export default function PrincipalLecturer({ user }) {
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [ratings, setRatings] = useState({ ratings: [], summary: [] });
  const [feedbacks, setFeedbacks] = useState({});
  const [replies, setReplies] = useState({});
  const [msg, setMsg] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadReportsCount, setUnreadReportsCount] = useState(0);
  const [newRatingsCount, setNewRatingsCount] = useState(0);
  const [viewedTabs, setViewedTabs] = useState({
    reports: false,
    complaints: false,
    ratings: false
  });
  const [searchTerm, setSearchTerm] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`
  });

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports`, { 
          headers: authHeaders() 
        });
        const data = await res.json();
        const reportsList = Array.isArray(data) ? data : data.reports || [];
        setReports(reportsList);
        
        if (!viewedTabs.reports) {
          const unread = reportsList.filter(r => !r.feedback || r.feedback.trim() === '').length;
          setUnreadReportsCount(unread);
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
        setUnreadReportsCount(0);
      }
    };
    
    fetchReports();
    const interval = setInterval(fetchReports, 30000);
    return () => clearInterval(interval);
  }, [viewedTabs.reports]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/complaints/prl`, {
          headers: authHeaders()
        });
        const data = await res.json();
        const complaintsList = data.success && Array.isArray(data.complaints) ? data.complaints : [];
        setComplaints(complaintsList);
        
        const pending = complaintsList.filter(c => c.status === 'pending').length;
        setPendingCount(pending);
      } catch (err) {
        console.error("Error fetching complaints:", err);
        setComplaints([]);
        setPendingCount(0);
      }
    };
    
    fetchComplaints();
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ratings/prl`, {
          headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
          const ratingsList = data.ratings || [];
          setRatings({
            ratings: ratingsList,
            summary: data.summary || []
          });
          
          if (!viewedTabs.ratings) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const newRatings = ratingsList.filter(r => 
              new Date(r.created_at) > sevenDaysAgo
            ).length;
            setNewRatingsCount(newRatings);
          }
        }
      } catch (err) {
        console.error("Error fetching ratings:", err);
        setRatings({ ratings: [], summary: [] });
        setNewRatingsCount(0);
      }
    };
    
    fetchRatings();
    const interval = setInterval(fetchRatings, 30000);
    return () => clearInterval(interval);
  }, [viewedTabs.ratings]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    
    if (tab === 'reports') {
      setViewedTabs(prev => ({ ...prev, reports: true }));
      setUnreadReportsCount(0);
    } else if (tab === 'ratings') {
      setViewedTabs(prev => ({ ...prev, ratings: true }));
      setNewRatingsCount(0);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      
      if (data.success) {
        setMsg('Report deleted successfully');
        setReports(reports.filter(r => r.id !== reportId));
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(data.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setMsg('Error deleting report');
    }
  };

  const submitFeedback = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${id}/feedback`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ feedback: feedbacks[id] || "" }),
      });
      const data = await res.json();
      if (data.success) { 
        setMsg("Feedback saved successfully"); 
        const updatedReports = reports.map(r => 
          r.id === id ? { ...r, feedback: feedbacks[id] } : r
        );
        setReports(updatedReports);
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
      const res = await fetch(`${API_BASE_URL}/api/complaints/${id}/reply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ reply: replies[id] || "" }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Reply sent successfully");
        setTimeout(() => setMsg(""), 3000);
        
        const updatedComplaints = complaints.map(c =>
          c.id === id ? { ...c, status: 'resolved', reply: replies[id] } : c
        );
        setComplaints(updatedComplaints);
        setPendingCount(prev => Math.max(0, prev - 1));
        setReplies(prev => ({ ...prev, [id]: "" }));
      } else {
        setMsg(data.message || "Failed to send reply");
      }
    } catch (err) {
      setMsg("Server error");
    }
  };

  const handleExportReports = () => {
    if (filteredReports.length === 0) {
      alert("No reports to export");
      return;
    }
    exportReportsToExcel(filteredReports);
  };

  const filteredReports = reports.filter(r => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.lecturer_name?.toLowerCase().includes(search) ||
      r.lecturername?.toLowerCase().includes(search) ||
      r.course_name?.toLowerCase().includes(search) ||
      r.coursename?.toLowerCase().includes(search) ||
      r.topic?.toLowerCase().includes(search) ||
      r.feedback?.toLowerCase().includes(search)
    );
  });

  const NotificationBadge = ({ count }) => {
    if (count === 0) return null;
    return (
      <span style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
        background: '#ff4444',
        color: 'white',
        borderRadius: '50%',
        minWidth: '24px',
        height: '24px',
        padding: '0 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        {count}
      </span>
    );
  };

  return (
    <div className="page-container">
      <h1>Principal Lecturer Portal</h1>
      <div className="welcome-section">
        <div className="welcome-icon">👋🏾</div>
        <div>
          <p className="welcome-text">
            Welcome, <span>{user.lecturer_info?.name} {user.lecturer_info?.surname}</span>
            <span className="role">Principal Lecturer</span>
          </p>
        </div>
      </div>
      {msg && <p className="info-message">{msg}</p>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleTabClick('reports')}
          style={{ position: 'relative' }}
        >
          Lecturer Reports
          <NotificationBadge count={unreadReportsCount} />
        </button>
        <button 
          className={`tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => handleTabClick('complaints')}
          style={{ position: 'relative' }}
        >
          Student Complaints
          <NotificationBadge count={pendingCount} />
        </button>
        <button 
          className={`tab ${activeTab === 'ratings' ? 'active' : ''}`}
          onClick={() => handleTabClick('ratings')}
          style={{ position: 'relative' }}
        >
          Lecturer Ratings
          <NotificationBadge count={newRatingsCount} />
        </button>
      </div>

      {activeTab === "reports" && (
        <div className="reports-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Lecturer Reports from Your Stream</h2>
            <button 
              onClick={handleExportReports}
              style={{ 
                background: '#4CAF50', 
                color: 'white', 
                padding: '10px 20px', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📥 Export to Excel
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by lecturer, course, topic, or feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            />
          </div>

          {filteredReports.length === 0 ? (
            <p>No reports found.</p>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => (
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
                      <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                        <button onClick={() => submitFeedback(r.id)}>Save</button>
                        <button 
                          onClick={() => handleDeleteReport(r.id)}
                          style={{ background: '#dc3545' }}
                        >
                          Delete
                        </button>
                      </div>
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