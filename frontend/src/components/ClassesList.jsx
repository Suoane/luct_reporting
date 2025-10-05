import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';
import './ClassesList.css';

export default function ClassesList({ user }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/lecturer/classes`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        
        if (data.success) {
          setClasses(data.classes);
        } else {
          setError(data.message || 'Failed to fetch classes');
        }
      } catch (err) {
        setError('Error connecting to server');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchClasses();
    }
  }, [user]);

  if (loading) {
    return <div className="loading">Loading classes...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="classes-list">
      <h2>My Classes</h2>
      <div className="classes-grid">
        {classes.map((cls) => (
          <div key={cls.id} className="class-card" onClick={() => navigate(`/classes/${cls.id}`)}>
            <div className="class-header">
              <h3>{cls.name}</h3>
              <span className="code">{cls.code}</span>
            </div>
            <div className="class-info">
              <p className="faculty">{cls.faculty_name}</p>
              <div className="student-stats">
                <div className="stat">
                  <span className="label">Total Students</span>
                  <span className="value">{cls.total_students}</span>
                </div>
                <div className="stat">
                  <span className="label">Present Today</span>
                  <span className="value">{cls.present_today}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {classes.length === 0 && (
        <div className="no-classes">
          <p>No classes assigned yet.</p>
        </div>
      )}
    </div>
  );
}