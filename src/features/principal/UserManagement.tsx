import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { Plus, UserPlus, Mail, ShieldAlert, Phone, UserCheck } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { school } = useAuth();
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'parents'>('teachers');
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [admissionNo, setAdmissionNo] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const loadData = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const uList = await dbService.getUsers(school.id);
      const cList = await dbService.getClasses(school.id);
      const sList = await dbService.getSections(school.id);
      const subjList = await dbService.getSubjects(school.id);
      setUsers(uList);
      setClasses(cList);
      setSections(sList);
      setSubjects(subjList);
    } catch (err) {
      console.error("Failed to load user rosters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [school]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    try {
      const uid = `user-${activeTab.slice(0, -1)}-${Date.now()}`;
      let role: 'teacher' | 'student' | 'parent' = 'teacher';
      let roleDetails: any = {};

      if (activeTab === 'teachers') {
        role = 'teacher';
        roleDetails = {
          teacherDetails: {
            employeeId,
            designation,
            subjects: selectedSubjects
          }
        };
      } else if (activeTab === 'students') {
        role = 'student';
        roleDetails = {
          studentDetails: {
            admissionNo,
            classId: selectedClassId,
            sectionId: selectedSectionId,
            rollNo,
            parentId: selectedParentId
          }
        };
      } else if (activeTab === 'parents') {
        role = 'parent';
        roleDetails = {
          parentDetails: {
            studentIds: selectedStudents,
            phone
          }
        };
      }

      await dbService.createUser(uid, {
        email,
        name,
        role,
        schoolId: school.id,
        isActive: true,
        ...roleDetails
      });

      // If parent is created, update the students' parentId backlink
      if (role === 'parent' && selectedStudents.length > 0) {
        for (const studId of selectedStudents) {
          const student = users.find(u => u.uid === studId);
          if (student && student.studentDetails) {
            await dbService.updateUser(studId, {
              studentDetails: {
                ...student.studentDetails,
                parentId: uid
              }
            });
          }
        }
      }

      // Reset
      setName('');
      setEmail('');
      setPhone('');
      setEmployeeId('');
      setDesignation('');
      setSelectedSubjects([]);
      setAdmissionNo('');
      setRollNo('');
      setSelectedClassId('');
      setSelectedSectionId('');
      setSelectedParentId('');
      setSelectedStudents([]);
      setIsAddModalOpen(false);
      loadData();
    } catch (err) {
      alert("Failed to create user: " + err);
    }
  };

  const toggleUserActivation = async (user: any) => {
    const confirmMsg = `Are you sure you want to ${user.isActive ? 'DEACTIVATE' : 'ACTIVATE'} ${user.name}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await dbService.updateUser(user.uid, { isActive: !user.isActive });
      loadData();
    } catch (err) {
      alert("Failed to update user status: " + err);
    }
  };

  const teachers = users.filter(u => u.role === 'teacher');
  const students = users.filter(u => u.role === 'student');
  const parents = users.filter(u => u.role === 'parent');

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || 'N/A';
  };

  const getSectionName = (sectId: string) => {
    return sections.find(s => s.id === sectId)?.name || 'N/A';
  };

  const getParentName = (parentId: string) => {
    return users.find(u => u.uid === parentId)?.name || 'Unassigned';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tabs list */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => { setActiveTab('teachers'); setIsAddModalOpen(false); }}
          className="btn"
          style={{
            background: activeTab === 'teachers' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeTab === 'teachers' ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Teachers ({teachers.length})
        </button>
        <button
          onClick={() => { setActiveTab('students'); setIsAddModalOpen(false); }}
          className="btn"
          style={{
            background: activeTab === 'students' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeTab === 'students' ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Students ({students.length})
        </button>
        <button
          onClick={() => { setActiveTab('parents'); setIsAddModalOpen(false); }}
          className="btn"
          style={{
            background: activeTab === 'parents' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeTab === 'parents' ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Parents ({parents.length})
        </button>
      </div>

      {/* Main Roster Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>
              School {activeTab}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Onboard and regulate {activeTab} rosters.
            </p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
            <Plus size={18} />
            <span>Onboard {activeTab.slice(0, -1)}</span>
          </button>
        </div>

        {loading ? (
          <div>Loading {activeTab} roster...</div>
        ) : (
          <div className="table-container">
            {activeTab === 'teachers' && (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Employee ID</th>
                    <th>Designation</th>
                    <th>Subjects Taught</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t.uid}>
                      <td style={{ fontWeight: 600 }}>
                        <div>{t.name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.email}</span>
                      </td>
                      <td>{t.teacherDetails?.employeeId}</td>
                      <td>{t.teacherDetails?.designation}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {t.teacherDetails?.subjects?.map((subId: string) => {
                            const subName = subjects.find(s => s.id === subId)?.name || subId;
                            return (
                              <span key={subId} className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                                {subName}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {t.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => toggleUserActivation(t)}
                          className="btn"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            background: t.isActive ? 'var(--danger-light)' : 'var(--success-light)',
                            color: t.isActive ? 'var(--danger)' : 'var(--success)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {t.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'students' && (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Class / Section</th>
                    <th>Roll No</th>
                    <th>Parent / Guardian</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.uid}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{s.studentDetails?.admissionNo}</td>
                      <td>{getClassName(s.studentDetails?.classId)} - {getSectionName(s.studentDetails?.sectionId)}</td>
                      <td>{s.studentDetails?.rollNo}</td>
                      <td>{getParentName(s.studentDetails?.parentId)}</td>
                      <td>
                        <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {s.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => toggleUserActivation(s)}
                          className="btn"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            background: s.isActive ? 'var(--danger-light)' : 'var(--success-light)',
                            color: s.isActive ? 'var(--danger)' : 'var(--success)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'parents' && (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Parent Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Linked Children</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parents.map(p => (
                    <tr key={p.uid}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.email}</td>
                      <td>{p.parentDetails?.phone}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {p.parentDetails?.studentIds?.map((studId: string) => {
                            const child = students.find(s => s.uid === studId);
                            return (
                              <span key={studId} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                                👤 {child ? child.name : 'Unknown Pupil'}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {p.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => toggleUserActivation(p)}
                          className="btn"
                          style={{
                            padding: '6px 10px',
                            fontSize: '0.75rem',
                            background: p.isActive ? 'var(--danger-light)' : 'var(--success-light)',
                            color: p.isActive ? 'var(--danger)' : 'var(--success)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={`Onboard School ${activeTab.slice(0, -1)}`}>
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Google Account Email</label>
              <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} placeholder="doe@google-auth.com" />
            </div>
          </div>

          {/* Teacher Specific Fields */}
          {activeTab === 'teachers' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input type="text" className="form-input" required value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="EMP-01" />
                </div>
                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input type="text" className="form-input" required value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Mathematics Instructor" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Subjects Taught</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px' }}>
                  {subjects.map(s => {
                    const isChecked = selectedSubjects.includes(s.id);
                    return (
                      <label key={s.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                        border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjects([...selectedSubjects, s.id]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(id => id !== s.id));
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <span>{s.name} ({s.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Student Specific Fields */}
          {activeTab === 'students' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Admission Number</label>
                  <input type="text" className="form-input" required value={admissionNo} onChange={e => setAdmissionNo(e.target.value)} placeholder="ADM-101" />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input type="text" className="form-input" required value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="01" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-select" required value={selectedClassId} onChange={e => {
                    setSelectedClassId(e.target.value);
                    setSelectedSectionId(''); // reset section on class change
                  }}>
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-select" required value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)}>
                    <option value="">Select Section</option>
                    {sections.filter(s => s.classId === selectedClassId).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Link Parent/Guardian</label>
                <select className="form-select" value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)}>
                  <option value="">Select Guardian (Optional)</option>
                  {parents.map(p => <option key={p.uid} value={p.uid}>{p.name} ({p.email})</option>)}
                </select>
              </div>
            </>
          )}

          {/* Parent Specific Fields */}
          {activeTab === 'parents' && (
            <>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="text" className="form-input" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="555-0103" />
              </div>

              <div className="form-group">
                <label className="form-label">Select Associated Children</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginTop: '6px' }}>
                  {students.map(s => {
                    const isChecked = selectedStudents.includes(s.uid);
                    return (
                      <label key={s.uid} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                        border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents([...selectedStudents, s.uid]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(uid => uid !== s.uid));
                            }
                          }}
                        />
                        <span>{s.name} (Adm: {s.studentDetails?.admissionNo} • {getClassName(s.studentDetails?.classId)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Onboard User</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
export default UserManagement;
