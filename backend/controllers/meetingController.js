const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Member = require('../models/Member');
const { generateMeetingNotesPDF } = require('../utils/pdfGenerator');
const { sendEmail } = require('../utils/email');

// Get all meetings
exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find()
      .populate('projectId', 'name')
      .sort({ date: -1 });
    
    res.json(meetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get upcoming meetings
exports.getUpcomingMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ 
      date: { $gte: new Date() } 
    })
    .populate('projectId', 'name')
    .sort({ date: 1 })
    .limit(10);
    
    // Transform the data to include projectName
    const formattedMeetings = meetings.map(meeting => ({
      _id: meeting._id,
      projectId: meeting.projectId._id,
      projectName: meeting.projectId.name,
      title: meeting.title,
      date: meeting.date,
      location: meeting.location
    }));
    
    res.json(formattedMeetings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific meeting
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('projectId', 'name')
      .populate('attendees', 'name email');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Get tasks associated with this meeting
    const tasks = await Task.find({ 
      meetingId: meeting._id,
      status: { $ne: 'closed' }
    })
    .populate('responsibleMemberId', 'name');
    
    // Format the meeting data
    const formattedMeeting = {
      _id: meeting._id,
      title: meeting.title,
      date: meeting.date,
      location: meeting.location,
      notes: meeting.notes,
      projectId: meeting.projectId._id,
      projectName: meeting.projectId.name,
      attendees: meeting.attendees,
      tasks: tasks
    };
    
    res.json(formattedMeeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new meeting
exports.createMeeting = async (req, res) => {
  const { 
    projectId, 
    title, 
    date, 
    location, 
    notes, 
    attendees, 
    recurring 
  } = req.body;

  try {
    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Create meeting
    const meeting = new Meeting({
      projectId,
      title,
      date,
      location,
      notes,
      attendees,
      recurring: recurring || { isRecurring: false },
      createdBy: req.user.id
    });

    await meeting.save();
    
    res.status(201).json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a meeting
exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Update fields
    const updateFields = ['title', 'date', 'location', 'notes', 'attendees', 'recurring'];
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        meeting[field] = req.body[field];
      }
    });
    
    await meeting.save();
    res.json(meeting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add a task to a meeting
exports.addTask = async (req, res) => {
  try {
    const { description, responsibleMemberId, dueDate, status } = req.body;
    const meetingId = req.params.id;
    
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Create new task
    const task = new Task({
      description,
      projectId: meeting.projectId,
      meetingId,
      responsibleMemberId,
      dueDate,
      status: status || 'pending'
    });
    
    await task.save();
    
    // Populate responsible member info
    const populatedTask = await Task.findById(task._id)
      .populate('responsibleMemberId', 'name');
      
    res.status(201).json(populatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send meeting notes as PDF
exports.sendMeetingNotes = async (req, res) => {
  try {
    const meetingId = req.params.id;
    
    // Get meeting with project and tasks
    const meeting = await Meeting.findById(meetingId)
      .populate('projectId', 'name')
      .populate('attendees', 'name email');
      
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Get tasks for this meeting
    const tasks = await Task.find({ 
      meetingId,
      status: { $ne: 'closed' }
    })
    .populate('responsibleMemberId', 'name');
    
    // Get project members
    const project = await Project.findById(meeting.projectId)
      .populate('members.memberId', 'name email');
    
    // Generate PDF
    const pdfBuffer = await generateMeetingNotesPDF(meeting, tasks);
    
    // Send emails to all project members
    const memberEmails = project.members.map(m => ({
      email: m.memberId.email,
      name: m.memberId.name
    }));
    
    for (const member of memberEmails) {
      await sendEmail({
        to: member.email,
        subject: `Meeting Notes: ${meeting.title}`,
        text: `Please find attached the meeting notes for ${meeting.title} held on ${new Date(meeting.date).toLocaleDateString()}.`,
        attachments: [
          {
            filename: `meeting-notes-${meetingId}.pdf`,
            content: pdfBuffer
          }
        ]
      });
    }
    
    res.json({ message: 'Meeting notes sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Close completed tasks
exports.closeCompletedTasks = async (req, res) => {
  try {
    const meetingId = req.params.id;
    
    // Find all completed tasks for this meeting
    const completedTasks = await Task.find({
      meetingId,
      status: 'completed'
    });
    
    // Update all tasks to closed
    for (const task of completedTasks) {
      task.status = 'closed';
      await task.save();
    }
    
    res.json({ 
      message: 'Tasks marked as closed', 
      count: completedTasks.length 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
