import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, User, Search } from 'lucide-react';

interface ParentMessagesProps {
  selectedChildId: string;
}

export const Messages: React.FC<ParentMessagesProps> = ({ selectedChildId }) => {
  const { school, user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTeachers = async () => {
      if (!school) return;
      setTeachersLoading(true);
      try {
        const uList = await dbService.getUsers(school.id);
        setTeachers(uList.filter(u => u.role === 'teacher'));
      } catch (err) {
        console.error("Failed to load teachers roster:", err);
      } finally {
        setTeachersLoading(false);
      }
    };
    loadTeachers();
  }, [school]);

  // Load message logs when teacher is selected
  const loadChat = async () => {
    if (!school || !user || !selectedTeacherId) return;
    setChatLoading(true);
    try {
      const chatLogs = await dbService.getMessages(school.id, user.uid, selectedTeacherId);
      setMessages(chatLogs);
    } catch (err) {
      console.error("Failed to load message thread:", err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [selectedTeacherId]);

  // Auto-scroll chat window to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Polling chat updates every 3s
  useEffect(() => {
    let interval: any;
    if (selectedTeacherId) {
      interval = setInterval(() => {
        loadChat();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedTeacherId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user || !selectedTeacherId || !content.trim()) return;

    try {
      const msg = await dbService.sendMessage(school.id, user.uid, selectedTeacherId, content.trim());
      setMessages(prev => [...prev, msg]);
      setContent('');
    } catch (err) {
      alert("Failed to send message: " + err);
    }
  };

  const getTeacherName = (id: string) => {
    return teachers.find(t => t.uid === id)?.name || 'Teacher';
  };

  const getTeacherDetails = (id: string) => {
    const t = teachers.find(t => t.uid === id);
    return t ? `${t.teacherDetails?.designation || 'Instructor'} (${t.email})` : '';
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      height: 'calc(100vh - 200px)',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)'
    }}>
      
      {/* 1. Left column: Teacher list */}
      <div style={{
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search teacher..."
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 6px' }}>
          {teachersLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem' }}>Loading teachers...</div>
          ) : filteredTeachers.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No teacher found.</div>
          ) : (
            filteredTeachers.map(t => {
              const isSelected = selectedTeacherId === t.uid;
              return (
                <button
                  key={t.uid}
                  onClick={() => setSelectedTeacherId(t.uid)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={18} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.teacherDetails?.designation || 'Instructor'}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right column: Chat details */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {selectedTeacherId ? (
          <>
            {/* Header info */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexShrink: 0
            }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{getTeacherName(selectedTeacherId)}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getTeacherDetails(selectedTeacherId)}</span>
              </div>
            </div>

            {/* Messages list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px',
              background: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {chatLoading && messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading chat...</div>
              ) : messages.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  gap: '8px'
                }}>
                  <MessageSquare size={36} style={{ color: 'var(--border-color)' }} />
                  <span style={{ fontSize: '0.85rem' }}>Ask your child's teacher a question here.</span>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        background: isMe ? 'var(--primary)' : 'var(--bg-secondary)',
                        color: isMe ? '#fff' : 'var(--text-primary)',
                        border: isMe ? 'none' : '1px solid var(--border-color)',
                        fontSize: '0.85rem',
                        lineHeight: '1.4',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)'
                      }}>
                        <div>{msg.content}</div>
                        <div style={{
                          fontSize: '0.65rem',
                          textAlign: 'right',
                          marginTop: '4px',
                          color: isMe ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)'
                        }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexShrink: 0,
              background: 'var(--bg-secondary)'
            }}>
              <input
                type="text"
                className="form-input"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type your message here..."
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '12px 14px' }}>
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '10px'
          }}>
            <MessageSquare size={48} style={{ color: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.9rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
              Select your child's instructor from the list to launch secure messaging.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
export default Messages;
