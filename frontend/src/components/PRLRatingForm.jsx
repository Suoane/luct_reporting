import React, { useState, useEffect } from "react";
import "./PRLRatingForm.css";

export default function PRLRatingForm({ authHeaders }) {
  const [prl, setPrl] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingPRL, setFetchingPRL] = useState(true);

  const ratingLabels = {
    5: "Excellent Leadership",
    4: "Good Leadership",
    3: "Satisfactory Leadership",
    2: "Needs Improvement",
    1: "Poor Leadership"
  };

  useEffect(() => {
    const fetchPRL = async () => {
      setFetchingPRL(true);
      try {
        const res = await fetch(API_BASE_URL + "/api/lecturer/prl", {
          headers: authHeaders()
        });
        const data = await res.json();
        
        if (data.success && data.prl) {
          setPrl(data.prl);
          setMsg("");
        } else {
          setMsg(data.message || "No Principal Lecturer found for your stream");
          setPrl(null);
        }
      } catch (err) {
        console.error("Error fetching PRL:", err);
        setMsg("Error loading Principal Lecturer information");
        setPrl(null);
      } finally {
        setFetchingPRL(false);
      }
    };
    fetchPRL();
  }, [authHeaders]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comments.trim()) {
      setMsg("Please provide comments with your rating");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL + "/api/ratings/prl", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ rating, comments })
      });

      const data = await res.json();
      
      if (data.success) {
        setMsg("Rating submitted successfully! Thank you for your feedback.");
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

  if (fetchingPRL) {
    return (
      <div className="prl-rating-container">
        <p className="info-message">Loading Principal Lecturer information...</p>
      </div>
    );
  }

  if (!prl) {
    return (
      <div className="prl-rating-container">
        <p className="error-message">{msg || "No Principal Lecturer assigned to your stream"}</p>
      </div>
    );
  }

  return (
    <div className="prl-rating-container">
      <h2>Rate Your Principal Lecturer</h2>
      
      <div className="prl-info">
        <h3>{prl.name} {prl.surname}</h3>
        <p>{prl.stream_name}</p>
      </div>

      {msg && (
        <p className={msg.includes("success") ? "success-message" : "error-message"}>
          {msg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="prl-rating-form">
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
            placeholder="Please provide specific feedback about the Principal Lecturer's performance, leadership, support, and communication..."
            rows="6"
            required
          />
          <small>Be constructive and professional in your feedback</small>
        </div>

        <button type="submit" disabled={loading || !comments.trim()}>
          {loading ? "Submitting..." : "Submit Rating"}
        </button>
      </form>
    </div>
  );
}