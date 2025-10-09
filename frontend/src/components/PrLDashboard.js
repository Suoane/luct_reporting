import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

const PrLDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({
    feedback_text: '',
    rating: 5,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the specific PRL dashboard endpoint
      const response = await api.get('/dashboard/principal-lecturer');
      console.log('Dashboard data:', response.data);
      
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to load dashboard data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = (report) => {
    setSelectedReport(report);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      await api.post(`/reports/${selectedReport.report_id}/feedback`, {
        feedback_text: feedback.feedback_text,
        rating: parseInt(feedback.rating),
      });
      
      alert('Feedback submitted successfully!');
      setShowFeedbackModal(false);
      setSelectedReport(null);
      setFeedback({ feedback_text: '', rating: 5 });
      fetchDashboardData();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(error.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const handleUpdateReportStatus = async (reportId, newStatus) => {
    try {
      await api.patch(`/reports/${reportId}/status`, {
        status: newStatus,
      });
      alert(`Report status updated to ${newStatus}!`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Failed to update report status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading Principal Lecturer Dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-container">
        <div className="error">Failed to load dashboard data</div>
      </div>
    );
  }

  const { stream, courses, lecturers, classes, pendingReports, stats } = dashboardData;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Principal Lecturer Dashboard</h1>
          <p>{stream?.stream_name} ({stream?.stream_code})</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card primary">
          
          <div className="stat-info">
            <h3>{stats?.totalCourses || 0}</h3>
            <p>Stream Courses</p>
          </div>
        </div>
        <div className="stat-card info">
          
          <div className="stat-info">
            <h3>{stats?.totalLecturers || 0}</h3>
            <p>Lecturers</p>
          </div>
        </div>
        <div className="stat-card success">
          
          <div className="stat-info">
            <h3>{stats?.totalClasses || 0}</h3>
            <p>Classes</p>
          </div>
        </div>
        <div className="stat-card warning">
          
          <div className="stat-info">
            <h3>{stats?.pending_reports || 0}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card secondary">
          
          <div className="stat-info">
            <h3>{stats?.total_reports || 0}</h3>
            <p>Total Reports</p>
          </div>
        </div>
        <div className="stat-card info">
          
          <div className="stat-info">
            <h3>{stats?.avgAttendance || 0}%</h3>
            <p>Avg Attendance</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
         Pending Reports ({pendingReports?.length || 0})
        </button>
        <button 
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Courses
        </button>
        <button 
          className={`tab ${activeTab === 'lecturers' ? 'active' : ''}`}
          onClick={() => setActiveTab('lecturers')}
        >
           Lecturers
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="row-layout">
            {/* Stream Info */}
            <div className="section-card">
              <div className="section-header">
                <h2>🎓 Stream Information</h2>
              </div>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Stream:</strong> {stream?.stream_name}
                </div>
                <div className="info-item">
                  <strong>Code:</strong> {stream?.stream_code}
                </div>
                <div className="info-item">
                  <strong>Total Courses:</strong> {courses?.length || 0}
                </div>
                <div className="info-item">
                  <strong>Total Lecturers:</strong> {lecturers?.length || 0}
                </div>
                <div className="info-item">
                  <strong>Total Classes:</strong> {classes?.length || 0}
                </div>
                <div className="info-item">
                  <strong>Feedback Given:</strong> {stats?.myFeedbackCount || 0}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="section-card">
              <div className="section-header">
                <h2> Recent Activity</h2>
              </div>
              <div className="activity-summary">
                <p> {stats?.reviewed_reports || 0} reports reviewed</p>
                <p> {stats?.pending_reports || 0} reports awaiting review</p>
                <p> Average attendance: {stats?.avgAttendance || 0}%</p>
                <p> Your feedback count: {stats?.myFeedbackCount || 0}</p>
              </div>
            </div>
          </div>

          {/* Classes Overview */}
          <div className="section-card">
            <div className="section-header">
              <h2>Classes Overview</h2>
            </div>
            <div className="classes-grid">
              {classes && classes.length > 0 ? (
                classes.map(classItem => (
                  <div key={classItem.class_id} className="class-card">
                    <h4>{classItem.class_name}</h4>
                    <p>👥 {classItem.total_students} students</p>
                    <p className="text-muted">{stream?.stream_code}</p>
                  </div>
                ))
              ) : (
                <p className="no-data">No classes found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending Reports Tab */}
      {activeTab === 'pending' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Reports Pending Review</h2>
            <p className="subtitle">Review and provide feedback for submitted reports</p>
          </div>
          <div className="reports-table">
            {pendingReports && pendingReports.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lecturer</th>
                    <th>Course</th>
                    <th>Class</th>
                    <th>Topic</th>
                    <th>Attendance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReports.map(report => (
                    <tr key={report.report_id}>
                      <td>{formatDate(report.date_of_lecture)}</td>
                      <td>{report.lecturer_name}</td>
                      <td>
                        <strong>{report.course_code}</strong>
                        <br />
                        <small>{report.course_name}</small>
                      </td>
                      <td>{report.class_name}</td>
                      <td className="topic-cell">{report.topic_taught}</td>
                      <td>
                        <div className="attendance-info">
                          {report.actual_students_present}/{report.total_registered_students}
                          <span className="percentage">
                            ({Math.round((report.actual_students_present / report.total_registered_students) * 100)}%)
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => handleReviewReport(report)}
                          >
                            Review
                          </button>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate(`/reports/${report.report_id}`)}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No pending reports to review. Great job!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Stream Courses</h2>
          </div>
          <div className="courses-grid">
            {courses && courses.length > 0 ? (
              courses.map(course => (
                <div key={course.course_id} className="course-card">
                  <div className="course-header">
                    <span className="course-code">{course.course_code}</span>
                    <span className="badge badge-info">{stream?.stream_code}</span>
                  </div>
                  <h4>{course.course_name}</h4>
                  <div className="course-meta">
                    {course.lecturer_name ? (
                      <p>{course.lecturer_name}</p>
                    ) : (
                      <p className="text-warning">No lecturer assigned</p>
                    )}
                    {course.lecturer_email && (
                      <p className="text-muted">{course.lecturer_email}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No courses in this stream.</p>
            )}
          </div>
        </div>
      )}

      {/* Lecturers Tab */}
      {activeTab === 'lecturers' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Lecturers in {stream?.stream_name}</h2>
          </div>
          <div className="lecturers-table">
            {lecturers && lecturers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Assigned Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturers.map(lecturer => {
                    const lecturerCourses = courses?.filter(c => c.lecturer_id === lecturer.user_id) || [];
                    
                    return (
                      <tr key={lecturer.user_id}>
                        <td><strong>{lecturer.full_name}</strong></td>
                        <td>{lecturer.email}</td>
                        <td>
                          {lecturerCourses.length > 0 ? (
                            <div className="courses-list">
                              {lecturerCourses.map(c => (
                                <span key={c.course_id} className="badge badge-info">
                                  {c.course_code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">No courses assigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No lecturers found in this stream.</p>
            )}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedReport && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Report</h2>
              <button 
                className="close-btn"
                onClick={() => setShowFeedbackModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="report-summary">
              <p><strong>Lecturer:</strong> {selectedReport.lecturer_name}</p>
              <p><strong>Course:</strong> {selectedReport.course_code} - {selectedReport.course_name}</p>
              <p><strong>Class:</strong> {selectedReport.class_name}</p>
              <p><strong>Topic:</strong> {selectedReport.topic_taught}</p>
              <p><strong>Date:</strong> {formatDate(selectedReport.date_of_lecture)}</p>
              <p><strong>Attendance:</strong> {selectedReport.actual_students_present}/{selectedReport.total_registered_students} ({Math.round((selectedReport.actual_students_present / selectedReport.total_registered_students) * 100)}%)</p>
            </div>

            <form onSubmit={handleSubmitFeedback}>
              <div className="form-group">
                <label>Feedback *</label>
                <textarea
                  value={feedback.feedback_text}
                  onChange={(e) => setFeedback({...feedback, feedback_text: e.target.value})}
                  required
                  rows="5"
                  placeholder="Provide constructive feedback on the lecture delivery, content coverage, and recommendations..."
                />
              </div>
              <div className="form-group">
                <label>Rating (1-5) *</label>
                <select
                  value={feedback.rating}
                  onChange={(e) => setFeedback({...feedback, rating: e.target.value})}
                  required
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Good</option>
                  <option value="2">2 - Needs Improvement</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrLDashboard;