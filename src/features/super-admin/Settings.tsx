import React from 'react';
import { Settings as SettingsIcon, Shield, Server } from 'lucide-react';

export const Settings: React.FC = () => {
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
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                Firebase Live Project: jksms-247
              </span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
export default Settings;
