const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all meetings
router.get('/', auth, async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const meetings = await Meeting.find();
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming meetings
router.get('/upcoming', auth, async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const meetings = await Meeting.find({ 
      date: { $gte: new Date() } 
    })
    .sort({ date: 1 })
    .limit(10);
    
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a meeting
router.get('/:id', auth, async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a meeting
router.post('/', auth, async (req, res) => {
  try {
    const Meeting = require('../models/Meeting');
    const { projectId, title, date, location, notes } = req.body;
    
    if (!projectId || !title || !date) {
      return res.status(400).json({ message: 'Project ID, title, and date are required' });
    }
    
    const meeting = new Meeting({
      projectId,
      title,
      date,
      location: location || '',
      notes: notes || '',
      createdBy: req.user.id
    });
    
    await meeting.save();
    res.status(201).json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
