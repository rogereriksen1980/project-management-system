const Task = require('../models/Task');
const Project = require('../models/Project');
const Member = require('../models/Member');

// Get project status report
exports.getProjectStatusReport = async (req, res) => {
  try {
    // Get all projects with task counts
    const projects = await Project.find().lean();
    
    const projectIds = projects.map(p => p._id);
    
    // Get task counts by project and status
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: {
          _id: { 
            projectId: "$projectId", 
            status: "$status" 
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format the data
    const projectReports = projects.map(project => {
      const projectTasks = taskCounts.filter(t => 
        t._id.projectId.toString() === project._id.toString()
      );
      
      // Calculate task counts by status
      const tasksByStatus = {
        pending: 0,
        'in-progress': 0,
        completed: 0,
        closed: 0
      };
      
      projectTasks.forEach(task => {
        tasksByStatus[task._id.status] = task.count;
      });
      
      // Calculate total and completion percentage
      const totalTasks = Object.values(tasksByStatus).reduce((sum, count) => sum + count, 0);
      const completedTasks = tasksByStatus.completed + tasksByStatus.closed;
      const completionPercentage = totalTasks === 0 ? 0 : 
        Math.round((completedTasks / totalTasks) * 100);
      
      return {
        projectId: project._id,
        name: project.name,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
        client: project.client,
        tasks: {
          total: totalTasks,
          pending: tasksByStatus.pending,
          inProgress: tasksByStatus['in-progress'],
          completed: tasksByStatus.completed,
          closed: tasksByStatus.closed,
          completionPercentage
        }
      };
    });
    
    res.json(projectReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get member task report
exports.getMemberTaskReport = async (req, res) => {
  try {
    // Get all members
    const members = await Member.find()
      .select('_id name email role company position')
      .lean();
      
    const memberIds = members.map(m => m._id);
    
    // Get task counts by member and status
    const taskCounts = await Task.aggregate([
      { $match: { responsibleMemberId: { $in: memberIds } } },
      { $group: {
          _id: { 
            memberId: "$responsibleMemberId", 
            status: "$status" 
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get overdue tasks
    const currentDate = new Date();
    const overdueTasks = await Task.aggregate([
      { 
        $match: { 
          responsibleMemberId: { $in: memberIds },
          status: { $in: ['pending', 'in-progress'] },
          dueDate: { $lt: currentDate }
        } 
      },
      { 
        $group: {
          _id: "$responsibleMemberId",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format the data
    const memberReports = members.map(member => {
      const memberTasks = taskCounts.filter(t => 
        t._id.memberId.toString() === member._id.toString()
      );
      
      // Calculate task counts by status
      const tasksByStatus = {
        pending: 0,
        'in-progress': 0,
        completed: 0,
        closed: 0
      };
      
      memberTasks.forEach(task => {
        tasksByStatus[task._id.status] = task.count;
      });
      
      // Get overdue task count
      const overdue = overdueTasks.find(t => 
        t._id.toString() === member._id.toString()
      );
      
      // Calculate total and completion statistics
      const totalActiveTasks = tasksByStatus.pending + tasksByStatus['in-progress'];
      const totalCompletedTasks = tasksByStatus.completed + tasksByStatus.closed;
      const totalTasks = totalActiveTasks + totalCompletedTasks;
      const completionRate = totalTasks === 0 ? 0 : 
        Math.round((totalCompletedTasks / totalTasks) * 100);
      
      return {
        memberId: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        company: member.company,
        position: member.position,
        tasks: {
          totalActive: totalActiveTasks,
          pending: tasksByStatus.pending,
          inProgress: tasksByStatus['in-progress'],
          completed: tasksByStatus.completed,
          closed: tasksByStatus.closed,
          total: totalTasks,
          completionRate,
          overdue: overdue ? overdue.count : 0
        }
      };
    });
    
    res.json(memberReports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
