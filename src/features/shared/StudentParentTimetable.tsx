/**
 * StudentParentTimetable
 * Shared component for Student and Parent roles.
 * 
 * Student: reads classId from their own profile.
 * Parent:  reads classId from selected child's profile (passed as prop).
 *
 * No section filtering. Read-only.
 */
import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_COLORS: Record<string, string> = {
  Monday:    'var(--primary)',
  Tuesday:   'var(--success)',
  Wednesday: '#f59e0b',
  Thursday:  '#3b82f6',
  Friday:    'var(--danger)',
  Saturday:  '#8b5cf6',
};

interface Props {
  /** For parent: pass the selected child's classId. For student: leave undefined. */
  childClassId?: string;
  childClassName?: string;
}

export const StudentParentTimetable: React.FC<Props> = ({ childClassId, childClassName }) => {
  const { school, user } = useAuth();
  const [periods, setPeriods]   = useState<any[]>([]);
  const [className, setClassName] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!school || !user) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        // Determine which classId to use
        let classId  = childClassId  || user.studentDetails?.classId  || '';
        let clsName  = childClassName || user.studentDetails?.className || '';

        if (!classId) {
          setError('Your class has not been assigned yet. Contact your principal.');
          setLoading(false);
          return;
        }
        setClassName(clsName);

        const data = await dbService.getClassTimetable(school.id, classId);
        // Sort by day index then startTime
        data.sort((a, b) => {
          const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
          if (di !== 0) return di;
          return (a.startTime || '').localeCompare(b.startTime || '');
        });
        setPeriods(data);
      } catch (err: any) {
        setError('Failed to load timetable: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [school, user, childClassId]);

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = periods.filter(p => p.day === d);
    return acc;
  }, {} as Record<string, any[]>);

  const activeDays = DAYS.filter(d => byDay[d].length > 0);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading timetable…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
          {className ? `Timetable — ${className}` : 'Class Timetable'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Weekly class schedule. Read-only view.
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'var(--danger-light, #fee2e2)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {!error && periods.length === 0 && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No timetable has been set for your class yet.</p>
        </div>
      )}

      {activeDays.length > 0 && (
        <>
          {/* Day cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {activeDays.map(day => (
              <div key={day} className="glass-panel" style={{ padding: '18px', borderTop: `3px solid ${DAY_COLORS[day]}` }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: DAY_COLORS[day], marginBottom: '12px' }}>
                  {day}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {byDay[day].map((p, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: DAY_COLORS[day], marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={11} /> {p.startTime} – {p.endTime}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.subjectName || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        👨‍🏫 {p.teacherName || '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Full table */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
              Full Week Table
            </h3>
            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Teacher</th>
                  </tr>
                </thead>
                <tbody>
                  {periods.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: DAY_COLORS[p.day] || 'var(--primary)' }}>{p.day}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{p.startTime} – {p.endTime}</td>
                      <td style={{ fontWeight: 600 }}>{p.subjectName || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.teacherName || '—'}</td>
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

export default StudentParentTimetable;
