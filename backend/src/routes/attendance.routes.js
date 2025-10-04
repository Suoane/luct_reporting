const express = require('express');
const router = express.Router();
const { getLecturerAttendance } = require('../controllers/attendance.controller');
const auth = require('../middlewares/auth.middleware');

// Get attendance for the current lecturer
router.get('/lecturer/attendance', auth, getLecturerAttendance);

module.exports = router;