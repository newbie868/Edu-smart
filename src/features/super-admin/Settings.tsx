import React from 'react';
import { Settings as SettingsIcon, Shield, Server, Database, RotateCcw } from 'lucide-react';
import { getDbMode } from '../../services/dbService';

export const Settings: React.FC = () => {
  const handleResetSandbox = () => {
    if (window.confirm("Are you sure you want to RESET the local sandbox? This will overwrite all custom local storage records back to the seed state.")) {
      localStorage.removeItem('edu_smart_seeded');
      localStorage.removeItem('edu_schools');
      localStorage.removeItem('edu_users');
      localStorage.removeItem('edu_classes');
      localStorage.removeItem('edu_sections');
      localStorage.removeItem('edu_subjects');
      localStorage.removeItem('edu_timetable');
      localStorage.removeItem('edu_attendance');
      localStorage.removeItem('edu_homework');
      localStorage.removeItem('edu_study_materials');
      localStorage.removeItem('edu_exams');
      localStorage.removeItem('edu_marks');
      localStorage.removeItem('edu_fees');
      localStorage.removeItem('edu_notices');
      localStorage.removeItem('edu_leaves');
      localStorage.removeItem('edu_messages');
      window.location.reload();
    }
  };

  const currentMode = getDbMode();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Platform settings */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <SettingsIcon size={24} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            System Settings
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)'
          }}>
            <Shield size={20} style={{ color: 'var(--primary)', marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Multi-Tenant Isolation</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Edu-Smart employs strict Firestore security rules filtering by `schoolId`. Inter-tenant data leakage is prevented at the database service and authentication guard layer.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)'
          }}>
            <Server size={20} style={{ color: 'var(--info)', marginTop: '2px' }} />
            <div>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Active Database Connection</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                The active client is connected to:
              </p>
              <span className={`badge ${currentMode === 'firebase' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                {currentMode === 'firebase' ? 'Firebase Live Project: jksms-247' : 'LocalStorage Simulated Sandbox'}
              </span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />

          {/* Sandbox control */}
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={16} style={{ color: 'var(--warning)' }} />
              Developer Sandbox Controls
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '16px' }}>
              If you are testing or demonstrating the platform in Sandbox Mode, you can reset the entire LocalStorage database state back to its seed parameters (Springfield Academy records).
            </p>
            <button 
              onClick={handleResetSandbox}
              className="btn"
              style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                borderColor: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                fontWeight: 600
              }}
            >
              <RotateCcw size={16} />
              <span>Reset Sandbox Local Database</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
export default Settings;
