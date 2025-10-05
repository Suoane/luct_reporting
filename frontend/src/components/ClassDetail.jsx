import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import './ClassDetail.css';

export default function ClassDetail({ user }) {
  const { moduleId } = useParams();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/lecturer/classes/${moduleId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setClassData(data.class);
        } else {
          setError(data.message || 'Failed to fetch class details');
        }
      } catch (err) {
        setError('Error connecting to server');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchClassDetails();
    }
  }, [user, moduleId]);

  if (loading) {
    return <div className="loading">Loading class details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!classData) {
    return <div className="error">Class not found</div>;
  }

  const calculateAttendancePercentage = (present, total) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  return (
    <div className="class-detail">
      <div className="class-header">
        <div>
          <h2>{classData.name}</h2>
          <p className="code">{classData.code}</p>
          <p className="faculty">{classData.faculty_name}</p>
        </div>
        <div className="student-count">
          <span className="label">Total Students</span>
          <span className="value">{classData.total_students}</span>
        </div>
      </div>

      <div className="attendance-section">
        <h3>Attendance History</h3>
        <div className="attendance-table">
          <div className="table-header">
            <div>Date</div>
            <div>Present</div>
            <div>Total</div>
            <div>Percentage</div>
          </div>
          {classData.attendance_history.map((record) => (
            <div key={record.date_of_class} className="table-row">
              <div>{new Date(record.date_of_class).toLocaleDateString()}</div>
              <div>{record.present}</div>
              <div>{record.total}</div>
              <div className="percentage">
                {calculateAttendancePercentage(record.present, record.total)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="quick-actions">
        <button 
          className="action-button"
          onClick={() => window.location.href = `/reports/new?moduleId=${moduleId}`}
        >
          Create Report
        </button>
        <button 
          className="action-button"
          onClick={() => window.location.href = `/attendance/${moduleId}`}
        >
          Mark Attendance
        </button>
      </div>
    </div>
  );
}