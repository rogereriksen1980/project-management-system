const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all members
router.get('/', auth, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const members = await Member.find().select('-password');
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific member
router.get('/:id', auth, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const member = await Member.findById(req.params.id).select('-password');
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new member
router.post('/', auth, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const { name, email, password, phone, company, position, role } = req.body;
    
    // Check if member already exists
    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return res.status(400).json({ message: 'Member already exists' });
    }
    
    const member = new Member({
      name,
      email,
      password,
      phone: phone || '',
      company: company || '',
      position: position || '',
      role: role || 'member'
    });
    
    await member.save();
    
    // Remove password from response
    const memberResponse = member.toObject();
    delete memberResponse.password;
    
    res.status(201).json(memberResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a member
router.put('/:id', auth, async (req, res) => {
  try {
    const Member = require('../models/Member');
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    const { name, email, phone, company, position, role } = req.body;
    
    if (name) member.name = name;
    if (email) member.email = email;
    if (phone !== undefined) member.phone = phone;
    if (company !== undefined) member.company = company;
    if (position !== undefined) member.position = position;
    if (role) member.role = role;
    
    await member.save();
    
    // Remove password from response
    const memberResponse = member.toObject();
    delete memberResponse.password;
    
    res.json(memberResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
