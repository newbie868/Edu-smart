import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Check, X, ShieldAlert } from 'lucide-react';

export const Leaves: React.FC = () => {
  const { school, user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const lList = await dbService.getLeaves(school.id);
      const uList = await dbService.getUsers(school.id);
      setLeaves(lList);
      setUsers(uList);
    } catch (err) {
      console.error("Failed to load leaves roster:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [school]);

  const handleResolveLeave = async (leaveId: string, status: 'approved' | 'rejected') => {
    if (!user) return;
    const actionText = status === 'approved' ? 'APPROVE' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${actionText} this leave request?`)) return;

    try {
      await dbService.resolveLeave(leaveId, status, user.uid);
      loadData();
    } catch (err) {
      alert("Failed to update leave status: " + err);
    }
  };

  const getUserName = (uid: string) => {
    return users.find(u => u.uid === uid)?.name || uid;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading leave requests...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Staff & Student Leaves</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Review and approve leave applications for your school.</p>
      </div>

      {leaves.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
          No leave requests recorded.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Role</th>
                <th>Reason</th>
                <th>Timeline</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{getUserName(l.userId)}</td>
                  <td>
                    <span className={`badge ${l.role === 'teacher' ? 'badge-primary' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                      {l.role}
                    </span>
                  </td>
                  <td>{l.reason}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{l.startDate} to {l.endDate}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${l.status === 'approved' ? 'badge-success' : l.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {l.status === 'pending' ? (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => handleResolveLeave(l.id, 'approved')}
                          className="btn btn-success"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleResolveLeave(l.id, 'rejected')}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Resolved by Principal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default Leaves;
