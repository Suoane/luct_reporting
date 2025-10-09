import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import axios from 'axios';
import "./Dashboard.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    stream_id: '',
  });
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [error, setError] = useState('');

  // Fetch streams on component mount - WITHOUT authentication
  useEffect(() => {
    const fetchStreams = async () => {
      setLoadingStreams(true);
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        // Make a direct axios call without authentication
        const response = await axios.get(`${API_BASE_URL}/streams/public`);
        const streamsData = response.data.streams || response.data || [];
        console.log('Fetched streams:', streamsData);
        setStreams(streamsData);
      } catch (err) {
        console.error('Error fetching streams:', err);
        // If public endpoint doesn't exist, try the authenticated one
        // This will work if user was previously logged in
        try {
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
          const response = await axios.get(`${API_BASE_URL}/streams`);
          const streamsData = response.data.streams || response.data || [];
          setStreams(streamsData);
        } catch (secondErr) {
          console.error('Second attempt failed:', secondErr);
          setError('Unable to load streams. Please refresh the page or contact administration.');
        }
      } finally {
        setLoadingStreams(false);
      }
    };
    fetchStreams();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check if stream is required for this role
    if (['student', 'lecturer', 'principal_lecturer'].includes(formData.role) && !formData.stream_id) {
      setError('Please select a stream');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const registerData = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      // Only add stream_id if it's required for the role
      if (['student', 'lecturer', 'principal_lecturer'].includes(formData.role)) {
        registerData.stream_id = parseInt(formData.stream_id);
      }

      const response = await authAPI.register(registerData);

      // Save token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Show success message
      alert('Registration successful! Redirecting to dashboard...');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if stream selection is needed for the selected role
  const needsStream = ['student', 'lecturer', 'principal_lecturer'].includes(formData.role);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Register</h2>
              <p className="text-center text-muted mb-4">
                LUCT Reporting System - Create your account
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="mb-3">
                  <label htmlFor="full_name" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@luct.ac.ls"
                    required
                  />
                  <small className="text-muted">Use your LUCT email address</small>
                </div>

                {/* Role */}
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="principal_lecturer">Principal Lecturer</option>
                    <option value="program_leader">Program Leader</option>
                  </select>
                </div>

                {/* Stream (conditional) */}
                {needsStream && (
                  <div className="mb-3">
                    <label htmlFor="stream_id" className="form-label">
                      Stream <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="stream_id"
                      name="stream_id"
                      value={formData.stream_id}
                      onChange={handleChange}
                      required
                      disabled={loadingStreams}
                    >
                      <option value="">
                        {loadingStreams ? 'Loading streams...' : 'Select a stream...'}
                      </option>
                      {streams.length > 0 && streams.map(stream => (
                        <option key={stream.stream_id} value={stream.stream_id}>
                          {stream.stream_code} - {stream.stream_name}
                        </option>
                      ))}
                    </select>
                    {loadingStreams && (
                      <small className="text-info d-block mt-1">
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Loading available streams...
                      </small>
                    )}
                    {!loadingStreams && streams.length === 0 && (
                      <small className="text-danger d-block mt-1">
                        No streams available. Please contact administration.
                      </small>
                    )}
                  </div>
                )}

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    required
                    minLength="6"
                  />
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirm Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading || (needsStream && streams.length === 0)}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-decoration-none fw-bold">
                      Login here
                    </Link>
                  </p>
                </div>
              </form>

              {/* Help Info */}
              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Registration Info:</strong><br/>
                  • Students, Lecturers, and Principal Lecturers must select a stream<br/>
                  • Program Leaders don't need to select a stream<br/>
                  • Use your official LUCT email address<br/>
                  • Password must be at least 6 characters
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;