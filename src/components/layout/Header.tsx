import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, LogOut, Database, AlertCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, school, dbMode, toggleDbMode, logout, isPlanExpired } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('edu_smart_theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edu_smart_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getPlanStatusText = () => {
    if (!school) return null;
    const expiry = new Date(school.planExpiry);
    const dateStr = expiry.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (isPlanExpired) {
      return { text: `Plan Expired (${dateStr})`, type: 'danger' };
    }
    
    // Check if expiring in less than 30 days
    const timeDiff = expiry.getTime() - Date.now();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= 30) {
      return { text: `${school.planName} Plan (Expires in ${daysDiff} days)`, type: 'warning' };
    }
    
    return { text: `${school.planName} Plan`, type: 'success' };
  };

  const planStatus = getPlanStatusText();

  return (
    <header className="glass-panel" style={{
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '0 0 var(--radius-md) var(--radius-md)',
      marginBottom: '24px',
      borderTop: 'none'
    }}>
      {/* Title */}
      <div>
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          textTransform: 'capitalize'
        }}>{title.replace('-', ' ')}</h2>
      </div>

      {/* Action panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* School Plan Badge */}
        {planStatus && (
          <span className={`badge badge-${planStatus.type}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px'
          }}>
            {planStatus.type === 'danger' && <AlertCircle size={14} />}
            {planStatus.type === 'warning' && <AlertCircle size={14} />}
            {planStatus.text}
          </span>
        )}

        {/* Database Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${dbMode === 'firebase' ? 'badge-primary' : 'badge-warning'}`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px'
          }}>
            <Database size={14} />
            {dbMode === 'firebase' ? 'Firebase Live' : 'Sandbox Demo'}
          </span>
          
          <button 
            onClick={() => toggleDbMode(dbMode === 'firebase' ? 'sandbox' : 'firebase')}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title={`Switch to ${dbMode === 'firebase' ? 'Sandbox Mode' : 'Firebase Mode'}`}
          >
            Switch to {dbMode === 'firebase' ? 'Sandbox' : 'Firebase'}
          </button>
        </div>

        {/* Dark/Light mode toggle */}
        <button 
          onClick={toggleTheme} 
          className="btn-icon" 
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Log out */}
        <button 
          onClick={logout} 
          className="btn btn-secondary" 
          style={{ padding: '8px 12px', fontSize: '0.85rem' }}
          title="Sign Out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
export default Header;
