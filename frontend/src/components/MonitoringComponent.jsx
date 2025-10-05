import React, { useEffect, useState } from "react";
import API_BASE_URL from '../config/api';
import ComplaintForm from "./ComplaintForm";
import ComplaintResponses from "./ComplaintResponses";

export default function MonitoringComponent({ user, authHeaders }) {
  const [modules, setModules] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [date, setDate] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const fetchModules = async () => {
      try {
        if (!user || !user.program_id) return;
        const res = await fetch(`${API_BASE_URL}/api/student/modules/${user.program_id}`, { 
          headers: authHeaders() 
        });
        const data = await res.json();
        setModules(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchAttendance = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/attendance`, { 
          headers: authHeaders() 
        });
        const data = await res.json();
        setAttendanceHistory(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchModules();
    fetchAttendance();
  }, [authHeaders, user]);

  const submitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedModule || !date) return setMsg("Select module and date");

    try {
      const moduleObj = modules.find((m) => m.code === selectedModule);
      const res = await fetch(`${API_BASE_URL}/api/student/attendance`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ 
          module_code: moduleObj.code, 
          module_name: moduleObj.name, 
          date_of_class: date 
        }),
      });
      const data = await res.json();
      setMsg(data.message || "Done");
      if (data.success) {
        setAttendanceHistory(prev => [
          { 
            module_code: moduleObj.code, 
            module_name: moduleObj.name, 
            date_of_class: date, 
            attended: true 
          }, 
          ...prev
        ]);
      }
    } catch (err) {
      console.error(err);
      setMsg("Error submitting attendance");
    }
  };

  return (
    <div>
      <h2>Monitor Attendance</h2>
      {msg && <p className="info">{msg}</p>}
      <form onSubmit={submitAttendance}>
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} required>
          <option value="">Select Module</option>
          {modules.map(m => (
            <option key={m.code} value={m.code}>{m.name}</option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <button type="submit">Mark Attendance</button>
      </form>

      <h3>Attendance History</h3>
      <table>
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

      <h3>Send Complaint/Report to Principal Lecturer</h3>
      <ComplaintForm user={user} authHeaders={authHeaders} />

      <h3>Your Complaint/Report Responses</h3>
      <ComplaintResponses user={user} authHeaders={authHeaders} />
    </div>
  );
}