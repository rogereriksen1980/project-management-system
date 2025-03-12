import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const Dashboard = () => {
  const { auth } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, tasksRes, meetingsRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/tasks/my-tasks'),
          api.get('/api/meetings/upcoming')
        ]);
        
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setUpcomingMeetings(meetingsRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task._id} className="border-b pb-4">
                  <div className="font-medium">{task.description}</div>
                  <div className="text-sm text-gray-600">
                    Project: {task.projectId.name} | 
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </div>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.status === 'pending' ? 'Pending' : 
                       task.status === 'in-progress' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No pending tasks</p>
          )}
          <div className="mt-4">
            <Link to="/tasks" className="text-blue-500 hover:underline">View all tasks</Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          {projects.length > 0 ? (
            <div className="space-y-4">
              {projects.slice(0, 5).map((project) => (
                <div key={project._id} className="border-b pb-4">
                  <Link to={`/projects/${project._id}`} className="font-medium hover:text-blue-500">
                    {project.name}
                  </Link>
                  <div className="text-sm text-gray-600">
                    Client: {project.client || 'None'} | 
                    Status: <span className={`${
                      project.status === 'planning' ? 'text-purple-600' : 
                      project.status === 'active' ? 'text-blue-600' : 
                      project.status === 'completed' ? 'text-green-600' : 
                      'text-red-600'
                    }`}>
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No projects found</p>
          )}
          <div className="mt-4">
            <Link to="/projects" className="text-blue-500 hover:underline">View all projects</Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
        {upcomingMeetings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Project</th>
                  <th className="px-4 py-2 text-left">Meeting Title</th>
                  <th className="px-4 py-2 text-left">Date & Time</th>
                  <th className="px-4 py-2 text-left">Location</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMeetings.map(meeting => (
                  <tr key={meeting._id} className="border-t">
                    <td className="px-4 py-2">{meeting.projectName}</td>
                    <td className="px-4 py-2">{meeting.title}</td>
                    <td className="px-4 py-2">{new Date(meeting.date).toLocaleString()}</td>
                    <td className="px-4 py-2">{meeting.location}</td>
                    <td className="px-4 py-2">
                      <Link 
                        to={`/projects/${meeting.projectId}/meetings/${meeting._id}`}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No upcoming meetings</p>
        )}
      </div>
      
      {auth.user?.role === 'admin' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Admin Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/projects/new" 
              className="bg-blue-100 p-4 rounded text-center hover:bg-blue-200"
            >
              Add New Project
            </Link>
            <Link 
              to="/members/new" 
              className="bg-green-100 p-4 rounded text-center hover:bg-green-200"
            >
              Add New Member
            </Link>
            <Link 
              to="/meetings/new" 
              className="bg-purple-100 p-4 rounded text-center hover:bg-purple-200"
            >
              Schedule Meeting
            </Link>
            <Link 
              to="/reports" 
              className="bg-yellow-100 p-4 rounded text-center hover:bg-yellow-200"
            >
              View Reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
