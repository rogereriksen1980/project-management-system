// Create a new project
exports.createProject = async (req, res) => {
  try {
    console.log('Project creation request received:', req.body);
    
    // Extract only the necessary fields
    const { 
      name, 
      description, 
      client,
      startDate,
      endDate,
      status
    } = req.body;
    
    // Simple validation
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    
    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }
    
    // Create a simplified project object
    const projectData = {
      name,
      description: description || '',
      client: client || '',
      startDate,
      endDate: endDate || null,
      status: status || 'planning',
      projectManager: req.user.id,
      members: []
    };
    
    console.log('Creating project with:', projectData);
    
    // Create project
    const project = new Project(projectData);
    
    console.log('Project model created, saving...');
    await project.save();
    console.log('Project saved successfully with ID:', project._id);
    
    // Return the created project
    res.status(201).json(project);
  } catch (err) {
    console.error('Error in createProject:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      message: 'Server error creating project', 
      error: err.message 
    });
  }
};
