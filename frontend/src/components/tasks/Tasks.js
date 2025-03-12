import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const Tasks = () => {
  const { auth } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClosedTasks, setShowClosedTasks] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, inProgress, completed
  const [commentText, setCommentText] = useState('');
  const [commentingTaskId, setCommentingTaskId] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // For regular users, fetch only their tasks
        // For admins, fetch all tasks
        const endpoint = auth.user?.role === 'admin' ? '/api/tasks' : '/api/tasks/my-tasks';
        const res = await api.get(endpoint);
        setTasks(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching tasks. Please try again.');
        setLoading(false);
        console.error('Error fetching tasks:', err);
      }
    };

    fetchTasks();
  }, [auth.user?.role]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: newStatus });
      
      // Update task in state
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (err) {
      setError('Error updating task status. Please try again.');
      console.error('Error updating task status:', err);
    }
  };

  const handleCloseTasks = async (taskId) => {
    try {
      await api.patch(`/api/tasks/${taskId}`, { status: 'closed' });
      
      // Update task in state
      setTasks(tasks.map(task => 
        task._id === taskId ? { ...task, status: 'closed' } : task
      ));
    } catch (err) {
      setError('Error closing task. Please try again.');
      console.error('Error closing task:', err);
    }
  };

  const handleAddComment = async (taskId, e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await api.post(`/api/tasks/${taskId}/comments`, { text: commentText });
      
      // Update task in state
      setTasks(tasks.map(task => 
        task._id === taskId 
          ? { ...task, comments: [...(task.comments || []), res.data] } 
          : task
      ));
      
      // Reset form
      setCommentText('');
      setCommentingTaskId(null);
    } catch (err) {
      setError('Error adding comment. Please try again.');
      console.error('Error adding comment:', err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100';
    }
  };

  const getFilteredTasks = () => {
    let filteredTasks = tasks;
    
    // Filter based on closed status
    if (!showClosedTasks) {
      filteredTasks = filteredTasks.filter(task => task.status !== 'closed');
    }
    
    // Filter based on status
    if (filter !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.status === filter);
    }
    
    return filteredTasks;
  };

  if (loading) {
    return <div className="text-center py-10">Loading tasks...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2">Status Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            {showClosedTasks && <option value="closed">Closed</option>}
          </select>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showClosed"
            checked={showClosedTasks}
            onChange={() => setShowClosedTasks(!showClosedTasks)}
            className="mr-2"
          />
          <label htmlFor="showClosed">Show Closed Tasks</label>
        </div>
      </div>

      {getFilteredTasks().length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p>No tasks found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Task</th>
                <th className="px-4 py-2 text-left">Project</th>
                <th className="px-4 py-2 text-left">Due Date</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredTasks().map((task) => (
                <React.Fragment key={task._id}>
                  <tr className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{task.description}</div>
                      <div className="text-sm text-gray-600">
                        Assigned to: {task.responsibleMemberId?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {task.projectId?.name && (
                        <Link to={`/projects/${task.projectId._id}`} className="text-blue-500 hover:underline">
                          {task.projectId.name}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusClass(task.status)}`}>
                        {task.status === 'pending' ? 'Pending' : 
                         task.status === 'in-progress' ? 'In Progress' : 
                         task.status === 'completed' ? 'Completed' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.status !== 'closed' && (
                        <div className="flex flex-col gap-2">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                            disabled={task.status === 'closed'}
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          
                          {(auth.user?.role === 'admin' || auth.user?.role === 'project_manager') && 
                           task.status === 'completed' && (
                            <button
                              onClick={() => handleCloseTasks(task._id)}
                              className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                              Close Task
                            </button>
                          )}
                          
                          <button
                            onClick={() => setCommentingTaskId(commentingTaskId === task._id ? null : task._id)}
                            className="text-green-500 hover:text-green-700 text-sm"
                          >
                            {commentingTaskId === task._id ? 'Cancel Comment' : 'Add Comment'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Comments section */}
                  {(task.comments?.length > 0 || commentingTaskId === task._id) && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-4 py-3">
                        {task.comments?.length > 0 && (
                          <div className="mb-3">
                            <h4 className="font-medium text-sm mb-2">Comments:</h4>
                            <div className="space-y-2">
                              {task.comments.map((comment, index) => (
                                <div key={index} className="text-sm bg-white p-2 rounded border">
                                  <div className="font-medium">
                                    {comment.createdBy?.name || 'Unknown'} - {new Date(comment.createdAt).toLocaleString()}
                                  </div>
                                  <div>{comment.text}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {commentingTaskId === task._id && (
                          <form onSubmit={(e) => handleAddComment(task._id, e)} className="flex gap-2">
                            <input
                              type="text"
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Add a comment..."
                              className="flex-grow px-3 py-2 border rounded"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                              Add
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Tasks;
