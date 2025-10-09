import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api';
import "./Dashboard.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Don't show navbar on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const handleLogout = async () => {
    console.log('Logout clicked!'); // Debug log
    try {
      await authAPI.logout();
      console.log('API logout successful'); // Debug log
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('Storage cleared, navigating to login'); // Debug log
      
      // Force navigation
      navigate('/login', { replace: true });
      
      // Force page reload to clear any cached state
      window.location.href = '/login';
    }
  };

  const getDashboardLink = () => {
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'lecturer':
        return '/lecturer/dashboard';
      case 'principal_lecturer':
        return '/prl/dashboard';
      case 'program_leader':
        return '/pl/dashboard';
      default:
        return '/dashboard';
    }
  };

  const getRoleDisplay = () => {
    switch (user.role) {
      case 'student':
        return 'Student';
      case 'lecturer':
        return 'Lecturer';
      case 'principal_lecturer':
        return 'Principal Lecturer';
      case 'program_leader':
        return 'Program Leader';
      default:
        return 'User';
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to={getDashboardLink()}>
          LUCT Reporting System
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to={getDashboardLink()}>
                Dashboard
              </Link>
            </li>

            {user.role === 'lecturer' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/lecturer/reports/new">
                    New Report
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/lecturer/reports">
                    My Reports
                  </Link>
                </li>
              </>
            )}

            {user.role === 'principal_lecturer' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/prl/reports">
                    Reports
                  </Link>
                </li>
              </>
            )}

            {user.role === 'program_leader' && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/pl/reports">
                    All Reports
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center">
            <span className="navbar-text text-white me-3">
              <strong>{user.full_name || 'User'}</strong> ({getRoleDisplay()})
            </span>
            <button 
              className="btn btn-outline-light btn-sm" 
              onClick={handleLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;