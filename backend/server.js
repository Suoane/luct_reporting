import 'dotenv/config';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "./src/db.js";
import config from "./src/config/config.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

// PUBLIC ENDPOINTS
app.get("/api/streams-public", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM streams ORDER BY name ASC");
    res.json({ success: true, streams: result.rows });
  } catch (err) {
    console.error("Error fetching streams:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/modules-public", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, code, stream_id FROM modules ORDER BY name ASC");
    res.json({ success: true, modules: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username, passwordLength: password?.length });
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username,
        u.role,
        u.password,
        CASE 
          WHEN l.id IS NOT NULL THEN json_build_object(
            'id', l.id,
            'name', l.name,
            'surname', l.surname
          )
          ELSE NULL
        END as lecturer_info
      FROM users u
      LEFT JOIN lecturers l ON l.username = u.username
      WHERE u.username = $1
    `, [username]);

    console.log('User found:', result.rows.length > 0);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('User role:', user.role);
      const match = await bcrypt.compare(password, user.password);
      console.log('Password match:', match);
      if (!match) {
        return res.json({ success: false, message: "Invalid username or password" });
      }

      delete user.password;
      const token = jwt.sign(user, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
      res.json({ success: true, token, user });
    } else {
      res.json({ success: false, message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// REGISTER STUDENT
app.post("/api/register/student", async (req, res) => {
  const { name, surname, student_number, email, username, password, faculty_id } = req.body;
  if (!faculty_id) {
    return res.status(400).json({ success: false, message: "Stream (faculty_id) is required for student registration." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      `INSERT INTO users (username, password, role, faculty_id) VALUES ($1,$2,$3,$4) RETURNING id`,
      [username, hashedPassword, "student", faculty_id]
    );
    const studentResult = await pool.query(
      `INSERT INTO students (name, surname, student_number, email, username, password, faculty_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [name, surname, student_number, email, username, hashedPassword, faculty_id, userResult.rows[0].id]
    );
    res.json({ success: true, id: userResult.rows[0].id });
  } catch (err) {
    console.error("Student registration error:", err);
    if (err.code === "23505") {
      let message = "Duplicate entry";
      if (err.detail?.includes("student_number")) message = "Student number already exists";
      else if (err.detail?.includes("email")) message = "Email already exists";
      else if (err.detail?.includes("username")) message = "Username already exists";
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// REGISTER LECTURER / PRL / PL
app.post("/api/register/:role", async (req, res) => {
  const { role } = req.params;
  const { name, surname, number, email, username, password, faculties } = req.body;

  if (!["lecturer", "pl", "prl"].includes(role))
    return res.status(400).json({ success: false, message: "Invalid role" });

  if (!faculties || !Array.isArray(faculties) || faculties.length === 0) {
    return res.status(400).json({ success: false, message: "Please select a stream" });
  }

  const stream_id = faculties[0];

  try {
    const streamCheck = await pool.query("SELECT id FROM streams WHERE id=$1", [stream_id]);
    if (streamCheck.rows.length === 0)
      return res.status(400).json({ success: false, message: `Invalid stream ID ${stream_id}` });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userResult = await pool.query(
      `INSERT INTO users (username, password, role) VALUES ($1,$2,$3) RETURNING id`,
      [username, hashedPassword, role]
    );
    
    await pool.query(
      `INSERT INTO lecturers (name, surname, username, password, stream_id, user_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name, surname, username, hashedPassword, stream_id, userResult.rows[0].id]
    );

    res.json({ success: true, id: userResult.rows[0].id });
  } catch (err) {
    console.error(`${role} registration error:`, err);
    if (err.code === "23505") {
      let message = "Duplicate entry";
      if (err.detail?.includes("username")) message = "Username already exists";
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET LECTURER INFO AND FACULTIES
app.get("/api/lecturer/info", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.id,
        l.name,
        l.surname,
        l.stream_id,
        l.module_id,
        s.name as stream_name,
        s.code as stream_code,
        m.name as module_name,
        m.code as module_code
      FROM lecturers l
      JOIN streams s ON l.stream_id = s.id
      LEFT JOIN modules m ON l.module_id = m.id
      WHERE l.username = $1
    `, [req.user.username]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lecturer not found" });
    }

    res.json({ success: true, lecturer: result.rows[0] });
  } catch (err) {
    console.error("Error fetching lecturer info:", err);
    res.status(500).json({ success: false, message: "Error fetching lecturer info" });
  }
});

app.get("/api/lecturer/faculties", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  try {
    const lecturerResult = await pool.query(
      "SELECT stream_id FROM lecturers WHERE username=$1",
      [req.user.username]
    );

    if (lecturerResult.rows.length === 0) {
      return res.json({ success: true, faculties: [] });
    }

    const stream_id = lecturerResult.rows[0].stream_id;

    const facultyResult = await pool.query(
      `SELECT s.id, s.name, s.code, 
              COALESCE(json_agg(
                json_build_object('id', m.id, 'name', m.name, 'code', m.code)
                ORDER BY m.name
              ) FILTER (WHERE m.id IS NOT NULL), '[]') as modules
       FROM streams s
       LEFT JOIN modules m ON m.stream_id = s.id
       WHERE s.id = $1
       GROUP BY s.id, s.name, s.code`,
      [stream_id]
    );

    res.json({ success: true, faculties: facultyResult.rows });
  } catch (err) {
    console.error("Error fetching faculties:", err);
    res.status(500).json({ success: false, message: "Error fetching faculties" });
  }
});

// LECTURER ATTENDANCE
app.get("/api/lecturer/attendance", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    const lecturerResult = await pool.query(`
      SELECT l.id, l.stream_id, m.code as module_code, m.name as module_name
      FROM lecturers l
      LEFT JOIN modules m ON l.module_id = m.id
      WHERE l.username = $1
    `, [req.user.username]);

    if (lecturerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lecturer not found" });
    }

    const lecturer = lecturerResult.rows[0];
    
    if (!lecturer.module_code) {
      return res.json({ success: true, attendance: [], summary: [] });
    }

    const result = await pool.query(`
      SELECT 
        sa.date_of_class,
        sa.module_code,
        sa.module_name,
        s.name as student_name,
        s.surname as student_surname,
        s.student_number,
        sa.attended,
        st.name as stream_name
      FROM student_attendance sa
      JOIN students s ON sa.student_id = s.id
      JOIN streams st ON s.faculty_id = st.id
      WHERE sa.lecturer_username = $1
        AND ($2::date IS NULL OR sa.date_of_class >= $2)
        AND ($3::date IS NULL OR sa.date_of_class <= $3)
      ORDER BY sa.date_of_class DESC, s.name
    `, [req.user.username, startDate, endDate]);

    const summaryResult = await pool.query(`
      SELECT 
        sa.module_code,
        sa.module_name,
        COUNT(DISTINCT sa.student_id) as total_students,
        COUNT(DISTINCT sa.date_of_class) as total_classes,
        ROUND(AVG(CASE WHEN sa.attended THEN 1 ELSE 0 END) * 100, 2) as attendance_rate
      FROM student_attendance sa
      WHERE sa.lecturer_username = $1
        AND ($2::date IS NULL OR sa.date_of_class >= $2)
        AND ($3::date IS NULL OR sa.date_of_class <= $3)
      GROUP BY sa.module_code, sa.module_name
    `, [req.user.username, startDate, endDate]);

    res.json({
      success: true,
      attendance: result.rows,
      summary: summaryResult.rows
    });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, message: "Error fetching attendance data" });
  }
});

