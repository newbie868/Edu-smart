import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Clock, Plus, Trash2, CalendarDays } from 'lucide-react';

export const Timetable: React.FC = () => {
  const { school } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  // Selection filters
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Slot creation form
  const [day, setDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');
  const [time, setTime] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const loadBaseData = async () => {
    if (!school) return;
    try {
      const cList = await dbService.getClasses(school.id);
      const sList = await dbService.getSections(school.id);
      const subjList = await dbService.getSubjects(school.id);
      const uList = await dbService.getUsers(school.id);
      setClasses(cList);
      setSections(sList);
      setSubjects(subjList);
      setTeachers(uList.filter(u => u.role === 'teacher'));
    } catch (err) {
      console.error("Failed to load timetable parameters:", err);
    }
  };

  const loadActiveTimetable = async () => {
    if (!school || !selectedClassId || !selectedSectionId) return;
    setLoading(true);
    try {
      const ttList = await dbService.getTimetable(school.id, selectedClassId, selectedSectionId);
      setTimetable(ttList);
    } catch (err) {
      console.error("Failed to load timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, [school]);

  useEffect(() => {
    loadActiveTimetable();
  }, [selectedClassId, selectedSectionId]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !selectedClassId || !selectedSectionId) {
      alert("Please choose a class and section first.");
      return;
    }

    try {
      // Find existing timetable record for this day
      const existingDayRecord = timetable.find(t => t.day === day);
      const newSlots = existingDayRecord ? [...existingDayRecord.slots] : [];
      
      // Append new slot
      newSlots.push({ time, subjectId, teacherId });
      
      // Sort slots by start time (simple sort helper)
      newSlots.sort((a, b) => a.time.localeCompare(b.time));

      await dbService.saveTimetable(school.id, selectedClassId, selectedSectionId, day, newSlots);
      
      // Reset form
      setTime('');
      setSubjectId('');
      setTeacherId('');
      
      // Refresh
      loadActiveTimetable();
    } catch (err) {
      alert("Failed to add timetable slot: " + err);
    }
  };

  const handleDeleteSlot = async (dayName: string, slotIndex: number) => {
    if (!school || !selectedClassId || !selectedSectionId) return;
    if (!window.confirm("Are you sure you want to delete this class slot?")) return;

    try {
      const dayRecord = timetable.find(t => t.day === dayName);
      if (!dayRecord) return;

      const newSlots = dayRecord.slots.filter((_: any, idx: number) => idx !== slotIndex);

      await dbService.saveTimetable(school.id, selectedClassId, selectedSectionId, dayName, newSlots);
      loadActiveTimetable();
    } catch (err) {
      alert("Failed to delete slot: " + err);
    }
  };

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || id;
  };

  const getTeacherName = (id: string) => {
    return teachers.find(t => t.uid === id)?.name || id;
  };

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Selection Filter Bar */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '14px' }}>
          Select Class & Section Schedule
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
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
        </div>
      </div>

      {selectedClassId && selectedSectionId && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Add Slot Form */}
          <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} style={{ color: 'var(--primary)' }} />
              Onboard Class Period
            </h3>
            
            <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Day</label>
                <select className="form-select" value={day} onChange={e => setDay(e.target.value as any)}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Time Interval</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={time} 
                  onChange={e => setTime(e.target.value)} 
                  placeholder="e.g. 09:00 - 10:00" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" required value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                  <option value="">Choose Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instructor / Teacher</label>
                <select className="form-select" required value={teacherId} onChange={e => setTeacherId(e.target.value)}>
                  <option value="">Choose Teacher</option>
                  {teachers.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
                <Clock size={16} />
                <span>Save Time Slot</span>
              </button>
            </form>
          </div>

          {/* Weekly Schedule Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={18} style={{ color: 'var(--success)' }} />
              Weekly Class Schedule
            </h3>

            {loading ? (
              <div>Loading timetable grid...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {DAYS.map(dayName => {
                  const dayRecord = timetable.find(t => t.day === dayName);
                  const slots = dayRecord ? dayRecord.slots : [];
                  
                  return (
                    <div 
                      key={dayName} 
                      style={{
                        padding: '16px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <h4 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '10px', color: 'var(--primary)' }}>
                        {dayName}
                      </h4>
                      {slots.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>No slots set.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {slots.map((slot: any, idx: number) => (
                            <div 
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 12px',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.8rem'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{slot.time}</span>
                                <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                                <span style={{ fontWeight: 500 }}>{getSubjectName(slot.subjectId)}</span>
                                <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>•</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{getTeacherName(slot.teacherId)}</span>
                              </div>
                              <button 
                                onClick={() => handleDeleteSlot(dayName, idx)}
                                className="btn-icon" 
                                style={{ padding: '4px', color: 'var(--danger)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {!selectedClassId && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }} className="glass-panel">
          Choose a class and section above to view and schedule academic timetables.
        </div>
      )}

    </div>
  );
};
export default Timetable;
