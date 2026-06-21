import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { School, Users, Award, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolList = await dbService.getSchools();
        const userList = await dbService.getUsers(null);
        setSchools(schoolList);
        setUsers(userList);
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.isActive).length;
  const premiumSchools = schools.filter(s => s.planName === 'Premium' && s.isActive).length;
  
  const teachersCount = users.filter(u => u.role === 'teacher').length;
  const studentsCount = users.filter(u => u.role === 'student').length;
  
  const expiredPlansCount = schools.filter(s => new Date(s.planExpiry).getTime() < Date.now()).length;

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard data...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Card 1 */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <School size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Schools</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {totalSchools}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{activeSchools} Active</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Students</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {studentsCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all nodes</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <Award size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Premium Licenses</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {premiumSchools}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Manual tier assignments</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ 
            background: expiredPlansCount > 0 ? 'var(--danger-light)' : 'var(--warning-light)', 
            color: expiredPlansCount > 0 ? 'var(--danger)' : 'var(--warning)' 
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Expired Tenants</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {expiredPlansCount}
            </h3>
            <span style={{ fontSize: '0.75rem', color: expiredPlansCount > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
              {expiredPlansCount > 0 ? 'Action required' : 'System healthy'}
            </span>
          </div>
        </div>

      </div>

      {/* Roster overview and recent actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        {/* Left column */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            System Tenant Distribution
          </h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>School</th>
                  <th>Teachers</th>
                  <th>Students</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(s => {
                  const sTeachers = users.filter(u => u.schoolId === s.id && u.role === 'teacher').length;
                  const sStudents = users.filter(u => u.schoolId === s.id && u.role === 'student').length;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{sTeachers}</td>
                      <td>{sStudents}</td>
                      <td>
                        <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {s.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            Quick Stats
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Instructors</span>
              <span style={{ fontWeight: 700 }}>{teachersCount}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Parents</span>
              <span style={{ fontWeight: 700 }}>{users.filter(u => u.role === 'parent').length}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-md)'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Platform Version</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>v2.0 Stable</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Dashboard;
