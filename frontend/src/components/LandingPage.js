import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, TrendingUp, Award, Clock } from 'lucide-react';
import './Dashboard.css';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container">
          <Link className="navbar-brand fw-bold text-primary" to="/">
            <span className="fs-4">Limkokwing Reporting System</span>
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
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Login</Link>
              </li>
              <li className="nav-item">
                <Link className="btn btn-primary ms-2" to="/register">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row align-items-center py-5">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Streamline Your Academic Reporting
              </h1>
              <p className="lead text-muted mb-4">
                The comprehensive reporting system for Limkokwing University of Creative Technology. 
                Manage lectures, track attendance, and generate insights with ease.
              </p>
              <div className="d-flex gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">
                  Register Now
                </Link>
                <Link to="/login" className="btn btn-outline-primary btn-lg">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="text-center">
                <div className="bg-primary bg-gradient rounded-4 p-5 shadow-lg">
                  <div className="d-flex justify-content-center mb-3">
                    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <h3 className="text-white">Digital Reporting Made Simple</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Powerful Features</h2>
            <p className="lead text-muted">Everything you need for effective academic management</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-primary" strokeWidth="2">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  </div>
                  <h4 className="card-title mb-3">Lecture Management</h4>
                  <p className="card-text text-muted">
                    Create and manage lecture reports with ease. Track topics covered, attendance, and learning outcomes.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-success" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <h4 className="card-title mb-3">Role-Based Access</h4>
                  <p className="card-text text-muted">
                    Customized dashboards for students, lecturers, principal lecturers, and program leaders.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-info" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  </div>
                  <h4 className="card-title mb-3">Analytics & Insights</h4>
                  <p className="card-text text-muted">
                    Generate comprehensive reports and gain valuable insights into academic performance.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-warning bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-warning" strokeWidth="2">
                      <circle cx="12" cy="8" r="7"/>
                      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                    </svg>
                  </div>
                  <h4 className="card-title mb-3">Stream-Based Organization</h4>
                  <p className="card-text text-muted">
                    Organize content by academic streams for better structure and management.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-danger" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <h4 className="card-title mb-3">Real-Time Updates</h4>
                  <p className="card-text text-muted">
                    Stay informed with instant notifications and real-time report updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body text-center p-4">
                  <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <h4 className="card-title mb-3">Comprehensive Reports</h4>
                  <p className="card-text text-muted">
                    Export detailed reports in various formats for record-keeping and analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-5 bg-light">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h2 className="display-5 fw-bold mb-4">About the System</h2>
              <p className="lead text-muted mb-4">
                The Limkokwing Reporting System is designed to modernize and streamline academic 
                reporting processes at Limkokwing University of Creative Technology.
              </p>
              <p className="text-muted mb-4">
                Our platform provides a centralized solution for managing lecture reports, tracking 
                student attendance, and generating comprehensive analytics. With role-based access 
                control, each user gets a tailored experience suited to their needs.
              </p>
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-white rounded shadow-sm">
                    <h3 className="text-primary fw-bold mb-0">100%</h3>
                    <p className="text-muted small mb-0">Digital</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-white rounded shadow-sm">
                    <h3 className="text-primary fw-bold mb-0">4</h3>
                    <p className="text-muted small mb-0">User Roles</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-white rounded shadow-sm">
                    <h3 className="text-primary fw-bold mb-0">24/7</h3>
                    <p className="text-muted small mb-0">Access</p>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-white rounded shadow-sm">
                    <h3 className="text-primary fw-bold mb-0">Secure</h3>
                    <p className="text-muted small mb-0">Platform</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="bg-primary bg-gradient rounded-4 p-5 text-white shadow-lg">
                <h3 className="mb-4">Who Can Use This System?</h3>
                <ul className="list-unstyled">
                  <li className="mb-3 d-flex align-items-start">
                    <span className="badge bg-white text-primary me-3 mt-1">1</span>
                    <div>
                      <strong>Students</strong> - View lecture schedules and access course materials
                    </div>
                  </li>
                  <li className="mb-3 d-flex align-items-start">
                    <span className="badge bg-white text-primary me-3 mt-1">2</span>
                    <div>
                      <strong>Lecturers</strong> - Create and manage lecture reports
                    </div>
                  </li>
                  <li className="mb-3 d-flex align-items-start">
                    <span className="badge bg-white text-primary me-3 mt-1">3</span>
                    <div>
                      <strong>Principal Lecturers</strong> - Review and approve reports within streams
                    </div>
                  </li>
                  <li className="mb-3 d-flex align-items-start">
                    <span className="badge bg-white text-primary me-3 mt-1">4</span>
                    <div>
                      <strong>Program Leaders</strong> - Oversee all reports and analytics
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-primary text-white">
        <div className="container py-5 text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Get Started?</h2>
          <p className="lead mb-4">
            Join Limkokwing University's digital transformation today
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <Link to="/register" className="btn btn-light btn-lg px-5">
              Create Account
            </Link>
            <Link to="/login" className="btn btn-outline-light btn-lg px-5">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 bg-dark text-white-50">
        <div className="container text-center">
          <p className="mb-0">
            &copy; 2025 Limkokwing University of Creative Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
