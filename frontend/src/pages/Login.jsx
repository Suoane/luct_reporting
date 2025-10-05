import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa";
import "./Login.css";
import regSuccessGif from "../assets/reg-succ.gif";

export default function Login({ setUser }) {
 

  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [role, setRole] = useState("student");

  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
  }, [setUser]);

  const [registerData, setRegisterData] = useState({
    name: "",
    surname: "",
    studentNumber: "",
    gmail: "",
    username: "",
    password: "",
    facultyId: "",
    faculties: []
  });

  const [registerMessage, setRegisterMessage] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch streams whenever register form is shown
  useEffect(() => {
    if (showRegister) {
      const fetchStreams = async () => {
        try {
          setLoading(true);
          const streamsRes = await fetch(API_BASE_URL + "/api/streams-public");
          const streamsData = await streamsRes.json();
          
          console.log("Streams response:", streamsData); // Debug log
          
          if (streamsData.success && Array.isArray(streamsData.streams)) {
            setStreams(streamsData.streams);
          } else if (Array.isArray(streamsData)) {
            // In case the API returns streams directly as an array
            setStreams(streamsData);
          } else {
            setStreams([]);
          }
        } catch (error) {
          console.error("Error fetching streams:", error);
          setStreams([]);
        } finally {
          setLoading(false);
        }
      };
      fetchStreams();
    }
  }, [showRegister]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(API_BASE_URL + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser({ ...data.user, token: data.token });
        switch (data.user.role) {
          case "lecturer": navigate("/lecturer"); break;
          case "student": navigate("/student"); break;
          case "prl": navigate("/prl"); break;
          case "pl": navigate("/pl"); break;
          case "admin": navigate("/admin"); break;
          default: navigate("/dashboard");
        }
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("Server error. Try again later.");
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "faculties" && type === "select-multiple") {
      const selectedFaculties = Array.from(e.target.selectedOptions).map((o) => o.value);
      setRegisterData((prev) => ({ ...prev, faculties: selectedFaculties }));
    } else {
      setRegisterData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage("");
    
    // Validation for non-student roles
    if (role !== "student" && registerData.faculties.length === 0) {
      setRegisterMessage("Please select at least one stream");
      return;
    }
    
    try {
      const endpoint = role === "student" ? "/api/register/student" : `/api/register/${role}`;
      const payload =
        role === "student"
          ? {
              name: registerData.name,
              surname: registerData.surname,
              student_number: registerData.studentNumber,
              email: registerData.gmail,
              username: registerData.username,
              password: registerData.password,
              faculty_id: parseInt(registerData.facultyId, 10),
            }
          : {
              name: registerData.name,
              surname: registerData.surname,
              number: registerData.studentNumber,
              email: registerData.gmail,
              username: registerData.username,
              password: registerData.password,
              faculties: registerData.faculties.map((id) => parseInt(id, 10)),
            };

      const res = await fetch(API_BASE_URL + "" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
          setShowRegister(false);
        }, 2000);
        setRegisterData({
          name: "",
          surname: "",
          studentNumber: "",
          gmail: "",
          username: "",
          password: "",
          facultyId: "",
          faculties: []
        });
      } else {
        setRegisterMessage(data.message || "Registration failed");
      }
    } catch (err) {
      setRegisterMessage("Server error during registration");
    }
  };

  return (
    <div className="app-container">
      <div className={`login-page ${showRegister ? "show-register" : ""}`}>
        <div className="login-header">
          <h1 style={{ textAlign: "center", marginBottom: 0 }}>LUCT Reporting System</h1>
          <p style={{ textAlign: "center", fontStyle: "italic", color: "#2e7d32", marginTop: 0 }}>
            "Empowering students and lecturers to connect, report, and grow together."
          </p>
        </div>

        {!showRegister && (
          <form onSubmit={handleLogin} className="login-form">
            <h1>Login</h1>
            {error && <p className="error">{error}</p>}
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="password-icon" onClick={() => setShowPassword((p) => !p)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit">Login</button>
          </form>
        )}

        {showRegister && (
          <form className="register-form" onSubmit={handleRegisterSubmit}>
            <h2>Register as {role}</h2>

            <div className="role-selector">
              <label>Role:</label>
              <select name="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="lecturer">Lecturer</option>
                <option value="pl">Program Leader</option>
                <option value="prl">Principal Lecturer</option>
              </select>
            </div>

            <input name="name" placeholder="First Name" value={registerData.name} onChange={handleRegisterChange} required />
            <input name="surname" placeholder="Surname" value={registerData.surname} onChange={handleRegisterChange} required />
            <input name="studentNumber" placeholder={role === "student" ? "Student Number" : "Staff Number"} value={registerData.studentNumber} onChange={handleRegisterChange} required />
            <input type="email" name="gmail" placeholder="Email" value={registerData.gmail} onChange={handleRegisterChange} required />
            <input name="username" placeholder="Username" value={registerData.username} onChange={handleRegisterChange} required />
            
            <div className="password-wrapper">
              <input 
                type={showRegPassword ? "text" : "password"} 
                name="password" 
                placeholder="Password" 
                value={registerData.password} 
                onChange={handleRegisterChange} 
                required 
              />
              <span className="password-icon" onClick={() => setShowRegPassword((p) => !p)}>
                {showRegPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {loading ? (
              <p style={{ color: '#fff', textAlign: 'center' }}>Loading streams...</p>
            ) : role === "student" ? (
              <select name="facultyId" value={registerData.facultyId} onChange={handleRegisterChange} required>
                <option value="">Select Stream</option>
                {streams.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            ) : (
              <>
                <label style={{ display: 'block', textAlign: 'left', marginTop: '0.5rem', color: '#fff' }}>
                  Select Streams (Hold Ctrl/Cmd to select multiple):
                </label>
                <select 
                  name="faculties" 
                  multiple 
                  value={registerData.faculties} 
                  onChange={handleRegisterChange} 
                  style={{ minHeight: '120px' }}
                  required
                >
                  {streams.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </>
            )}

            {registerMessage && <p className="error">{registerMessage}</p>}
            <button type="submit">Register</button>
          </form>
        )}

        <p
          className="toggle-register"
          onClick={() => setShowRegister((s) => !s)}
          style={{ marginTop: "1.5rem", marginBottom: "0.5rem", textAlign: "center", fontWeight: "bold", fontSize: "1.1rem" }}
        >
          {showRegister ? "Back to Login" : "Don't have an account? Register"}
        </p>

        <div className="info-cards-row">
          <div className="info-card">
            <h2>About This Web App</h2>
            <p>
              The LUCT Reporting System is a digital platform designed to streamline academic monitoring, feedback, and support for students and staff.
            </p>
          </div>
          <div className="info-card">
            <h2>Key Features</h2>
            <ul>
              <li><b>Student Portal:</b> Mark attendance, submit complaints/reports, and rate lecturers/modules.</li>
              <li><b>Lecturer Portal:</b> Manage attendance, respond to complaints, monitor ratings.</li>
              <li><b>Leaders:</b> Ensure academic quality through feedback and reporting.</li>
            </ul>
          </div>
          <div className="info-card">
            <h2>How It Works</h2>
            <p>
              Register or login. Dashboards show modules and lecturers tied to your stream, with secure role-based access.
            </p>
          </div>
          <div className="info-card">
            <h2>Security & Privacy</h2>
            <p>
              All data is protected and only accessible to authorized roles. Your information is never shared outside the university.
            </p>
          </div>
        </div>

        {showAnimation && (
          <div className="registration-success-animation">
            <img src={regSuccessGif} alt="Registration Success" className="anime-animation" />
            <p>Registration Successful!</p>
          </div>
        )}
      </div>

     
    </div>
  );
}