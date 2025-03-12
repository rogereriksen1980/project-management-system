const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get tasks for current user
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const tasks = await Task.find({ 
      responsibleMemberId: req.user.id,
      status: { $ne: 'closed' }
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific task
router.get('/:id', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.patch('/:id', auth, async (req, res) => {
  try {
    const Task = require('../models/Task');
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Update fields
    const updateFields = ['description', 'responsibleMemberId', 'dueDate', 'status'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });
    
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
