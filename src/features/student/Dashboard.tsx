import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Calendar, CheckSquare, Clock, Megaphone } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { school, user } = useAuth();
  const [timetable, setTimetable] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [attendancePercent, setAttendancePercent] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentDashboard = async () => {
      if (!school || !user || !user.studentDetails) return;
      setLoading(true);
      try {
        const { classId, sectionId } = user.studentDetails;
        
        // Load data
        const ttList = await dbService.getTimetable(school.id, classId, sectionId);
        const hwList = await dbService.getHomeworks(school.id, classId, sectionId);
        const subjList = await dbService.getSubjects(school.id);
        const noticeList = await dbService.getNotices(school.id);
        
        // Calculate attendance
        const attendanceList = await dbService.getAttendanceList(school.id, classId, sectionId);
        const studentLogs = attendanceList.filter(
          (a: any) => a.records && a.records[user.uid]
        );
        const total = studentLogs.length;
        const present = studentLogs.filter((a: any) => a.records[user.uid] === 'present').length;
        const late = studentLogs.filter((a: any) => a.records[user.uid] === 'late').length;
        const rate = total === 0 ? 100 : Math.round(((present + late * 0.5) / total) * 100);
        setAttendancePercent(rate);

        setTimetable(ttList);
        setHomeworks(hwList);
        setSubjects(subjList);
        setNotices(noticeList.slice(0, 3));
      } catch (err) {
        console.error("Failed to load student dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentDashboard();
  }, [school, user]);

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || id;
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Metric Cards Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        
        {/* Attendance card */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
            <CheckSquare size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>My Attendance</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {attendancePercent}%
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Good standing</span>
          </div>
        </div>

        {/* Homework card */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Pending Homework</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              {homeworks.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned tasks</span>
          </div>
        </div>

        {/* Level card */}
        <div className="glass-panel metric-card">
          <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>My Grade Level</span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
              Grade 10
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Section A</span>
          </div>
        </div>

      </div>

      {/* Timetable + Notice board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        
        {/* Schedule grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
            Weekly Class Timetable
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DAYS.map(dayName => {
              const dayRecord = timetable.find(t => t.day === dayName);
              const slots = dayRecord ? dayRecord.slots : [];
              return (
                <div 
                  key={dayName}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{dayName}</h4>
                  {slots.length === 0 ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No periods configured.</span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {slots.map((slot: any, idx: number) => (
                        <div 
                          key={idx}
                          style={{
                            padding: '6px 12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.75rem'
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>{slot.time}</span>
                          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
                          <span>{getSubjectName(slot.subjectId)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notices Board */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={18} style={{ color: 'var(--primary)' }} />
            School Bulletins
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
