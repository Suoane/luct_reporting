import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsAPI } from '../api'; // Use the API helper
import "./Dashboard.css";

const ReportsList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [token, navigate]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getMyReports(); // Use API helper
      setReports(response.data.reports || []);
      setError('');
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const response = await reportsAPI.getById(reportId);
      setSelectedReport(response.data.report);
    } catch (err) {
      console.error('Error fetching report details:', err);
      alert('Failed to load report details');
    }
  };

  const handleCloseModal = () => {
    setSelectedReport(null);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      await reportsAPI.delete(reportId);
      setReports(reports.filter(r => r.report_id !== reportId));
      setSelectedReport(null);
      alert('Report deleted successfully');
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report');
    }
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.topic_taught?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.class_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: '#ffa500', text: 'Pending' },
      reviewed: { color: '#17a2b8', text: 'Reviewed' },
      approved: { color: '#28a745', text: 'Approved' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 My Lecture Reports</h1>
        <button 
          className="btn-primary"
          onClick={() => navigate('/submit-report')}
        >
          + New Report
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Search and Filter */}
      <div className="reports-controls">
        <input
          type="text"
          placeholder="🔍 Search by course, topic, or class..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {/* Reports Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffa500' }}>
            {reports.filter(r => r.status === 'pending').length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#17a2b8' }}>
            {reports.filter(r => r.status === 'reviewed').length}
          </div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>
            {reports.filter(r => r.status === 'approved').length}
          </div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <div className="empty-state">
          <p>📝 No reports found</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/submit-report')}
          >
            Submit Your First Report
          </button>
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Course</th>
                <th>Class</th>
                <th>Week</th>
                <th>Topic</th>
                <th>Attendance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => {
                const badge = getStatusBadge(report.status);
                const attendanceRate = ((report.actual_students_present / report.total_registered_students) * 100).toFixed(0);
                
                return (
                  <tr key={report.report_id}>
                    <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                    <td>
                      <div className="course-cell">
                        <strong>{report.course_code}</strong>
                        <small>{report.course_name}</small>
                      </div>
                    </td>
                    <td>{report.class_name}</td>
                    <td>Week {report.week_of_reporting}</td>
                    <td className="topic-cell">{report.topic_taught}</td>
                    <td>
                      <div className="attendance-cell">
                        <span>{report.actual_students_present}/{report.total_registered_students}</span>
                        <small>({attendanceRate}%)</small>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: badge.color }}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-view"
                          onClick={() => handleViewReport(report.report_id)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        {report.status === 'pending' && (
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteReport(report.report_id)}
                            title="Delete Report"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report Details</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Course:</label>
                  <span>{selectedReport.course_code} - {selectedReport.course_name}</span>
                </div>
                
                <div className="detail-item">
                  <label>Class:</label>
                  <span>{selectedReport.class_name}</span>
                </div>
                
                <div className="detail-item">
                  <label>Week:</label>
                  <span>Week {selectedReport.week_of_reporting}</span>
                </div>
                
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{new Date(selectedReport.date_of_lecture).toLocaleDateString()}</span>
                </div>
                
                <div className="detail-item">
                  <label>Time:</label>
                  <span>{selectedReport.scheduled_time}</span>
                </div>
                
                <div className="detail-item">
                  <label>Venue:</label>
                  <span>{selectedReport.venue}</span>
                </div>
                
                <div className="detail-item">
                  <label>Attendance:</label>
                  <span>
                    {selectedReport.actual_students_present} / {selectedReport.total_registered_students} students
                  </span>
                </div>
                
                <div className="detail-item">
                  <label>Status:</label>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadge(selectedReport.status).color }}
                  >
                    {getStatusBadge(selectedReport.status).text}
                  </span>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Topic Taught</h3>
                <p>{selectedReport.topic_taught}</p>
              </div>
              
              <div className="detail-section">
                <h3>Learning Outcomes</h3>
                <p>{selectedReport.learning_outcomes}</p>
              </div>
              
              {selectedReport.recommendations && (
                <div className="detail-section">
                  <h3>Recommendations</h3>
                  <p>{selectedReport.recommendations}</p>
                </div>
              )}

              {selectedReport.feedback && selectedReport.feedback.length > 0 && (
                <div className="detail-section feedback-section">
                  <h3>Feedback from Principal Lecturer</h3>
                  {selectedReport.feedback.map((fb, index) => (
                    <div key={index} className="feedback-item">
                      <div className="feedback-header">
                        <strong>{fb.prl_name}</strong>
                        <small>{new Date(fb.created_at).toLocaleString()}</small>
                      </div>
                      {fb.rating && (
                        <div className="rating">
                          {'⭐'.repeat(fb.rating)}
                        </div>
                      )}
                      <p>{fb.feedback_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .reports-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .reports-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .reports-header h1 {
          margin: 0;
          color: #333;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .reports-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .search-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .filter-select {
          padding: 0.75rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          min-width: 150px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #667eea;
        }

        .stat-label {
          color: #666;
          margin-top: 0.5rem;
        }

        .reports-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .reports-table {
          width: 100%;
          border-collapse: collapse;
        }

        .reports-table th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem;
          text-align: left;
          font-weight: 600;
        }

        .reports-table td {
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }

        .reports-table tbody tr:hover {
          background-color: #f8f9fa;
        }

        .course-cell {
          display: flex;
          flex-direction: column;
        }

        .course-cell strong {
          color: #333;
        }

        .course-cell small {
          color: #666;
          font-size: 0.85rem;
        }

        .topic-cell {
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .attendance-cell {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          display: inline-block;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-view, .btn-delete {
          padding: 0.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1.2rem;
          transition: transform 0.2s;
        }

        .btn-view:hover, .btn-delete:hover {
          transform: scale(1.2);
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .empty-state p {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 1rem;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 2rem;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px 16px 0 0;
        }

        .modal-header h2 {
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          line-height: 1;
        }

        .modal-body {
          padding: 2rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-item label {
          font-weight: 600;
          color: #666;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        .detail-item span {
          color: #333;
          font-size: 1rem;
        }

        .detail-section {
          margin-bottom: 1.5rem;
        }

        .detail-section h3 {
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .detail-section p {
          color: #333;
          line-height: 1.6;
        }

        .feedback-section {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
        }

        .feedback-item {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .rating {
          margin: 0.5rem 0;
          color: #ffa500;
        }

        .modal-footer {
          padding: 1rem 2rem;
          border-top: 1px solid #eee;
          display: flex;
          justify-content: flex-end;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .reports-container {
            padding: 1rem;
          }

          .reports-header {
            flex-direction: column;
            gap: 1rem;
          }

          .reports-controls {
            flex-direction: column;
          }

          .reports-table-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportsList;