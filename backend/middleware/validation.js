// Validation middleware for different routes

// Validate registration input
const validateRegistration = (req, res, next) => {
  const { full_name, email, password, role } = req.body;
  const errors = [];

  // Full name validation
  if (!full_name || full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Role validation
  const validRoles = ['student', 'lecturer', 'principal_lecturer', 'program_leader'];
  if (!role || !validRoles.includes(role)) {
    errors.push('Valid role is required (student, lecturer, principal_lecturer, program_leader)');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate login input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push('Email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate report creation/update
const validateReport = (req, res, next) => {
  const {
    course_id,
    class_id,
    week_of_reporting,
    date_of_lecture,
    venue,
    scheduled_time,
    topic_taught,
    learning_outcomes,
    actual_students_present,
    total_registered_students,
  } = req.body;

  const errors = [];

  if (!course_id) errors.push('Course ID is required');
  if (!class_id) errors.push('Class ID is required');
  
  if (!week_of_reporting || week_of_reporting < 1 || week_of_reporting > 52) {
    errors.push('Week of reporting must be between 1 and 52');
  }

  if (!date_of_lecture) {
    errors.push('Date of lecture is required');
  }

  if (!venue || venue.trim().length === 0) {
    errors.push('Venue is required');
  }

  if (!scheduled_time) {
    errors.push('Scheduled time is required');
  }

  if (!topic_taught || topic_taught.trim().length === 0) {
    errors.push('Topic taught is required');
  }

  if (!learning_outcomes || learning_outcomes.trim().length === 0) {
    errors.push('Learning outcomes are required');
  }

  if (actual_students_present === undefined || actual_students_present < 0) {
    errors.push('Valid number of students present is required');
  }

  if (total_registered_students === undefined || total_registered_students < 1) {
    errors.push('Valid total number of registered students is required');
  }

  if (actual_students_present > total_registered_students) {
    errors.push('Students present cannot exceed total registered students');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate feedback input
const validateFeedback = (req, res, next) => {
  const { feedback_text, rating } = req.body;
  const errors = [];

  if (!feedback_text || feedback_text.trim().length === 0) {
    errors.push('Feedback text is required');
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    errors.push('Rating must be between 1 and 5');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate course creation/update
const validateCourse = (req, res, next) => {
  const { course_name, course_code, stream_id } = req.body;
  const errors = [];

  if (!course_name || course_name.trim().length === 0) {
    errors.push('Course name is required');
  }

  if (!course_code || course_code.trim().length === 0) {
    errors.push('Course code is required');
  }

  if (!stream_id) {
    errors.push('Stream ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate class creation/update
const validateClass = (req, res, next) => {
  const { class_name, stream_id, total_students } = req.body;
  const errors = [];

  if (!class_name || class_name.trim().length === 0) {
    errors.push('Class name is required');
  }

  if (!stream_id) {
    errors.push('Stream ID is required');
  }

  if (total_students !== undefined && total_students < 0) {
    errors.push('Total students must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate user update
const validateUserUpdate = (req, res, next) => {
  const { full_name, email } = req.body;
  const errors = [];

  if (full_name !== undefined && full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Valid email is required');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateReport,
  validateFeedback,
  validateCourse,
  validateClass,
  validateUserUpdate,
};