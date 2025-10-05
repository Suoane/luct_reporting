import React, { useState, useEffect } from "react";
import ComplaintForm from "./ComplaintForm";
import ComplaintResponses from "./ComplaintResponses";
import { exportComplaintsToExcel } from "../utils/excelExport";
import "./StudentPage.css";

export default function StudentPage({ user }) {
  const [tab, setTab] = useState("monitoring");
  const [rating, setRating] = useState({ 
    lecturer_username: "", 
    module_id: "", 
    rating: 5, 
    comments: "" 
  });
  const [msg, setMsg] = useState("");
  const [lecturers, setLecturers] = useState([]);
  const [modules, setModules] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [date, setDate] = useState("");
  const [attendanceMsg, setAttendanceMsg] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const ratingCommentsMap = {
    5: "Extremely satisfactory",
    4: "Very satisfactory",
    3: "Satisfactory",
    2: "Needs improvement",
    1: "Unsatisfactory"
  };

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch(API_BASE_URL + "/api/student/modules/stream", {
          headers: authHeaders()
        });
        const data = await res.json();
        setModules(Array.isArray(data) ? data : data.modules || []);
      } catch (err) {
        console.error("Error fetching modules:", err);
        setModules([]);
      }
    };
    fetchModules();
  }, []);

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const res = await fetch(API_BASE_URL + "/api/lecturers/student/stream/regular", {
          headers: authHeaders()
        });
        const data = await res.json();
        setLecturers(data.success && Array.isArray(data.lecturers) ? data.lecturers : []);
      } catch (err) {
        console.error("Error fetching lecturers:", err);
        setLecturers([]);
      }
    };
    fetchLecturers();
  }, []);

  useEffect(() => {
    if (tab === "monitoring") {
      const fetchAttendance = async () => {
        try {
          const res = await fetch(API_BASE_URL + "/api/student/attendance", {
            headers: authHeaders()
          });
          const data = await res.json();
          setAttendanceHistory(Array.isArray(data) ? data : data.attendance || []);
        } catch (err) {
          console.error("Error fetching attendance:", err);
          setAttendanceHistory([]);
        }
      };
      fetchAttendance();

      const fetchComplaints = async () => {
        try {
          const res = await fetch(API_BASE_URL + "/api/complaints/student", {
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
  }, [tab]);

  const submitRating = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(API_BASE_URL + "/api/ratings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...rating,
          comments: rating.comments || ratingCommentsMap[rating.rating]
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Rating submitted successfully");
        setRating({ lecturer_username: "", module_id: "", rating: 5, comments: "" });
      } else {
        setMsg(data.message || "Rating failed");
      }
    } catch (err) {
      console.error(err);
      setMsg("Server error");
    }
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedModule || !date || !selectedLecturer) {
      return setAttendanceMsg("Please select lecturer, module and date");
    }

    try {
      const moduleObj = modules.find(m => m.id === Number(selectedModule));
      if (!moduleObj) return setAttendanceMsg("Invalid module selected");

      const res = await fetch(API_BASE_URL + "/api/student/attendance", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          module_code: moduleObj.code,
          module_name: moduleObj.name,
          date_of_class: date,
          lecturer_username: selectedLecturer
        })
      });
      const data = await res.json();
      setAttendanceMsg(data.message || "Done");

      if (data.success) {
        setAttendanceHistory(prev => [
          { 
            module_code: moduleObj.code, 
            module_name: moduleObj.name, 
            date_of_class: date, 
            attended: true,
            lecturer_username: selectedLecturer
          },
          ...prev
        ]);
        setSelectedModule("");
        setSelectedLecturer("");
        setDate("");
      }
    } catch (err) {
      console.error(err);
      setAttendanceMsg("Error submitting attendance");
    }
  };

  const handleExportComplaints = () => {
    if (complaints.length === 0) {
      alert("No complaint responses to export");
      return;
    }
    exportComplaintsToExcel(complaints);
  };

  const filteredComplaints = complaints.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(search) ||
      c.message?.toLowerCase().includes(search) ||
      c.reply?.toLowerCase().includes(search) ||
      c.status?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="page-container">
      <h1>Student Dashboard</h1>

      <nav className="student-nav">
        <button onClick={() => setTab("monitoring")} className={tab === "monitoring" ? "active" : ""}>
          Attendance & Complaints
        </button>
        <button onClick={() => setTab("rating")} className={tab === "rating" ? "active" : ""}>
          Lecturer Rating
        </button>
      </nav>

      {tab === "monitoring" && (
        <>
          <h2>Mark Attendance</h2>
          {attendanceMsg && <p className="info">{attendanceMsg}</p>}
          <form onSubmit={submitAttendance} className="attendance-form">
            <select 
              value={selectedLecturer} 
              onChange={(e) => setSelectedLecturer(e.target.value)} 
              required
            >
              <option value="">Select Lecturer</option>
              {lecturers.length === 0 && <option disabled>No lecturers available</option>}
              {lecturers.map(l => (
                <option key={l.username} value={l.username}>
                  {l.name} {l.surname}
                </option>
              ))}
            </select>

            <select 
              value={selectedModule} 
              onChange={(e) => setSelectedModule(e.target.value)} 
              required
            >
              <option value="">Select Module</option>
              {modules.length === 0 && <option disabled>No modules available</option>}
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>

            {modules.length === 0 && <p className="info">No modules found for your stream. Please contact admin.</p>}
            {lecturers.length === 0 && <p className="info">No lecturers found for your stream. Please contact admin.</p>}

            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
            <button type="submit">Mark Attendance</button>
          </form>

          <h3>Attendance History</h3>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Lecturer</th>
                <th>Module</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.length > 0 ? (
                attendanceHistory.map((a, i) => (
                  <tr key={i}>
                    <td>{a.lecturer_username || 'N/A'}</td>
                    <td>{a.module_name}</td>
                    <td>{a.date_of_class}</td>
                    <td className={a.attended ? 'present' : 'absent'}>
                      {a.attended ? "Present" : "Absent"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>

          <h2>Send Complaint/Report to Principal Lecturer</h2>
          <ComplaintForm user={user} authHeaders={authHeaders} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
            <h2>Your Complaint/Report Responses</h2>
            <button 
              onClick={handleExportComplaints}
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
              placeholder="Search complaints by subject, message, reply, or status..."
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

          {filteredComplaints.length === 0 ? (
            <p>No complaint responses found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Reply</th>
                  <th>Replied At</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map(c => (
                  <tr key={c.id}>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>{c.subject || '-'}</td>
                    <td>{c.message}</td>
                    <td>
                      <span className={`status-badge ${c.status}`}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </span>
                    </td>
                    <td>{c.reply || 'Pending response'}</td>
                    <td>{c.replied_at ? new Date(c.replied_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === "rating" && (
        <>
          <h2>Rate a Course / Lecturer</h2>
          {msg && <p className="info">{msg}</p>}
          <form onSubmit={submitRating} className="rating-form">
            <select 
              value={rating.lecturer_username} 
              onChange={(e) => setRating(p => ({ ...p, lecturer_username: e.target.value }))} 
              required
            >
              <option value="">Select Lecturer</option>
              {lecturers.length === 0 && <option disabled>No lecturers available</option>}
              {lecturers.map(l => (
                <option key={l.username} value={l.username}>{l.name} {l.surname}</option>
              ))}
            </select>
            {lecturers.length === 0 && <p className="info">No lecturers found. Please contact admin.</p>}

            <select 
              value={rating.module_id} 
              onChange={(e) => setRating(p => ({ ...p, module_id: e.target.value }))} 
              required
            >
              <option value="">Select Module</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>

            <select 
              value={rating.rating} 
              onChange={(e) => setRating(p => ({ ...p, rating: Number(e.target.value) }))}
            >
              {[5,4,3,2,1].map(v => (
                <option key={v} value={v}>{v} - {ratingCommentsMap[v]}</option>
              ))}
            </select>

            <textarea 
              placeholder="Comments (optional)" 
              value={rating.comments} 
              onChange={(e) => setRating(p => ({ ...p, comments: e.target.value }))} 
            />
            <button type="submit">Submit Rating</button>
          </form>
        </>
      )}
    </div>
  );
}