// GET PRLs BY STUDENT'S STREAM
app.get("/api/prls/student/stream", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT faculty_id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json({ success: true, prls: [] });
    }

    const facultyId = studentResult.rows[0].faculty_id;

    const result = await pool.query(
      `SELECT DISTINCT l.id, l.name, l.surname, l.username 
       FROM lecturers l
       JOIN users u ON l.username = u.username
       WHERE l.stream_id = $1 AND u.role = 'prl'
       ORDER BY l.name ASC`,
      [facultyId]
    );

    res.json({ success: true, prls: result.rows });
  } catch (err) {
    console.error("Error fetching PRLs:", err);
    res.status(500).json({ success: false, message: "Error fetching PRLs" });
  }
});

// COMPLAINTS
app.post("/api/complaints", authenticateToken, checkRole(["student"]), async (req, res) => {
  const { prl_id, subject, message } = req.body;
  
  try {
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const student_id = studentResult.rows[0].id;

    await pool.query(
      `INSERT INTO complaints (student_id, prl_id, subject, message, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [student_id, prl_id, subject, message]
    );

    res.json({ success: true, message: "Complaint submitted successfully" });
  } catch (err) {
    console.error("Error submitting complaint:", err);
    res.status(500).json({ success: false, message: "Error submitting complaint" });
  }
});

app.get("/api/complaints/student", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json({ success: true, complaints: [] });
    }

    const student_id = studentResult.rows[0].id;

    const result = await pool.query(
      `SELECT 
        c.id,
        c.subject,
        c.message,
        c.status,
        c.reply,
        c.created_at,
        c.replied_at,
        l.name as prl_name,
        l.surname as prl_surname
       FROM complaints c
       JOIN lecturers l ON c.prl_id = l.id
       WHERE c.student_id = $1
       ORDER BY c.created_at DESC`,
      [student_id]
    );

    res.json({ success: true, complaints: result.rows });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ success: false, message: "Error fetching complaints" });
  }
});

app.get("/api/reports/student/complaints", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json({ success: true, complaints: [] });
    }

    const student_id = studentResult.rows[0].id;

    const result = await pool.query(
      `SELECT 
        c.id,
        c.subject,
        c.message,
        c.status,
        c.reply,
        c.created_at,
        l.name || ' ' || l.surname as lecturer_name
       FROM complaints c
       JOIN lecturers l ON c.prl_id = l.id
       WHERE c.student_id = $1
       ORDER BY c.created_at DESC`,
      [student_id]
    );

    res.json({ success: true, complaints: result.rows });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.json({ success: true, complaints: [] });
  }
});

app.get("/api/complaints/prl", authenticateToken, checkRole(["prl"]), async (req, res) => {
  try {
    const prlResult = await pool.query(
      "SELECT id FROM lecturers WHERE username=$1",
      [req.user.username]
    );

    if (prlResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "PRL not found" });
    }

    const prl_id = prlResult.rows[0].id;

    const result = await pool.query(
      `SELECT 
        c.id,
        c.subject,
        c.message,
        c.status,
        c.reply,
        c.created_at,
        c.replied_at,
        s.name as student_name,
        s.surname as student_surname,
        s.student_number
       FROM complaints c
       JOIN students s ON c.student_id = s.id
       WHERE c.prl_id = $1
       ORDER BY c.created_at DESC`,
      [prl_id]
    );

    res.json({ success: true, complaints: result.rows });
  } catch (err) {
    console.error("Error fetching complaints:", err);
    res.status(500).json({ success: false, message: "Error fetching complaints" });
  }
});

app.post("/api/complaints/:id/reply", authenticateToken, checkRole(["prl"]), async (req, res) => {
  const { reply } = req.body;
  const { id } = req.params;
  
  try {
    await pool.query(
      `UPDATE complaints 
       SET reply = $1, status = 'resolved', replied_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [reply, id]
    );

    res.json({ success: true, message: "Reply sent successfully" });
  } catch (err) {
    console.error("Error replying to complaint:", err);
    res.status(500).json({ success: false, message: "Error sending reply" });
  }
});

