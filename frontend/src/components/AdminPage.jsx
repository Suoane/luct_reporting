import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faEdit, faTrash, faSearch, faChalkboardTeacher, faUserGraduate, faBook, faChartBar } from "@fortawesome/free-solid-svg-icons";
import API_BASE_URL from '../config/api';
import "./AdminPage.css";

export default function AdminPage({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    surname: '',
    email: '',
    role: 'student',
    faculty_id: '',
    student_number: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [facultyFilter, setFacultyFilter] = useState('all');
  const [streams, setStreams] = useState([]);
  const [modules, setModules] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLecturers: 0,
    totalPRLs: 0,
    totalPLs: 0,
    totalReports: 0
  });

  useEffect(() => {
    const fetchStreamsAndModules = async () => {
      try {
        const streamsRes = await fetch(`${API_BASE_URL}/api/streams`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        const streamsData = await streamsRes.json();
        setStreams(streamsData.streams || []);

        const modulesRes = await fetch(`${API_BASE_URL}/api/modules`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        const modulesData = await modulesRes.json();
        setModules(modulesData.modules || []);
      } catch (err) {
        setStreams([]);
        setModules([]);
      }
    };

    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reports`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (err) {
        console.error(err);
        setReports([]);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();
        const safeUsers = data.users || [];
        setUsers(safeUsers);
        setStats({
          totalStudents: safeUsers.filter(u => u.role === 'student').length,
          totalLecturers: safeUsers.filter(u => u.role === 'lecturer').length,
          totalPRLs: safeUsers.filter(u => u.role === 'prl').length,
          totalPLs: safeUsers.filter(u => u.role === 'pl').length,
          totalReports: reports.length
        });
      } catch (err) {
        console.error(err);
        setUsers([]);
      }
    };

    fetchReports();
    fetchUsers();
    fetchStreamsAndModules();
  }, [user.token, reports.length]);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser 
        ? `${API_BASE_URL}/api/users/${editingUser.id}`
        : `${API_BASE_URL}/api/users`;

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userForm)
      });

      const data = await res.json();
      
      if (res.ok) {
        const usersRes = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        });
        const userData = await usersRes.json();
        setUsers(userData.users || []);
        
        setUserForm({
          username: '',
          password: '',
          name: '',
          surname: '',
          email: '',
          role: 'student',
          faculty_id: '',
          student_number: ''
        });
        setEditingUser(null);
      } else {
        alert(data.message || 'Error creating/updating user');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating/updating user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setUsers(users.filter(u => (u.user_id || u.id) !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (data.success) {
        setReports(reports.filter(r => r.id !== reportId));
        alert('Report deleted successfully');
      } else {
        alert(data.message || 'Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Error deleting report');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email || '',
      role: user.role,
      password: '',
      faculty_id: user.faculty_id || user.stream_id || '',
      student_number: user.student_number || ''
    });
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'student': 'Student',
      'lecturer': 'Lecturer',
      'prl': 'Principal Lecturer',
      'pl': 'Program Leader',
      'admin': 'Admin'
    };
    return roleMap[role] || role;
  };

  const filteredUsers = (users || [])
    .filter(u => userFilter === 'all' || u.role === userFilter)
    .filter(u => facultyFilter === 'all' || 
      streams.find(s => s.id === (u.faculty_id || u.stream_id))?.name === facultyFilter
    )
    .filter(u => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        u.username?.toLowerCase().includes(search) ||
        u.name?.toLowerCase().includes(search) ||
        u.surname?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.student_number?.toLowerCase().includes(search)
      );
    });

  return (
    <div className="page-container">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''}
          onClick={() => setActiveTab('dashboard')}>
          <FontAwesomeIcon icon={faChartBar} /> Overview
        </button>
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}>
          <FontAwesomeIcon icon={faUserGraduate} /> Users
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}>
          <FontAwesomeIcon icon={faBook} /> Reports
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <FontAwesomeIcon icon={faUserGraduate} className="stat-icon" />
            <div className="stat-info">
              <h3>Students</h3>
              <p>{stats.totalStudents}</p>
            </div>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faChalkboardTeacher} className="stat-icon" />
            <div className="stat-info">
              <h3>Lecturers</h3>
              <p>{stats.totalLecturers}</p>
            </div>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faChalkboardTeacher} className="stat-icon" />
            <div className="stat-info">
              <h3>Principal Lecturers</h3>
              <p>{stats.totalPRLs}</p>
            </div>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faChalkboardTeacher} className="stat-icon" />
            <div className="stat-info">
              <h3>Program Leaders</h3>
              <p>{stats.totalPLs}</p>
            </div>
          </div>
          <div className="stat-card">
            <FontAwesomeIcon icon={faBook} className="stat-icon" />
            <div className="stat-info">
              <h3>Reports</h3>
              <p>{reports.length}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="users-section">
          <div className="users-header">
            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleUserSubmit} className="user-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Username"
                  value={userForm.username}
                  onChange={e => setUserForm({...userForm, username: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={userForm.password}
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  required={!editingUser}
                />
              </div>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Name"
                  value={userForm.name}
                  onChange={e => setUserForm({...userForm, name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Surname"
                  value={userForm.surname}
                  onChange={e => setUserForm({...userForm, surname: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  type="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                  required
                />
                <select
                  value={userForm.role}
                  onChange={e => {
                    setUserForm({
                      ...userForm,
                      role: e.target.value,
                      faculty_id: '',
                      student_number: ''
                    });
                  }}
                  required
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="prl">Principal Lecturer</option>
                  <option value="pl">Program Leader</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {userForm.role === 'student' && (
                <div className="form-row">
                  <input
                    type="text"
                    placeholder="Student Number"
                    value={userForm.student_number}
                    onChange={e => setUserForm({...userForm, student_number: e.target.value})}
                    required
                  />
                  <select
                    value={userForm.faculty_id}
                    onChange={e => setUserForm({...userForm, faculty_id: e.target.value})}
                    required
                  >
                    <option value="">Select Stream</option>
                    {streams.map(stream => (
                      <option key={stream.id} value={stream.id}>{stream.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {['lecturer', 'prl', 'pl'].includes(userForm.role) && (
                <div className="form-row">
                  <select
                    value={userForm.faculty_id}
                    onChange={e => setUserForm({...userForm, faculty_id: e.target.value})}
                    required
                  >
                    <option value="">Select Stream</option>
                    {streams.map(stream => (
                      <option key={stream.id} value={stream.id}>{stream.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-actions">
                <button type="submit">
                  <FontAwesomeIcon icon={editingUser ? faEdit : faUserPlus} />
                  {editingUser ? ' Update User' : ' Add User'}
                </button>
                {editingUser && (
                  <button type="button" onClick={() => {
                    setEditingUser(null);
                    setUserForm({
                      username: '',
                      password: '',
                      name: '',
                      surname: '',
                      email: '',
                      role: 'student',
                      faculty_id: '',
                      student_number: ''
                    });
                  }} className="cancel-btn">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="users-list">
            <div className="filters">
              <div className="search-box">
                <FontAwesomeIcon icon={faSearch} />
                <input
                  type="text"
                  placeholder="Search by name, username, email, student number..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={userFilter}
                onChange={e => setUserFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="student">Students</option>
                <option value="lecturer">Lecturers</option>
                <option value="prl">Principal Lecturers</option>
                <option value="pl">Program Leaders</option>
                <option value="admin">Admins</option>
              </select>
              <select
                value={facultyFilter}
                onChange={e => setFacultyFilter(e.target.value)}
              >
                <option value="all">All Streams</option>
                {streams.map(stream => (
                  <option key={stream.id} value={stream.name}>{stream.name}</option>
                ))}
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Stream</th>
                  <th>Student Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const streamId = u.faculty_id || u.stream_id;
                  const streamName = streams.find(s => s.id === streamId)?.name || '-';
                  
                  return (
                    <tr key={u.username}>
                      <td>{u.username}</td>
                      <td>{u.name} {u.surname}</td>
                      <td>{u.email || '-'}</td>
                      <td><span className={`role-badge ${u.role}`}>{getRoleDisplay(u.role)}</span></td>
                      <td>{streamName}</td>
                      <td>{u.student_number || '-'}</td>
                      <td className="actions">
                        <button onClick={() => handleEditUser(u)} className="edit-btn">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.user_id || u.id)} className="delete-btn">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <>
          <h2>All Reports</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Faculty</th>
                <th>Course</th>
                <th>Lecturer</th>
                <th>Date</th>
                <th>Topic</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.facultyname}</td>
                  <td>{r.coursename}</td>
                  <td>{r.lecturername}</td>
                  <td>{new Date(r.dateoflecture).toLocaleDateString()}</td>
                  <td>{r.topic}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteReport(r.id)}
                      className="delete-btn"
                      style={{ background: '#dc3545', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <FontAwesomeIcon icon={faTrash} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}