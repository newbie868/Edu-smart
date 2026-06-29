import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, CheckSquare, Megaphone, Clock, Calendar } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { school, user } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!school || !user) return;
      setLoading(true);
      try {
        const [subjList, noticeList, teacherPeriods] = await Promise.all([
          dbService.getSubjects(school.id),
          dbService.getNotices(school.id),
          dbService.getTeacherTimetable(school.id, user.uid),
        ]);

        // Sort by day then startTime
        const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        teacherPeriods.sort((a: any, b: any) => {
          const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
          return di !== 0 ? di : (a.startTime || '').localeCompare(b.startTime || '');
        });

        setSubjects(subjList);
        setNotices(noticeList.slice(0, 3));
        setTimetable(teacherPeriods);
      } catch (err) {
        console.error("Failed to load teacher metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [school, user]);

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || id;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading teacher metrics...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Metric summary panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Classes count */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Teaching Schedule</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {timetable.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Periods per week</span>
          </div>
        </div>

        {/* Subjects taught */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Assigned Subjects</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {user?.teacherDetails?.subjects?.length || 0}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Curriculum topics</span>
          </div>
        </div>

      </div>

      {/* Schedule + Notices Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        
        {/* Schedule grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            My Teaching Class Schedule
          </h3>
          {timetable.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No class periods assigned in timetable schedules.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Class / Grade</th>
                    <th>Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((slot, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{slot.day}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{slot.startTime} – {slot.endTime}</td>
                      <td>{slot.className || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{slot.subjectName || getSubjectName(slot.subjectId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notices list */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={18} style={{ color: 'var(--primary)' }} />
            Bulletins Board
          </h3>
          
          {notices.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No notices published.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {notices.map(n => (
                <div 
                  key={n.id}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{n.title}</span>
                    <span className={`badge ${n.schoolId === 'global' ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.6rem', transform: 'scale(0.9)' }}>
                      {n.schoolId === 'global' ? 'Global' : 'School'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>{n.content}</p>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                    <Calendar size={10} />
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
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