// RATINGS FOR PRL
app.get("/api/ratings/prl", authenticateToken, checkRole(["prl"]), async (req, res) => {
  try {
    const prlResult = await pool.query(
      "SELECT stream_id FROM lecturers WHERE username=$1",
      [req.user.username]
    );

    if (prlResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "PRL not found" });
    }

    const stream_id = prlResult.rows[0].stream_id;

    const result = await pool.query(
      `SELECT 
        r.id,
        r.course,
        r.rating,
        r.comments,
        r.created_at,
        l.name as lecturer_name,
        l.surname as lecturer_surname,
        s.name as student_name,
        s.surname as student_surname,
        st.name as stream_name
       FROM ratings r
       JOIN lecturers l ON r.lecturer_id = l.id
       JOIN students s ON r.student_id = s.id
       JOIN streams st ON r.faculty_id = st.id
       WHERE r.faculty_id = $1
       ORDER BY r.created_at DESC`,
      [stream_id]
    );

    const summaryResult = await pool.query(
      `SELECT 
        l.name as lecturer_name,
        l.surname as lecturer_surname,
        r.course,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as total_ratings
       FROM ratings r
       JOIN lecturers l ON r.lecturer_id = l.id
       WHERE r.faculty_id = $1
       GROUP BY l.id, l.name, l.surname, r.course
       ORDER BY average_rating DESC`,
      [stream_id]
    );

    res.json({ 
      success: true, 
      ratings: result.rows,
      summary: summaryResult.rows
    });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ success: false, message: "Error fetching ratings" });
  }
});

