import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Save, Trash2, CalendarDays, AlertCircle, CheckCircle, Info } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
type Day = typeof DAYS[number];

interface Period {
  _id: string;       // local key only (not saved to DB)
  day: Day;
  startTime: string; // "08:00"
  endTime: string;   // "08:45"
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  isBreak: boolean;
}

const DEFAULT_PERIODS: { startTime: string; endTime: string; isBreak: boolean }[] = [
  { startTime: '08:00', endTime: '08:45', isBreak: false },
  { startTime: '08:45', endTime: '09:30', isBreak: false },
  { startTime: '09:30', endTime: '10:15', isBreak: false },
  { startTime: '10:15', endTime: '10:30', isBreak: true  }, // Break
  { startTime: '10:30', endTime: '11:15', isBreak: false },
  { startTime: '11:15', endTime: '12:00', isBreak: false },
  { startTime: '12:00', endTime: '12:45', isBreak: false },
  { startTime: '12:45', endTime: '13:30', isBreak: true  }, // Lunch
  { startTime: '13:30', endTime: '14:15', isBreak: false },
  { startTime: '14:15', endTime: '15:00', isBreak: false },
];

let _uid = 0;
const uid = () => `p-${++_uid}`;

const makePeriodGrid = (dbPeriods: any[], teachers: any[], subjects: any[]): Period[] => {
  // Build a map from "day|startTime" -> db period
  const map = new Map<string, any>();
  dbPeriods.forEach(p => map.set(`${p.day}|${p.startTime}`, p));

  const grid: Period[] = [];
  DAYS.forEach(day => {
    DEFAULT_PERIODS.forEach(slot => {
      const key = `${day}|${slot.startTime}`;
      const existing = map.get(key);
      grid.push({
        _id: uid(),
        day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBreak: slot.isBreak,
        subjectId:   existing?.subjectId   || '',
        subjectName: existing?.subjectName || '',
        teacherId:   existing?.teacherId   || '',
        teacherName: existing?.teacherName || '',
      });
    });
  });
  return grid;
};

