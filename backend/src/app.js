const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/faculties', require('./routes/faculties.routes'));
app.use('/api/faculties-programs', require('./routes/faculties-programs.routes'));
app.use('/api/programs', require('./routes/programs.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/lecturers', require('./routes/lecturers.routes'));
app.use('/api/courses', require('./routes/courses.routes'));
app.use('/api/classes', require('./routes/classes.routes'));
app.use('/api', require('./routes/modules.routes'));
app.use('/api', require('./routes/attendance.routes'));

module.exports = app;
