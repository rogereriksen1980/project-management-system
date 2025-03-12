import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const Members = () => {
  const { auth } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState(null);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/api/members');
        setMembers(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching members. Please try again.');
        setLoading(false);
        console.error('Error fetching members:', err);
      }
    };

    fetchMembers();
  }, []);

  const handleResetPassword = async (memberId) => {
    try {
      await api.post(`/api/members/${memberId}/reset-password`);
      setResetPasswordSuccess('Password has been reset. An email has been sent to the member.');
      setResetPasswordId(null);
      setShowModal(false);
    } catch (err) {
      setError('Error resetting password. Please try again.');
      console.error('Error resetting password:', err);
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      await api.delete(`/api/members/${memberId}`);
      setMembers(members.filter(member => member._id !== memberId));
    } catch (err) {
      setError('Error deleting member. Please try again.');
      console.error('Error deleting member:', err);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'project_manager':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRoleName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'project_manager':
        return 'Project Manager';
      default:
        return 'Member';
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading members...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        {auth.user?.role === 'admin' && (
          <Link
            to="/members/new"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Add New Member
          </Link>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {resetPasswordSuccess && (
        <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
          {resetPasswordSuccess}
        </div>
      )}

      {members.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <p>No members found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Company / Position</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {member.name}
                      {member._id === auth.user?.id && ' (You)'}
                    </div>
                  </td>
                  <td className="px-4 py-3">{member.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeClass(member.role)}`}>
                      {formatRoleName(member.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {member.company && <div>{member.company}</div>}
                    {member.position && <div className="text-sm text-gray-600">{member.position}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {/* Self-edit or admin edit */}
                      {(auth.user?.id === member._id || auth.user?.role === 'admin') && (
                        <Link
                          to={`/members/${member._id}`}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </Link>
                      )}
                      
                      {/* Admin-only actions */}
                      {auth.user?.role === 'admin' && auth.user?.id !== member._id && (
                        <>
                          <button
                            onClick={() => {
                              setResetPasswordId(member._id);
                              setShowModal(true);
                            }}
                            className="text-orange-500 hover:text-orange-700 text-sm text-left"
                          >
                            Reset Password
                          </button>
                          
                          <button
                            onClick={() => handleDeleteMember(member._id)}
                            className="text-red-500 hover:text-red-700 text-sm text-left"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Reset Password</h3>
            <p className="mb-4">
              Are you sure you want to reset the password for this member? A new random password will be generated and sent to their email.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setResetPasswordId(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(resetPasswordId)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
