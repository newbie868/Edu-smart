import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Calendar, Download, FileText } from 'lucide-react';

export const Academics: React.FC = () => {
  const { school, user } = useAuth();
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'homework' | 'materials'>('homework');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAcademicHub = async () => {
      if (!school || !user || !user.studentDetails) return;
      setLoading(true);
      try {
        const { classId, sectionId } = user.studentDetails;
        const hwList = await dbService.getHomeworks(school.id, classId, sectionId);
        const matList = await dbService.getStudyMaterials(school.id, classId, sectionId);
        const subjList = await dbService.getSubjects(school.id);
        
        setHomeworks(hwList);
        setMaterials(matList);
        setSubjects(subjList);
      } catch (err) {
        console.error("Failed to load student academics:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAcademicHub();
  }, [school, user]);

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || id;
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading academic hub...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tab Switchers */}
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
          My Homework ({homeworks.length})
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
          Study Handouts ({materials.length})
        </button>
      </div>

      {/* Main Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
          {activeTab === 'homework' ? 'Assigned Homework Tasks' : 'Reference Documents'}
        </h3>

        {activeTab === 'homework' ? (
          homeworks.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No homework assigned! Enjoy your free time.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {homeworks.map(hw => (
                <div 
                  key={hw.id}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{hw.title}</h4>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                        {getSubjectName(hw.subjectId)}
                      </span>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                      Due: {new Date(hw.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>
                    {hw.description}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          materials.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No study materials uploaded for this class.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {materials.map(mat => (
                <div 
                  key={mat.id}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mat.title}</h4>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                      {getSubjectName(mat.subjectId)}
                    </span>
                    {mat.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px', lineHeight: '1.4' }}>
                        {mat.description}
                      </p>
                    )}
                  </div>
                  <a 
                    href={mat.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary" 
                    style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  );
};
export default Academics;
