import React, { useState, useEffect } from "react";
import "./StudentPage.css";

export default function StudentPage({ user, authHeaders }) {
  const [tab, setTab] = useState("monitoring"); // navbar switch
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState({ lecturer_username: "", module_id: "", rating: 5, comments: "" });
  const [msg, setMsg] = useState("");
  const [lecturers, setLecturers] = useState([]);
  const [modules, setModules] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [date, setDate] = useState("");
  const [attendanceMsg, setAttendanceMsg] = useState("");

  // --- Rating comment mapping ---
  const ratingCommentsMap = {
    5: "Extremely satisfactory",
    4: "Very satisfactory",
    3: "Satisfactory",
    2: "Needs improvement",
    1: "Unsatisfactory"
  };

  // Fetch modules for student based on faculty
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/student/modules", {
          headers: authHeaders
        });
        const data = await res.json();
        if (Array.isArray(data)) setModules(data);
      } catch (err) {
        console.error("Error fetching modules:", err);
      }
    };
    fetchModules();
  }, [authHeaders]);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/reports", {
          headers: authHeaders
        });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
        setReports([]);
      }
    };
    fetchReports();
  }, [authHeaders]);

  // Fetch lecturers
  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/lecturers", {
          headers: authHeaders
        });
        const data = await res.json();
        if (data.success) setLecturers(data.lecturers);
      } catch (err) {
        console.error("Error fetching lecturers:", err);
      }
    };
    fetchLecturers();
  }, [authHeaders]);

  // Fetch attendance history
  useEffect(() => {
    if (tab === "monitoring") {
      const fetchAttendance = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/student/attendance", {
            headers: authHeaders
          });
          const data = await res.json();
          setAttendanceHistory(data);
        } catch (err) {
          console.error("Error fetching attendance:", err);
        }
      };
      fetchAttendance();
    }
  }, [tab, authHeaders]);

  const filteredReports = reports.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const submitRating = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/ratings", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rating,
          comments: rating.comments || ratingCommentsMap[rating.rating] // default comment
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Rating submitted successfully");
        setRating({ lecturer_username: "", module_id: "", rating: 5, comments: "" });
      } else setMsg(data.message || "Rating failed");
    } catch (err) {
      console.error(err);
      setMsg("Server error");
    }
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedModule || !date) return setAttendanceMsg("Select module and date");

    try {
      const moduleObj = modules.find(m => m.id === Number(selectedModule));
      if (!moduleObj) return setAttendanceMsg("Invalid module selected");

      const res = await fetch("http://localhost:5000/api/student/attendance", {
        method: "POST",
        headers: { ...authHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          module_code: moduleObj.code,
          module_name: moduleObj.name,
          date_of_class: date
        })
      });
      const data = await res.json();
      setAttendanceMsg(data.message || "Done");

      if (data.success) {
        setAttendanceHistory(prev => [
          { module_code: moduleObj.code, module_name: moduleObj.name, date_of_class: date, attended: true },
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
      setAttendanceMsg("Error submitting attendance");
    }
  };

  return (
    <div className="page-container">
      <h1>Student Portal</h1>

      {/* Navbar */}
      <nav className="student-nav">
        <button onClick={() => setTab("monitoring")} className={tab === "monitoring" ? "active" : ""}>Monitor Reports</button>
        <button onClick={() => setTab("rating")} className={tab === "rating" ? "active" : ""}>Rating</button>
      </nav>

      {tab === "monitoring" && (
        <>
          <h2>Mark Attendance</h2>
          {attendanceMsg && <p className="info">{attendanceMsg}</p>}
          <form onSubmit={submitAttendance} className="attendance-form">
            <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} required>
              <option value="">Select Module</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            <button type="submit">Mark Attendance</button>
          </form>

          <h3>Attendance History</h3>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Date</th>
                <th>Attended</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((a, i) => (
                <tr key={i}>
                  <td>{a.module_name}</td>
                  <td>{a.date_of_class}</td>
                  <td>{a.attended ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Recent Reports</h2>
          <input placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <table className="reports-table">
            <thead>
              <tr>
                <th>Lecturer</th>
                <th>Course</th>
                <th>Date</th>
                <th>Students Present</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => (
                <tr key={r.id}>
                  <td>{r.lecturer_name ?? r.lecturerName}</td>
                  <td>{r.course_name ?? r.courseName}</td>
                  <td>{r.date_of_lecture ?? r.dateOfLecture}</td>
                  <td>{r.actual_students ?? r.actualStudents}</td>
                  <td>{r.total_students ?? r.totalStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
              {lecturers.map(l => (
                <option key={l.username} value={l.username}>{l.name} {l.surname}</option>
              ))}
            </select>

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
              {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
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
