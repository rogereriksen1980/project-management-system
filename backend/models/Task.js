const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting'
  },
  responsibleMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  dueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'closed'],
    default: 'pending'
  },
  comments: [{
    text: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', TaskSchema);
