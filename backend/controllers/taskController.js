const Task = require('../models/Task');
const crypto = require('crypto');
const config = require('../config');

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('projectId', 'name')
      .populate('responsibleMemberId', 'name')
      .populate('meetingId', 'title date')
      .sort({ dueDate: 1 });
    
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks for current user
exports.getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      responsibleMemberId: req.user.id,
      status: { $ne: 'closed' }
    })
    .populate('projectId', 'name')
    .populate('meetingId', 'title date')
    .sort({ dueDate: 1 });
    
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific task
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('responsibleMemberId', 'name email')
      .populate('meetingId', 'title date')
      .populate('comments.createdBy', 'name');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    // Find the task
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if status is being updated to completed
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedDate = new Date();
    }
    
    // Update fields
    const updateFields = ['description', 'responsibleMemberId', 'dueDate', 'status', 'completedDate'];
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
};

// Add a comment to a task
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.comments.push({
      text,
      createdBy: req.user.id
    });
    
    await task.save();
    
    // Get the newly added comment with populated user
    const updatedTask = await Task.findById(req.params.id)
      .populate('comments.createdBy', 'name');
      
    const newComment = updatedTask.comments[updatedTask.comments.length - 1];
    
    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark task as completed via token
exports.completeTaskByToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    
    // Validate token
    const expectedToken = crypto.createHmac('sha256', config.jwtSecret)
                               .update(id.toString())
                               .digest('hex');
                               
    if (token !== expectedToken) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Find and update task
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.status = 'completed';
    task.completedDate = new Date();
    
    await task.save();
    
    // Return a simple HTML page with confirmation
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Task Completed</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            text-align: center;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          .success {
            color: #4CAF50;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .task-details {
            text-align: left;
            margin: 20px 0;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
          }
          .button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓ Task Completed!</div>
          <div class="task-details">
            <p><strong>Task:</strong> ${task.description}</p>
            <p><strong>Completed on:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>The task has been marked as completed successfully.</p>
          <a href="${config.baseUrl}" class="button">Go to Project Manager</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
