import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Plus, Calendar, FileText, Download, Trash } from 'lucide-react';

export const Homework: React.FC = () => {
  const { school, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'homework' | 'materials'>('homework');
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const loadFilters = async () => {
    if (!school) return;
    try {
      const cList = await dbService.getClasses(school.id);
      const sList = await dbService.getSections(school.id);
      const subjList = await dbService.getSubjects(school.id);
      setClasses(cList);
      setSections(sList);
      setSubjects(subjList);
    } catch (err) {
      console.error("Failed to load filters:", err);
    }
  };

  const loadDataFeed = async () => {
    if (!school || !selectedClassId || !selectedSectionId) return;
    setLoading(true);
    try {
      if (activeTab === 'homework') {
        const feed = await dbService.getHomeworks(school.id, selectedClassId, selectedSectionId);
        setList(feed);
      } else {
        const feed = await dbService.getStudyMaterials(school.id, selectedClassId, selectedSectionId);
        setList(feed);
      }
    } catch (err) {
      console.error("Failed to load feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, [school]);

  useEffect(() => {
    loadDataFeed();
  }, [school, activeTab, selectedClassId, selectedSectionId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user) return;

    try {
      let uploadedUrl = '';
      if (attachedFile) {
        // Upload the file via storage service
        uploadedUrl = await dbService.uploadFile(school.id, activeTab, attachedFile);
      }

      if (activeTab === 'homework') {
        await dbService.createHomework({
          schoolId: school.id,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          title,
          description,
          dueDate,
          fileUrl: uploadedUrl || undefined,
          teacherId: user.uid
        });
      } else {
        await dbService.createStudyMaterial({
          schoolId: school.id,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          title,
          description,
          fileUrl: uploadedUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          teacherId: user.uid
        });
      }

      // Reset
      setTitle('');
      setDescription('');
      setDueDate('');
      setAttachedFile(null);
      // Reset the file input element in form
      const fileInput = document.getElementById('attached-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      loadDataFeed();
      alert("Successfully published!");
    } catch (err) {
      alert("Failed to create: " + err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!school) return;
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    try {
      if (activeTab === 'homework') {
        await dbService.deleteHomework(school.id, itemId);
      } else {
        await dbService.deleteStudyMaterial(school.id, itemId);
      }
      loadDataFeed();
      alert("Deleted successfully.");
    } catch (err) {
      alert("Deletion failed: " + err);
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Switch Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('homework')}
          className="btn"
          style={{
            background: activeTab === 'homework' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeTab === 'homework' ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Homework Manager
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className="btn"
          style={{
            background: activeTab === 'materials' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: activeTab === 'materials' ? '#fff' : 'var(--text-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          Study Handouts
        </button>
      </div>

      {/* Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Create form */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            New {activeTab === 'homework' ? 'Homework Sheet' : 'Study Handout'}
          </h3>
          
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Grade / Class</label>
                <select className="form-select" required value={selectedClassId} onChange={e => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}>
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <select className="form-select" required value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId}>
                  <option value="">Select Section</option>
                  {sections.filter(s => s.classId === selectedClassId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <select className="form-select" required value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 4 Fractions Review" />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Instructions</label>
              <textarea className="form-textarea" required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide assignment context..." />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'homework' ? '1fr 1fr' : '1fr', gap: '12px' }}>
              {activeTab === 'homework' && (
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label">File Attachment</label>
                <input 
                  type="file" 
                  id="attached-file-input"
                  className="form-input" 
                  onChange={e => setAttachedFile(e.target.files?.[0] || null)} 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={!selectedClassId || !selectedSectionId} style={{ marginTop: '6px' }}>
              <Plus size={16} />
              <span>Create {activeTab === 'homework' ? 'Homework' : 'Handout'}</span>
            </button>
          </form>
        </div>

        {/* List Grid */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
            Active Roster Feed
          </h3>

          {!selectedClassId || !selectedSectionId ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Select class parameters to load the feed.</p>
          ) : loading ? (
            <div>Loading list...</div>
          ) : list.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No items found for this class.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '520px', overflowY: 'auto' }}>
              {list.map(item => (
                <div 
                  key={item.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</h4>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                        {getSubjectName(item.subjectId)}
                      </span>
                    </div>
                    {activeTab === 'homework' && (
                      <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '12px' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {item.fileUrl && (
                      <a 
                        href={item.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="btn btn-secondary" 
                        style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Download size={12} />
                        <span>View File</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Trash size={12} />
                      <span>Delete</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
export default Homework;
