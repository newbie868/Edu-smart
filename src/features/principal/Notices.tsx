import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, Calendar, Trash } from 'lucide-react';

export const Notices: React.FC = () => {
  const { school, user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'teachers' | 'parents' | 'students'>('all');

  const fetchNotices = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const list = await dbService.getNotices(school.id);
      setNotices(list.filter(n => n.schoolId === school.id));
    } catch (err) {
      console.error("Failed to load school bulletins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [school]);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user) return;
    try {
      await dbService.createNotice({
        schoolId: school.id,
        title,
        content,
        targetAudience,
        createdBy: user.uid
      });
      setTitle('');
      setContent('');
      setTargetAudience('all');
      fetchNotices();
    } catch (err) {
      alert("Failed to publish school notice: " + err);
    }
  };

  const handleDeleteNotice = async (noticeId: string, noticeTitle: string) => {
    if (!school) return;
    if (!window.confirm(`Are you sure you want to delete notice "${noticeTitle}"?`)) return;
    try {
      await dbService.deleteNotice(school.id, noticeId);
      fetchNotices();
    } catch (err) {
      alert("Failed to delete notice: " + err);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }}>
      
      {/* Create notice */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Megaphone size={20} style={{ color: 'var(--primary)' }} />
          Publish Bulletin
        </h3>
        
        <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Science Fair Postponement" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Scope Audience</label>
            <select 
              className="form-select" 
              value={targetAudience} 
              onChange={e => setTargetAudience(e.target.value as any)}
            >
              <option value="all">Everyone in School</option>
              <option value="teachers">Teachers Only</option>
              <option value="parents">Parents Only</option>
              <option value="students">Students Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Details / Content</label>
            <textarea 
              className="form-textarea" 
              required 
              rows={5} 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Provide bulletin context here..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Plus size={18} />
            <span>Publish Notice</span>
          </button>
        </form>
      </div>

      {/* Notice Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
          School Bulletin Board
        </h3>

        {loading ? (
          <div>Loading school bulletins...</div>
        ) : notices.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            No notices posted yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {notices.map(notice => (
              <div 
                key={notice.id} 
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{notice.title}</h4>
                  <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                    To: {notice.targetAudience}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '12px' }}>
                  {notice.content}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    <Calendar size={12} />
                    <span>{new Date(notice.createdAt).toLocaleString()}</span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteNotice(notice.id, notice.title)}
                    className="btn-icon"
                    style={{ color: 'var(--danger)', padding: '4px' }}
                    title="Delete Notice"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default Notices;
