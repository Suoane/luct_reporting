import React, { useState, useEffect } from "react";
import { exportReportsToExcel, exportPRLRatingsToExcel } from "../utils/excelExport";
import "./ProgramLeader.css";

export default function ProgramLeader({ user }) {
  const [activeTab, setActiveTab] = useState("monitoring");
  const [reports, setReports] = useState([]);
  const [prlRatings, setPrlRatings] = useState([]);
  const [lecturerRatings, setLecturerRatings] = useState([]);
  const [streams, setStreams] = useState([]);
  const [modules, setModules] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`
  });

  // Fetch initial data
  useEffect(() => {
    fetchStreams();
    fetchModules();
    fetchLecturers();
  }, []);

  // Fetch PRL reports
  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab]);

  // Fetch PRL ratings from lecturers
  useEffect(() => {
    if (activeTab === "prl-ratings") {
      fetchPRLRatings();
    }
  }, [activeTab]);

  // Fetch lecturer ratings from students
  useEffect(() => {
    if (activeTab === "lecturer-ratings") {
      fetchLecturerRatings();
    }
  }, [activeTab]);

  const fetchStreams = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/streams-public");
      const data = await res.json();
      setStreams(data.streams || []);
    } catch (err) {
      console.error("Error fetching streams:", err);
    }
  };

  const fetchModules = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/modules-public");
      const data = await res.json();
      setModules(data.modules || []);
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const fetchLecturers = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/pl/lecturers", {
        headers: authHeaders()
      });
      const data = await res.json();
      setLecturers(data.lecturers || []);
    } catch (err) {
      console.error("Error fetching lecturers:", err);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/reports", {
        headers: authHeaders()
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
    }
  };

  const fetchPRLRatings = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/ratings/pl/prls", {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setPrlRatings(data.ratings || []);
      }
    } catch (err) {
      console.error("Error fetching PRL ratings:", err);
      setPrlRatings([]);
    }
  };

  const fetchLecturerRatings = async () => {
    try {
      const res = await fetch(API_BASE_URL + "/api/pl/lecturer-ratings", {
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setLecturerRatings(data.ratings || []);
      }
    } catch (err) {
      console.error("Error fetching lecturer ratings:", err);
      setLecturerRatings([]);
    }
  };

  const handleExportReports = () => {
    if (filteredReports.length === 0) {
      alert("No reports to export");
      return;
    }
    exportReportsToExcel(filteredReports);
  };

  const handleExportPRLRatings = () => {
    if (prlRatings.length === 0) {
      alert("No PRL ratings to export");
      return;
    }
    exportPRLRatingsToExcel(prlRatings);
  };

  const filteredReports = reports.filter(r => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      r.facultyname?.toLowerCase().includes(search) ||
      r.lecturername?.toLowerCase().includes(search) ||
      r.coursename?.toLowerCase().includes(search) ||
      r.topic?.toLowerCase().includes(search) ||
      r.feedback?.toLowerCase().includes(search)
    );
  });

  const filteredPRLRatings = prlRatings.filter(prl => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      prl.prl_name?.toLowerCase().includes(search) ||
      prl.prl_surname?.toLowerCase().includes(search) ||
      prl.stream_name?.toLowerCase().includes(search)
    );
  });

  const filteredLecturerRatings = lecturerRatings.filter(l => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      l.lecturer_name?.toLowerCase().includes(search) ||
      l.lecturer_surname?.toLowerCase().includes(search) ||
      l.stream_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="page-container">
      <h1>Program Leader Portal</h1>
      <div className="welcome-section">
        <div className="welcome-icon">ðŸ‘‹ðŸ¾</div>
        <div>
          <p className="welcome-text">
            Welcome, <span>{user.username}</span>
            <span className="role">Program Leader</span>
          </p>
        </div>
      </div>
      {msg && <p className="success-message">{msg}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'monitoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('monitoring')}
        >
          Monitoring
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          PRL Reports
        </button>
        <button 
          className={`tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          Classes & Modules
        </button>
        <button 
          className={`tab ${activeTab === 'lecturers' ? 'active' : ''}`}
          onClick={() => setActiveTab('lecturers')}
        >
          Lecturers
        </button>
        <button 
          className={`tab ${activeTab === 'prl-ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('prl-ratings')}
        >
          PRL Ratings
        </button>
        <button 
          className={`tab ${activeTab === 'lecturer-ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('lecturer-ratings')}
        >
          Lecturer Ratings
        </button>
      </div>

      {activeTab === "monitoring" && (
        <div className="monitoring-section">
          <h2>System Monitoring Overview</h2>
          <div className="monitoring-grid">
            <div className="monitor-card">
              <h3>Total Streams</h3>
              <div className="monitor-value">{streams.length}</div>
            </div>
            <div className="monitor-card">
              <h3>Total Modules</h3>
              <div className="monitor-value">{modules.length}</div>
            </div>
            <div className="monitor-card">
              <h3>Total Lecturers</h3>
              <div className="monitor-value">{lecturers.length}</div>
            </div>
            <div className="monitor-card">
              <h3>Total Reports</h3>
              <div className="monitor-value">{reports.length}</div>
            </div>
          </div>

          <h3>Streams Overview</h3>
          <div className="streams-overview">
            {streams.map(stream => {
              const streamModules = modules.filter(m => m.stream_id === stream.id);
              return (
                <div key={stream.id} className="stream-card">
                  <h4>{stream.name}</h4>
                  <p><strong>Modules:</strong> {streamModules.length}</p>
                  <div className="module-list">
                    {streamModules.map(m => (
                      <span key={m.id} className="module-tag">
                        {m.code}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="reports-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Reports from Principal Lecturers</h2>
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
              ðŸ“¥ Export to Excel
            </button>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by faculty, lecturer, course, topic, or feedback..."
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
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Faculty</th>
                  <th>Lecturer</th>
                  <th>Course</th>
                  <th>Topic</th>
                  <th>Students</th>
                  <th>Feedback</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => (
                  <tr key={r.id}>
                    <td>{r.dateoflecture}</td>
                    <td>{r.facultyname}</td>
                    <td>{r.lecturername}</td>
                    <td>{r.coursename}</td>
                    <td>{r.topic}</td>
                    <td>{r.actualstudents}/{r.totalstudents}</td>
                    <td>{r.feedback || '-'}</td>
                    <td>{new Date(r.submitted_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "classes" && (
        <div className="classes-section">
          <h2>All Streams & Modules</h2>
          {streams.map(stream => {
            const streamModules = modules.filter(m => m.stream_id === stream.id);
            return (
              <div key={stream.id} className="class-details-card">
                <h3>{stream.name}</h3>
                <div className="modules-grid">
                  {streamModules.map(module => (
                    <div key={module.id} className="module-card">
                      <h4>{module.code}</h4>
                      <p>{module.name}</p>
                    </div>
                  ))}
                </div>
                {streamModules.length === 0 && (
                  <p className="no-data">No modules assigned to this stream</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "lecturers" && (
        <div className="lecturers-section">
          <h2>All Lecturers</h2>
          {lecturers.length === 0 ? (
            <p>No lecturers found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Stream</th>
                  <th>Module</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {lecturers.map(l => (
                  <tr key={l.id}>
                    <td>{l.name} {l.surname}</td>
                    <td>{l.username}</td>
                    <td>{l.stream_name || '-'}</td>
                    <td>{l.module_name || 'Not assigned'}</td>
                    <td>
                      <span className={`role-badge ${l.role}`}>
                        {l.role === 'prl' ? 'Principal Lecturer' : 
                         l.role === 'pl' ? 'Program Leader' : 'Lecturer'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "prl-ratings" && (
        <div className="prl-ratings-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>Principal Lecturer Ratings (from Lecturers)</h2>
            <button 
              onClick={handleExportPRLRatings}
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
              ðŸ“¥ Export to Excel
            </button>
          </div>

          <p className="info-note">
            Ratings submitted by lecturers evaluating their Principal Lecturers' performance.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by PRL name or stream..."
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

          {filteredPRLRatings.length === 0 ? (
            <p>No PRL ratings found.</p>
          ) : (
            <div className="summary-grid">
              {filteredPRLRatings.map((prl) => (
                <div key={prl.prl_id} className="summary-card">
                  <h4>{prl.prl_name} {prl.prl_surname}</h4>
                  <p><strong>Stream:</strong> {prl.stream_name}</p>
                  <p className="rating-score">
                    <strong>Average Rating:</strong>
                    <span className={`rating ${
                      prl.average_rating >= 4 ? 'excellent' :
                      prl.average_rating >= 3 ? 'good' :
                      prl.average_rating >= 2 ? 'fair' : 'poor'
                    }`}>
                      {prl.average_rating ? parseFloat(prl.average_rating).toFixed(2) : 'N/A'} / 5
                    </span>
                  </p>
                  <p><strong>Total Ratings:</strong> {prl.total_ratings || 0}</p>
                  
                  {prl.ratings && prl.ratings.length > 0 && (
                    <div className="recent-feedback">
                      <h5>Recent Feedback:</h5>
                      {prl.ratings.slice(0, 3).map((rating, idx) => (
                        <div key={idx} className="feedback-item">
                          <div className="feedback-header">
                            <span className="rating-value">{rating.rating}/5</span>
                            <span className="feedback-date">
                              {new Date(rating.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="feedback-comment">{rating.comments}</p>
                          <small>- {rating.lecturer_name}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "lecturer-ratings" && (
        <div className="lecturer-ratings-section">
          <h2>Lecturer Ratings (from Students)</h2>
          <p className="info-note">
            Overview of all lecturer ratings submitted by students across all streams.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search by lecturer name or stream..."
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

          {filteredLecturerRatings.length === 0 ? (
            <p>No lecturer ratings found.</p>
          ) : (
            <div className="ratings-overview">
              {filteredLecturerRatings.map((lecturer) => (
                <div key={lecturer.lecturer_id} className="lecturer-rating-card">
                  <h4>{lecturer.lecturer_name} {lecturer.lecturer_surname}</h4>
                  <p><strong>Stream:</strong> {lecturer.stream_name}</p>
                  <div className="rating-stats">
                    <div className="stat">
                      <label>Average Rating:</label>
                      <span className={`rating ${
                        lecturer.average_rating >= 4 ? 'excellent' :
                        lecturer.average_rating >= 3 ? 'good' :
                        lecturer.average_rating >= 2 ? 'fair' : 'poor'
                      }`}>
                        {lecturer.average_rating ? parseFloat(lecturer.average_rating).toFixed(2) : 'N/A'} / 5
                      </span>
                    </div>
                    <div className="stat">
                      <label>Total Ratings:</label>
                      <span>{lecturer.total_ratings || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}