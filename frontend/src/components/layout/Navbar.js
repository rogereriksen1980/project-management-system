import React, { useContext } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link to="/dashboard" className="text-xl font-bold">
                  Project Manager
                </Link>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/projects"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Projects
                  </Link>
                  <Link
                    to="/tasks"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Tasks
                  </Link>
                  <Link
                    to="/members"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Members
                  </Link>
                  {auth.user?.role === 'admin' && (
                    <Link
                      to="/reports"
                      className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Reports
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="mr-4">{auth.user?.name}</span>
                    <button
                      onClick={handleLogout}
                      className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto py-6 px-4">
        <Outlet />
      </main>
    </>
  );
};

export default Navbar;
