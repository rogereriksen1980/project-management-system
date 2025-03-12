// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  next();
};

// Middleware to check if user is project manager or admin
exports.isProjectManagerOrAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'project_manager') {
    return res.status(403).json({ message: 'Access denied: Project Manager or Admin role required' });
  }
  next();
};

// Middleware to check if user is part of the project
exports.isProjectMember = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.params.id || req.body.projectId;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Allow access if user is admin, project manager, or member of the project
    if (req.user.role === 'admin' || 
        project.projectManager.toString() === req.user.id || 
        project.members.some(m => m.memberId.toString() === req.user.id)) {
      return next();
    }
    
    res.status(403).json({ message: 'Access denied: You are not a member of this project' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
