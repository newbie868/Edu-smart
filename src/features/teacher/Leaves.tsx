import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, ShieldCheck } from 'lucide-react';

export const Leaves: React.FC = () => {
  const { school, user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchMyLeaves = async () => {
    if (!school || !user) return;
    setLoading(true);
    try {
      const list = await dbService.getLeaves(school.id);
      // Filter for current teacher's leaves
      setLeaves(list.filter(l => l.userId === user.uid));
    } catch (err) {
      console.error("Failed to load teacher leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, [school, user]);

  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user) return;

    try {
      await dbService.createLeaveRequest({
        schoolId: school.id,
        userId: user.uid,
        role: 'teacher',
        reason,
        startDate,
        endDate
      });
      
      setReason('');
      setStartDate('');
      setEndDate('');
      fetchMyLeaves();
      alert("Leave request submitted to Principal.");
    } catch (err) {
      alert("Failed to submit request: " + err);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }}>
      
      {/* Request Form */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} style={{ color: 'var(--primary)' }} />
          Request Leave of Absence
        </h3>
        
        <form onSubmit={handleRequestLeave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Reason for Request</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="e.g. Medical appointment" 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                className="form-input" 
                required 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                className="form-input" 
                required 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
            <ShieldCheck size={16} />
            <span>Submit Application</span>
          </button>
        </form>
      </div>

      {/* History Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
          My Leave History
        </h3>

        {loading ? (
          <div>Loading leave logs...</div>
        ) : leaves.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No leave applications submitted.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
            {leaves.map(l => (
              <div 
                key={l.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.reason}</h4>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <Calendar size={12} />
                    <span>{l.startDate} to {l.endDate}</span>
                  </div>
                </div>
                <span className={`badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default Leaves;
