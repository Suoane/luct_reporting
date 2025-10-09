import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

const LecturerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the specific lecturer dashboard endpoint
      const response = await api.get('/dashboard/lecturer');
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

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
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
        <div className="loading">Loading Lecturer Dashboard...</div>
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

  const { courses, classes, recentReports, stats } = dashboardData;

  // Get user from localStorage as fallback
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.full_name}!</h1>
          <p>Lecturer - {user?.stream_name || 'N/A'}</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/lecturer/report/new')}
        >
          New Report
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card primary">
          
          <div className="stat-info">
            <h3>{stats?.totalCourses || 0}</h3>
            <p>My Courses</p>
          </div>
        </div>
        <div className="stat-card success">
          
          <div className="stat-info">
            <h3>{stats?.total_reports || 0}</h3>
            <p>Total Reports</p>
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
            <h3>{stats?.reviewed_reports || 0}</h3>
            <p>Reviewed</p>
          </div>
        </div>
        <div className="stat-card info">
          
          <div className="stat-info">
            <h3>{stats?.approved_reports || 0}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card info">
          
          <div className="stat-info">
            <h3>{stats?.avgAttendanceRate || 0}%</h3>
            <p>Avg Attendance</p>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="section-card">
        <div className="section-header">
          <h2>My Courses</h2>
        </div>
        <div className="courses-grid">
          {courses && courses.length > 0 ? (
            courses.map(course => (
              <div key={course.course_id} className="course-card">
                <div className="course-header">
                  <span className="course-code">{course.course_code}</span>
                  <span className="badge badge-info">{course.stream_code}</span>
                </div>
                <h3>{course.course_name}</h3>
                <div className="course-info">
                  <p>🎓 {course.stream_name}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No courses assigned yet.</p>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="section-card">
        <div className="section-header">
          <h2>My Recent Reports</h2>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/lecturer/reports')}
          >
            View All
          </button>
        </div>
        <div className="reports-table">
          {recentReports && recentReports.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Class</th>
                  <th>Topic</th>
                  <th>Week</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Feedback</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map(report => (
                  <tr key={report.report_id}>
                    <td>{formatDate(report.date_of_lecture)}</td>
                    <td>
                      <strong>{report.course_code}</strong>
                      <br />
                      <small>{report.course_name}</small>
                    </td>
                    <td>{report.class_name}</td>
                    <td className="topic-cell">{report.topic_taught}</td>
                    <td>Week {report.week_of_reporting}</td>
                    <td>
                      <div className="attendance-info">
                        {report.actual_students_present}/{report.total_registered_students}
                        <span className="percentage">
                          ({Math.round((report.actual_students_present / report.total_registered_students) * 100)}%)
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        report.status === 'approved' ? 'success' : 
                        report.status === 'reviewed' ? 'warning' : 'secondary'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      {report.feedback_count > 0 ? (
                        <span className="badge badge-info">{report.feedback_count} </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/reports/${report.report_id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <p>📭 No reports submitted yet.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/lecturer/report/new')}
              >
                Create Your First Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* My Classes */}
      {classes && classes.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2>My Classes</h2>
          </div>
          <div className="classes-grid">
            {classes.map(classItem => (
              <div key={classItem.class_id} className="class-card">
                <h4>{classItem.class_name}</h4>
                <p>👥 {classItem.total_students} students</p>
                <p className="text-muted">{classItem.stream_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/lecturer/report/new')}
          >
           
            <span>New Report</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/lecturer/reports')}
          >
            
            <span>My Reports</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/lecturer/courses')}
          >
            
            <span>My Courses</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/profile')}
          >
            <span className="action-icon">👤</span>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;