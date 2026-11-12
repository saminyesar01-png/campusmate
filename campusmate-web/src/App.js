import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import ClassRoutine from './pages/student/ClassRoutine';
import Announcements from './pages/student/Announcements';
import CGPACalculator from './pages/student/CGPACalculator';
import LostFound from './pages/student/LostFound';
import StudyMaterials from './pages/student/StudyMaterials';
import AdvisingSlip from './pages/student/AdvisingSlip';


// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

import './styles/global.css';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-main">
        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Student routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><StudentDashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/routine" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><ClassRoutine /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/announcements" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><Announcements /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/materials" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><StudyMaterials /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/cgpa" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><CGPACalculator /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/lost-found" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><LostFound /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/student/advising" element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppLayout><AdvisingSlip /></AppLayout>
            </ProtectedRoute>
          } />


          {/* Teacher routes */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <AppLayout><TeacherDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
