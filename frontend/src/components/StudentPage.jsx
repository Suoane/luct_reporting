import React, { useState, useEffect } from "react";
import ComplaintForm from "./ComplaintForm";
import ComplaintResponses from "./ComplaintResponses";
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
        const res = await fetch("http://localhost:5000/api/student/modules/stream", {
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
        const res = await fetch("http://localhost:5000/api/lecturers/student/stream/regular", {
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
          const res = await fetch("http://localhost:5000/api/student/attendance", {
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
    }
  }, [tab]);

  const submitRating = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/ratings", {
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

      const res = await fetch("http://localhost:5000/api/student/attendance", {
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

          <h2>Your Complaint/Report Responses</h2>
          <ComplaintResponses user={user} authHeaders={authHeaders} />
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