import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { TimeSlotModal } from './TimeSlotModal';
import {
  Save, Trash2, CalendarDays, AlertCircle, CheckCircle, Info, Settings2
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
type Day = typeof DAYS[number];

interface Period {
  _id: string;
  day: Day;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  isBreak: boolean;
}

interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  order: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
let _uid = 0;
const uid = () => `p-${++_uid}`;

const makeGrid = (timeSlots: TimeSlot[], dbPeriods: any[]): Period[] => {
  const map = new Map<string, any>();
  dbPeriods.forEach(p => map.set(`${p.day}|${p.startTime}`, p));

  const grid: Period[] = [];
  DAYS.forEach(day => {
    timeSlots.forEach(slot => {
      const key = `${day}|${slot.startTime}`;
      const existing = map.get(key);
      grid.push({
        _id:         uid(),
        day,
        startTime:   slot.startTime,
        endTime:     slot.endTime,
        isBreak:     slot.isBreak,
        subjectId:   existing?.subjectId   || '',
        subjectName: existing?.subjectName || '',
        teacherId:   existing?.teacherId   || '',
        teacherName: existing?.teacherName || '',
      });
    });
  });
  return grid;
};

// Format "08:00" → "08:00 AM"
const fmt = (t: string): string => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const hh   = h % 12 || 12;
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

// ─── Component ─────────────────────────────────────────────────────────────────
export const Timetable: React.FC = () => {
  const { school } = useAuth();

  const [classes,   setClasses]   = useState<any[]>([]);
  const [subjects,  setSubjects]  = useState<any[]>([]);
  const [teachers,  setTeachers]  = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  const [selectedClassId,   setSelectedClassId]   = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');

  const [grid,            setGrid]           = useState<Period[]>([]);
  const [loading,         setLoading]        = useState(false);
  const [slotsLoading,    setSlotsLoading]   = useState(true);
  const [saving,          setSaving]         = useState(false);
  const [showSlotModal,   setShowSlotModal]  = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Load base data + time slots ─────────────────────────────────────────────
  useEffect(() => {
    if (!school) return;
    (async () => {
      setSlotsLoading(true);
      try {
        const [cList, subjList, uList, slots] = await Promise.all([
          dbService.getClasses(school.id),
          dbService.getSubjects(school.id),
          dbService.getUsers(school.id),
          dbService.getTimeSlots(school.id),
        ]);
        setClasses(cList);
        setSubjects(subjList);
        setTeachers(uList.filter(u => u.role === 'teacher'));
        setTimeSlots(slots as TimeSlot[]);
      } catch (err) {
        console.error('Failed to load timetable base data:', err);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [school]);

  // ── Reload grid when class or timeSlots change ─────────────────────────────
  const loadTimetable = useCallback(async (classId: string, slots: TimeSlot[]) => {
    if (!school || !classId || slots.length === 0) return;
    setLoading(true);
    try {
      const dbPeriods = await dbService.getTimetableByClass(school.id, classId);
      setGrid(makeGrid(slots, dbPeriods));
    } catch (err) {
      showToast('error', 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, [school]);

  useEffect(() => {
    if (selectedClassId && timeSlots.length > 0) {
      loadTimetable(selectedClassId, timeSlots);
    } else {
      setGrid([]);
    }
  }, [selectedClassId, timeSlots]);

  // ── Cell update ────────────────────────────────────────────────────────────
  const updatePeriod = (pid: string, field: keyof Period, value: string) => {
    setGrid(prev => prev.map(p => {
      if (p._id !== pid) return p;
      const updated = { ...p, [field]: value };
      if (field === 'subjectId') {
        updated.subjectName = subjects.find(s => s.id === value)?.name || '';
      }
      if (field === 'teacherId') {
        updated.teacherName = teachers.find(t => t.uid === value)?.name || '';
      }
      return updated;
    }));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    const filled = grid.filter(p => !p.isBreak && (p.subjectId || p.teacherId));
    for (const p of filled) {
      if (p.subjectId && !p.teacherId)
        return `${p.day} ${p.startTime}: Teacher required when a subject is selected.`;
      if (p.teacherId && !p.subjectId)
        return `${p.day} ${p.startTime}: Subject required when a teacher is selected.`;
    }
    const teacherMap = new Map<string, string>();
    for (const p of filled) {
      if (!p.teacherId) continue;
      const key = `${p.teacherId}|${p.startTime}`;
      if (teacherMap.has(key)) {
        return `"${p.teacherName}" is already assigned at ${p.startTime} on ${teacherMap.get(key)}. Cannot assign to ${p.day}.`;
      }
      teacherMap.set(key, p.day);
    }
    return null;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!school || !selectedClassId) return;
    const err = validate();
    if (err) { showToast('error', err); return; }
    setSaving(true);
    try {
      const periodsToSave = grid
        .filter(p => !p.isBreak && p.subjectId && p.teacherId)
        .map(({ _id, isBreak, ...rest }) => rest);
      await dbService.saveTimetableByClass(school.id, selectedClassId, selectedClassName, periodsToSave);
      showToast('success', `Timetable for ${selectedClassName} saved.`);
    } catch (e: any) {
      showToast('error', 'Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClear = () => {
    if (!window.confirm('Clear all assignments for this class?')) return;
    setGrid(prev => prev.map(p =>
      p.isBreak ? p : { ...p, subjectId: '', subjectName: '', teacherId: '', teacherName: '' }
    ));
  };

  // ── After time slots saved ────────────────────────────────────────────────
  const handleSlotsSaved = (saved: any[]) => {
    setTimeSlots(saved as TimeSlot[]);
    setShowSlotModal(false);
    showToast('success', 'Daily schedule updated. Timetable grid refreshed.');
    if (selectedClassId) loadTimetable(selectedClassId, saved as TimeSlot[]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const getCell = (day: Day, startTime: string) =>
    grid.find(p => p.day === day && p.startTime === startTime);

  if (slotsLoading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading schedule configuration…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 18px', borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          fontSize: '0.88rem', fontWeight: 500, maxWidth: '440px',
          animation: 'slideIn 0.2s ease'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Time Slot Modal */}
      {showSlotModal && school && (
        <TimeSlotModal
          schoolId={school.id}
          initialSlots={timeSlots}
          onSaved={handleSlotsSaved}
          onClose={() => setShowSlotModal(false)}
        />
      )}

      {/* ── Header card ─── */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
              Select Class to Manage Timetable
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Choose a class and build the weekly timetable. Time slots are shared across all classes.
            </p>
            <div style={{ maxWidth: '320px' }}>
              <label className="form-label">SELECT CLASS</label>
              <select
                className="form-select"
                value={selectedClassId}
                onChange={e => {
                  const cls = classes.find(c => c.id === e.target.value);
                  setSelectedClassId(e.target.value);
                  setSelectedClassName(cls?.name || '');
                }}
              >
                <option value="">Choose a class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Manage Time Slots button */}
          <button
            onClick={() => setShowSlotModal(true)}
            className="btn"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
              color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem',
              padding: '10px 16px', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', whiteSpace: 'nowrap'
            }}
          >
            <Settings2 size={16} style={{ color: 'var(--primary)' }} />
            Manage Time Slots
          </button>
        </div>

        {/* Time slot summary strip */}
        {timeSlots.length > 0 && (
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {timeSlots.map(slot => (
              <span
                key={slot.id}
                style={{
                  fontSize: '0.72rem', fontWeight: 600,
                  padding: '3px 10px', borderRadius: '20px',
                  background: slot.isBreak ? 'var(--warning-light, #fef3c7)' : 'var(--primary-light)',
                  color: slot.isBreak ? '#92400e' : 'var(--primary)',
                  border: `1px solid ${slot.isBreak ? 'var(--warning, #f59e0b)' : 'var(--primary)'}`,
                }}
              >
                {slot.name} · {fmt(slot.startTime)}–{fmt(slot.endTime)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Timetable grid ─── */}
      {selectedClassId && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '16px', flexWrap: 'wrap', gap: '12px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={18} style={{ color: 'var(--primary)' }} />
              Build Timetable for {selectedClassName}
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleClear} className="btn btn-danger" style={{ fontSize: '0.85rem' }}>
                <Trash2 size={15} /><span>Clear</span>
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Save size={15} /><span>{saving ? 'Saving…' : 'Save Timetable'}</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: '#eff6ff', border: '1px solid #3b82f6',
            color: '#3b82f6', fontSize: '0.8rem', marginBottom: '20px'
          }}>
            <Info size={16} />
            Assign a teacher for each subject slot. Break rows are read-only. Changes apply to all sections.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              Loading timetable…
            </div>
          ) : timeSlots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No time slots configured. Click <strong>Manage Time Slots</strong> to set up your daily schedule.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '860px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Period / Day</th>
                    {DAYS.map(d => <th key={d} style={thStyle}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(slot => (
                    <tr key={slot.id}>
                      {/* Row header — period name + time range */}
                      <td style={{
                        ...tdStyle,
                        width: '140px', verticalAlign: 'middle',
                        background: slot.isBreak ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                      }}>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: slot.isBreak ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                          {slot.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
                          {fmt(slot.startTime)} – {fmt(slot.endTime)}
                        </div>
                      </td>

                      {/* Day cells */}
                      {DAYS.map(day => {
                        const cell = getCell(day, slot.startTime);
                        if (!cell) return <td key={day} style={tdStyle} />;

                        if (cell.isBreak) return (
                          <td key={day} style={{
                            ...tdStyle,
                            background: 'var(--bg-tertiary)',
                            textAlign: 'center',
                            fontWeight: 600, fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.05em'
                          }}>
                            ☕ {slot.name}
                          </td>
                        );

                        return (
                          <td key={day} style={{ ...tdStyle, padding: '6px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <select
                                className="form-select"
                                style={{ fontSize: '0.73rem', padding: '5px 6px' }}
                                value={cell.subjectId}
                                onChange={e => updatePeriod(cell._id, 'subjectId', e.target.value)}
                              >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <select
                                className="form-select"
                                style={{ fontSize: '0.73rem', padding: '5px 6px' }}
                                value={cell.teacherId}
                                onChange={e => updatePeriod(cell._id, 'teacherId', e.target.value)}
                              >
                                <option value="">Select Teacher</option>
                                {teachers.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
                              </select>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!selectedClassId && (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <CalendarDays size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Select a class above to view and edit its timetable.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
            Use <strong>Manage Time Slots</strong> to configure your school's daily schedule.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Table styles ─────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: '0.8rem',
  borderBottom: '2px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  letterSpacing: '0.02em',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid var(--border-color)',
  verticalAlign: 'middle',
};

export default Timetable;
