import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Plus, Check } from 'lucide-react';

export const Fees: React.FC = () => {
  const { school } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedFee, setSelectedFee] = useState<any>(null);

  const loadData = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const fList = await dbService.getFees(school.id);
      const cList = await dbService.getClasses(school.id);
      const uList = await dbService.getUsers(school.id);
      setFees(fList);
      setClasses(cList);
      setStudents(uList.filter(u => u.role === 'student'));
    } catch (err) {
      console.error("Failed to load fee logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [school]);

  const handleCreateFeeSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !targetClassId) return;

    try {
      // Find all students in target class
      const targetStudents = students.filter(
        s => s.studentDetails && s.studentDetails.classId === targetClassId
      );

      if (targetStudents.length === 0) {
        alert("There are no students in the selected class to bill.");
        return;
      }

      // Batch generate bills
      for (const s of targetStudents) {
        await dbService.createFee({
          schoolId: school.id,
          studentId: s.uid,
          title,
          amount: parseFloat(amount),
          dueDate
        });
      }

      // Reset
      setTitle('');
      setAmount('');
      setDueDate('');
      setTargetClassId('');
      
      // Refresh
      loadData();
      alert(`Success! Generated fee statements for ${targetStudents.length} students.`);
    } catch (err) {
      alert("Failed to generate fee schedule: " + err);
    }
  };

  const handleRecordPayment = async (feeId: string) => {
    if (!window.confirm("Record this manual tuition payment now?")) return;
    try {
      await dbService.recordPayment(feeId, paymentMethod);
      loadData();
    } catch (err) {
      alert("Failed to save payment status: " + err);
    }
  };

  const getStudentName = (uid: string) => {
    return students.find(s => s.uid === uid)?.name || uid;
  };

  const getStudentClass = (uid: string) => {
    const s = students.find(std => std.uid === uid);
    if (!s || !s.studentDetails) return 'N/A';
    return classes.find(c => c.id === s.studentDetails.classId)?.name || 'N/A';
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading billing statements...</div>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }}>
      
      {/* Create Fee Schedule (Billing) */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCard size={18} style={{ color: 'var(--primary)' }} />
          Issue Tuition Invoice
        </h3>
        
        <form onSubmit={handleCreateFeeSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Billing Title</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. First Term Tuition Fee" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Class to Bill</label>
            <select className="form-select" required value={targetClassId} onChange={e => setTargetClassId(e.target.value)}>
              <option value="">Choose Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="1200" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input 
                type="date" 
                className="form-input" 
                required 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)} 
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
            <Plus size={16} />
            <span>Generate Invoices</span>
          </button>
        </form>
      </div>

      {/* Roster / Payment Sheet */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px' }}>
          Tuition Payment Sheet
        </h3>

        {fees.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No fee statements generated yet.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Title</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => {
                  const isOverdue = f.status === 'unpaid' && new Date(f.dueDate).getTime() < Date.now();
                  return (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{getStudentName(f.studentId)}</div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Class: {getStudentClass(f.studentId)}</span>
                      </td>
                      <td>{f.title}</td>
                      <td>${f.amount}</td>
                      <td>
                        <span className={`badge ${f.status === 'paid' ? 'badge-success' : isOverdue ? 'badge-danger' : 'badge-warning'}`}>
                          {f.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {f.status === 'unpaid' ? (
                          <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                            <select 
                              className="form-select" 
                              style={{ padding: '4px 6px', fontSize: '0.75rem', width: '90px' }}
                              value={paymentMethod}
                              onChange={e => setPaymentMethod(e.target.value)}
                            >
                              <option value="Cash">Cash</option>
                              <option value="Check">Check</option>
                              <option value="Transfer">Bank</option>
                            </select>
                            <button
                              onClick={() => handleRecordPayment(f.id)}
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              title="Record Offline Payment"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {f.paymentMethod}
                          </span>
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

    </div>
  );
};
export default Fees;
