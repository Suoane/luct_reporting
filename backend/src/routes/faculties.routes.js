const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all faculties
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/faculties - Fetching faculties');
        const result = await db.query('SELECT * FROM faculties ORDER BY name');
        console.log('Faculties fetched:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error getting faculties:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;