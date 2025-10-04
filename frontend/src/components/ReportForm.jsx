import { useState, useEffect } from "react";
import "./ReportForm.css";

export default function ReportForm({ user, onSubmitted }) {
  const [formData, setFormData] = useState({
    facultyName: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    moduleName: "",
    moduleCode: "",
    lecturerName: user?.lecturer_info ? `${user.lecturer_info.name} ${user.lecturer_info.surname}` : "",
    actualStudents: "",
    totalStudents: "",
    venue: "",
    scheduledTime: "",
    topic: "",
    learningOutcomes: "",
    recommendations: "",
  });

  const [faculties, setFaculties] = useState([]);
  const [modules, setModules] = useState([]);
  const [message, setMessage] = useState("");

  // Fetch faculties when component mounts
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/lecturer/faculties", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setFaculties(data.faculties || []);
        }
      } catch (err) {
        console.error("Error fetching faculties:", err);
      }
    };
    fetchFaculties();
  }, [user.token]);

  // Set modules when faculty changes
  useEffect(() => {
    if (!formData.facultyName) {
      setModules([]);
      return;
    }
    const selectedFaculty = faculties.find(f => f.name === formData.facultyName);
    if (selectedFaculty) {
      setModules(selectedFaculty.modules || []);
    }
  }, [formData.facultyName, faculties]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      
      // If selecting a module, auto-fill module code
      if (name === 'moduleName') {
        const selectedModule = modules.find(m => m.name === value);
        if (selectedModule) {
          newData.moduleCode = selectedModule.code;
        }
      }
      return newData;
    });
  };

  // Get current week number
  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setFormData(prev => ({
      ...prev,
      dateOfLecture: date,
      weekOfReporting: date ? `Week ${getWeekNumber(date)}` : ''
    }));
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
          moduleName: "",
          moduleCode: "",
          lecturerName: user.username,
          actualStudents: "",
          totalStudents: "",
          venue: "",
          scheduledTime: "",
          topic: "",
          learningOutcomes: "",
          recommendations: "",
        });
        if (onSubmitted) onSubmitted();
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
        <div className="form-group">
          <label>Faculty</label>
          <select
            name="facultyName"
            value={formData.facultyName}
            onChange={handleChange}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map(faculty => (
              <option key={faculty.id} value={faculty.name}>
                {faculty.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Module</label>
          <select
            name="moduleName"
            value={formData.moduleName}
            onChange={handleChange}
            required
            disabled={!formData.facultyName}
          >
            <option value="">Select Module</option>
            {modules.map(module => (
              <option key={`${module.id}-${module.code}`} value={module.name}>
                {module.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Module Code</label>
          <input
            type="text"
            name="moduleCode"
            value={formData.moduleCode}
            readOnly
            required
          />
        </div>

        <div className="form-group">
          <label>Date of Lecture</label>
          <input
            type="date"
            name="dateOfLecture"
            value={formData.dateOfLecture}
            onChange={handleDateChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Week of Reporting</label>
          <input
            type="text"
            name="weekOfReporting"
            value={formData.weekOfReporting}
            readOnly
            required
          />
        </div>

        <div className="form-group">
          <label>Lecturer Name</label>
          <input
            type="text"
            name="lecturerName"
            value={formData.lecturerName}
            readOnly
            required
          />
        </div>

        <div className="form-group">
          <label>Venue</label>
          <input
            type="text"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Scheduled Time</label>
          <input
            type="time"
            name="scheduledTime"
            value={formData.scheduledTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Students Present</label>
          <input
            type="number"
            name="actualStudents"
            value={formData.actualStudents}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Total Students</label>
          <input
            type="number"
            name="totalStudents"
            value={formData.totalStudents}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Topic</label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Learning Outcomes</label>
          <textarea
            name="learningOutcomes"
            value={formData.learningOutcomes}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Recommendations</label>
          <textarea
            name="recommendations"
            value={formData.recommendations}
            onChange={handleChange}
            required
          />
        </div>

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
