import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import "./Dashboard.css";

const LectureReport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    course_id: '',
    class_id: '',
    week_of_reporting: '',
    date_of_lecture: '',
    venue: '',
    scheduled_time: '',
    topic_taught: '',
    learning_outcomes: '',
    actual_students_present: '',
    recommendations: ''
  });

  // Dropdown data
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [totalRegistered, setTotalRegistered] = useState(0);

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCourses();
    fetchClasses();
  }, [token, navigate]);

  // Fetch courses assigned to this lecturer
  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      const coursesData = response.data.courses || response.data || [];
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    }
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      const classesData = response.data.classes || response.data || [];
      setClasses(classesData);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes');
    }
  };

  // Handle class selection to get total students
  const handleClassChange = (e) => {
    const classId = e.target.value;
    setFormData({ ...formData, class_id: classId });
    
    const selectedClass = classes.find(c => c.class_id === parseInt(classId));
    if (selectedClass) {
      setTotalRegistered(selectedClass.total_students);
    }
  };

  // Handle course selection
  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setFormData({ ...formData, course_id: courseId });
    
    const course = courses.find(c => c.course_id === parseInt(courseId));
    setSelectedCourse(course);
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.course_id || !formData.class_id) {
      setError('Please select both course and class');
      setLoading(false);
      return;
    }

    if (parseInt(formData.actual_students_present) > totalRegistered) {
      setError('Students present cannot exceed total registered students');
      setLoading(false);
      return;
    }

    try {
      const reportData = {
        ...formData,
        total_registered_students: totalRegistered,
        course_id: parseInt(formData.course_id),
        class_id: parseInt(formData.class_id),
        week_of_reporting: parseInt(formData.week_of_reporting),
        actual_students_present: parseInt(formData.actual_students_present)
      };

      const response = await api.post('/reports', reportData);

      setSuccess('Report submitted successfully!');
      
      // Reset form and redirect after 2 seconds
      setTimeout(() => {
        navigate('/lecturer-dashboard');
      }, 2000);

    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '900px' }}>
        <div className="card-header">
          <h2>Submit Lecture Report</h2>
          <p className="auth-subtitle">LUCT Faculty Reporting System</p>
        </div>

        {error && <div className="error-message"> {error}</div>}
        {success && <div className="success-message"> {success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Faculty & Lecturer Info */}
          <div className="form-section">
            <h3 className="section-title">Lecturer Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Faculty Name</label>
                <input
                  type="text"
                  value={user?.full_name || ''}
                  disabled
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Stream</label>
                <input
                  type="text"
                  value={user?.stream_name || 'N/A'}
                  disabled
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Course & Class Selection */}
          <div className="form-section">
            <h3 className="section-title"> ourse & Class Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Course Name *</label>
                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleCourseChange}
                  required
                  className="form-control"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course Code</label>
                <input
                  type="text"
                  value={selectedCourse?.course_code || ''}
                  disabled
                  className="form-control"
                  placeholder="Auto-filled"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Class Name *</label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleClassChange}
                  required
                  className="form-control"
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} - {cls.stream_name} ({cls.total_students} students)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Week of Reporting *</label>
                <input
                  type="number"
                  name="week_of_reporting"
                  value={formData.week_of_reporting}
                  onChange={handleChange}
                  min="1"
                  max="52"
                  required
                  className="form-control"
                  placeholder="1-52"
                />
              </div>
            </div>
          </div>

          {/* Lecture Details */}
          <div className="form-section">
            <h3 className="section-title">Lecture Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Lecture *</label>
                <input
                  type="date"
                  name="date_of_lecture"
                  value={formData.date_of_lecture}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Scheduled Time *</label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Venue *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  className="form-control"
                  placeholder="e.g., Lab A101, Room B203"
                />
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="form-section">
            <h3 className="section-title">👥 Attendance</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Students Present *</label>
                <input
                  type="number"
                  name="actual_students_present"
                  value={formData.actual_students_present}
                  onChange={handleChange}
                  min="0"
                  max={totalRegistered || 999}
                  required
                  className="form-control"
                  placeholder="Number of students present"
                />
              </div>

              <div className="form-group">
                <label>Total Registered Students</label>
                <input
                  type="number"
                  value={totalRegistered}
                  disabled
                  className="form-control"
                  placeholder="Select a class first"
                />
              </div>
            </div>
          </div>

          {/* Academic Content */}
          <div className="form-section">
            <h3 className="section-title">Academic Content</h3>
            <div className="form-group">
              <label>Topic Taught *</label>
              <textarea
                name="topic_taught"
                value={formData.topic_taught}
                onChange={handleChange}
                required
                className="form-control"
                rows="3"
                placeholder="Describe the topic covered in this lecture"
              />
            </div>

            <div className="form-group">
              <label>Learning Outcomes *</label>
              <textarea
                name="learning_outcomes"
                value={formData.learning_outcomes}
                onChange={handleChange}
                required
                className="form-control"
                rows="3"
                placeholder="What should students be able to do after this lecture?"
              />
            </div>

            <div className="form-group">
              <label>Recommendations (Optional)</label>
              <textarea
                name="recommendations"
                value={formData.recommendations}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Any recommendations or observations"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/lecturer-dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '⏳ Submitting...' : ' Submit Report'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .form-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #667eea;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
        }

        .form-control {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-control:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          color: #666;
        }

        textarea.form-control {
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 2px solid #eee;
        }

        .btn-primary, .btn-secondary {
          padding: 0.875rem 2.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background-color: #f5f5f5;
          color: #333;
          border: 2px solid #ddd;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #e0e0e0;
        }

        .btn-primary:disabled, .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #c33;
          font-weight: 500;
        }

        .success-message {
          background-color: #efe;
          color: #2a7f2a;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border-left: 4px solid #2a7f2a;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default LectureReport;