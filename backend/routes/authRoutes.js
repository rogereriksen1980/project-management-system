const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const config = require('../config');

// Register user
router.post('/register', async (req, res) => {
  try {
    const Member = require('../models/Member');
    const { name, email, password } = req.body;

    // Check if member already exists
    let member = await Member.findOne({ email });
    if (member) {
      return res.status(400).json({ message: 'Member already exists' });
    }

    // Check if this is the first member (make them admin)
    const memberCount = await Member.countDocuments();
    const role = memberCount === 0 ? 'admin' : 'member';

    // Create new member
    member = new Member({
      name,
      email,
      password,
      role
    });

    await member.save();

    // Create JWT token
    const payload = {
      user: {
        id: member.id,
        role: member.role
      }
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: member.id, 
            name: member.name, 
            email: member.email, 
            role: member.role 
          } 
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const Member = require('../models/Member');
    const { email, password } = req.body;

    // Check if member exists
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: member.id,
        role: member.role
      }
    };

    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          token, 
          user: { 
            id: member.id, 
            name: member.name, 
            email: member.email, 
            role: member.role 
          } 
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const member = await Member.findById(req.user.id).select('-password');
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
