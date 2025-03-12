const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isProjectMember, isProjectManagerOrAdmin } = require('../middleware/roles');
const {
  getAllMeetings,
  getUpcomingMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  addTask,
  sendMeetingNotes,
  closeCompletedTasks
} = require('../controllers/meetingController');

// @route   GET /api/meetings
// @desc    Get all meetings
// @access  Private
router.get('/', auth, getAllMeetings);

// @route   GET /api/meetings/upcoming
// @desc    Get upcoming meetings
// @access  Private
router.get('/upcoming', auth, getUpcomingMeetings);

// @route   GET /api/meetings/:id
// @desc    Get a meeting
// @access  Private (Project Members)
router.get('/:id', auth, getMeeting);

// @route   POST /api/meetings
// @desc    Create a meeting
// @access  Private (Project Manager/Admin)
router.post('/', auth, isProjectManagerOrAdmin, createMeeting);

// @route   PUT /api/meetings/:id
// @desc    Update a meeting
// @access  Private (Project Manager/Admin)
router.put('/:id', auth, isProjectManagerOrAdmin, updateMeeting);

// @route   POST /api/meetings/:id/tasks
// @desc    Add a task to a meeting
// @access  Private (Project Manager/Admin)
router.post('/:id/tasks', auth, isProjectManagerOrAdmin, addTask);

// @route   POST /api/meetings/:id/send-notes
// @desc    Send meeting notes as PDF
// @access  Private (Project Manager/Admin)
router.post('/:id/send-notes', auth, isProjectManagerOrAdmin, sendMeetingNotes);

// @route   POST /api/meetings/:id/close-completed-tasks
// @desc    Close completed tasks
// @access  Private (Project Manager/Admin)
router.post('/:id/close-completed-tasks', auth, isProjectManagerOrAdmin, closeCompletedTasks);

module.exports = router;
