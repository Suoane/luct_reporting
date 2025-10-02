// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";
import regSuccessGif from "../assets/reg-succ.gif";

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [role, setRole] = useState("student");
  const [registerData, setRegisterData] = useState({
    name: "",
    surname: "",
    studentNumber: "",
    gmail: "",
    username: "",
    password: "",
    facultyId: "",
  });
  const [registerMessage, setRegisterMessage] = useState("");
  const [showAnimation, setShowAnimation] = useState(false);

  const faculties = [
    { id: 1, label: "Faculty of Information & Communication Technology" },
    { id: 2, label: "Faculty of Design Innovation" },
    { id: 3, label: "Faculty of Communication, Media and Broadcasting" },
    { id: 4, label: "Faculty of Architecture and the Built Environment" },
    { id: 5, label: "Faculty of Creativity in Tourism and Hospitality" },
    { id: 6, label: "Faculty of Business and Globalization" },
  ];

  // ==================== LOGIN ====================
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser({ ...data.user, token: data.token });

        // Navigate based on role
        switch (data.user.role) {
          case "admin":
            navigate("/admin");
            break;
          case "lecturer":
            navigate("/lecturer");
            break;
          case "student":
            navigate("/student");
            break;
          case "prl":
            navigate("/prl");
            break;
          case "pl":
            navigate("/pl");
            break;
          default:
            navigate("/dashboard");
        }
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (err) {
      setError("Server error. Try again later.");
      console.error("Login error:", err);
    }
  };

  // ==================== REGISTER ====================
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage("");
    try {
      const endpoint =
        role === "student"
          ? "/api/register/student"
          : `/api/register/${role}`;

      const payload =
        role === "student"
          ? {
              name: registerData.name,
              surname: registerData.surname,
              student_number: registerData.studentNumber,
              email: registerData.gmail,
              username: registerData.username,
              password: registerData.password,
              faculty: registerData.facultyId,
            }
          : {
              name: registerData.name,
              surname: registerData.surname,
              number: registerData.studentNumber,
              email: registerData.gmail,
              username: registerData.username,
              password: registerData.password,
              faculties: [registerData.facultyId],
            };

      const res = await fetch("http://localhost:5000" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        // Show animation instead of immediately hiding form
        setShowAnimation(true);

        setTimeout(() => {
          setShowAnimation(false);
          setShowRegister(false);
        }, 2000); // Show for 2 seconds

        setRegisterData({
          name: "",
          surname: "",
          studentNumber: "",
          gmail: "",
          username: "",
          password: "",
          facultyId: "",
        });
      } else {
        setRegisterMessage(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterMessage("Server error during registration");
    }
  };

  return (
    <div className="login-page">
      <form onSubmit={handleLogin}>
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
          <span
            className="password-icon"
            onClick={() => setShowPassword((p) => !p)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <button type="submit">Login</button>
      </form>

      <p
        className="toggle-register"
        onClick={() => setShowRegister((s) => !s)}
      >
        {showRegister ? "Back to Login" : "Don't have an account? Register"}
      </p>

      {showRegister && (
        <form className="register-form" onSubmit={handleRegisterSubmit}>
          <h2>Register as {role}</h2>

          <label>Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          >
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="prl">Principal Lecturer</option>
            <option value="pl">Program Leader</option>
          </select>

          <input
            type="text"
            name="name"
            placeholder="Name"
            value={registerData.name}
            onChange={handleRegisterChange}
            required
          />
          <input
            type="text"
            name="surname"
            placeholder="Surname"
            value={registerData.surname}
            onChange={handleRegisterChange}
            required
          />
          {role === "student" && (
            <input
              type="text"
              name="studentNumber"
              placeholder="Student Number"
              value={registerData.studentNumber}
              onChange={handleRegisterChange}
              required
            />
          )}
          <input
            type="email"
            name="gmail"
            placeholder="Email"
            value={registerData.gmail}
            onChange={handleRegisterChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={registerData.username}
            onChange={handleRegisterChange}
            required
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={registerData.password}
              onChange={handleRegisterChange}
              required
            />
            <span
              className="password-icon"
              onClick={() => setShowPassword((p) => !p)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <label>Faculty:</label>
          <select
            name="facultyId"
            value={registerData.facultyId}
            onChange={handleRegisterChange}
            required
          >
            <option value="">Select Faculty</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>

          <button type="submit">Register</button>
          {registerMessage && <p className="error">{registerMessage}</p>}
        </form>
      )}

      {showAnimation && (
        <div className="registration-success-animation">
          <img src={regSuccessGif} alt="Registration Success" className="anime-animation" />
          <p>Registration Successful!</p>
        </div>
      )}
    </div>
  );
}
