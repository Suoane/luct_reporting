const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const db = require('../db');

// Get all faculties
router.get('/faculties', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name FROM faculties ORDER BY name'
    );
    res.json({ success: true, faculties: result.rows });
  } catch (err) {
    console.error('Error getting faculties:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get modules by faculty
router.get('/lecturer/modules/:facultyId', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT m.id, m.name, m.code FROM modules m ' +
      'JOIN lecturer_modules lm ON m.id = lm.module_id ' +
      'WHERE m.faculty_id = $1 AND lm.lecturer_id = $2 ' +
      'ORDER BY m.name',
      [req.params.facultyId, req.user.id]
    );
    res.json({ success: true, modules: result.rows });
  } catch (err) {
    console.error('Error getting modules:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
