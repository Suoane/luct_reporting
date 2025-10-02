import { useEffect, useState } from "react";

export default function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/reports")
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error("Error fetching reports:", err));
  }, []);

  return (
    <div className="page">
      <h1 className="title">Reports</h1>
      <table className="table">
        <thead>
          <tr>
            <th>Faculty</th>
            <th>Class</th>
            <th>Week</th>
            <th>Date</th>
            <th>Course</th>
            <th>Lecturer</th>
            <th>Present</th>
            <th>Total</th>
            <th>Topic</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.id}>
              <td>{r.facultyname}</td>
              <td>{r.classname}</td>
              <td>{r.weekofreporting}</td>
              <td>{r.dateoflecture}</td>
              <td>{r.coursename} ({r.coursecode})</td>
              <td>{r.lecturername}</td>
              <td>{r.actualstudents}</td>
              <td>{r.totalstudents}</td>
              <td>{r.topic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
