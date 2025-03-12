const Member = require('../models/Member');
const jwt = require('jsonwebtoken');
const config = require('../config');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

// Register a new member
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, company, position } = req.body;

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
      phone,
      company,
      position,
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
      { expiresIn: config.jwtExpire },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: member.id, name: member.name, email: member.email, role: member.role } });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login member
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if member exists
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await member.comparePassword(password);
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
      { expiresIn: config.jwtExpire },
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
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const member = await Member.findOne({ email });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Set token and expiry
    member.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    member.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    
    await member.save();
    
    // Create reset URL
    const resetUrl = `${config.baseUrl}/reset-password/${resetToken}`;
    
    // Send email
    await sendEmail({
      to: member.email,
      subject: 'Password Reset',
      text: `You requested a password reset. Please go to: ${resetUrl} to reset your password. This link is valid for 1 hour.`,
      html: `
        <p>You requested a password reset.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>This link is valid for 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });
    
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Hash the token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Find member with this token and valid expiry
    const member = await Member.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!member) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Set new password
    member.password = password;
    member.resetPasswordToken = undefined;
    member.resetPasswordExpires = undefined;
    
    await member.save();
    
    res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const member = await Member.findById(req.user.id).select('-password');
    res.json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
