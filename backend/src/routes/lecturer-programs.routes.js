import express from 'express';
import { getLecturerPrograms } from '../controllers/programs.controller.js';
import auth from '../middlewares/auth.middleware.js';
import checkRole from '../middlewares/role.middleware.js';

const router = express.Router();

// Get all programs for a lecturer
router.get('/', auth, checkRole(['lecturer']), getLecturerPrograms);

export default router;