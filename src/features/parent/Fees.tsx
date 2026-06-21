import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Calendar } from 'lucide-react';

interface ParentFeesProps {
  selectedChildId: string;
}

export const Fees: React.FC<ParentFeesProps> = ({ selectedChildId }) => {
  const { school } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildFees = async () => {
      if (!school || !selectedChildId) return;
      setLoading(true);
      try {
        const list = await dbService.getFees(school.id, selectedChildId);
        setFees(list);
      } catch (err) {
        console.error("Failed to load child fees:", err);
      } finally {
        setLoading(false);
      }
    };
    loadChildFees();
  }, [school, selectedChildId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading child fee statement...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CreditCard size={22} style={{ color: 'var(--primary)' }} />
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Tuition Invoices</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Track tuition fees and payment confirmations.</p>
        </div>
      </div>

      {fees.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
          No fee invoices issued for your child.
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice Title</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Payment Status</th>
                <th>Payment Details</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => {
                const isOverdue = f.status === 'unpaid' && new Date(f.dueDate).getTime() < Date.now();
                return (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.title}</td>
                    <td style={{ fontWeight: 700 }}>${f.amount}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        <span>{new Date(f.dueDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${f.status === 'paid' ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                        {f.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {f.status === 'paid' ? (
                        <div>
                          <span>Paid via {f.paymentMethod}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            On: {new Date(f.paidAt).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span>Please settle dues offline with the Principal.</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default Fees;
