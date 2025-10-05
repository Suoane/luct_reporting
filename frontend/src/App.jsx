// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import StudentPage from "./components/StudentPage";
import LecturerPage from "./components/LecturerPage";
import PrincipalLecturer from "./components/PrincipalLecturer";
import ProgramLeader from "./components/ProgramLeader";
import AdminPage from "./components/AdminPage";
import ClassesList from "./components/ClassesList";
import ClassDetail from "./components/ClassDetail";
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";

export default function App() {
  const linkedinUrl = "https://www.linkedin.com/in/divinechukwudi";
  const githubUrl = "https://github.com/DivineChukwudi";
  const gmailUrl = "mailto:chukwudidivine20@gmail.com";
  // ==================== USER STATE ====================
  const [user, setUser] = useState(() => {
    try {
      const rawUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!rawUser || !token) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        return null;
      }
      return { ...JSON.parse(rawUser), token };
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  useEffect(() => {
    // Clear any invalid state
    if (!user) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  const logout = () => {
    // Clear all auth-related data
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  };

  // ==================== PROTECTED ROUTE ====================
  function ProtectedRoute({ user, allowedRoles, children }) {
    if (!user) return <Navigate to="/" replace />;
    if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
    return children;
  }

  return (
    <Router>
      {user && <Navbar setUser={logout} />}
      <Routes>
        <Route path="/" element={<Login setUser={setUser} />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute user={user} allowedRoles={["student"]}>
              <StudentPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lecturer"
          element={
            <ProtectedRoute user={user} allowedRoles={["lecturer"]}>
              <LecturerPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/prl"
          element={
            <ProtectedRoute user={user} allowedRoles={["prl"]}>
              <PrincipalLecturer user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pl"
          element={
            <ProtectedRoute user={user} allowedRoles={["pl"]}>
              <ProgramLeader user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={["admin"]}>
              <AdminPage user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/classes"
          element={
            <ProtectedRoute user={user} allowedRoles={["lecturer", "prl", "pl"]}>
              <ClassesList user={user} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/classes/:moduleId"
          element={
            <ProtectedRoute user={user} allowedRoles={["lecturer", "prl", "pl"]}>
              <ClassDetail user={user} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={user ? "/student" : "/"} replace />} />
      </Routes>
       <footer className="login-footer">
        <div className="footer-copy">
          &copy; {new Date().getFullYear()} LUCT Reporting System. All rights reserved | System designed by etern.pptx
        </div>
        <div className="footer-links">
          <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"><FaLinkedin /> LinkedIn</a>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer"><FaGithub /> GitHub</a>
          <a href={gmailUrl} target="_blank" rel="noopener noreferrer"><FaEnvelope /> Gmail</a>
        </div>
      </footer>
    </Router>
    
  );
}
