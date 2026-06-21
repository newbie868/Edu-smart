import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Send, MessageSquare, User, Search } from 'lucide-react';

export const Messages: React.FC = () => {
  const { school, user } = useAuth();
  const [parents, setParents] = useState<any[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [parentsLoading, setParentsLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadParents = async () => {
      if (!school) return;
      setParentsLoading(true);
      try {
        const uList = await dbService.getUsers(school.id);
        setParents(uList.filter(u => u.role === 'parent'));
      } catch (err) {
        console.error("Failed to load parents roster:", err);
      } finally {
        setParentsLoading(false);
      }
    };
    loadParents();
  }, [school]);

  // Load message logs when parent is selected
  const loadChat = async () => {
    if (!school || !user || !selectedParentId) return;
    setChatLoading(true);
    try {
      const chatLogs = await dbService.getMessages(school.id, user.uid, selectedParentId);
      setMessages(chatLogs);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [selectedParentId]);

  // Auto-scroll chat window to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Optional: Set up polling (1.5s interval) for sandbox/mock updates or actual DB additions
  useEffect(() => {
    let interval: any;
    if (selectedParentId) {
      interval = setInterval(() => {
        loadChat();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedParentId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user || !selectedParentId || !content.trim()) return;

    try {
      const msg = await dbService.sendMessage(school.id, user.uid, selectedParentId, content.trim());
      setMessages(prev => [...prev, msg]);
      setContent('');
    } catch (err) {
      alert("Failed to send message: " + err);
    }
  };

  const getParentName = (id: string) => {
    return parents.find(p => p.uid === id)?.name || 'Guardian';
  };

  const getParentDetails = (id: string) => {
    const p = parents.find(p => p.uid === id);
    return p ? p.email : '';
  };

  const filteredParents = parents.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="glass-panel" style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      height: 'calc(100vh - 150px)',
      overflow: 'hidden',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)'
    }}>
      
      {/* 1. Left Column: Roster list */}
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
              placeholder="Search parent..."
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 6px' }}>
          {parentsLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem' }}>Loading parents...</div>
          ) : filteredParents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No parent found.</div>
          ) : (
            filteredParents.map(p => {
              const isSelected = selectedParentId === p.uid;
              return (
                <button
                  key={p.uid}
                  onClick={() => setSelectedParentId(p.uid)}
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
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-primary)' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.email}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Column: Chat view */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {selectedParentId ? (
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
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{getParentName(selectedParentId)}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getParentDetails(selectedParentId)}</span>
              </div>
            </div>

            {/* Messages body */}
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
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading chat logs...</div>
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
                  <span style={{ fontSize: '0.85rem' }}>This conversation is empty. Say hello!</span>
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
              Select a parent from the roster to begin secure messaging.
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
export default Messages;
