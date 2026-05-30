import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import SchedulePage from './pages/SchedulePage';
import JournalPage from './pages/JournalPage';
import SubjectPage from './pages/SubjectPage';
import LabPage from './pages/LabPage';
import TeacherJournalPage from './pages/TeacherJournalPage';
import TeacherSubjectPage from './pages/TeacherSubjectPage';
import SubmissionsPage from './pages/SubmissionsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/schedule" element={<PrivateRoute><SchedulePage /></PrivateRoute>} />
          <Route path="/journal" element={<PrivateRoute role="student"><JournalPage /></PrivateRoute>} />
          <Route path="/subjects/:id" element={<PrivateRoute role="student"><SubjectPage /></PrivateRoute>} />
          <Route path="/labs/:id" element={<PrivateRoute role="student"><LabPage /></PrivateRoute>} />

          <Route path="/teacher/journal" element={<PrivateRoute role="teacher"><TeacherJournalPage /></PrivateRoute>} />
          <Route path="/teacher/subjects/:id" element={<PrivateRoute role="teacher"><TeacherSubjectPage /></PrivateRoute>} />
          <Route path="/teacher/labs/:id/submissions" element={<PrivateRoute role="teacher"><SubmissionsPage /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
