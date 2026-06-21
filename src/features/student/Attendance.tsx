import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Calendar } from 'lucide-react';

export const Attendance: React.FC = () => {
  const { school, user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendanceLogs = async () => {
      if (!school || !user || !user.studentDetails) return;
      setLoading(true);
      try {
        const { classId, sectionId } = user.studentDetails;
        
        // Fetch all attendance records for this class/section
        const attendanceList = await dbService.getAttendanceList(school.id, classId, sectionId);
        const studentLogs = attendanceList
          .filter((a: any) => a.records && a.records[user.uid])
          .map((a: any) => ({
            date: a.date,
            status: a.records[user.uid],
            updatedAt: a.updatedAt
          }))
          .sort((a: any, b: any) => b.date.localeCompare(a.date));

        setLogs(studentLogs);
      } catch (err) {
        console.error("Failed to load student attendance logs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAttendanceLogs();
  }, [school, user]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading attendance log...</div>;
  }

  const presentCount = logs.filter(l => l.status === 'present').length;
  const lateCount = logs.filter(l => l.status === 'late').length;
  const absentCount = logs.filter(l => l.status === 'absent').length;
  const totalCount = logs.length;
  const percent = totalCount === 0 ? 100 : Math.round(((presentCount + lateCount * 0.5) / totalCount) * 100);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
      
      {/* Summary Stats Card */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
          Roll Call Summary
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Attendance Rate</span>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--success)' }}>{percent}%</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
            <div style={{ background: 'var(--success-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>{presentCount}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Present</span>
            </div>
            <div style={{ background: 'var(--warning-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--warning)' }}>{lateCount}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Late</span>
            </div>
            <div style={{ background: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, color: 'var(--danger)' }}>{absentCount}</div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Absent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Records List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
          Roll Call Logs
        </h3>

        {logs.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px' }}>No roll call records found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {logs.map((log, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 500 }}>{new Date(log.date).toLocaleDateString()}</span>
                </div>
                <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default Attendance;
