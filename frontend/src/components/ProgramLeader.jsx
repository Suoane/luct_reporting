import React, { useState, useEffect } from "react";
import "./ProgramLeader.css";

export default function ProgramLeader({ user }) {
  const [activeTab, setActiveTab] = useState("courses");
  const [courses, setCourses] = useState([]);
  const [prlRatings, setPrlRatings] = useState({ ratings: [], summary: [] });
  const [courseData, setCourseData] = useState({ 
    course_name: "", 
    course_code: "", 
    lecturer_username: "" 
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`
  });

  useEffect(() => {
    if (activeTab === "courses") {
      const fetchCourses = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/courses", { 
            headers: authHeaders() 
          });
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : data.courses || []);
        } catch (err) {
          console.error("Error fetching courses:", err);
          setCourses([]);
        }
      };
      fetchCourses();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "prl-ratings") {
      const fetchPrlRatings = async () => {
        try {
          const res = await fetch("http://localhost:5000/api/ratings/pl/prls", {
            headers: authHeaders()
          });
          const data = await res.json();
          if (data.success) {
            setPrlRatings({
              ratings: data.ratings || [],
              summary: data.summary || []
            });
            setError("");
          } else {
            setError(data.message || "Failed to load PRL ratings");
          }
        } catch (err) {
          console.error("Error fetching PRL ratings:", err);
          setError("Failed to load PRL ratings");
          setPrlRatings({ ratings: [], summary: [] });
        }
      };
      fetchPrlRatings();
    }
  }, [activeTab]);

  const addCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(courseData)
      });
      const data = await res.json();
      if (data.success) {
        setMsg("Course added successfully");
        setError("");
        setCourseData({ course_name: "", course_code: "", lecturer_username: "" });
        // Refresh courses
        const coursesRes = await fetch("http://localhost:5000/api/courses", { 
          headers: authHeaders() 
        });
        const coursesData = await coursesRes.json();
        setCourses(Array.isArray(coursesData) ? coursesData : coursesData.courses || []);
        setTimeout(() => setMsg(""), 3000);
      } else {
        setError(data.message || "Failed to add course");
        setMsg("");
      }
    } catch (err) {
      setError("Server error");
      setMsg("");
    }
  };

  return (
    <div className="page-container">
      <h1>Program Leader Portal</h1>
      <p className="welcome-text">Welcome, {user.username}</p>
      {msg && <p className="info">{msg}</p>}
      {error && <p className="error">{error}</p>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Course Management
        </button>
        <button 
          className={`tab ${activeTab === 'prl-ratings' ? 'active' : ''}`}
          onClick={() => setActiveTab('prl-ratings')}
        >
          Principal Lecturer Ratings
        </button>
      </div>

      {activeTab === "courses" && (
        <div className="courses-section">
          <h2>Add New Course</h2>
          <form onSubmit={addCourse} className="course-form">
            <input 
              placeholder="Course Name" 
              value={courseData.course_name} 
              onChange={(e) => setCourseData((p) => ({ ...p, course_name: e.target.value }))} 
              required 
            />
            <input 
              placeholder="Course Code" 
              value={courseData.course_code} 
              onChange={(e) => setCourseData((p) => ({ ...p, course_code: e.target.value }))} 
              required 
            />
            <input 
              placeholder="Lecturer Username" 
              value={courseData.lecturer_username} 
              onChange={(e) => setCourseData((p) => ({ ...p, lecturer_username: e.target.value }))} 
            />
            <button type="submit">Add Course</button>
          </form>

          <h2>All Courses</h2>
          {courses.length === 0 ? (
            <p>No courses available</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Course Code</th>
                  <th>Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>{c.course_name ?? c.courseName}</td>
                    <td>{c.course_code ?? c.courseCode}</td>
                    <td>{c.lecturer_username ?? c.lecturerUsername ?? 'Not assigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "prl-ratings" && (
        <div className="prl-ratings-section">
          <h2>Principal Lecturer Performance Ratings</h2>
          <p className="info-note">
            These ratings are submitted by students to evaluate Principal Lecturers' performance 
            in managing their streams and supporting lecturers.
          </p>

          {prlRatings.summary.length > 0 && (
            <div className="ratings-summary">
              <h3>Summary by Principal Lecturer</h3>
              <div className="summary-grid">
                {prlRatings.summary.map((s, idx) => (
                  <div key={idx} className="summary-card">
                    <h4>{s.prl_name} {s.prl_surname}</h4>
                    <p><strong>Stream:</strong> {s.stream_name}</p>
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

          <h3>All PRL Ratings Details</h3>
          {prlRatings.ratings.length === 0 ? (
            <div className="no-ratings">
              <p>No PRL ratings submitted yet.</p>
              <p className="note">
                Note: Students will be able to rate Principal Lecturers once the rating functionality is enabled.
              </p>
            </div>
          ) : (
            <table className="ratings-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Principal Lecturer</th>
                  <th>Stream</th>
                  <th>Student</th>
                  <th>Rating</th>
                  <th>Comments</th>
                </tr>
              </thead>
              <tbody>
                {prlRatings.ratings.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>{r.prl_name} {r.prl_surname}</td>
                    <td>{r.stream_name}</td>
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