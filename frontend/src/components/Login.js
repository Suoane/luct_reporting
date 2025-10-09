import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import "./Dashboard.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  // Quick login helper function
  const handleQuickLogin = (email) => {
    setFormData({ email, password: 'lecturer123' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.login(formData);

      // Save token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2>LUCT Reporting System</h2>
                <p className="text-muted">
                  Welcome back! Please login to your account.
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email Address
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
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>

                {/* Register Link */}
                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-decoration-none fw-bold">
                      Register here
                    </Link>
                  </p>
                </div>
              </form>

              {/* Test Credentials Info */}
              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <strong>Test Credentials</strong><br/>
                  <span className="text-info">All passwords: lecturer123</span>
                  <hr className="my-2"/>
                  <div className="d-grid gap-1">
                    <button 
                      className="btn btn-sm btn-outline-primary text-start"
                      onClick={() => handleQuickLogin('motlatsi.mokhele@luct.ac.ls')}
                      type="button"
                    >
                      Program Leader: motlatsi.mokhele@luct.ac.ls
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-info text-start"
                      onClick={() => handleQuickLogin('thabo.molefe@luct.ac.ls')}
                      type="button"
                    >
                      Principal Lecturer (IS): thabo.molefe@luct.ac.ls
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-success text-start"
                      onClick={() => handleQuickLogin('palesa.ramoeletsi@luct.ac.ls')}
                      type="button"
                    >
                     Lecturer (IS): palesa.ramoeletsi@luct.ac.ls
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary text-start"
                      onClick={() => handleQuickLogin('thabiso.mokoena@student.luct.ac.ls')}
                      type="button"
                    >
                      Student (IS): thabiso.mokoena@student.luct.ac.ls
                    </button>
                  </div>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;