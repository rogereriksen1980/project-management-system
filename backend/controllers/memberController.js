const Member = require('../models/Member');
const Project = require('../models/Project');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

// Get all members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.find()
      .select('-password')
      .sort({ name: 1 });
    
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific member
exports.getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .select('-password');
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new member
exports.createMember = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone,
      company,
      position,
      role,
      projects
    } = req.body;
    
    // Check if member already exists
    let member = await Member.findOne({ email });
    if (member) {
      return res.status(400).json({ message: 'Member already exists' });
    }
    
    // Generate a random password
    const password = crypto.randomBytes(8).toString('hex');
    
    // Create new member
    member = new Member({
      name,
      email,
      password,
      phone,
      company,
      position,
      role: role || 'member',
      projects: projects || []
    });
    
    await member.save();
    
    // Add member to specified projects
    if (projects && projects.length > 0) {
      for (const projectId of projects) {
        await Project.findByIdAndUpdate(
          projectId,
          { $addToSet: { 'members.memberId': member._id } }
        );
      }
    }
    
    // Send welcome email with password
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Project Management System',
        text: `Hi ${name},\n\nYou have been added to the Project Management System.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login and change your password.\n`,
        html: `
          <h2>Welcome to Project Management System</h2>
          <p>Hi ${name},</p>
          <p>You have been added to the Project Management System.</p>
          <p><strong>Your login credentials:</strong><br>
          Email: ${email}<br>
          Password: ${password}</p>
          <p>Please login and change your password.</p>
        `
      });
    } catch (emailErr) {
      console.error('Error sending welcome email:', emailErr);
      // Continue even if email fails
    }
    
    // Return the member without the password
    const memberResponse = { ...member._doc };
    delete memberResponse.password;
    
    res.status(201).json(memberResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a member
exports.updateMember = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      position,
      role,
      projects
    } = req.body;
    
    // Find member
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Check if email is being changed and if it already exists
    if (email && email !== member.email) {
      const existingMember = await Member.findOne({ email });
      if (existingMember) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      member.email = email;
    }
    
    // Update fields
    if (name) member.name = name;
    if (phone !== undefined) member.phone = phone;
    if (company !== undefined) member.company = company;
    if (position !== undefined) member.position = position;
    if (role) member.role = role;
    
    // Handle project changes if provided
    if (projects) {
      // Get current projects
      const currentProjects = member.projects.map(p => p.toString());
      
      // Find projects to remove
      const projectsToRemove = currentProjects.filter(p => !projects.includes(p));
      
      // Find projects to add
      const projectsToAdd = projects.filter(p => !currentProjects.includes(p));
      
      // Remove member from projects they're being removed from
      for (const projectId of projectsToRemove) {
        await Project.findByIdAndUpdate(
          projectId,
          { $pull: { 'members.memberId': member._id } }
        );
      }
      
      // Add member to new projects
      for (const projectId of projectsToAdd) {
        await Project.findByIdAndUpdate(
          projectId,
          { $addToSet: { 'members.memberId': member._id } }
        );
      }
      
      // Update member's projects
      member.projects = projects;
    }
    
    await member.save();
    
    // Return the member without the password
    const memberResponse = { ...member._doc };
    delete memberResponse.password;
    
    res.json(memberResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a member
exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Remove member from all projects
    for (const projectId of member.projects) {
      await Project.findByIdAndUpdate(
        projectId,
        { $pull: { 'members.memberId': member._id } }
      );
    }
    
    await member.remove();
    
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset member password (admin function)
exports.resetMemberPassword = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Generate a new random password
    const newPassword = crypto.randomBytes(8).toString('hex');
    
    // Update member's password
    member.password = newPassword;
    await member.save();
    
    // Send email with new password
    try {
      await sendEmail({
        to: member.email,
        subject: 'Your Password Has Been Reset',
        text: `Hi ${member.name},\n\nYour password has been reset by an administrator.\n\nYour new password: ${newPassword}\n\nPlease login and change your password.\n`,
        html: `
          <h2>Password Reset</h2>
          <p>Hi ${member.name},</p>
          <p>Your password has been reset by an administrator.</p>
          <p><strong>Your new password:</strong> ${newPassword}</p>
          <p>Please login and change your password.</p>
        `
      });
    } catch (emailErr) {
      console.error('Error sending password reset email:', emailErr);
      // Continue even if email fails
    }
    
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