app.get("/api/ratings/pl/prls", authenticateToken, checkRole(["pl"]), async (req, res) => {
  try {
    res.json({ 
      success: true, 
      ratings: [],
      summary: []
    });
  } catch (err) {
    console.error("Error fetching PRL ratings:", err);
    res.status(500).json({ success: false, message: "Error fetching PRL ratings" });
  }
});

app.get("/api/lecturers/student/stream", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT faculty_id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json({ success: true, lecturers: [] });
    }

    const facultyId = studentResult.rows[0].faculty_id;

    const result = await pool.query(
      `SELECT DISTINCT l.id, l.name, l.surname, l.username 
       FROM lecturers l
       WHERE l.stream_id = $1
       ORDER BY l.name ASC`,
      [facultyId]
    );

    res.json({ success: true, lecturers: result.rows });
  } catch (err) {
    console.error("Error fetching lecturers:", err);
    res.status(500).json({ success: false, message: "Error fetching lecturers" });
  }
});

app.get("/api/student/modules/stream", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT faculty_id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json([]);
    }

    const facultyId = studentResult.rows[0].faculty_id;

    const modulesResult = await pool.query(
      "SELECT id, code, name FROM modules WHERE stream_id=$1 ORDER BY name ASC",
      [facultyId]
    );

    res.json(modulesResult.rows);
  } catch (err) {
    console.error("Error fetching modules:", err);
    res.json([]);
  }
});

