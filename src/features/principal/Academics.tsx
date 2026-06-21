import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Plus, BookOpen, Layers, FolderDot, Trash } from 'lucide-react';

export const Academics: React.FC = () => {
  const { school } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Class form
  const [className, setClassName] = useState('');
  
  // Section form
  const [sectionName, setSectionName] = useState('');
  const [sectClassId, setSectClassId] = useState('');
  const [sectTeacherId, setSectTeacherId] = useState('');

  // Subject form
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');

  const loadData = async () => {
    if (!school) return;
    setLoading(true);
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
      console.error("Failed to load academic configs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [school]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    try {
      await dbService.createClass(school.id, className);
      setClassName('');
      loadData();
    } catch (err) {
      alert("Failed to create class: " + err);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    try {
      await dbService.createSection(school.id, sectClassId, sectionName, sectTeacherId || undefined);
      setSectionName('');
      setSectClassId('');
      setSectTeacherId('');
      loadData();
    } catch (err) {
      alert("Failed to create section: " + err);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    try {
      await dbService.createSubject(school.id, subjectName, subjectCode);
      setSubjectName('');
      setSubjectCode('');
      loadData();
    } catch (err) {
      alert("Failed to create subject: " + err);
    }
  };

  const handleDeleteClass = async (classId: string, name: string) => {
    if (!school) return;
    if (!window.confirm(`Are you sure you want to delete class "${name}"? This might break section links.`)) return;
    try {
      await dbService.deleteClass(school.id, classId);
      loadData();
    } catch (err) {
      alert("Delete failed: " + err);
    }
  };

  const handleDeleteSection = async (sectionId: string, name: string) => {
    if (!school) return;
    if (!window.confirm(`Are you sure you want to delete section "${name}"?`)) return;
    try {
      await dbService.deleteSection(school.id, sectionId);
      loadData();
    } catch (err) {
      alert("Delete failed: " + err);
    }
  };

  const handleDeleteSubject = async (subjId: string, name: string) => {
    if (!school) return;
    if (!window.confirm(`Are you sure you want to delete subject "${name}"?`)) return;
    try {
      await dbService.deleteSubject(school.id, subjId);
      loadData();
    } catch (err) {
      alert("Delete failed: " + err);
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || classId;
  };

  const getTeacherName = (tId?: string) => {
    if (!tId) return 'Unassigned';
    return teachers.find(t => t.uid === tId)?.name || tId;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading academic structure...</div>;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }}>
      
      {/* 1. Classes Column */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FolderDot size={20} style={{ color: 'var(--primary)' }} />
          Classes
        </h3>

        {/* Add Class Form */}
        <form onSubmit={handleCreateClass} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            className="form-input" 
            required 
            value={className} 
            onChange={e => setClassName(e.target.value)} 
            placeholder="e.g. Grade 10" 
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }}>
            <Plus size={18} />
          </button>
        </form>

        {/* Classes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
          {classes.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No classes configured yet.</p>
          ) : (
            classes.map(c => (
              <div 
                key={c.id} 
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>ID: {c.id.slice(0, 8)}</div>
                </div>
                <button 
                  onClick={() => handleDeleteClass(c.id, c.name)} 
                  className="btn-icon" 
                  style={{ color: 'var(--danger)', padding: '4px' }}
                >
                  <Trash size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Sections Column */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={20} style={{ color: 'var(--success)' }} />
          Sections
        </h3>

        {/* Add Section Form */}
        <form onSubmit={handleCreateSection} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={sectionName} 
              onChange={e => setSectionName(e.target.value)} 
              placeholder="e.g. Section A" 
            />
            <select className="form-select" required value={sectClassId} onChange={e => setSectClassId(e.target.value)}>
              <option value="">Choose Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="form-select" value={sectTeacherId} onChange={e => setSectTeacherId(e.target.value)}>
              <option value="">Class Teacher (Optional)</option>
              {teachers.map(t => <option key={t.uid} value={t.uid}>{t.name}</option>)}
            </select>
            <button type="submit" className="btn btn-success" style={{ padding: '10px 14px' }}>
              <Plus size={18} />
            </button>
          </div>
        </form>

        {/* Sections List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
          {sections.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No sections configured yet.</p>
          ) : (
            sections.map(s => (
              <div 
                key={s.id} 
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{getClassName(s.classId)} - {s.name}</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Sec</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Advisor: <span style={{ fontWeight: 500 }}>{getTeacherName(s.classTeacherId)}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteSection(s.id, s.name)} 
                  className="btn-icon" 
                  style={{ color: 'var(--danger)', padding: '4px' }}
                >
                  <Trash size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Subjects Column */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={20} style={{ color: 'var(--info)' }} />
          Subjects
        </h3>

        {/* Add Subject Form */}
        <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            className="form-input" 
            required 
            value={subjectName} 
            onChange={e => setSubjectName(e.target.value)} 
            placeholder="e.g. Mathematics" 
            style={{ flex: 2 }}
          />
          <input 
            type="text" 
            className="form-input" 
            required 
            value={subjectCode} 
            onChange={e => setSubjectCode(e.target.value)} 
            placeholder="MATH-10" 
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-info" style={{ padding: '10px 14px' }}>
            <Plus size={18} />
          </button>
        </form>

        {/* Subjects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
          {subjects.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>No subjects configured yet.</p>
          ) : (
            subjects.map(sub => (
              <div 
                key={sub.id} 
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sub.name}</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Code: {sub.code}</div>
                </div>
                <button 
                  onClick={() => handleDeleteSubject(sub.id, sub.name)} 
                  className="btn-icon" 
                  style={{ color: 'var(--danger)', padding: '4px' }}
                >
                  <Trash size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
export default Academics;