// ─── Component ────────────────────────────────────────────────────────────────
export const Timetable: React.FC = () => {
  const { school } = useAuth();

  const [classes,  setClasses]  = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [selectedClassId,   setSelectedClassId]   = useState('');
  const [selectedClassName, setSelectedClassName] = useState('');

  const [grid,    setGrid]    = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load base data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!school) return;
    (async () => {
      try {
        const [cList, subjList, uList] = await Promise.all([
          dbService.getClasses(school.id),
          dbService.getSubjects(school.id),
          dbService.getUsers(school.id),
        ]);
        setClasses(cList);
        setSubjects(subjList);
        setTeachers(uList.filter(u => u.role === 'teacher'));
      } catch (err) {
        console.error('Failed to load timetable base data:', err);
      }
    })();
  }, [school]);

  // ── Load timetable when class changes ──────────────────────────────────────
  const loadTimetable = useCallback(async (classId: string) => {
    if (!school || !classId) return;
    setLoading(true);
    try {
      const dbPeriods = await dbService.getTimetableByClass(school.id, classId);
      setGrid(makePeriodGrid(dbPeriods, teachers, subjects));
    } catch (err) {
      console.error('Failed to load timetable:', err);
      showToast('error', 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, [school, teachers, subjects]);

  useEffect(() => {
    if (selectedClassId) loadTimetable(selectedClassId);
    else setGrid([]);
  }, [selectedClassId]);

  // ── Cell update helper ──────────────────────────────────────────────────────
  const updatePeriod = (pid: string, field: keyof Period, value: string) => {
    setGrid(prev => prev.map(p => {
      if (p._id !== pid) return p;
      const updated = { ...p, [field]: value };
      // Auto-fill name when id changes
      if (field === 'subjectId') {
        const subj = subjects.find(s => s.id === value);
        updated.subjectName = subj?.name || '';
      }
      if (field === 'teacherId') {
        const t = teachers.find(t => t.uid === value);
        updated.teacherName = t?.name || '';
      }
      return updated;
    }));
  };

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    const filled = grid.filter(p => !p.isBreak && (p.subjectId || p.teacherId));

    // Every filled period must have both subject AND teacher
    for (const p of filled) {
      if (p.subjectId && !p.teacherId) return `${p.day} ${p.startTime}: Teacher is required when a subject is selected.`;
      if (p.teacherId && !p.subjectId) return `${p.day} ${p.startTime}: Subject is required when a teacher is selected.`;
    }

    // Detect same teacher assigned at the same time slot across different days
    const teacherTimeMap = new Map<string, string>();
    for (const p of filled) {
      if (!p.teacherId) continue;
      const key = `${p.teacherId}|${p.startTime}`;
      if (teacherTimeMap.has(key)) {
        const prevDay = teacherTimeMap.get(key);
        return `Teacher "${p.teacherName || p.teacherId}" is already assigned at ${p.startTime} on ${prevDay}. Cannot assign to ${p.day} at the same time.`;
      }
      teacherTimeMap.set(key, p.day);
    }

    return null;
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
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
      showToast('success', `Timetable for ${selectedClassName} saved successfully.`);
    } catch (err: any) {
      showToast('error', 'Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Clear ────────────────────────────────────────────────────────────────────
  const handleClear = () => {
    if (!window.confirm('Clear all assignments for this class? This cannot be undone.')) return;
    setGrid(prev => prev.map(p => p.isBreak ? p : {
      ...p, subjectId: '', subjectName: '', teacherId: '', teacherName: ''
    }));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  // Group grid rows by time slot for column layout
  const timeSlots = DEFAULT_PERIODS;

  const getCell = (day: Day, startTime: string) =>
    grid.find(p => p.day === day && p.startTime === startTime);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 18px', borderRadius: 'var(--radius-md)',
          background: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontSize: '0.9rem', fontWeight: 500, maxWidth: '420px'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '6px' }}>
          Select Class to Manage Timetable
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Choose a class and build the weekly timetable by assigning teachers to subjects and time slots.
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
            <option value="">Choose a class...</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Timetable grid */}
      {selectedClassId && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={18} style={{ color: 'var(--primary)' }} />
              Build Timetable for {selectedClassName}
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleClear} className="btn btn-danger" style={{ fontSize: '0.85rem' }}>
                <Trash2 size={15} /><span>Clear Timetable</span>
              </button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Save size={15} /><span>{saving ? 'Saving…' : 'Save Timetable'}</span>
              </button>
            </div>
          </div>

          {/* Info banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--info-light, #eff6ff)', border: '1px solid var(--info, #3b82f6)',
            color: 'var(--info, #3b82f6)', fontSize: '0.8rem', marginBottom: '20px'
          }}>
            <Info size={16} />
            Assign a teacher for each subject and time slot. The timetable will apply to all sections of this class.
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading timetable…</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Time / Day</th>
                    {DAYS.map(d => <th key={d} style={thStyle}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(slot => (
                    <tr key={slot.startTime}>
                      {/* Time label */}
                      <td style={{ ...tdStyle, fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)', width: '120px' }}>
                        {slot.startTime} AM – {slot.endTime} AM
                      </td>
                      {/* Day cells */}
                      {DAYS.map(day => {
                        const cell = getCell(day, slot.startTime);
                        if (!cell) return <td key={day} style={tdStyle} />;
                        if (cell.isBreak) return (
                          <td key={day} style={{ ...tdStyle, background: 'var(--bg-tertiary)', textAlign: 'center', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            Break
                          </td>
                        );
                        return (
                          <td key={day} style={{ ...tdStyle, padding: '6px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <select
                                className="form-select"
                                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                                value={cell.subjectId}
                                onChange={e => updatePeriod(cell._id, 'subjectId', e.target.value)}
                              >
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                              <select
                                className="form-select"
                                style={{ fontSize: '0.75rem', padding: '5px 8px' }}
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
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: '10px 8px',
  textAlign: 'center',
  fontWeight: 700,
  fontSize: '0.8rem',
  borderBottom: '2px solid var(--border-color)',
  background: 'var(--bg-secondary)',
  letterSpacing: '0.02em',
};

const tdStyle: React.CSSProperties = {
  padding: '8px',
  border: '1px solid var(--border-color)',
  verticalAlign: 'middle',
};

export default Timetable;
