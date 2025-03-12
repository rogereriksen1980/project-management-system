const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create simple controller functions directly in the routes file
// This ensures we don't have any undefined functions

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error('Error getting projects:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a specific project
const getProject = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    console.error('Error getting project:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new project
const createProject = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const { name, description, client, startDate, endDate, status } = req.body;
    
    console.log('Creating project:', req.body);
    
    if (!name || !startDate) {
      return res.status(400).json({ message: 'Name and start date are required' });
    }
    
    const project = new Project({
      name,
      description: description || '',
      client: client || '',
      startDate,
      endDate: endDate || null,
      status: status || 'planning',
      projectManager: req.user.id
    });
    
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a project
const updateProject = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const { name, description, client, startDate, endDate, status } = req.body;
    
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (client !== undefined) project.client = client;
    if (startDate) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status) project.status = status;
    
    await project.save();
    res.json(project);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a project
const deleteProject = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    await project.remove();
    res.json({ message: 'Project removed' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Define routes with the functions we just created
router.get('/', auth, getAllProjects);
router.get('/:id', auth, getProject);
router.post('/', auth, createProject);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, deleteProject);

module.exports = router;
