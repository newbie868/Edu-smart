import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, CheckSquare, CreditCard, Clock, Megaphone } from 'lucide-react';

interface ParentDashboardProps {
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
}

export const Dashboard: React.FC<ParentDashboardProps> = ({ selectedChildId, setSelectedChildId }) => {
  const { school, user } = useAuth();
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendancePercent, setAttendancePercent] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParentDashboard = async () => {
      if (!school || !user || !user.parentDetails) return;
      setLoading(true);
      try {
        // 1. Fetch children profiles
        const uList = await dbService.getUsers(school.id);
        const kids = uList.filter(u => user.parentDetails.studentIds.includes(u.uid));
        setChildrenList(kids);

        // Auto-select first child if none selected
        let activeKidId = selectedChildId;
        if (!activeKidId && kids.length > 0) {
          activeKidId = kids[0].uid;
          setSelectedChildId(kids[0].uid);
        }

        if (activeKidId) {
          const kid = kids.find(k => k.uid === activeKidId);
          if (kid && kid.studentDetails) {
            const { classId, sectionId } = kid.studentDetails;
            
            // Load child details
            const ttList = await dbService.getTimetable(school.id, classId, sectionId);
            const feeList = await dbService.getFees(school.id, activeKidId);
            const subjList = await dbService.getSubjects(school.id);
            
            // Scan attendance
            const rawAttendance = JSON.parse(localStorage.getItem('edu_attendance') || '[]');
            const childLogs = rawAttendance.filter(
              (a: any) => a.schoolId === school.id && a.classId === classId && a.sectionId === sectionId && a.records && a.records[activeKidId]
            );
            const total = childLogs.length;
            const present = childLogs.filter((a: any) => a.records[activeKidId] === 'present').length;
            const late = childLogs.filter((a: any) => a.records[activeKidId] === 'late').length;
            const rate = total === 0 ? 100 : Math.round(((present + late * 0.5) / total) * 100);

            setTimetable(ttList);
            setFees(feeList);
            setAttendancePercent(rate);
            setSubjects(subjList);
          }
        }

        // Notices
        const noticeList = await dbService.getNotices(school.id);
        setNotices(noticeList.slice(0, 3));
      } catch (err) {
        console.error("Failed to load parent metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadParentDashboard();
  }, [school, user, selectedChildId]);

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || id;
  };

  const getChildClassDetails = () => {
    if (!selectedChildId) return '';
    const kid = childrenList.find(c => c.uid === selectedChildId);
    if (!kid || !kid.studentDetails) return '';
    return `Grade level: Roll ${kid.studentDetails.rollNo}`;
  };

  const getUnpaidFeesCount = () => {
    return fees.filter(f => f.status === 'unpaid').length;
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading guardian workspace...</div>;
  }

  const activeChild = childrenList.find(c => c.uid === selectedChildId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* Child Switcher Ribbon */}
      {childrenList.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Select Student Profile</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Currently viewing academic records for {activeChild?.name}.</span>
          </div>
          <select 
            className="form-select" 
            style={{ maxWidth: '240px' }}
            value={selectedChildId}
            onChange={e => setSelectedChildId(e.target.value)}
          >
            {childrenList.map(c => <option key={c.uid} value={c.uid}>👤 {c.name}</option>)}
          </select>
        </div>
      )}

      {selectedChildId ? (
        <>
          {/* Child Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px'
          }}>
            {/* Attendance rate */}
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                <CheckSquare size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Child Attendance</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
                  {attendancePercent}%
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Active attendance</span>
              </div>
            </div>

            {/* Fees status */}
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: getUnpaidFeesCount() > 0 ? 'var(--danger-light)' : 'var(--success-light)', color: getUnpaidFeesCount() > 0 ? 'var(--danger)' : 'var(--success)' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Tuition Status</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
                  {getUnpaidFeesCount() > 0 ? `${getUnpaidFeesCount()} Unpaid` : 'Settled'}
                </h3>
                <span style={{ fontSize: '0.75rem', color: getUnpaidFeesCount() > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                  {getUnpaidFeesCount() > 0 ? 'Payment required' : 'No dues'}
                </span>
              </div>
            </div>

            {/* Class info */}
            <div className="glass-panel metric-card">
              <div className="metric-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Academic Level</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0 0 0' }}>
                  Grade 10
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getChildClassDetails()}</span>
              </div>
            </div>
          </div>

          {/* Timetable + notice board */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '24px',
            flexWrap: 'wrap'
          }}>
            
            {/* Timetable schedule */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
                Class Schedule Timetable
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No periods set.</span>
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

            {/* Notices feed */}
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
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      ) : (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }} className="glass-panel">
          No children profiles associated with your parent account. Please contact the school Principal.
        </div>
      )}

    </div>
  );
};
export default Dashboard;
