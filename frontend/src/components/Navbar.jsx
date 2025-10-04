// src/components/Navbar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import "./Navbar.css";

export default function Navbar({ setUser }) {
  const navigate = useNavigate();
  const rawUser = localStorage.getItem("user");
  const user = rawUser ? JSON.parse(rawUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
      {user && (
        <>
          <div className="user-info">
            <div className="user-profile">
              <FontAwesomeIcon icon={faUser} className="user-icon" />
              <span className="username">{user.username}</span>
            </div>
          </div>
          <div className="nav-links">
            {user.role === 'student' && null}
            {user.role === 'lecturer' && null}
            {user.role === 'prl' && (
              <>
                <NavLink to="/prl" className={({ isActive }) => isActive ? 'active' : ''}>
                  My Portal
                </NavLink>
                <NavLink to="/classes" className={({ isActive }) => isActive ? 'active' : ''}>
                  My Classes
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                  Reports
                </NavLink>
              </>
            )}
            {user.role === 'pl' && (
              <>
                <NavLink to="/pl" className={({ isActive }) => isActive ? 'active' : ''}>
                  My Portal
                </NavLink>
                <NavLink to="/classes" className={({ isActive }) => isActive ? 'active' : ''}>
                  My Classes
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                  Reports
                </NavLink>
              </>
            )}
            {user.role === 'admin' && null}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </>
      )}
    </nav>
  );
}
