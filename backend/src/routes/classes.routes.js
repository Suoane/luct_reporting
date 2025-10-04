const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { getLecturerClasses, getClassDetails } = require('../controllers/classes.controller');

// Get all classes for a lecturer
router.get('/lecturer/classes', auth, getLecturerClasses);

// Get detailed information for a specific class
router.get('/lecturer/classes/:moduleId', auth, getClassDetails);

module.exports = router;