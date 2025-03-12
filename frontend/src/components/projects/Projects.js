import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const Projects = () => {
  const { auth } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        setProjects(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching projects. Please try again.');
        setLoading(false);
        console.error('Error fetching projects:', err);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return;
    }

    try {
      await api.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(project => project._id !== projectId));
    } catch (err) {
      setError('Error deleting project. Please try again.');
      console.error('Error deleting project:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading projects...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        {auth.user?.role === 'admin' && (
          <Link
            to="/projects/new"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Add New Project
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p>No projects found. {auth.user?.role === 'admin' && 'Create your first project by clicking "Add New Project".'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
                <span className={`px-2 py-1 rounded text-xs ${getStatusClass(project.status)}`}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">
                {project.description?.substring(0, 100) || 'No description provided'}
                {project.description?.length > 100 && '...'}
              </p>
              
              <div className="mb-4">
                <p className="text-sm"><strong>Client:</strong> {project.client || 'None'}</p>
                <p className="text-sm"><strong>Start Date:</strong> {new Date(project.startDate).toLocaleDateString()}</p>
                {project.endDate && (
                  <p className="text-sm"><strong>End Date:</strong> {new Date(project.endDate).toLocaleDateString()}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <Link 
                  to={`/projects/${project._id}`}
                  className="text-blue-500 hover:text-blue-700"
                >
                  View Details
                </Link>
                
                {auth.user?.role === 'admin' && (
                  <div>
                    <Link 
                      to={`/projects/${project._id}`}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      Edit
                    </Link>
                    <button 
                      onClick={() => handleDeleteProject(project._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
