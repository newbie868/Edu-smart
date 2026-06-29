/**
 * TimeSlotModal
 * Allows principal to add, edit, delete and drag-reorder time slots per school.
 * No external drag-and-drop library — uses native HTML5 draggable.
 */
import React, { useState, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { Plus, Trash2, GripVertical, X, Save, AlertCircle, CheckCircle, Coffee } from 'lucide-react';

interface Slot {
  _key: string;        // local UUID, NOT saved to Firestore
  name: string;
  startTime: string;   // "08:00"
  endTime: string;     // "08:45"
  isBreak: boolean;
}

interface Props {
  schoolId: string;
  initialSlots: any[];         // from Firestore / defaults
  onSaved: (saved: any[]) => void;
  onClose: () => void;
}

let _k = 0;
const newKey = () => `slot-${++_k}`;

const fromDb = (dbSlots: any[]): Slot[] =>
  dbSlots.map(s => ({
    _key: newKey(),
    name: s.name || '',
    startTime: s.startTime || '',
    endTime: s.endTime || '',
    isBreak: !!s.isBreak,
  }));

// ── Validation helpers ───────────────────────────────────────────────────────

const toMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};

const validate = (slots: Slot[]): string | null => {
  if (slots.length === 0) return 'Add at least one time slot.';

  const teachingSlots = slots.filter(s => !s.isBreak);
  if (teachingSlots.length === 0) return 'At least one teaching period (non-break) is required.';

  for (const s of slots) {
    if (!s.startTime) return `"${s.name || 'Unnamed slot'}": Start time is required.`;
    if (!s.endTime)   return `"${s.name || 'Unnamed slot'}": End time is required.`;
    if (toMinutes(s.startTime) >= toMinutes(s.endTime))
      return `"${s.name || 'Unnamed slot'}": Start time must be before end time.`;
  }

  // Overlap check
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i], b = slots[j];
      const aStart = toMinutes(a.startTime), aEnd = toMinutes(a.endTime);
      const bStart = toMinutes(b.startTime), bEnd = toMinutes(b.endTime);
      if (aStart < bEnd && aEnd > bStart) {
        return `Overlap detected: "${a.name || a.startTime}" and "${b.name || b.startTime}" overlap.`;
      }
    }
  }

  return null;
};

// ── Component ────────────────────────────────────────────────────────────────

export const TimeSlotModal: React.FC<Props> = ({ schoolId, initialSlots, onSaved, onClose }) => {
  const [slots, setSlots] = useState<Slot[]>(fromDb(initialSlots));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Drag state
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  // ── CRUD helpers ────────────────────────────────────────────────────────────
  const addSlot = () => {
    const last = slots[slots.length - 1];
    const start = last?.endTime || '08:00';
    setSlots(prev => [...prev, { _key: newKey(), name: `Period ${prev.filter(s => !s.isBreak).length + 1}`, startTime: start, endTime: '', isBreak: false }]);
  };

  const addBreak = () => {
    const last = slots[slots.length - 1];
    const start = last?.endTime || '10:15';
    setSlots(prev => [...prev, { _key: newKey(), name: 'Break', startTime: start, endTime: '', isBreak: true }]);
  };

  const updateSlot = (key: string, field: keyof Slot, value: any) => {
    setSlots(prev => prev.map(s => s._key === key ? { ...s, [field]: value } : s));
  };

  const removeSlot = (key: string) => {
    setSlots(prev => prev.filter(s => s._key !== key));
  };

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragEnter = (idx: number) => { dragOverIdx.current = idx; };
  const onDragEnd   = () => {
    const from = dragIdx.current;
    const to   = dragOverIdx.current;
    if (from === null || to === null || from === to) return;
    setSlots(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    dragIdx.current = null;
    dragOverIdx.current = null;
  };

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = validate(slots);
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      // Sort by startTime before saving
      const sorted = [...slots].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
      await dbService.saveTimeSlots(schoolId, sorted);
      setSuccessMsg('Schedule saved!');
      setTimeout(() => { onSaved(sorted); }, 800);
    } catch (e: any) {
      setError('Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', pointerEvents: 'none'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          width: '100%', maxWidth: '640px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          pointerEvents: 'all', overflow: 'hidden'
        }}>

          {/* Modal Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid var(--border-color)',
            flexShrink: 0
          }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', margin: 0 }}>
                ⏱️ Manage Time Slots
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                Drag to reorder · Customize your school's daily schedule
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}>
              <X size={20} />
            </button>
          </div>

          {/* Slot list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

            {slots.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No time slots yet. Click "Add Period" to start.
              </div>
            )}

            {slots.map((slot, idx) => (
              <div
                key={slot._key}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', marginBottom: '8px',
                  borderRadius: 'var(--radius-md)',
                  background: slot.isBreak ? 'var(--warning-light, #fef3c7)' : 'var(--bg-tertiary)',
                  border: `1px solid ${slot.isBreak ? 'var(--warning, #f59e0b)' : 'var(--border-color)'}`,
                  cursor: 'grab', transition: 'box-shadow 0.15s'
                }}
              >
                {/* Drag handle */}
                <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                {/* Break badge */}
                {slot.isBreak && (
                  <Coffee size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                )}

                {/* Name */}
                <input
                  type="text"
                  className="form-input"
                  placeholder={slot.isBreak ? 'Break name' : 'Period name'}
                  value={slot.name}
                  onChange={e => updateSlot(slot._key, 'name', e.target.value)}
                  style={{ width: '130px', fontSize: '0.8rem', padding: '6px 8px', flexShrink: 0 }}
                />

                {/* Start */}
                <input
                  type="time"
                  className="form-input"
                  value={slot.startTime}
                  onChange={e => updateSlot(slot._key, 'startTime', e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 8px', flex: 1, minWidth: '90px' }}
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>→</span>
                {/* End */}
                <input
                  type="time"
                  className="form-input"
                  value={slot.endTime}
                  onChange={e => updateSlot(slot._key, 'endTime', e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 8px', flex: 1, minWidth: '90px' }}
                />

                {/* Is Break toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={slot.isBreak}
                    onChange={e => updateSlot(slot._key, 'isBreak', e.target.checked)}
                    style={{ width: '14px', height: '14px' }}
                  />
                  Break
                </label>

                {/* Delete */}
                <button
                  onClick={() => removeSlot(slot._key)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '4px', flexShrink: 0 }}
                  title="Delete slot"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            {/* Add buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button onClick={addSlot} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                <Plus size={14} /><span>Add Period</span>
              </button>
              <button onClick={addBreak} className="btn" style={{ fontSize: '0.8rem', background: 'var(--warning-light, #fef3c7)', color: '#92400e', border: '1px solid var(--warning, #f59e0b)' }}>
                <Coffee size={14} /><span>Add Break</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px', borderTop: '1px solid var(--border-color)',
            flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px'
          }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: 'var(--danger-light, #fee2e2)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.82rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                {error}
              </div>
            )}
            {successMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#dcfce7', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', fontSize: '0.82rem' }}>
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} className="btn" style={{ fontSize: '0.85rem' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <Save size={14} /><span>{saving ? 'Saving…' : 'Save Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TimeSlotModal;
