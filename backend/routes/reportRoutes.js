const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isProjectManagerOrAdmin } = require('../middleware/roles');
const {
  getProjectStatusReport,
  getMemberTaskReport
} = require('../controllers/reportController');

// @route   GET /api/reports/projects
// @desc    Get project status report
// @access  Private (Admin/Project Manager)
router.get('/projects', auth, isProjectManagerOrAdmin, getProjectStatusReport);

// @route   GET /api/reports/members
// @desc    Get member task report
// @access  Private (Admin/Project Manager)
router.get('/members', auth, isProjectManagerOrAdmin, getMemberTaskReport);

module.exports = router;
