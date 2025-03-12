const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin, isProjectManagerOrAdmin } = require('../middleware/roles');
const {
  getAllMembers,
  getMember,
  createMember,
  updateMember,
  deleteMember,
  resetMemberPassword
} = require('../controllers/memberController');

// @route   GET /api/members
// @desc    Get all members
// @access  Private
router.get('/', auth, getAllMembers);

// @route   GET /api/members/:id
// @desc    Get a member
// @access  Private
router.get('/:id', auth, getMember);

// @route   POST /api/members
// @desc    Create a member
// @access  Private (Admin/Project Manager)
router.post('/', auth, isProjectManagerOrAdmin, createMember);

// @route   PUT /api/members/:id
// @desc    Update a member
// @access  Private (Admin/Project Manager)
router.put('/:id', auth, isProjectManagerOrAdmin, updateMember);

// @route   DELETE /api/members/:id
// @desc    Delete a member
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, deleteMember);

// @route   POST /api/members/:id/reset-password
// @desc    Reset a member's password (for admins)
// @access  Private (Admin)
router.post('/:id/reset-password', auth, isAdmin, resetMemberPassword);

module.exports = router;
