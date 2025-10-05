import { useState, useEffect } from "react";
import "./ReportForm.css";

export default function ReportForm({ user, lecturerInfo, onSubmitted }) {
  const [formData, setFormData] = useState({
    facultyName: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseName: "",
    courseCode: "",
    lecturerName: "",
    actualStudents: "",
    totalStudents: "",
    venue: "",
    scheduledTime: "",
    topic: "",
    learningOutcomes: "",
    recommendations: "",
  });

  const [modules, setModules] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill lecturer info when component mounts
  useEffect(() => {
    if (lecturerInfo) {
      setFormData(prev => ({
        ...prev,
        facultyName: lecturerInfo.stream_name || "",
        lecturerName: `${lecturerInfo.name} ${lecturerInfo.surname}`,
        courseName: lecturerInfo.module_name || "",
        courseCode: lecturerInfo.module_code || ""
      }));
    }
  }, [lecturerInfo]);

  // Fetch modules for the lecturer's stream
  useEffect(() => {
    const fetchModules = async () => {
      if (!lecturerInfo?.stream_id) return;
      
      try {
        const res = await fetch(API_BASE_URL + "/api/lecturer/faculties", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.faculties.length > 0) {
          setModules(data.faculties[0].modules || []);
        }
      } catch (err) {
        console.error("Error fetching modules:", err);
      }
    };
    fetchModules();
  }, [user.token, lecturerInfo]);

  // Fetch total students count
useEffect(() => {
  const fetchStudentCount = async () => {
    if (!lecturerInfo?.stream_id) return;
    
    try {
      const res = await fetch(API_BASE_URL + "/api/lecturer/student-count", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          totalStudents: data.total_students.toString()
        }));
      }
    } catch (err) {
      console.error("Error fetching student count:", err);
    }
  };
  fetchStudentCount();
}, [user.token, lecturerInfo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // If selecting a module/course, auto-fill course code
      if (name === 'courseName') {
        const selectedModule = modules.find(m => m.name === value);
        if (selectedModule) {
          newData.courseCode = selectedModule.code;
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage("You must be logged in to submit a report");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(API_BASE_URL + "/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      
      if (data.success) {
        setMessage("Report submitted successfully to Principal Lecturer");
        // Reset only the fields that should be cleared
        setFormData(prev => ({
          ...prev,
          className: "",
          weekOfReporting: "",
          dateOfLecture: "",
          actualStudents: "",
          
          venue: "",
          scheduledTime: "",
          topic: "",
          learningOutcomes: "",
          recommendations: "",
        }));
        if (onSubmitted) onSubmitted(data);
      } else {
        setMessage(data.message || "Failed to submit report");
      }
    } catch (err) {
      console.error("Report submit error:", err);
      setMessage("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-form-container">
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-row">
          <div className="form-group">
            <label>Faculty/Stream Name *</label>
            <input
              type="text"
              name="facultyName"
              value={formData.facultyName}
              onChange={handleChange}
              required
              readOnly
              className="readonly-field"
              title="Auto-filled from your assigned stream"
            />
          </div>

          <div className="form-group">
            <label>Class Name *</label>
            <input
              type="text"
              name="className"
              value={formData.className}
              onChange={handleChange}
              placeholder="e.g., Year 1 Group A"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Week of Reporting *</label>
            <input
              type="text"
              name="weekOfReporting"
              value={formData.weekOfReporting}
              onChange={handleChange}
              placeholder="e.g., Week 1, Week 12"
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Lecture *</label>
            <input
              type="date"
              name="dateOfLecture"
              value={formData.dateOfLecture}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Course/Module Name *</label>
            {modules.length > 0 ? (
              <select
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                required
              >
                <option value="">Select Module</option>
                {modules.map(module => (
                  <option key={module.id} value={module.name}>
                    {module.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="courseName"
                value={formData.courseName}
                onChange={handleChange}
                required
                readOnly={!!lecturerInfo?.module_name}
                className={lecturerInfo?.module_name ? "readonly-field" : ""}
              />
            )}
          </div>

          <div className="form-group">
            <label>Course Code *</label>
            <input
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              required
              readOnly
              className="readonly-field"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label>Lecturer Name *</label>
            <input
              type="text"
              name="lecturerName"
              value={formData.lecturerName}
              readOnly
              required
              className="readonly-field"
              title="Auto-filled from your profile"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Actual Students Present *</label>
            <input
              type="number"
              name="actualStudents"
              value={formData.actualStudents}
              onChange={handleChange}
              min="0"
              placeholder="Number of students who attended"
              required
            />
          </div>

          <div className="form-group">
            <label>Total Registered Students *</label>
            <input
              type="number"
              name="totalStudents"
              value={formData.totalStudents}
              onChange={handleChange}
              min="0"
              readOnly
              className="readonly-field"
              title="Auto-filled from student enrollment data"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Venue of Class *</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              placeholder="e.g., Lab 301, Room B12"
              required
            />
          </div>

          <div className="form-group">
            <label>Scheduled Lecture Time *</label>
            <input
              type="time"
              name="scheduledTime"
              value={formData.scheduledTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label>Topic Taught *</label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            placeholder="Brief description of the topic covered"
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Learning Outcomes of the Topic *</label>
          <textarea
            name="learningOutcomes"
            value={formData.learningOutcomes}
            onChange={handleChange}
            placeholder="What students should be able to do after this lesson..."
            rows="4"
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Lecturer's Recommendations</label>
          <textarea
            name="recommendations"
            value={formData.recommendations}
            onChange={handleChange}
            placeholder="Any recommendations or observations (optional)"
            rows="4"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Report to Principal Lecturer"}
          </button>
        </div>

        {message && (
          <div className={`form-message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}