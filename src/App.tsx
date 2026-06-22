import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Loader } from './components/ui/Loader';
import { PageContainer } from './components/layout/PageContainer';
import Login from './features/auth/Login';
import DiagnosticPage from './features/debug/DiagnosticPage';

// Import Super Admin Panels
import SADashboard from './features/super-admin/Dashboard';
import SASchoolManagement from './features/super-admin/SchoolManagement';
import SAGlobalNotices from './features/super-admin/GlobalNotices';
import SASettings from './features/super-admin/Settings';

// Import Principal Panels
import PDashboard from './features/principal/Dashboard';
import PUserManagement from './features/principal/UserManagement';
import PAcademics from './features/principal/Academics';
import PTimetable from './features/principal/Timetable';
import PFees from './features/principal/Fees';
import PNotices from './features/principal/Notices';
import PExams from './features/principal/Exams';
import PLeaves from './features/principal/Leaves';

// Import Teacher Panels
import TDashboard from './features/teacher/Dashboard';
import TAttendance from './features/teacher/Attendance';
import TMarksEntry from './features/teacher/MarksEntry';
import THomework from './features/teacher/Homework';
import TMessages from './features/teacher/Messages';
import TLeaves from './features/teacher/Leaves';

// Import Parent Panels
import ParentDashboard from './features/parent/Dashboard';
import ParentAcademics from './features/parent/Academics';
import ParentAttendance from './features/parent/Attendance';
import ParentFees from './features/parent/Fees';
import ParentReports from './features/parent/Reports';
import ParentMessages from './features/parent/Messages';

// Import Student Panels
import StudentDashboard from './features/student/Dashboard';
import StudentAcademics from './features/student/Academics';
import StudentAttendance from './features/student/Attendance';
import StudentReportCard from './features/student/ReportCard';

const EduSmartApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  
  // Persisted Parent State for Child Switcher
  const [selectedChildId, setSelectedChildId] = useState('');

  // Reset tab to dashboard when user logs in/out or role changes
  useEffect(() => {
    setCurrentTab('dashboard');
    setSelectedChildId('');
  }, [user]);

  if (loading) {
    return <Loader fullPage message="Verifying authentication session..." />;
  }

  if (!user) {
    return <Login />;
  }

  // Render Dashboard Content based on active user role and tab
  const renderContent = () => {
    switch (user.role) {
      case 'super_admin':
        switch (currentTab) {
          case 'dashboard': return <SADashboard />;
          case 'schools': return <SASchoolManagement />;
          case 'notices': return <SAGlobalNotices />;
          case 'settings': return <SASettings />;
          default: return <SADashboard />;
        }
      
      case 'principal':
        switch (currentTab) {
          case 'dashboard': return <PDashboard />;
          case 'teachers': return <PUserManagement />;
          case 'students': return <PUserManagement />;
          case 'academics': return <PAcademics />;
          case 'timetable': return <PTimetable />;
          case 'fees': return <PFees />;
          case 'notices': return <PNotices />;
          case 'exams': return <PExams />;
          case 'leaves': return <PLeaves />;
          default: return <PDashboard />;
        }

      case 'teacher':
        switch (currentTab) {
          case 'dashboard': return <TDashboard />;
          case 'attendance': return <TAttendance />;
          case 'marks': return <TMarksEntry />;
          case 'homework': return <THomework />;
          case 'messages': return <TMessages />;
          case 'leaves': return <TLeaves />;
          default: return <TDashboard />;
        }

      case 'parent':
        switch (currentTab) {
          case 'dashboard': 
            return <ParentDashboard selectedChildId={selectedChildId} setSelectedChildId={setSelectedChildId} />;
          case 'academics': 
            return <ParentAcademics selectedChildId={selectedChildId} />;
          case 'attendance': 
            return <ParentAttendance selectedChildId={selectedChildId} />;
          case 'fees': 
            return <ParentFees selectedChildId={selectedChildId} />;
          case 'reports': 
            return <ParentReports selectedChildId={selectedChildId} />;
          case 'messages': 
            return <ParentMessages selectedChildId={selectedChildId} />;
          default: 
            return <ParentDashboard selectedChildId={selectedChildId} setSelectedChildId={setSelectedChildId} />;
        }

      case 'student':
        switch (currentTab) {
          case 'dashboard': return <StudentDashboard />;
          case 'academics': return <StudentAcademics />;
          case 'attendance': return <StudentAttendance />;
          case 'reports': return <StudentReportCard />;
          default: return <StudentDashboard />;
        }

      default:
        return <div>Access Denied. Unknown user role profile.</div>;
    }
  };

  return (
    <PageContainer currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderContent()}
    </PageContainer>
  );
};

export const App: React.FC = () => {
  // Diagnostic mode: append ?debug=1 to URL to show production Firestore trace
  const isDebug = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';

  if (isDebug) {
    return <DiagnosticPage />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <EduSmartApp />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
