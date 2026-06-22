import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import Modal from '../../components/ui/Modal';
import { Plus, Edit2, Check, X, AlertTriangle, ShieldCheck, UserPlus } from 'lucide-react';

export const SchoolManagement: React.FC = () => {
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [planName, setPlanName] = useState<'Basic' | 'Premium'>('Basic');
  const [planExpiry, setPlanExpiry] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const schoolList = await dbService.getSchools();
      const userList = await dbService.getUsers(null);
      setSchools(schoolList);
      setUsers(userList);
    } catch (err) {
      console.error("Failed to load schools data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Create a dummy/temp principal UID
      const principalUid = `user-principal-${Date.now()}`;
      
      // 2. Create school payload
      const schoolPayload = {
        name,
        address,
        phone,
        planName,
        planExpiry: new Date(planExpiry).toISOString(),
        isActive: true
      };
      
      // 3. Create both school and principal in a single atomic batch operation
      await dbService.createSchoolWithPrincipal(schoolPayload, {
        uid: principalUid,
        email: principalEmail,
        name: principalName,
        role: 'principal'
      });

      // Reset
      setName('');
      setAddress('');
      setPhone('');
      setPlanName('Basic');
      setPlanExpiry('');
      setPrincipalName('');
      setPrincipalEmail('');
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to create school and principal: " + err);
    }
  };

  const handleOpenEdit = (school: any) => {
    setCurrentSchool(school);
    setName(school.name);
    setAddress(school.address || '');
    setPhone(school.phone || '');
    setPlanName(school.planName);
    setPlanExpiry(new Date(school.planExpiry).toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;

    try {
      await dbService.updateSchool(currentSchool.id, {
        name,
        address,
        phone,
        planName,
        planExpiry: new Date(planExpiry).toISOString()
      });
      setIsEditModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to update school: " + err);
    }
  };

  const toggleSchoolStatus = async (school: any) => {
    const confirmMsg = `Are you sure you want to ${school.isActive ? 'DISABLE' : 'ACTIVATE'} ${school.name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await dbService.updateSchool(school.id, { isActive: !school.isActive });
      loadData();
    } catch (err) {
      alert("Failed to toggle status: " + err);
    }
  };

  const getPrincipalName = (principalId: string) => {
    const user = users.find(u => u.uid === principalId);
    return user ? user.name : 'Unknown Principal';
  };

  const getPrincipalEmail = (principalId: string) => {
    const user = users.find(u => u.uid === principalId);
    return user ? user.email : 'No email';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Table Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Registered Schools</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Add, edit, or adjust plans for platforms tenants.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Add School</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading registered schools...</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Principal</th>
                  <th>Plan Tier</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map(school => {
                  const isExpired = new Date(school.planExpiry).getTime() < Date.now();
                  return (
                    <tr key={school.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'var(--bg-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            color: 'var(--primary)'
                          }}>
                            {school.name.charAt(0)}
                          </div>
                          <div>
                            <div>{school.name}</div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{school.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{getPrincipalName(school.principalId)}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getPrincipalEmail(school.principalId)}</span>
                      </td>
                      <td>
                        <span className={`badge ${school.planName === 'Premium' ? 'badge-primary' : 'badge-info'}`}>
                          {school.planName}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-primary)' }}>
                            {new Date(school.planExpiry).toLocaleDateString()}
                          </span>
                          {isExpired && (
                            <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${school.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {school.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button 
                            onClick={() => handleOpenEdit(school)}
                            className="btn-icon"
                            title="Edit School Details"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button
                            onClick={() => toggleSchoolStatus(school)}
                            className="btn"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              background: school.isActive ? 'var(--danger-light)' : 'var(--success-light)',
                              color: school.isActive ? 'var(--danger)' : 'var(--success)',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            {school.isActive ? 'Disable' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add School Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Register New School"
        footer={
          <>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="add-school-form" className="btn btn-primary">Create School</button>
          </>
        }
      >
        <form id="add-school-form" onSubmit={handleAddSchool} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">School Name</label>
            <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Springfield Academy" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. 555-0199" />
            </div>
            <div className="form-group">
              <label className="form-label">Location / Address</label>
              <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Springfield" />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
          <h4 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserPlus size={16} style={{ color: 'var(--primary)' }} />
            Create Principal Account
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Principal Name</label>
              <input type="text" className="form-input" required value={principalName} onChange={e => setPrincipalName(e.target.value)} placeholder="e.g. Seymour Skinner" />
            </div>
            <div className="form-group">
              <label className="form-label">Principal Google Email</label>
              <input type="email" className="form-input" required value={principalEmail} onChange={e => setPrincipalEmail(e.target.value)} placeholder="principal@springfield.edu" />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
          <h4 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            Subscription Settings
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Plan Tier</label>
              <select className="form-select" value={planName} onChange={e => setPlanName(e.target.value as any)}>
                <option value="Basic">Basic Plan</option>
                <option value="Premium">Premium Plan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Plan Expiry Date</label>
              <input type="date" className="form-input" required value={planExpiry} onChange={e => setPlanExpiry(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit School Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit School Details"
        footer={
          <>
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="edit-school-form" className="btn btn-primary">Save Changes</button>
          </>
        }
      >
        <form id="edit-school-form" onSubmit={handleEditSchool} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">School Name</label>
            <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Location / Address</label>
              <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />
          <h4 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            Subscription Settings
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Plan Tier</label>
              <select className="form-select" value={planName} onChange={e => setPlanName(e.target.value as any)}>
                <option value="Basic">Basic Plan</option>
                <option value="Premium">Premium Plan</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Plan Expiry Date</label>
              <input type="date" className="form-input" required value={planExpiry} onChange={e => setPlanExpiry(e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default SchoolManagement;
