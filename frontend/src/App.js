import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import LecturerDashboard from './components/LecturerDashboard';
import PrLDashboard from './components/PrLDashboard';
import PLDashboard from './components/PLDashboard';
import LectureReport from './components/LectureReport';
import ReportsList from './components/ReportsList';
import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dashboard Router based on role
const DashboardRouter = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'lecturer':
      return <LecturerDashboard />;
    case 'principal_lecturer':
      return <PrLDashboard />;
    case 'program_leader':
      return <PLDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Generic Dashboard Route */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
          
          {/* Student Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Lecturer Routes */}
          <Route 
            path="/lecturer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <LecturerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/reports/new" 
            element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <LectureReport />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lecturer/reports" 
            element={
              <ProtectedRoute allowedRoles={['lecturer']}>
                <ReportsList />
              </ProtectedRoute>
            } 
          />
          
          {/* Principal Lecturer Routes */}
          <Route 
            path="/prl/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['principal_lecturer']}>
                <PrLDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/prl/reports" 
            element={
              <ProtectedRoute allowedRoles={['principal_lecturer']}>
                <ReportsList />
              </ProtectedRoute>
            } 
          />
          
          {/* Program Leader Routes */}
          <Route 
            path="/pl/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['program_leader']}>
                <PLDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pl/reports" 
            element={
              <ProtectedRoute allowedRoles={['program_leader']}>
                <ReportsList />
              </ProtectedRoute>
            } 
          />
          
          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;