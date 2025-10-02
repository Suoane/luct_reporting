import { useState } from "react";
import "./ReportForm.css";

export default function ReportForm({ user, onSubmitted }) {
  const [formData, setFormData] = useState({
    facultyName: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseName: "",
    courseCode: "",
    lecturerName: user?.username || "",
    actualStudents: "",
    totalStudents: "",
    venue: "",
    scheduledTime: "",
    topic: "",
    learningOutcomes: "",
    recommendations: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return setMessage("You must be logged in to submit a report");

    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Report submitted successfully");
        setFormData({
          facultyName: "",
          className: "",
          weekOfReporting: "",
          dateOfLecture: "",
          courseName: "",
          courseCode: "",
          lecturerName: user.username,
          actualStudents: "",
          totalStudents: "",
          venue: "",
          scheduledTime: "",
          topic: "",
          learningOutcomes: "",
          recommendations: "",
        });
        if (onSubmitted) onSubmitted(); // refresh parent data
      } else {
        setMessage(data.message || "Failed to submit report");
      }
    } catch (err) {
      console.error("Report submit error:", err);
      setMessage("Server error. Please try again later.");
    }
  };

  return (
    <div className="report-form-container">
      <h2>Lecturer Reporting Form</h2>
      <form onSubmit={handleSubmit}>
        {Object.keys(formData).map((field) => (
          <div key={field} className="form-group">
            <label>{field}</label>
            {["learningOutcomes", "recommendations"].includes(field) ? (
              <textarea
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
              />
            ) : (
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                readOnly={field === "lecturerName"}
              />
            )}
          </div>
        ))}
        <button type="submit">Submit Report</button>
        {message && (
          <p style={{ color: message.includes("successfully") ? "#4ade80" : "#f87171" }}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
