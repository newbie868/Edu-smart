import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Users, GraduationCap, School, BookOpen, AlertCircle, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { school } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!school) return;
      setLoading(true);
      try {
        const uList = await dbService.getUsers(school.id);
        const cList = await dbService.getClasses(school.id);
        const sList = await dbService.getSubjects(school.id);
        const lList = await dbService.getLeaves(school.id);
        const nList = await dbService.getNotices(school.id);

        setTeachers(uList.filter(u => u.role === 'teacher'));
        setStudents(uList.filter(u => u.role === 'student'));
        setClasses(cList);
        setSubjects(sList);
        setLeaves(lList.filter(l => l.status === 'pending'));
        setNotices(nList.slice(0, 3)); // show top 3 bulletins
      } catch (err) {
        console.error("Failed to load principal dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [school]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading school metrics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Teachers count */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Users size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Teachers</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {teachers.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Staff Members</span>
          </div>
        </div>

        {/* Students count */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Students</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {students.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Enrolled Pupils</span>
          </div>
        </div>

        {/* Classes count */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
            <School size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Classes</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {classes.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Grade levels</span>
          </div>
        </div>

        {/* Subjects count */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Subjects</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {subjects.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curriculum catalog</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Notice Board + Leaves Queue */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Bulletin board preview */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            Recent Bulletins & Notices
          </h3>
          {notices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No notices published.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {notices.map(n => (
                <div 
                  key={n.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{n.title}</h4>
                    <span className={`badge ${n.schoolId === 'global' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.6rem' }}>
                      {n.schoolId === 'global' ? 'Global' : 'School'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '8px' }}>
                    {n.content}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} />
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaves queue preview */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
            Pending Leaves Queue
          </h3>
          {leaves.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>All leave applications processed.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {leaves.slice(0, 3).map(l => (
                <div 
                  key={l.id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {teachers.find(t => t.uid === l.userId)?.name || students.find(s => s.uid === l.userId)?.name || l.userId}
                    </span>
                    <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{l.role}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Reason: {l.reason}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Timeline: {l.startDate} to {l.endDate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default Dashboard;
