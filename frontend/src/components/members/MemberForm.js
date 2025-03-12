import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);
  const isNewMember = id === 'new';
  const isSelfEdit = !isNewMember && id === auth.user?.id;

  const [member, setMember] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    role: 'member',
    projects: []
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(!isNewMember);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all projects for the dropdown
        const projectsRes = await api.get('/api/projects');
        setAllProjects(projectsRes.data);

        if (!isNewMember) {
          // Fetch member details if editing an existing member
          const memberRes = await api.get(`/api/members/${id}`);
          setMember(memberRes.data);
        }

        setLoading(false);
      } catch (err) {
        setError('Error loading data. Please try again.');
        setLoading(false);
        console.error('Error in MemberForm:', err);
      }
    };

    fetchData();
  }, [id, isNewMember]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMember({ ...member, [name]: value });
  };

  const handleProjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setMember({ ...member, projects: selectedOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate passwords for new members
    if (isNewMember && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const memberData = { ...member };
      
      // Include password only for new members
      if (isNewMember) {
        memberData.password = password;
      }

      let response;
      if (isNewMember) {
        response = await api.post('/api/members', memberData);
        setSuccessMessage('Member created successfully!');
      } else {
        response = await api.put(`/api/members/${id}`, memberData);
        setSuccessMessage('Member updated successfully!');
      }

      // If editing self, update auth context
      if (isSelfEdit) {
        // You might need to update the auth context with the new user data
        // This depends on how your auth context is set up
      }

      // Redirect after a brief delay to show success message
      setTimeout(() => {
        navigate('/members');
      }, 1500);
    } catch (err) {
      setError('Error saving member. Please check your inputs and try again.');
      console.error('Error saving member:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading member details...</div>;
  }

  // Check permissions - admins can edit anyone, users can only edit themselves
  const canEdit = auth.user?.role === 'admin' || isSelfEdit;
  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          You don't have permission to edit this member.
        </div>
        <Link to="/members" className="text-blue-500 hover:underline">
          Back to Members
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isNewMember ? 'Add New Member' : isSelfEdit ? 'Edit Your Profile' : 'Edit Member'}
      </h1>

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

      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={member.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={member.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                required
              />
            </div>

            {isNewMember && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="password">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required={isNewMember}
                    minLength="6"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required={isNewMember}
                    minLength="6"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="phone">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={member.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="company">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={member.company}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="position">
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                value={member.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            {/* Only admins can change roles */}
            {auth.user?.role === 'admin' && (
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="role">
                  Role *
                </label>
                <select
                  id="role"
                  name="role"
                  value={member.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                >
                  <option value="member">Member</option>
                  <option value="project_manager">Project Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
          </div>

          {/* Only admins can assign projects */}
          {auth.user?.role === 'admin' && (
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="projects">
                Assigned Projects
              </label>
              <select
                id="projects"
                name="projects"
                multiple
                value={member.projects}
                onChange={handleProjectChange}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                size="5"
              >
                {allProjects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-1">
                Hold Ctrl (or Cmd on Mac) to select multiple projects
              </p>
            </div>
          )}

          <div className="flex justify-between">
            <div>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded mr-2"
              >
                {isNewMember ? 'Create Member' : 'Save Changes'}
              </button>
              <Link
                to="/members"
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-6 rounded"
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MemberForm;
