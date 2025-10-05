import React, { useState, useEffect, useCallback } from "react";
import ReportForm from "./ReportForm";
import PRLRatingForm from "./PRLRatingForm";
import API_BASE_URL from '../config/api';
import "./LecturerPage.css";

export default function LecturerPage({ user }) {
  const [activeTab, setActiveTab] = useState('classes');
  const [reports, setReports] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [lecturerInfo, setLecturerInfo] = useState(null);
  
  // Attendance state
  const [attendanceData, setAttendanceData] = useState({ attendance: [], summary: [] });
  const [attendanceFilters, setAttendanceFilters] = useState({
    moduleCode: '',
    startDate: '',
    endDate: ''
  });
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const authHeaders = useCallback(() => ({
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json'
  }), [user.token]);

  // Fetch lecturer info (stream and module assignment)
  useEffect(() => {
    const fetchLecturerInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lecturer/info`, {
          headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setLecturerInfo(data.lecturer);
        }
      } catch (err) {
        console.error('Error fetching lecturer info:', err);
      }
    };
    fetchLecturerInfo();
  }, [authHeaders]);

  const fetchAttendanceData = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const queryParams = new URLSearchParams({
        ...(attendanceFilters.moduleCode && { moduleCode: attendanceFilters.moduleCode }),
        ...(attendanceFilters.startDate && { startDate: attendanceFilters.startDate }),
        ...(attendanceFilters.endDate && { endDate: attendanceFilters.endDate })
      }).toString();

      const res = await fetch(
        `${API_BASE_URL}/api/lecturer/attendance${queryParams ? `?${queryParams}` : ''}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      
      if (data.success) {
        setAttendanceData(data);
        setError(null);
      } else {
        setError('Failed to load attendance data');
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoadingAttendance(false);
    }
  }, [authHeaders, attendanceFilters]);

  useEffect(() => {
    const fetchMyReports = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lecturer/reports`, { 
          headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setReports(data.reports || []);
          setError(null);
        } else {
          setError(data.message || "Failed to load reports");
          setReports([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load reports. Please try again later.");
        setReports([]);
      }
    };

    const fetchPrograms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lecturer/programs`, { 
          headers: authHeaders()
        });
        const data = await res.json();
        if (data.success) {
          setPrograms(data.programs);
          setError(null);
        } else {
          setError(data.message || "Failed to load programs");
          setPrograms([]);
        }
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs. Please try again later.');
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReports();
    fetchPrograms();
  }, [authHeaders]);

  // Fetch attendance data when tab changes to attendance
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData();
    }
  }, [activeTab, fetchAttendanceData]);

  const renderClasses = () => {
    if (loading) return <div className="loading">Loading class information...</div>;
    
    if (!lecturerInfo) {
      return <div className="loading">Loading your class information...</div>;
    }

    return (
      <div className="classes-section">
        <h2>My Assigned Class</h2>
        <div className="class-card">
          <div className="class-header">
            <h3>{lecturerInfo.stream_name}</h3>
          </div>
          <div className="class-details">
            <div className="detail-row">
              <span className="label">Module:</span>
              <span className="value">{lecturerInfo.module_name || 'Not assigned'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Module Code:</span>
              <span className="value">{lecturerInfo.module_code || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="label">Lecturer:</span>
              <span className="value">{lecturerInfo.name} {lecturerInfo.surname}</span>
            </div>
          </div>
        </div>
        {!lecturerInfo.module_id && (
          <div className="warning-message">
            You don't have a module assigned yet. Please contact your Program Leader.
          </div>
        )}

        {programs.length > 0 && (
          <div className="programs-overview">
            <h3>Program Details</h3>
            {renderPrograms()}
          </div>
        )}
      </div>
    );
  };

  const renderPrograms = () => {
    if (programs.length === 0) return null;

    return (
      <div className="faculties-container">
        {programs.map((prog, index) => (
          <div key={`${prog.faculty_name}-${index}`} className="faculty-section">
            <h4>{prog.faculty_name}</h4>
            <div className="module-info">
              <p><strong>Your Module:</strong> {prog.module_name || 'Not assigned'}</p>
              <p><strong>Module Code:</strong> {prog.module_code || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleProgramSelect = async (programId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programs/${programId}`, {
        headers: authHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedProgram(data.program);
      } else {
        setError('Failed to load program details');
      }
    } catch (err) {
      console.error('Error fetching program details:', err);
      setError('Failed to load program details');
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      
      if (data.success) {
        setMsg('Report deleted successfully');
        setReports(reports.filter(r => r.id !== reportId));
        setTimeout(() => setMsg(''), 3000);
      } else {
        setError(data.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Error deleting report');
    }
  };

  const renderReports = () => (
    <div className="reports-section">
      <h2>Submit Report to Principal Lecturer</h2>
      {msg && <p className="success-message">{msg}</p>}
      {error && activeTab === 'reports' && <p className="error-message">{error}</p>}
      
      {lecturerInfo && (
        <ReportForm 
          user={user} 
          lecturerInfo={lecturerInfo}
          onSubmitted={(result) => {
            if (result.success) {
              setMsg(result.prlNotified 
                ? "Report submitted successfully and Principal Lecturer notified" 
                : "Report submitted successfully");
              setError(null);
              // Refresh reports
              fetch(`${API_BASE_URL}/api/lecturer/reports`, { 
                headers: authHeaders()
              }).then(res => res.json()).then(data => {
                if (data.success) setReports(data.reports || []);
              });
            } else {
              setError(result.message || "Failed to submit report");
              setMsg("");
            }
            setTimeout(() => { setMsg(""); setError(null); }, 5000);
          }} 
        />
      )}

      <h2>My Submitted Reports</h2>
      {reports.length === 0 ? (
        <p>No reports submitted yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Course</th>
              <th>Topic</th>
              <th>Students Present</th>
              <th>Total</th>
              <th>Submitted</th>
              <th>Feedback</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td>{r.dateoflecture}</td>
                <td>{r.coursename}</td>
                <td>{r.topic}</td>
                <td>{r.actualstudents}</td>
                <td>{r.totalstudents}</td>
                <td>{new Date(r.submitted_at).toLocaleString()}</td>
                <td>{r.feedback || '-'}</td>
                <td>
                  <button 
                    onClick={() => handleDeleteReport(r.id)}
                    className="delete-btn"
                    style={{ background: '#dc3545', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderProgramDetails = () => {
    if (!selectedProgram) return null;

    return (
      <div className="program-details-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{selectedProgram.program_name}</h2>
            <button onClick={() => setSelectedProgram(null)} className="close-button">×</button>
          </div>
          <div className="modal-body">
            <div className="program-info">
              <p><strong>Faculty:</strong> {selectedProgram.faculty_name}</p>
              <p><strong>Program Type:</strong> {selectedProgram.program_type}</p>
            </div>
            <div className="modules-list">
              <h3>Modules</h3>
              <div className="modules-grid">
                {selectedProgram.modules.map(module => (
                  <div key={module.id} className="module-card">
                    <h4>{module.code}</h4>
                    <h5>{module.name}</h5>
                    <p><strong>Year Level:</strong> {module.year_level}</p>
                    <p><strong>Semester:</strong> {module.semester}</p>
                    <p><strong>Credits:</strong> {module.credits}</p>
                    {module.description && <p className="description">{module.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <h1>Lecturer Portal</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          Classes
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
        <button 
          className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance
        </button>
        <button 
          className={`tab ${activeTab === 'rateprl' ? 'active' : ''}`}
          onClick={() => setActiveTab('rateprl')}
        >
          Rate PRL
        </button>
      </div>

      {selectedProgram && renderProgramDetails()}

      <div className="tab-content">
        {activeTab === 'classes' && renderClasses()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'rateprl' && (
          <PRLRatingForm authHeaders={authHeaders} />
        )}
        {activeTab === 'attendance' && (
          <div className="attendance-container">
            <h2>Attendance Monitoring</h2>
            
            <div className="attendance-filters">
              <select 
                value={attendanceFilters.moduleCode} 
                onChange={(e) => setAttendanceFilters(prev => ({
                  ...prev, 
                  moduleCode: e.target.value
                }))}
              >
                <option value="">All Modules</option>
                {programs.flatMap(prog => 
                  prog.module_codes?.map((code, index) => (
                    <option key={code} value={code}>
                      {code} - {prog.module_names[index]}
                    </option>
                  ))
                )}
              </select>

              <div className="date-filters">
                <div className="date-input">
                  <label>From:</label>
                  <input
                    type="date"
                    value={attendanceFilters.startDate}
                    onChange={(e) => setAttendanceFilters(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                  />
                </div>
                <div className="date-input">
                  <label>To:</label>
                  <input
                    type="date"
                    value={attendanceFilters.endDate}
                    onChange={(e) => setAttendanceFilters(prev => ({
                      ...prev,
                      endDate: e.target.value
                    }))}
                  />
                </div>
              </div>

              <button 
                onClick={() => fetchAttendanceData()}
                disabled={loadingAttendance}
              >
                {loadingAttendance ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>

            {attendanceData.summary.length > 0 && (
              <div className="attendance-summary">
                <h3>Attendance Summary</h3>
                <div className="summary-cards">
                  {attendanceData.summary.map(summary => (
                    <div key={summary.module_code} className="summary-card">
                      <h4>{summary.module_name}</h4>
                      <p><strong>Module Code:</strong> {summary.module_code}</p>
                      <p><strong>Total Students:</strong> {summary.total_students}</p>
                      <p><strong>Total Classes:</strong> {summary.total_classes}</p>
                      <p className="attendance-rate">
                        <strong>Attendance Rate:</strong>
                        <span className={`rate ${summary.attendance_rate >= 75 ? 'good' : summary.attendance_rate >= 50 ? 'warning' : 'poor'}`}>
                          {summary.attendance_rate}%
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {attendanceData.attendance.length > 0 ? (
              <div className="attendance-details">
                <h3>Detailed Attendance Records</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Module</th>
                      <th>Student Number</th>
                      <th>Student Name</th>
                      <th>Stream</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.attendance.map((record, index) => (
                      <tr key={index}>
                        <td>{new Date(record.date_of_class).toLocaleDateString()}</td>
                        <td>{record.module_code} - {record.module_name}</td>
                        <td>{record.student_number}</td>
                        <td>{record.student_name} {record.student_surname}</td>
                        <td>{record.stream_name}</td>
                        <td className={record.attended ? 'present' : 'absent'}>
                          {record.attended ? 'Present' : 'Absent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data">
                {loadingAttendance ? 'Loading attendance data...' : 'No attendance records found'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}