// STUDENT ATTENDANCE
app.post("/api/student/attendance", authenticateToken, checkRole(["student"]), async (req, res) => {
  const { module_code, module_name, date_of_class, lecturer_username } = req.body;
  
  try {
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const studentId = studentResult.rows[0].id;

    const check = await pool.query(
      "SELECT id FROM student_attendance WHERE student_id=$1 AND module_code=$2 AND date_of_class=$3",
      [studentId, module_code, date_of_class]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Attendance already marked" });
    }

    await pool.query(
      `INSERT INTO student_attendance 
       (student_id, module_code, module_name, date_of_class, attended, lecturer_username) 
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [studentId, module_code, module_name, date_of_class, true, lecturer_username]
    );

    res.json({ success: true, message: "Attendance marked and lecturer notified" });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/student/attendance", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json([]);
    }

    const studentId = studentResult.rows[0].id;

    const result = await pool.query(
      "SELECT module_code, module_name, date_of_class, attended, lecturer_username FROM student_attendance WHERE student_id=$1 ORDER BY date_of_class DESC",
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch attendance error:", err);
    res.json([]);
  }
});

// REPORTS
app.post("/api/reports", authenticateToken, checkRole(["lecturer", "pl"]), async (req, res) => {
  const data = req.body;
  try {
    const lecturerFacultyCheck = await pool.query(`
      SELECT l.stream_id
      FROM lecturers l
      JOIN streams s ON l.stream_id = s.id
      WHERE l.username = $1 AND s.name = $2
    `, [req.user.username, data.facultyName]);

    if (lecturerFacultyCheck.rows.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not authorized to submit reports for this faculty" 
      });
    }

    const sql = `
      INSERT INTO reports 
      (faculty_name, class_name, week_of_reporting, date_of_lecture, course_name, course_code, 
       lecturer_name, actual_students, total_students, venue, scheduled_time, topic, 
       learning_outcomes, recommendations, status, submitted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending',CURRENT_TIMESTAMP) 
      RETURNING id
    `;

    const result = await pool.query(sql, [
      data.facultyName,
      data.className,
      data.weekOfReporting,
      data.dateOfLecture,
      data.moduleName || data.courseName,
      data.moduleCode || data.courseCode,
      data.lecturerName,
      data.actualStudents,
      data.totalStudents,
      data.venue,
      data.scheduledTime,
      data.topic,
      data.learningOutcomes,
      data.recommendations,
    ]);

    const prlNotificationResult = await pool.query(`
      SELECT DISTINCT u.username
      FROM users u
      JOIN lecturers l ON u.username = l.username
      JOIN streams s ON l.stream_id = s.id
      WHERE u.role = 'prl' AND s.name = $1
    `, [data.facultyName]);

    res.json({ 
      success: true, 
      message: "Report submitted successfully", 
      id: result.rows[0].id,
      prlNotified: prlNotificationResult.rows.length > 0
    });
  } catch (err) {
    console.error("Error inserting report:", err);
    res.status(500).json({ success: false, message: "Error submitting report" });
  }
});

app.get("/api/reports", authenticateToken, async (req, res) => {
  try {
    let query = "";
    let params = [];

    if (req.user.role === 'prl') {
      query = `
        SELECT r.* 
        FROM reports r
        WHERE r.faculty_name IN (
          SELECT s.name
          FROM streams s
          JOIN lecturers l ON s.id = l.stream_id
          WHERE l.username = $1
        )
        ORDER BY r.submitted_at DESC
      `;
      params = [req.user.username];
    } else {
      query = "SELECT * FROM reports ORDER BY submitted_at DESC";
    }

    const result = await pool.query(query, params);
    res.json({ success: true, reports: result.rows });
  } catch (err) {
    console.error("Error fetching reports:", err);
    res.status(500).json({ success: false, message: "Error fetching reports" });
  }
});

app.get("/api/lecturer/reports", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  try {
    const lecturerResult = await pool.query(
      "SELECT l.id, CONCAT(l.name, ' ', l.surname) as full_name FROM lecturers l WHERE l.username = $1",
      [req.user.username]
    );

    if (lecturerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lecturer not found' });
    }

    const result = await pool.query(
      "SELECT * FROM reports WHERE lecturer_name=$1 ORDER BY submitted_at DESC",
      [lecturerResult.rows[0].full_name]
    );
    res.json({ success: true, reports: result.rows });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, message: 'Error fetching reports' });
  }
});

app.post("/api/reports/:id/feedback", authenticateToken, checkRole(["prl"]), async (req, res) => {
  const { feedback } = req.body;
  try {
    await pool.query("UPDATE reports SET feedback=$1 WHERE id=$2", [feedback, req.params.id]);
    res.json({ success: true, message: "Feedback added" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// RATINGS
const ratingDescriptions = {
  1: "Poor",
  2: "Below average",
  3: "Average",
  4: "Satisfactory",
  5: "Extremely satisfactory"
};

app.post("/api/ratings", authenticateToken, checkRole(["student"]), async (req, res) => {
  const { lecturer_username, module_id, rating, comments } = req.body;
  const finalComments = comments || ratingDescriptions[rating] || "No comment";

  try {
    const studentResult = await pool.query(
      "SELECT id FROM students WHERE username = $1",
      [req.user.username]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const student_id = studentResult.rows[0].id;

    const lecturerResult = await pool.query(
      "SELECT id FROM lecturers WHERE username = $1",
      [lecturer_username]
    );
    if (lecturerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lecturer not found" });
    }
    const lecturer_id = lecturerResult.rows[0].id;

    const moduleResult = await pool.query(
      "SELECT stream_id, name FROM modules WHERE id = $1",
      [module_id]
    );
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Module not found" });
    }
    const faculty_id = moduleResult.rows[0].stream_id;
    const course = moduleResult.rows[0].name;

    await pool.query(
      "INSERT INTO ratings (student_id, lecturer_id, faculty_id, course, rating, comments, created_at) VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)",
      [student_id, lecturer_id, faculty_id, course, rating, finalComments]
    );
    
    res.json({ success: true, message: "Rating submitted successfully" });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/lecturer/ratings", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  try {
    const lecturerResult = await pool.query(
      "SELECT id FROM lecturers WHERE username = $1",
      [req.user.username]
    );

    if (lecturerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Lecturer not found" });
    }

    const lecturer_id = lecturerResult.rows[0].id;

    const result = await pool.query(`
      SELECT 
        r.course,
        f.name as faculty_name,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as total_ratings,
        json_agg(
          json_build_object(
            'rating', r.rating,
            'comments', r.comments,
            'submitted_at', r.created_at
          ) ORDER BY r.created_at DESC
        ) as recent_ratings
      FROM ratings r
      JOIN streams f ON r.faculty_id = f.id
      WHERE r.lecturer_id = $1
      GROUP BY r.course, f.name
      ORDER BY average_rating DESC
    `, [lecturer_id]);

    res.json({ success: true, ratings: result.rows });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ success: false, message: "Error fetching ratings" });
  }
});

// ADMIN ENDPOINTS
app.get("/api/streams", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name FROM streams ORDER BY name ASC");
    res.json({ success: true, streams: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/modules", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, code, stream_id FROM modules ORDER BY name ASC");
    res.json({ success: true, modules: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/users", authenticateToken, checkRole(["admin"]), async (req, res) => {
  const { username, password, name, surname, email, role, faculty_id, program_id, student_number } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const userResult = await pool.query(
      'INSERT INTO users (username, password, role, name, surname) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, hashedPassword, role, name, surname]
    );
    
    if (role === 'student') {
      if (!student_number) {
        throw new Error('Student number is required for student users');
      }
      await pool.query(
        'INSERT INTO students (name, surname, username, password, student_number, faculty_id, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [name, surname, username, hashedPassword, student_number, faculty_id, userResult.rows[0].id]
      );
    } else if (['lecturer', 'prl', 'pl'].includes(role)) {
      await pool.query(
        'INSERT INTO lecturers (name, surname, username, password, stream_id, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [name, surname, username, hashedPassword, faculty_id, userResult.rows[0].id]
      );
    }
    
    await pool.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'User created successfully',
      userId: userResult.rows[0].id
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating user:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Error creating user'
    });
  }
});

app.get("/api/users", authenticateToken, checkRole(["admin"]), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        u.role,
        u.faculty_id,
        COALESCE(s.name, l.name) as name,
        COALESCE(s.surname, l.surname) as surname,
        s.email,
        s.student_number,
        s.id as student_id,
        l.id as lecturer_id,
        l.stream_id
      FROM users u
      LEFT JOIN students s ON u.username = s.username
      LEFT JOIN lecturers l ON u.username = l.username
      ORDER BY u.role, u.username
    `);

    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

app.delete("/api/users/:id", authenticateToken, checkRole(["admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query('SELECT username, role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    
    await pool.query('BEGIN');
    
    if (user.role === 'student') {
      await pool.query('DELETE FROM student_attendance WHERE student_id IN (SELECT id FROM students WHERE username = $1)', [user.username]);
      await pool.query('DELETE FROM ratings WHERE student_id IN (SELECT id FROM students WHERE username = $1)', [user.username]);
      await pool.query('DELETE FROM complaints WHERE student_id IN (SELECT id FROM students WHERE username = $1)', [user.username]);
      await pool.query('DELETE FROM students WHERE username = $1', [user.username]);
    } else if (['lecturer', 'prl', 'pl'].includes(user.role)) {
      const lecturerResult = await pool.query('SELECT id FROM lecturers WHERE username = $1', [user.username]);
      if (lecturerResult.rows.length > 0) {
        const lecturerId = lecturerResult.rows[0].id;
        await pool.query('DELETE FROM ratings WHERE lecturer_id = $1', [lecturerId]);
        await pool.query('DELETE FROM complaints WHERE prl_id = $1', [lecturerId]);
      }
      await pool.query('DELETE FROM lecturers WHERE username = $1', [user.username]);
    }
    
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    await pool.query('COMMIT');
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// COURSES
app.post("/api/courses", authenticateToken, checkRole(["pl"]), async (req, res) => {
  const { course_name, course_code, lecturer_username } = req.body;
  try {
    await pool.query(
      "INSERT INTO courses (course_name, course_code, lecturer_username) VALUES ($1,$2,$3)",
      [course_name, course_code, lecturer_username]
    );
    res.json({ success: true, message: "Course added & assigned" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/courses", authenticateToken, checkRole(["prl", "pl"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY id DESC");
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// LECTURER PROGRAMS
app.get("/api/lecturer/programs", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  try {
    const lecturerResult = await pool.query(
      "SELECT stream_id, module_id FROM lecturers WHERE username=$1",
      [req.user.username]
    );

    if (lecturerResult.rows.length === 0) {
      return res.json({ success: true, programs: [] });
    }

    const { stream_id, module_id } = lecturerResult.rows[0];

    const result = await pool.query(`
      SELECT 
        s.id as stream_id,
        s.name as faculty_name,
        s.code as faculty_code,
        m.code as module_code,
        m.name as module_name,
        array_agg(m.code) as module_codes,
        array_agg(m.name) as module_names
      FROM streams s
      LEFT JOIN modules m ON m.stream_id = s.id AND m.id = $2
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.code, m.code, m.name
    `, [stream_id, module_id]);

    res.json({ success: true, programs: result.rows });
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ success: false, message: "Error fetching programs" });
  }
});

// GET LECTURERS (excluding PRLs) BY STUDENT'S STREAM
app.get("/api/lecturers/student/stream/regular", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const studentResult = await pool.query(
      "SELECT faculty_id FROM students WHERE username=$1",
      [req.user.username]
    );

    if (studentResult.rows.length === 0) {
      return res.json({ success: true, lecturers: [] });
    }

    const facultyId = studentResult.rows[0].faculty_id;

    const result = await pool.query(
      `SELECT DISTINCT l.id, l.name, l.surname, l.username 
       FROM lecturers l
       JOIN users u ON l.username = u.username
       WHERE l.stream_id = $1 AND u.role = 'lecturer'
       ORDER BY l.name ASC`,
      [facultyId]
    );

    res.json({ success: true, lecturers: result.rows });
  } catch (err) {
    console.error("Error fetching lecturers:", err);
    res.status(500).json({ success: false, message: "Error fetching lecturers" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL");

    const adminUsername = "admin";
    const adminPassword = "adminbetter";
    const adminCheck = await pool.query("SELECT id FROM users WHERE username = $1 AND role = 'admin'", [adminUsername]);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
        [adminUsername, hashedPassword, "admin"]
      );
      console.log("Default admin user created: username='admin', password='adminbetter'");
    } else {
      console.log("Default admin user already exists.");
    }
  } catch (err) {
    console.error("Could not connect to PostgreSQL or create admin user", err.message);
  }
  console.log(`Server running on port ${PORT}`);
});