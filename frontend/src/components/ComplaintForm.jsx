import React, { useEffect, useState } from "react";
import API_BASE_URL from '../config/api';

export default function ComplaintForm({ user, authHeaders }) {
  const [prls, setPrls] = useState([]);
  const [prlId, setPrlId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPRLs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/prls/student/stream`, { 
          headers: authHeaders() 
        });
        const data = await res.json();
        setPrls(data.success && Array.isArray(data.prls) ? data.prls : []);
      } catch (err) {
        console.error("Error fetching PRLs:", err);
        setPrls([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPRLs();
  }, [authHeaders]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prlId || !message) {
      setStatus("Please select a Principal Lecturer and enter your message.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ prl_id: prlId, subject, message })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("Complaint submitted successfully!");
        setPrlId("");
        setSubject("");
        setMessage("");
      } else {
        setStatus(data.message || "Failed to submit complaint");
      }
    } catch (err) {
      console.error("Error submitting complaint:", err);
      setStatus("Error submitting complaint");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2em" }}>
      <label>
        Principal Lecturer:
        <select value={prlId} onChange={e => setPrlId(e.target.value)} required>
          <option value="">Select Principal Lecturer</option>
          {loading && <option disabled>Loading...</option>}
          {!loading && prls.length === 0 && <option disabled>No PRLs available</option>}
          {prls.map(prl => (
            <option key={prl.id} value={prl.id}>{prl.name} {prl.surname}</option>
          ))}
        </select>
        {!loading && prls.length === 0 && (
          <p className="info">No Principal Lecturers found for your stream. Please contact admin.</p>
        )}
      </label>
      <br />
      <label>
        Subject:
        <input 
          type="text" 
          value={subject} 
          onChange={e => setSubject(e.target.value)} 
          placeholder="Subject (optional)" 
        />
      </label>
      <br />
      <label>
        Message:
        <textarea 
          value={message} 
          onChange={e => setMessage(e.target.value)} 
          required 
          placeholder="Describe your complaint or report..." 
          rows="5"
        />
      </label>
      <br />
      <button type="submit">Send Complaint/Report</button>
      {status && <p className="info">{status}</p>}
    </form>
  );
}