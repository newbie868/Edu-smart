import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, Calendar, Trash } from 'lucide-react';

export const GlobalNotices: React.FC = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'teachers' | 'parents' | 'students'>('all');

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const list = await dbService.getNotices('global');
      setNotices(list.filter(n => n.schoolId === 'global'));
    } catch (err) {
      console.error("Failed to fetch global notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await dbService.createNotice({
        schoolId: 'global',
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
      alert("Failed to post global notice: " + err);
    }
  };

  const handleDeleteNotice = async (noticeId: string, noticeTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete global notice "${noticeTitle}"?`)) return;
    try {
      await dbService.deleteNotice('global', noticeId);
      fetchNotices();
    } catch (err) {
      alert("Failed to delete global notice: " + err);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '24px'
    }}>
      
      {/* Create notice card */}
      <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Megaphone size={20} style={{ color: 'var(--primary)' }} />
          Broadcast System Notice
        </h3>
        
        <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Notice Title</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Scheduled Network Upgrade" 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Audience</label>
            <select 
              className="form-select" 
              value={targetAudience} 
              onChange={e => setTargetAudience(e.target.value as any)}
            >
              <option value="all">Everyone</option>
              <option value="teachers">Teachers Only</option>
              <option value="parents">Parents Only</option>
              <option value="students">Students Only</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notice Content</label>
            <textarea 
              className="form-textarea" 
              required 
              rows={5} 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Write detailed bulletin contents here..."
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            <Plus size={18} />
            <span>Publish Notice</span>
          </button>
        </form>
      </div>

      {/* Broadcast Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
          Active Global Broadcasts
        </h3>

        {loading ? (
          <div>Loading notices feed...</div>
        ) : notices.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
            No global notices broadcasted yet.
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
                  border: '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{notice.title}</h4>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
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
                    title="Delete Global Notice"
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
export default GlobalNotices;
