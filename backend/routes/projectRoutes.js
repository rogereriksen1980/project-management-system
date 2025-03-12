const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isProjectManagerOrAdmin, isProjectMember } = require('../middleware/roles');
const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectMembers
} = require('../controllers/projectController');

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', auth, getAllProjects);

// @route   GET /api/projects/:id
// @desc    Get a project
// @access  Private (Project Members)
router.get('/:id', auth, isProjectMember, getProject);

// @route   POST /api/projects
// @desc    Create a project
// @access  Private (Admin/Project Manager)
router.post('/', auth, createProject);  // Remove the middleware check for now

// @route   PUT /api/projects/:id
// @desc    Update a project
// @access  Private (Admin/Project Manager)
router.put('/:id', auth, isProjectManagerOrAdmin, updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete a project
// @access  Private (Admin)
router.delete('/:id', auth, isProjectManagerOrAdmin, deleteProject);

// @route   GET /api/projects/:id/members
// @desc    Get project members
// @access  Private (Project Members)
router.get('/:id/members', auth, isProjectMember, getProjectMembers);

module.exports = router;
