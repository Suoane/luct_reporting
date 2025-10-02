import React, { useState, useEffect } from "react";
import "./ProgramLeader.css";

export default function ProgramLeader({ authHeaders }) {
  const [courses, setCourses] = useState([]);
  const [courseData, setCourseData] = useState({ course_name: "", course_code: "", lecturer_username: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/courses", { headers: authHeaders() });
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : data.courses || []);
      } catch (err) {
        console.error(err);
        setCourses([]);
      }
    };
    fetchCourses();
  }, [authHeaders]);

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
        setMsg("Course added");
        setCourseData({ course_name: "", course_code: "", lecturer_username: "" });
      } else setMsg(data.message || "Failed to add");
    } catch { setMsg("Server error"); }
  };

  return (
    <div className="page-container">
      <h1>Program Leader Portal</h1>
      {msg && <p className="info">{msg}</p>}
      <form onSubmit={addCourse}>
        <input placeholder="Course Name" value={courseData.course_name} onChange={(e) => setCourseData((p) => ({ ...p, course_name: e.target.value }))} required />
        <input placeholder="Course Code" value={courseData.course_code} onChange={(e) => setCourseData((p) => ({ ...p, course_code: e.target.value }))} required />
        <input placeholder="Lecturer Username" value={courseData.lecturer_username} onChange={(e) => setCourseData((p) => ({ ...p, lecturer_username: e.target.value }))} />
        <button type="submit">Add Course</button>
      </form>
      <h2>All Courses</h2>
      <table>
        <thead><tr><th>Course Name</th><th>Course Code</th><th>Lecturer</th></tr></thead>
        <tbody>{courses.map(c => <tr key={c.id}><td>{c.course_name ?? c.courseName}</td><td>{c.course_code ?? c.courseCode}</td><td>{c.lecturer_username ?? c.lecturerUsername}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
