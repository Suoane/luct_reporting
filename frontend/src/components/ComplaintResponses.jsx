import React, { useEffect, useState } from "react";
import API_BASE_URL from '../config/api';

export default function ComplaintResponses({ user, authHeaders }) {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports/student/complaints`, { 
          headers: authHeaders() 
        });
        const data = await res.json();
        setResponses(data.complaints || []);
      } catch (err) {
        setResponses([]);
      }
      setLoading(false);
    };
    fetchResponses();
  }, [authHeaders]);

  if (loading) return <p>Loading...</p>;
  if (!responses.length) return <p>No complaints/reports submitted yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Lecturer</th>
          <th>Subject</th>
          <th>Message</th>
          <th>Status</th>
          <th>Reply</th>
        </tr>
      </thead>
      <tbody>
        {responses.map((r, i) => (
          <tr key={i}>
            <td>{r.lecturer_name || r.lecturer_id}</td>
            <td>{r.subject}</td>
            <td>{r.message}</td>
            <td>{r.status}</td>
            <td>{r.reply || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}