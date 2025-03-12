const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllTasks,
  getMyTasks,
  getTask,
  updateTask,
  addComment,
  completeTaskByToken
} = require('../controllers/taskController');

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', auth, getAllTasks);

// @route   GET /api/tasks/my-tasks
// @desc    Get tasks for current user
// @access  Private
router.get('/my-tasks', auth, getMyTasks);

// @route   GET /api/tasks/:id
// @desc    Get a task
// @access  Private
router.get('/:id', auth, getTask);

// @route   PATCH /api/tasks/:id
// @desc    Update a task
// @access  Private
router.patch('/:id', auth, updateTask);

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/:id/comments', auth, addComment);

// @route   GET /api/tasks/:id/complete
// @desc    Complete a task via token (for email links)
// @access  Public
router.get('/:id/complete', completeTaskByToken);

module.exports = router;
