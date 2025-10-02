import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "luct_reporting",
  password: "0883",
  port: 5432,
});

const JWT_SECRET = "supersecretkey";

// =================== AUTH MIDDLEWARE ===================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
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

// =================== LOGIN ===================
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT id, username, role, password FROM users WHERE username=$1",
      [username]
    );
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.json({ success: false, message: "Invalid username or password" });

      delete user.password;
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "2h" });
      res.json({ success: true, token, user });
    } else {
      res.json({ success: false, message: "Invalid username or password" });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================== REGISTER STUDENT ===================
app.post("/api/register/student", async (req, res) => {
  const { name, surname, student_number, email, username, password, faculty } = req.body;

  try {
    const facultyCheck = await pool.query("SELECT id FROM faculties WHERE id=$1", [faculty]);
    if (facultyCheck.rows.length === 0)
      return res.status(400).json({ success: false, message: "Invalid faculty selected" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const studentResult = await pool.query(
      `INSERT INTO students (name, surname, student_number, email, username, password, faculty_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [name, surname, student_number, email, username, hashedPassword, faculty]
    );

    await pool.query(
      `INSERT INTO users (username, password, role) VALUES ($1,$2,$3)`,
      [username, hashedPassword, "student"]
    );

    res.json({ success: true, id: studentResult.rows[0].id });
  } catch (err) {
    console.error("Student registration error:", err);
    if (err.code === "23505") {
      let message = "Duplicate entry";
      if (err.detail.includes("student_number")) message = "Student number already exists";
      else if (err.detail.includes("email")) message = "Email already exists";
      else if (err.detail.includes("username")) message = "Username already exists";
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// =================== REGISTER LECTURER / PRL / PL ===================
app.post("/api/register/:role", async (req, res) => {
  const { role } = req.params;
  const { name, surname, number, email, username, password, faculties } = req.body;

  if (!["lecturer", "pl", "prl"].includes(role))
    return res.status(400).json({ success: false, message: "Invalid role" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const lecturerResult = await pool.query(
      `INSERT INTO lecturers (name, surname, number, email, username, password)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name, surname, number || null, email, username, hashedPassword]
    );

    if (faculties && Array.isArray(faculties)) {
      for (const faculty_id of faculties) {
        const facultyCheck = await pool.query("SELECT id FROM faculties WHERE id=$1", [faculty_id]);
        if (facultyCheck.rows.length === 0)
          return res.status(400).json({ success: false, message: `Invalid faculty ID ${faculty_id}` });

        await pool.query(
          `INSERT INTO lecturer_faculties (lecturer_id, faculty_id) VALUES ($1,$2)`,
          [lecturerResult.rows[0].id, faculty_id]
        );
      }
    }

    await pool.query(
      `INSERT INTO users (username, password, role) VALUES ($1,$2,$3)`,
      [username, hashedPassword, role]
    );

    res.json({ success: true, id: lecturerResult.rows[0].id });
  } catch (err) {
    console.error(`${role} registration error:`, err);
    if (err.code === "23505") {
      let message = "Duplicate entry";
      if (err.detail.includes("email")) message = "Email already exists";
      else if (err.detail.includes("username")) message = "Username already exists";
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// =================== REPORTS ===================
app.post("/api/reports", authenticateToken, checkRole(["lecturer", "pl"]), async (req, res) => {
  const data = req.body;
  const sql = `
    INSERT INTO reports 
    (faculty_name, class_name, week_of_reporting, date_of_lecture, course_name, course_code, lecturer_name, actual_students, total_students, venue, scheduled_time, topic, learning_outcomes, recommendations)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id
  `;
  try {
    const result = await pool.query(sql, [
      data.facultyName,
      data.className,
      data.weekOfReporting,
      data.dateOfLecture,
      data.courseName,
      data.courseCode,
      data.lecturerName,
      data.actualStudents,
      data.totalStudents,
      data.venue,
      data.scheduledTime,
      data.topic,
      data.learningOutcomes,
      data.recommendations,
    ]);
    res.json({ success: true, message: "Report submitted", id: result.rows[0].id });
  } catch (err) {
    console.error("Error inserting report:", err);
    res.status(500).json({ success: false, message: "Error submitting report" });
  }
});

// =================== GET REPORTS ===================
app.get("/api/reports", authenticateToken, checkRole(["admin", "prl", "pl"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reports ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/api/lecturer/reports", authenticateToken, checkRole(["lecturer"]), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM reports WHERE lecturer_name=$1 ORDER BY id DESC",
      [req.user.username]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// =================== PRL Feedback ===================
app.post("/api/reports/:id/feedback", authenticateToken, checkRole(["prl"]), async (req, res) => {
  const { feedback } = req.body;
  try {
    await pool.query("UPDATE reports SET feedback=$1 WHERE id=$2", [feedback, req.params.id]);
    res.json({ success: true, message: "Feedback added" });
  } catch (err) {
    res.status(500).json(err);
  }
});

// =================== RATINGS ===================
const ratingDescriptions = {
  1: "Poor",
  2: "Below average",
  3: "Average",
  4: "Satisfactory",
  5: "Extremely satisfactory"
};

app.post("/api/ratings", authenticateToken, checkRole(["student"]), async (req, res) => {
  const { lecturer_username, module_code, rating } = req.body;
  const comments = ratingDescriptions[rating] || "No comment";

  try {
    await pool.query(
      "INSERT INTO ratings (student_username, lecturer_username, module_code, rating, comments) VALUES ($1,$2,$3,$4,$5)",
      [req.user.username, lecturer_username, module_code, rating, comments]
    );
    res.json({ success: true, message: "Rating submitted", comments });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// =================== COURSES ===================
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
    const result = await pool.query("SELECT * FROM courses");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// =================== GET LECTURERS FOR STUDENT DROPDOWN ===================
app.get("/api/lecturers", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, surname, username FROM lecturers ORDER BY name ASC");
    res.json({ success: true, lecturers: result.rows });
  } catch (err) {
    console.error("Error fetching lecturers:", err);
    res.status(500).json({ success: false, message: "Error fetching lecturers" });
  }
});

// =================== STUDENT PROGRAMS & MODULES ===================
// Get student's programs (if student needs to choose program)
app.get("/api/student/programs", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name 
       FROM programs p
       JOIN students s ON s.faculty_id = p.faculty_id
       WHERE s.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, programs: result.rows });
  } catch (err) {
    console.error("Error fetching programs:", err);
    res.status(500).json({ success: false, message: "Error fetching programs" });
  }
});

// Get modules by program
app.get("/api/student/modules/:programId", authenticateToken, checkRole(["student"]), async (req, res) => {
  const { programId } = req.params;
  try {
    const result = await pool.query(
      "SELECT code, name FROM modules WHERE program_id=$1 ORDER BY name ASC",
      [programId]
    );
    res.json({ success: true, modules: result.rows });
  } catch (err) {
    console.error("Error fetching modules:", err);
    res.status(500).json({ success: false, message: "Error fetching modules" });
  }
});

// =================== STUDENT ATTENDANCE ===================
app.post("/api/student/attendance", authenticateToken, checkRole(["student"]), async (req, res) => {
  const { module_code, module_name, date_of_class } = req.body;
  try {
    const check = await pool.query(
      "SELECT id FROM student_attendance WHERE student_id=$1 AND module_code=$2 AND date_of_class=$3",
      [req.user.id, module_code, date_of_class]
    );
    if (check.rows.length > 0) return res.status(400).json({ success: false, message: "Attendance already marked" });

    await pool.query(
      "INSERT INTO student_attendance (student_id, module_code, module_name, date_of_class, attended) VALUES ($1,$2,$3,$4,$5)",
      [req.user.id, module_code, module_name, date_of_class, true]
    );

    res.json({ success: true, message: "Attendance marked" });
  } catch (err) {
    console.error("Attendance error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/student/attendance", authenticateToken, checkRole(["student"]), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT module_code, module_name, date_of_class, attended FROM student_attendance WHERE student_id=$1 ORDER BY date_of_class DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch attendance error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =================== SERVER LISTEN ===================
app.listen(5000, () => console.log("Server running on port 5000"));
