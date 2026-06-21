import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { CheckSquare, Calendar, ShieldCheck } from 'lucide-react';

export const Attendance: React.FC = () => {
  const { school, user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Selections
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Attendance records state
  const [records, setRecords] = useState<{ [studentId: string]: 'present' | 'absent' | 'late' }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      if (!school) return;
      try {
        const cList = await dbService.getClasses(school.id);
        const sList = await dbService.getSections(school.id);
        setClasses(cList);
        setSections(sList);
      } catch (err) {
        console.error("Failed to load attendance variables:", err);
      }
    };
    loadFilters();
  }, [school]);

  // Load students and existing attendance when filters change
  useEffect(() => {
    const loadSheet = async () => {
      if (!school || !selectedClassId || !selectedSectionId) return;
      setLoading(true);
      try {
        // 1. Fetch students in school
        const uList = await dbService.getUsers(school.id);
        const filteredStudents = uList.filter(
          u => u.role === 'student' && 
               u.studentDetails && 
               u.studentDetails.classId === selectedClassId && 
               u.studentDetails.sectionId === selectedSectionId
        );
        setStudents(filteredStudents);

        // 2. Fetch existing attendance records
        const existingAtt = await dbService.getAttendance(school.id, selectedClassId, selectedSectionId, date);
        
        if (existingAtt && existingAtt.records) {
          setRecords(existingAtt.records);
        } else {
          // Initialize everyone as present by default
          const defaultRecords: any = {};
          filteredStudents.forEach(s => {
            defaultRecords[s.uid] = 'present';
          });
          setRecords(defaultRecords);
        }
      } catch (err) {
        console.error("Failed to load attendance sheet:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSheet();
  }, [school, selectedClassId, selectedSectionId, date]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user || !selectedClassId || !selectedSectionId) return;

    try {
      await dbService.saveAttendance(
        school.id,
        selectedClassId,
        selectedSectionId,
        date,
        records,
        user.uid
      );
      alert("Attendance submitted successfully!");
    } catch (err) {
      alert("Failed to submit attendance: " + err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Filter Selection Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Grade / Class</label>
            <select className="form-select" value={selectedClassId} onChange={e => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId('');
            }}>
              <option value="">Choose Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Section</label>
            <select className="form-select" value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)}>
              <option value="">Choose Section</option>
              {sections.filter(s => s.classId === selectedClassId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Attendance Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Roster Sheet */}
      {selectedClassId && selectedSectionId && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
              Roll Call Register
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Date: <span style={{ fontWeight: 600 }}>{new Date(date).toLocaleDateString()}</span>
            </span>
          </div>

          {loading ? (
            <div>Loading attendance list...</div>
          ) : students.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No students registered in this class/section.</p>
          ) : (
            <form onSubmit={handleSaveAttendance}>
              <div className="table-container" style={{ marginBottom: '20px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Admission No</th>
                      <th style={{ textAlign: 'center' }}>Roll Call Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => {
                      const currentStatus = records[s.uid] || 'present';
                      return (
                        <tr key={s.uid}>
                          <td>{s.studentDetails?.rollNo || '-'}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.studentDetails?.admissionNo}</td>
                          <td style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {/* Present pill */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.uid, 'present')}
                              style={{
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: currentStatus === 'present' ? 'var(--success)' : 'var(--bg-tertiary)',
                                color: currentStatus === 'present' ? '#fff' : 'var(--text-secondary)'
                              }}
                            >
                              Present
                            </button>
                            {/* Late pill */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.uid, 'late')}
                              style={{
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: currentStatus === 'late' ? 'var(--warning)' : 'var(--bg-tertiary)',
                                color: currentStatus === 'late' ? '#fff' : 'var(--text-secondary)'
                              }}
                            >
                              Late
                            </button>
                            {/* Absent pill */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.uid, 'absent')}
                              style={{
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: currentStatus === 'absent' ? 'var(--danger)' : 'var(--bg-tertiary)',
                                color: currentStatus === 'absent' ? '#fff' : 'var(--text-secondary)'
                              }}
                            >
                              Absent
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <ShieldCheck size={18} />
                  <span>Submit Roll Call</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!selectedClassId && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }} className="glass-panel">
          Select class parameters in the filter above to begin daily roll call registration.
        </div>
      )}

    </div>
  );
};
export default Attendance;
