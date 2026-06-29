import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  GraduationCap, 
  Clock, 
  CreditCard, 
  FileText, 
  CheckSquare, 
  BookOpen, 
  MessageSquare, 
  Settings,
  CalendarDays,
  FileCheck
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, school } = useAuth();
  if (!user) return null;

  // Sidebar config per role
  const menuConfigs = {
    super_admin: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'schools', label: 'Schools', icon: School },
      { id: 'notices', label: 'Global Notices', icon: FileText },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
    principal: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'teachers', label: 'Teachers', icon: Users },
      { id: 'students', label: 'Students & Parents', icon: GraduationCap },
      { id: 'academics', label: 'Academics Config', icon: Settings },
      { id: 'timetable', label: 'Timetable', icon: Clock },
      { id: 'fees', label: 'Fee Management', icon: CreditCard },
      { id: 'notices', label: 'School Notices', icon: FileText },
      { id: 'exams', label: 'Exams & Reports', icon: FileCheck },
      { id: 'leaves', label: 'Leave Requests', icon: CalendarDays },
    ],
    teacher: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'timetable', label: 'My Timetable', icon: Clock },
      { id: 'attendance', label: 'Mark Attendance', icon: CheckSquare },
      { id: 'marks', label: 'Enter Marks', icon: FileCheck },
      { id: 'homework', label: 'Homework & Materials', icon: BookOpen },
      { id: 'messages', label: 'Messages', icon: MessageSquare },
      { id: 'leaves', label: 'My Leaves', icon: CalendarDays },
    ],
    parent: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'timetable', label: 'Class Timetable', icon: Clock },
      { id: 'academics', label: 'Homework & Materials', icon: BookOpen },
      { id: 'attendance', label: 'Attendance History', icon: CheckSquare },
      { id: 'fees', label: 'Tuition Fees', icon: CreditCard },
      { id: 'reports', label: 'Report Cards', icon: FileCheck },
      { id: 'messages', label: 'Message Teacher', icon: MessageSquare },
    ],
    student: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'timetable', label: 'My Timetable', icon: Clock },
      { id: 'academics', label: 'Academic Hub', icon: BookOpen },
      { id: 'attendance', label: 'My Attendance', icon: CheckSquare },
      { id: 'reports', label: 'My Report Card', icon: FileCheck },
    ]
  };

  const menuItems = menuConfigs[user.role] || [];

  return (
    <div style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), var(--info))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            fontFamily: 'var(--font-display)'
          }}>E</div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em'
          }} className="gradient-text">Edu-Smart</span>
        </div>
        {school && (
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} title={school.name}>
            🏫 {school.name}
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav style={{
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: 1,
        overflowY: 'auto'
      }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                textAlign: 'left',
                width: '100%',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer Card */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-tertiary)'
      }}>
        <img 
          src={user.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100"} 
          alt={user.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '2px solid var(--primary-light)'
          }}
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <h4 style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>{user.name}</h4>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--primary)',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.02em'
          }}>
            {user.role.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
