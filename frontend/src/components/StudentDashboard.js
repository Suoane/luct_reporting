import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    attendanceRate: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user profile
      const profileRes = await api.get('/auth/profile');
      setUser(profileRes.data.user);

      // Get stream-specific courses
      const coursesRes = await api.get(`/courses?stream_id=${profileRes.data.user.stream_id}`);
      setCourses(coursesRes.data.courses || coursesRes.data);

      // Get classes
      const classesRes = await api.get(`/classes?stream_id=${profileRes.data.user.stream_id}`);
      setClasses(classesRes.data.classes || classesRes.data);

      // Get recent reports for monitoring
      const reportsRes = await api.get('/reports/recent');
      setRecentReports(reportsRes.data.reports?.slice(0, 10) || reportsRes.data.slice(0, 10));

      // Calculate stats
      setStats({
        totalCourses: coursesRes.data.courses?.length || coursesRes.data.length || 0,
        totalClasses: classesRes.data.classes?.length || classesRes.data.length || 0,
        attendanceRate: 85, // This would be calculated from actual attendance data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading Student Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.full_name}!</h1>
          <p>{user?.stream_name} Student</p>
        </div>
        <div className="user-badge">
          <span className="badge badge-primary">{user?.stream_code}</span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card primary">
          
          <div className="stat-info">
            <h3>{stats.totalCourses}</h3>
            <p>Enrolled Courses</p>
          </div>
        </div>
        <div className="stat-card success">
          
          <div className="stat-info">
            <h3>{stats.totalClasses}</h3>
            <p>Classes</p>
          </div>
        </div>
        <div className="stat-card info">
          
          <div className="stat-info">
            <h3>{stats.attendanceRate}%</h3>
            <p>Attendance Rate</p>
          </div>
        </div>
        <div className="stat-card warning">
         
          <div className="stat-info">
            <h3>{recentReports.length}</h3>
            <p>Recent Reports</p>
          </div>
        </div>
      </div>

      {/* My Courses */}
      <div className="section-card">
        <div className="section-header">
          <h2>My Courses</h2>
        </div>
        <div className="courses-grid">
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course.course_id} className="course-card">
                <div className="course-header">
                  <span className="course-code">{course.course_code}</span>
                  <span className="badge badge-info">{user?.stream_code}</span>
                </div>
                <h3>{course.course_name}</h3>
                <div className="course-info">
                  <p>{course.lecturer_name || 'TBA'}</p>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/courses/${course.course_id}`)}
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <p className="no-data">No courses found for your stream.</p>
          )}
        </div>
      </div>

      {/* My Classes */}
      <div className="section-card">
        <div className="section-header">
          <h2>My Classes</h2>
        </div>
        <div className="classes-grid">
          {classes.length > 0 ? (
            classes.map(classItem => (
              <div key={classItem.class_id} className="class-card">
                <h3>{classItem.class_name}</h3>
                <div className="class-info">
                  <p>{classItem.total_students} students</p>
                  <p>{user?.stream_name}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No classes found.</p>
          )}
        </div>
      </div>

      {/* Recent Lecture Reports (Monitoring) */}
      <div className="section-card">
        <div className="section-header">
          <h2>Recent Lecture Reports</h2>
          <p className="subtitle">Monitor your lecturers' activities</p>
        </div>
        <div className="reports-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Lecturer</th>
                <th>Topic</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentReports.length > 0 ? (
                recentReports.map(report => (
                  <tr key={report.report_id}>
                    <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                    <td>
                      <strong>{report.course_code}</strong>
                      <br />
                      <small>{report.course_name}</small>
                    </td>
                    <td>{report.lecturer_name}</td>
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
                      <span className={`badge badge-${
                        report.status === 'approved' ? 'success' : 
                        report.status === 'reviewed' ? 'warning' : 'secondary'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No reports available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/monitoring')}
          >
            
            <span>Monitoring</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/rating')}
          >
            
            <span>Rate Lectures</span>
          </button>
          <button 
            className="action-card"
            onClick={() => navigate('/profile')}
          >
            <span className="action-icon">👤</span>
            <span>My Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;