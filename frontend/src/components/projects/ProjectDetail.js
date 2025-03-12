import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const isNewProject = id === 'new';

  const [project, setProject] = useState({
    name: '',
    description: '',
    client: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'planning',
    members: [],
    projectManager: auth.user?.id || ''
  });

  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(!isNewProject);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all members for the dropdown
        const membersRes = await api.get('/api/members');
        setAvailableMembers(membersRes.data);

        if (!isNewProject) {
          // Fetch project details if editing an existing project
          const projectRes = await api.get(`/api/projects/${id}`);
          const projectData = projectRes.data;
          
          // Format dates for form inputs
          if (projectData.startDate) {
            projectData.startDate = new Date(projectData.startDate).toISOString().split('T')[0];
          }
          if (projectData.endDate) {
            projectData.endDate = new Date(projectData.endDate).toISOString().split('T')[0];
          }
          
          setProject(projectData);
          
          // Set selected members from project data
          if (projectData.members) {
            setSelectedMembers(
              projectData.members.map(member => ({
                memberId: member.memberId._id,
                name: member.memberId.name,
                role: member.role || ''
              }))
            );
          }
          
          // Fetch meetings for this project
          try {
            const meetingsRes = await api.get(`/api/projects/${id}/meetings`);
            setMeetings(meetingsRes.data);
          } catch (meetingErr) {
            console.error('Error fetching meetings:', meetingErr);
            // Continue even if meetings fail to load
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Error loading project data. Please try again.');
        setLoading(false);
        console.error('Error in ProjectDetail:', err);
      }
    };

    fetchData();
  }, [id, isNewProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject({ ...project, [name]: value });
  };

  const handleMemberSelect = (e) => {
    const selectedMemberId = e.target.value;
    if (!selectedMemberId) return;

    const alreadySelected = selectedMembers.some(m => m.memberId === selectedMemberId);
    if (alreadySelected) {
      setError('This member is already added to the project.');
      return;
    }

    const memberToAdd = availableMembers.find(m => m._id === selectedMemberId);
    setSelectedMembers([
      ...selectedMembers,
      {
        memberId: memberToAdd._id,
        name: memberToAdd.name,
        role: ''
      }
    ]);
  };

  const handleMemberRoleChange = (memberId, role) => {
    setSelectedMembers(
      selectedMembers.map(member =>
        member.memberId === memberId ? { ...member, role } : member
      )
    );
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(member => member.memberId !== memberId));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccessMessage(null);

  try {
    // Create a minimal project object with only the essential fields
    const projectData = {
      name: project.name,
      description: project.description || '',
      client: project.client || '',
      startDate: project.startDate,
      status: project.status || 'planning'
    };
    
    console.log('Submitting simplified project data:', projectData);

    let response;
    if (isNewProject) {
      response = await api.post('/api/projects', projectData);
      console.log('Project created successfully:', response.data);
      setSuccessMessage('Project created successfully!');
    } else {
      response = await api.put(`/api/projects/${id}`, projectData);
      console.log('Project updated successfully:', response.data);
      setSuccessMessage('Project updated successfully!');
    }

    // Redirect after a brief delay to show success message
    setTimeout(() => {
      navigate(`/projects/${response.data._id}`);
    }, 1500);
  } catch (err) {
    console.error('Error saving project:', err);
    
    const errorMessage = err.response?.data?.message || 
                        err.response?.data?.error || 
                        err.message || 
                        'Unknown error occurred';
                        
    setError(`Error: ${errorMessage}`);
  }
};

  const handleDeleteProject = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/projects/${id}`);
      setSuccessMessage('Project deleted successfully!');
      
      // Redirect to projects list after a brief delay
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
    } catch (err) {
      setError('Error deleting project. Please try again.');
      console.error('Error deleting project:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading project details...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {isNewProject ? 'Create New Project' : 'Edit Project'}
        </h1>
        {!isNewProject && (
          <Link
            to={`/projects/${id}/meetings/new`}
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          >
            Schedule Meeting
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <form onSubmit={handleSubmit}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div>
      <label className="block text-gray-700 mb-2" htmlFor="name">
        Project Name *
      </label>
      <input
        type="text"
        id="name"
        name="name"
        value={project.name}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded"
        required
      />
    </div>

    <div>
      <label className="block text-gray-700 mb-2" htmlFor="client">
        Client
      </label>
      <input
        type="text"
        id="client"
        name="client"
        value={project.client}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded"
      />
    </div>

    <div>
      <label className="block text-gray-700 mb-2" htmlFor="startDate">
        Start Date *
      </label>
      <input
        type="date"
        id="startDate"
        name="startDate"
        value={project.startDate}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded"
        required
      />
    </div>

    <div>
      <label className="block text-gray-700 mb-2" htmlFor="status">
        Status *
      </label>
      <select
        id="status"
        name="status"
        value={project.status}
        onChange={handleChange}
        className="w-full px-3 py-2 border border-gray-300 rounded"
        required
      >
        <option value="planning">Planning</option>
        <option value="active">Active</option>
        <option value="on-hold">On Hold</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  </div>

  <div className="mb-6">
    <label className="block text-gray-700 mb-2" htmlFor="description">
      Description
    </label>
    <textarea
      id="description"
      name="description"
      value={project.description}
      onChange={handleChange}
      className="w-full px-3 py-2 border border-gray-300 rounded"
      rows="4"
    ></textarea>
  </div>

  <div className="flex justify-between">
    <div>
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded mr-2"
      >
        {isNewProject ? 'Create Project' : 'Save Changes'}
      </button>
      <Link
        to="/projects"
        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded"
      >
        Cancel
      </Link>
    </div>
    {!isNewProject && auth.user?.role === 'admin' && (
      <button
        type="button"
        onClick={handleDeleteProject}
        className="bg-red-500 hover:bg-red-600 text-white py-2 px-6 rounded"
      >
        Delete Project
      </button>
    )}
  </div>
</form>
      </div>

      {!isNewProject && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Project Meetings</h2>
          
          {meetings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Meeting Title</th>
                    <th className="px-4 py-2 text-left">Date & Time</th>
                    <th className="px-4 py-2 text-left">Location</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map(meeting => (
                    <tr key={meeting._id} className="border-t">
                      <td className="px-4 py-2">{meeting.title}</td>
                      <td className="px-4 py-2">{new Date(meeting.date).toLocaleString()}</td>
                      <td className="px-4 py-2">{meeting.location}</td>
                      <td className="px-4 py-2">
                        <Link
                          to={`/projects/${id}/meetings/${meeting._id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          View Notes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No meetings scheduled for this project yet.</p>
          )}
          
          <div className="mt-4">
            <Link
              to={`/projects/${id}/meetings/new`}
              className="text-blue-500 hover:text-blue-700"
            >
              Schedule a Meeting
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
