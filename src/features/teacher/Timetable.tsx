import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_COLORS: Record<string, string> = {
  Monday:    'var(--primary)',
  Tuesday:   'var(--success)',
  Wednesday: 'var(--warning, #f59e0b)',
  Thursday:  'var(--info, #3b82f6)',
  Friday:    'var(--danger)',
  Saturday:  '#8b5cf6',
};

export const TeacherTimetable: React.FC = () => {
  const { school, user } = useAuth();
  const [periods, setPeriods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!school || !user) return;
    (async () => {
      setLoading(true);
      try {
        const data = await dbService.getTeacherTimetable(school.id, user.uid);
        // Sort by day then startTime
        data.sort((a, b) => {
          const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
          if (di !== 0) return di;
          return (a.startTime || '').localeCompare(b.startTime || '');
        });
        setPeriods(data);
      } catch (err) {
        console.error('Failed to load teacher timetable:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [school, user]);

  // Group by day
  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = periods.filter(p => p.day === day);
    return acc;
  }, {} as Record<string, any[]>);

  const activeDays = DAYS.filter(d => byDay[d].length > 0);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading your timetable…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
          My Timetable
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Your assigned classes and periods for the week. Read-only view.
        </p>
      </div>

      {periods.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Clock size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No periods have been assigned to you yet.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Contact your principal to set up the timetable.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Clock size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Periods / Week</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0' }}>{periods.length}</h3>
              </div>
            </div>
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                <CalendarDays size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Days</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0' }}>{activeDays.length}</h3>
              </div>
            </div>
          </div>

          {/* Day-by-day grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {activeDays.map(day => (
              <div key={day} className="glass-panel" style={{ padding: '20px', borderTop: `3px solid ${DAY_COLORS[day] || 'var(--primary)'}` }}>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: DAY_COLORS[day] || 'var(--primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarDays size={16} />
                  {day}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {byDay[day].map((p, idx) => (
                    <div key={idx} style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                    }}>
                      {/* Time badge */}
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        fontSize: '0.7rem', fontWeight: 700, color: DAY_COLORS[day] || 'var(--primary)',
                        background: `${DAY_COLORS[day] || 'var(--primary)'}18`,
                        padding: '3px 8px', borderRadius: '20px', marginBottom: '8px'
                      }}>
                        <Clock size={11} />
                        {p.startTime} – {p.endTime}
                      </div>
                      {/* Subject */}
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {p.subjectName || '—'}
                      </div>
                      {/* Class */}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        📚 {p.className || 'Class'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Full week table view */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Full Week Schedule
            </h3>
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Class</th>
                    <th>Subject</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 700, color: DAY_COLORS[p.day] || 'var(--primary)' }}>{p.day}</td>
                      <td style={{ whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {p.startTime} – {p.endTime}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.className || '—'}</td>
                      <td>{p.subjectName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherTimetable;
