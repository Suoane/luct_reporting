import React, { useState, useEffect } from "react";
import "./LecturerRatingForm.css";

export default function LecturerRatingForm({ authHeaders }) {
  const [lecturers, setLecturers] = useState([]);
  const [modules, setModules] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [selectedModule, setSelectedModule] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const ratingLabels = {
    5: "Extremely Satisfactory",
    4: "Very Satisfactory",
    3: "Satisfactory",
    2: "Needs Improvement",
    1: "Unsatisfactory"
  };

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
  }, [authHeaders]);

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
  }, [authHeaders]);

  const handleLecturerChange = (e) => {
    const lecturerUsername = e.target.value;
    const lecturer = lecturers.find(l => l.username === lecturerUsername);
    setSelectedLecturer(lecturer);
    setSelectedModule("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLecturer) {
      setMsg("Please select a lecturer");
      return;
    }

    if (!selectedModule) {
      setMsg("Please select a module");
      return;
    }

    if (!comments.trim()) {
      setMsg("Please provide comments with your rating");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL + "/api/ratings", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          lecturer_username: selectedLecturer.username,
          module_id: selectedModule,
          rating: rating,
          comments: comments
        })
      });

      const data = await res.json();
      
      if (data.success) {
        setMsg("Rating submitted successfully! Thank you for your feedback.");
        setSelectedLecturer(null);
        setSelectedModule("");
        setComments("");
        setRating(5);
      } else {
        setMsg(data.message || "Failed to submit rating");
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setMsg("Server error - please try again");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 5000);
    }
  };

  if (lecturers.length === 0) {
    return (
      <div className="prl-rating-container">
        <p className="info-message">No lecturers found for your stream. Please contact admin.</p>
      </div>
    );
  }

  return (
    <div className="prl-rating-container">
      <h2>Rate Your Lecturer</h2>

      {selectedLecturer && (
        <div className="prl-info">
          <h3>{selectedLecturer.name} {selectedLecturer.surname}</h3>
          <p>Lecturer in your stream</p>
        </div>
      )}

      {msg && (
        <p className={msg.includes("success") ? "success-message" : "error-message"}>
          {msg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="prl-rating-form">
        <div className="form-group">
          <label>Select Lecturer:</label>
          <select
            value={selectedLecturer?.username || ""}
            onChange={handleLecturerChange}
            required
          >
            <option value="">-- Choose a Lecturer --</option>
            {lecturers.map(l => (
              <option key={l.username} value={l.username}>
                {l.name} {l.surname}
              </option>
            ))}
          </select>
        </div>

        {selectedLecturer && (
          <>
            <div className="form-group">
              <label>Select Module:</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                required
              >
                <option value="">-- Choose a Module --</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="rating-selector">
              <label>Your Rating:</label>
              <div className="rating-options">
                {[5, 4, 3, 2, 1].map((value) => (
                  <label key={value} className="rating-option">
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={(e) => setRating(Number(e.target.value))}
                    />
                    <span className={`rating-label ${rating === value ? 'selected' : ''}`}>
                      {value} - {ratingLabels[value]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Comments (Required):</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Please provide specific feedback about the lecturer's teaching, clarity, support, and communication..."
                rows="6"
                required
              />
              <small>Be constructive and professional in your feedback</small>
            </div>

            <button type="submit" disabled={loading || !comments.trim()}>
              {loading ? "Submitting..." : "Submit Rating"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}