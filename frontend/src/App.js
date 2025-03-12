import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/dashboard/Dashboard';
import Projects from './components/projects/Projects';
import ProjectDetail from './components/projects/ProjectDetail';
import Members from './components/members/Members';
import MemberForm from './components/members/MemberForm';
import MeetingNotes from './components/meetings/MeetingNotes';
import MeetingForm from './components/meetings/MeetingForm';
import Tasks from './components/tasks/Tasks';
import Reports from './components/reports/Reports';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/routing/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token?" element={<ResetPassword />} />
            
            <Route path="/" element={<PrivateRoute><Navbar /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="projects/new" element={<ProjectDetail />} />
              <Route path="projects/:id" element={<ProjectDetail />} />
              <Route path="projects/:projectId/meetings/new" element={<MeetingForm />} />
              <Route path="projects/:projectId/meetings/:meetingId" element={<MeetingNotes />} />
              <Route path="members" element={<Members />} />
              <Route path="members/new" element={<MemberForm />} />
              <Route path="members/:id" element={<MemberForm />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="reports" element={<Reports />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
