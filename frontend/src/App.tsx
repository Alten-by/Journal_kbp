import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SchedulePage from './pages/SchedulePage';
import JournalPage from './pages/JournalPage';
import SubjectPage from './pages/SubjectPage';
import LabPage from './pages/LabPage';
import TeacherJournalPage from './pages/TeacherJournalPage';
import TeacherSubjectPage from './pages/TeacherSubjectPage';
import SubmissionsPage from './pages/SubmissionsPage';
import StudentStatsPage from './pages/StudentStatsPage';

function WithLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/schedule"
            element={<PrivateRoute><WithLayout><SchedulePage /></WithLayout></PrivateRoute>}
          />

          <Route
            path="/journal"
            element={<PrivateRoute role="student"><WithLayout><JournalPage /></WithLayout></PrivateRoute>}
          />
          <Route
            path="/subjects/:id"
            element={<PrivateRoute role="student"><WithLayout><SubjectPage /></WithLayout></PrivateRoute>}
          />
          <Route
            path="/labs/:id"
            element={<PrivateRoute role="student"><WithLayout><LabPage /></WithLayout></PrivateRoute>}
          />
          <Route
            path="/stats"
            element={<PrivateRoute role="student"><WithLayout><StudentStatsPage /></WithLayout></PrivateRoute>}
          />

          <Route
            path="/teacher/journal"
            element={<PrivateRoute role="teacher"><WithLayout><TeacherJournalPage /></WithLayout></PrivateRoute>}
          />
          <Route
            path="/teacher/subjects/:id"
            element={<PrivateRoute role="teacher"><WithLayout><TeacherSubjectPage /></WithLayout></PrivateRoute>}
          />
          <Route
            path="/teacher/labs/:id/submissions"
            element={<PrivateRoute role="teacher"><WithLayout><SubmissionsPage /></WithLayout></PrivateRoute>}
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
