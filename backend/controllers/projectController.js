const Project = require('../models/Project');
const Member = require('../models/Member');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    let projects;
    
    // If admin, get all projects
    if (req.user.role === 'admin') {
      projects = await Project.find()
        .populate('projectManager', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Get projects where user is manager or member
      projects = await Project.find({
        $or: [
          { projectManager: req.user.id },
          { 'members.memberId': req.user.id }
        ]
      })
      .populate('projectManager', 'name email')
      .sort({ createdAt: -1 });
    }
    
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('projectManager', 'name email')
      .populate('members.memberId', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      client,
      startDate,
      endDate,
      status,
      members,
      projectManager 
    } = req.body;
    
    console.log('Creating project with data:', req.body);
    
    // Validation
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }
    
    // Create project
    const project = new Project({
      name,
      description: description || '',
      client: client || '',
      startDate,
      endDate: endDate || null,
      status: status || 'planning',
      members: members || [],
      projectManager: projectManager || req.user.id
    });
    
    await project.save();
    console.log('Project created successfully:', project._id);
    
    // Add project to members' projects array
    if (members && members.length > 0) {
      console.log('Adding project to member profiles:', members.length);
      for (const member of members) {
        await Member.findByIdAndUpdate(
          member.memberId,
          { $addToSet: { projects: project._id } }
        );
      }
    }
    
    // Add project to project manager's projects array
    if (projectManager) {
      console.log('Adding project to project manager profile:', projectManager);
      await Member.findByIdAndUpdate(
        projectManager,
        { $addToSet: { projects: project._id } }
      );
    }
    
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ 
      message: 'Server error creating project', 
      error: err.message 
    });
  }
};

// Update a project
exports.updateProject = async (req, res) => {
  try {
    const {
      name,
      description,
      client,
      startDate,
      endDate,
      status,
      members,
      projectManager
    } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update fields
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (client !== undefined) project.client = client;
    if (startDate) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status) project.status = status;
    
    // Handle member changes
    if (members) {
      // Get current member IDs
      const currentMemberIds = project.members.map(m => m.memberId.toString());
      
      // Get new member IDs
      const newMemberIds = members.map(m => m.memberId.toString());
      
      // Find members to remove
      const removedMemberIds = currentMemberIds.filter(id => !newMemberIds.includes(id));
      
      // Find members to add
      const addedMemberIds = newMemberIds.filter(id => !currentMemberIds.includes(id));
      
      // Remove project from removed members
      for (const memberId of removedMemberIds) {
        await Member.findByIdAndUpdate(
          memberId,
          { $pull: { projects: project._id } }
        );
      }
      
      // Add project to added members
      for (const memberId of addedMemberIds) {
        await Member.findByIdAndUpdate(
          memberId,
          { $addToSet: { projects: project._id } }
        );
      }
      
      // Update project members
      project.members = members;
    }
    
    // Handle project manager change
    if (projectManager && projectManager !== project.projectManager.toString()) {
      // Remove project from old manager
      await Member.findByIdAndUpdate(
        project.projectManager,
        { $pull: { projects: project._id } }
      );
      
      // Add project to new manager
      await Member.findByIdAndUpdate(
        projectManager,
        { $addToSet: { projects: project._id } }
      );
      
      // Update project manager
      project.projectManager = projectManager;
    }
    
    await project.save();
    
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Remove project from all members
    const memberIds = [
      ...project.members.map(m => m.memberId),
      project.projectManager
    ];
    
    for (const memberId of memberIds) {
      await Member.findByIdAndUpdate(
        memberId,
        { $pull: { projects: project._id } }
      );
    }
    
    await project.remove();
    
    res.json({ message: 'Project removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project members
exports.getProjectMembers = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.memberId', 'name email phone company position role')
      .populate('projectManager', 'name email phone company position role');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Format members data
    const members = project.members.map(m => ({
      _id: m.memberId._id,
      name: m.memberId.name,
      email: m.memberId.email,
      phone: m.memberId.phone,
      company: m.memberId.company,
      position: m.memberId.position,
      role: m.memberId.role,
      projectRole: m.role
    }));
    
    // Add project manager to members list
    members.push({
      _id: project.projectManager._id,
      name: project.projectManager.name,
      email: project.projectManager.email,
      phone: project.projectManager.phone,
      company: project.projectManager.company,
      position: project.projectManager.position,
      role: project.projectManager.role,
      projectRole: 'Project Manager'
    });
    
    res.json(members);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
