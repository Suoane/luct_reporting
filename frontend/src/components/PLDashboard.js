import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, streamsAPI, coursesAPI } from '../api';
import './Dashboard.css';

const PLDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedStream, setSelectedStream] = useState('all');
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_name: '',
    course_code: '',
    stream_id: '',
    lecturer_id: '',
  });
  const [newStream, setNewStream] = useState({
    stream_name: '',
    stream_code: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data
      const dashboardResponse = await dashboardAPI.getProgramLeaderDashboard();
      console.log('Dashboard data:', dashboardResponse.data);
      
      // Fetch detailed stream data with lecturers and courses
      const streamsResponse = await streamsAPI.getAll();
      console.log('Streams data:', streamsResponse.data);
      
      // Fetch all courses
      const coursesResponse = await coursesAPI.getAll();
      console.log('Courses data:', coursesResponse.data);
      
      // Combine the data
      const combinedData = {
        streams: dashboardResponse.data.streams || [],
        recentReports: dashboardResponse.data.recentReports || [],
        reportsByStream: dashboardResponse.data.reportsByStream || [],
        stats: dashboardResponse.data.stats || {},
        streamsWithDetails: streamsResponse.data.streams || [],
        allCourses: coursesResponse.data.courses || [],
      };
      
      console.log('Combined data:', combinedData);
      
      setDashboardData(combinedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to load dashboard data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await coursesAPI.create({
        course_name: newCourse.course_name,
        course_code: newCourse.course_code,
        stream_id: parseInt(newCourse.stream_id),
        lecturer_id: newCourse.lecturer_id ? parseInt(newCourse.lecturer_id) : null,
      });
      alert('✅ Course added successfully!');
      setShowAddCourseModal(false);
      setNewCourse({
        course_name: '',
        course_code: '',
        stream_id: '',
        lecturer_id: '',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding course:', error);
      alert(error.response?.data?.message || 'Failed to add course');
    }
  };

  const handleAddStream = async (e) => {
    e.preventDefault();
    try {
      await streamsAPI.create({
        stream_name: newStream.stream_name,
        stream_code: newStream.stream_code,
      });
      alert('✅ Stream added successfully!');
      setShowAddStreamModal(false);
      setNewStream({
        stream_name: '',
        stream_code: '',
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding stream:', error);
      alert(error.response?.data?.message || 'Failed to add stream');
    }
  };

  const handleAssignLecturer = async (courseId, lecturerId) => {
    if (!lecturerId) return;
    
    try {
      await coursesAPI.assignLecturer(courseId, parseInt(lecturerId));
      alert('✅ Lecturer assigned successfully!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error assigning lecturer:', error);
      alert(error.response?.data?.message || 'Failed to assign lecturer');
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
        <div className="loading">Loading Program Leader Dashboard...</div>
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

  const { streams, recentReports, reportsByStream, stats, streamsWithDetails, allCourses } = dashboardData;

  // Get all lecturers from all streams
  const allLecturers = streamsWithDetails?.flatMap(stream => {
    // Get lecturers for this stream from allCourses
    const streamCourses = allCourses.filter(c => c.stream_id === stream.stream_id);
    const lecturerMap = new Map();
    
    streamCourses.forEach(course => {
      if (course.lecturer_id && course.lecturer_name) {
        lecturerMap.set(course.lecturer_id, {
          user_id: course.lecturer_id,
          full_name: course.lecturer_name,
          email: course.lecturer_email,
          stream_id: course.stream_id,
          stream_code: course.stream_code,
        });
      }
    });
    
    return Array.from(lecturerMap.values());
  }) || [];

  const filteredCourses = selectedStream === 'all' 
    ? allCourses 
    : allCourses.filter(c => c.stream_id === parseInt(selectedStream));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📊 Program Leader Dashboard</h1>
          <p>Overall Management & Administration</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowAddStreamModal(true)}
          >
            ➕ Add Stream
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddCourseModal(true)}
          >
            ➕ Add Course
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-info">
            <h3>{stats?.totalStreams || 0}</h3>
            <p>Academic Streams</p>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-info">
            <h3>{stats?.totalCourses || 0}</h3>
            <p>Total Courses</p>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-info">
            <h3>{stats?.usersByRole?.lecturer || 0}</h3>
            <p>Active Lecturers</p>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-info">
            <h3>{stats?.total_reports || 0}</h3>
            <p>Total Reports</p>
          </div>
        </div>
        <div className="stat-card secondary">
          <div className="stat-info">
            <h3>{stats?.usersByRole?.student || 0}</h3>
            <p>Total Students</p>
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
          className={`tab ${activeTab === 'streams' ? 'active' : ''}`}
          onClick={() => setActiveTab('streams')}
        >
          Streams
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
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="row-layout">
            <div className="section-card">
              <div className="section-header">
                <h2>System Overview</h2>
              </div>
              <div className="overview-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Streams:</span>
                  <span className="stat-value">{stats?.totalStreams || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Courses:</span>
                  <span className="stat-value">{stats?.totalCourses || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Classes:</span>
                  <span className="stat-value">{stats?.totalClasses || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Lecturers:</span>
                  <span className="stat-value">{stats?.usersByRole?.lecturer || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Principal Lecturers:</span>
                  <span className="stat-value">{stats?.usersByRole?.principal_lecturer || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Students:</span>
                  <span className="stat-value">{stats?.usersByRole?.student || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending Reports:</span>
                  <span className="stat-value">{stats?.pending_reports || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Attendance:</span>
                  <span className="stat-value">{stats?.avgAttendance || 0}%</span>
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-header">
                <h2>Reports by Stream</h2>
              </div>
              <div className="stream-reports">
                {reportsByStream && reportsByStream.length > 0 ? (
                  reportsByStream.map(item => (
                    <div key={item.stream_code} className="stream-report-item">
                      <div className="stream-info">
                        <strong>{item.stream_code}</strong>
                        <span className="text-muted">{item.stream_name}</span>
                      </div>
                      <span className="badge badge-info">{item.report_count} reports</span>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No report data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streams Tab */}
      {activeTab === 'streams' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Academic Streams</h2>
          </div>
          <div className="streams-grid">
            {streamsWithDetails && streamsWithDetails.length > 0 ? (
              streamsWithDetails.map(stream => (
                <div key={stream.stream_id} className="stream-card">
                  <div className="stream-header">
                    <h3>{stream.stream_name}</h3>
                    <span className="stream-code">{stream.stream_code}</span>
                  </div>
                  <div className="stream-stats">
                    <p>{stream.total_courses || 0} Courses</p>
                    <p>{stream.total_classes || 0} Classes</p>
                    <p>{stream.total_lecturers || 0} Lecturers</p>
                  </div>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedStream(stream.stream_id.toString());
                      setActiveTab('courses');
                    }}
                  >
                    View Courses →
                  </button>
                </div>
              ))
            ) : (
              <p className="no-data">No streams found</p>
            )}
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="tab-content">
          <div className="content-header">
            <h2>Course Management</h2>
            <div className="header-actions">
              <select 
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Streams</option>
                {streamsWithDetails?.map(stream => (
                  <option key={stream.stream_id} value={stream.stream_id}>
                    {stream.stream_code} - {stream.stream_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="courses-table">
            {filteredCourses.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Stream</th>
                    <th>Assigned Lecturer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(course => {
                    const streamLecturers = allLecturers.filter(l => l.stream_id === course.stream_id);
                    
                    return (
                      <tr key={course.course_id}>
                        <td><strong>{course.course_code}</strong></td>
                        <td>{course.course_name}</td>
                        <td>
                          <span className="badge badge-info">
                            {course.stream_code}
                          </span>
                        </td>
                        <td>
                          {course.lecturer_name ? (
                            <span className="lecturer-name">
                              {course.lecturer_name}
                            </span>
                          ) : (
                            <select
                              className="lecturer-select"
                              onChange={(e) => handleAssignLecturer(course.course_id, e.target.value)}
                              defaultValue=""
                            >
                              <option value="">Assign Lecturer...</option>
                              {streamLecturers.map(lecturer => (
                                <option key={lecturer.user_id} value={lecturer.user_id}>
                                  {lecturer.full_name}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate(`/courses/${course.course_id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <p>No courses found for selected stream.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lecturers Tab */}
      {activeTab === 'lecturers' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Lecturer Management</h2>
          </div>
          <div className="lecturers-table">
            {allLecturers.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Stream</th>
                    <th>Assigned Courses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allLecturers.map(lecturer => {
                    const lecturerCourses = allCourses.filter(c => c.lecturer_id === lecturer.user_id);
                    
                    return (
                      <tr key={lecturer.user_id}>
                        <td><strong>{lecturer.full_name}</strong></td>
                        <td>{lecturer.email}</td>
                        <td>
                          <span className="badge badge-info">
                            {lecturer.stream_code}
                          </span>
                        </td>
                        <td>
                          {lecturerCourses.length > 0 ? (
                            <div className="courses-list">
                              {lecturerCourses.map(c => (
                                <span key={c.course_id} className="badge badge-secondary">
                                  {c.course_code}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">No courses assigned</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate(`/users/${lecturer.user_id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No lecturers found</p>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="tab-content">
          <div className="section-header">
            <h2>Recent Reports</h2>
          </div>
          <div className="reports-table">
            {recentReports && recentReports.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Stream</th>
                    <th>Lecturer</th>
                    <th>Course</th>
                    <th>Class</th>
                    <th>Topic</th>
                    <th>Attendance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(report => (
                    <tr key={report.report_id}>
                      <td>{formatDate(report.date_of_lecture)}</td>
                      <td>
                        <span className="badge badge-info">{report.stream_code}</span>
                      </td>
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
                        <span className={`badge badge-${
                          report.status === 'approved' ? 'success' : 
                          report.status === 'reviewed' ? 'warning' : 'secondary'
                        }`}>
                          {report.status}
                        </span>
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
                <p>No reports found. Reports will appear here once lecturers submit them.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Stream Modal */}
      {showAddStreamModal && (
        <div className="modal-overlay" onClick={() => setShowAddStreamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Stream</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddStreamModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddStream}>
              <div className="form-group">
                <label>Stream Name *</label>
                <input
                  type="text"
                  value={newStream.stream_name}
                  onChange={(e) => setNewStream({...newStream, stream_name: e.target.value})}
                  required
                  placeholder="e.g., Information Systems"
                />
              </div>
              <div className="form-group">
                <label>Stream Code *</label>
                <input
                  type="text"
                  value={newStream.stream_code}
                  onChange={(e) => setNewStream({...newStream, stream_code: e.target.value})}
                  required
                  placeholder="e.g., IS"
                  maxLength="4"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddStreamModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourseModal && (
        <div className="modal-overlay" onClick={() => setShowAddCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Course</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddCourseModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCourse}>
              <div className="form-group">
                <label>Course Name *</label>
                <input
                  type="text"
                  value={newCourse.course_name}
                  onChange={(e) => setNewCourse({...newCourse, course_name: e.target.value})}
                  required
                  placeholder="e.g., Database Management Systems"
                />
              </div>
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  value={newCourse.course_code}
                  onChange={(e) => setNewCourse({...newCourse, course_code: e.target.value})}
                  required
                  placeholder="e.g., IS301"
                />
              </div>
              <div className="form-group">
                <label>Stream *</label>
                <select
                  value={newCourse.stream_id}
                  onChange={(e) => setNewCourse({...newCourse, stream_id: e.target.value, lecturer_id: ''})}
                  required
                >
                  <option value="">Select Stream...</option>
                  {streamsWithDetails?.map(stream => (
                    <option key={stream.stream_id} value={stream.stream_id}>
                      {stream.stream_code} - {stream.stream_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assign Lecturer (Optional)</label>
                <select
                  value={newCourse.lecturer_id}
                  onChange={(e) => setNewCourse({...newCourse, lecturer_id: e.target.value})}
                  disabled={!newCourse.stream_id}
                >
                  <option value="">Assign Later...</option>
                  {allLecturers
                    .filter(l => !newCourse.stream_id || l.stream_id === parseInt(newCourse.stream_id))
                    .map(lecturer => (
                      <option key={lecturer.user_id} value={lecturer.user_id}>
                        {lecturer.full_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddCourseModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PLDashboard;