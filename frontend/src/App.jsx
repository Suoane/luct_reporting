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

export default function App() {
  // ==================== USER STATE ====================
  const [user, setUser] = useState(() => {
    const rawUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    return rawUser ? { ...JSON.parse(rawUser), token } : null;
  });

  useEffect(() => {
    if (!user) {
      const rawUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (rawUser && token) setUser({ ...JSON.parse(rawUser), token });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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

        <Route path="*" element={<Navigate to={user ? "/student" : "/"} replace />} />
      </Routes>
    </Router>
  );
}
