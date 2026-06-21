import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Award, Printer } from 'lucide-react';

interface ParentReportsProps {
  selectedChildId: string;
}

export const Reports: React.FC<ParentReportsProps> = ({ selectedChildId }) => {
  const { school } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChildReport = async () => {
      if (!school || !selectedChildId) return;
      setLoading(true);
      try {
        const kid = await dbService.getUser(selectedChildId);
        if (kid && kid.studentDetails) {
          const { classId } = kid.studentDetails;
          
          const examList = await dbService.getExams(school.id, classId);
          const subjList = await dbService.getSubjects(school.id);
          
          // Load marks
          const studentMarks = [];
          for (const ex of examList) {
            const mList = await dbService.getMarks(school.id, ex.id);
            const personalMark = mList.find(m => m.studentId === selectedChildId);
            if (personalMark) {
              studentMarks.push({
                examId: ex.id,
                examName: ex.name,
                subjectId: ex.subjectId,
                marksObtained: personalMark.marksObtained,
                maxMarks: ex.maxMarks,
                remarks: personalMark.remarks
              });
            }
          }

          setExams(examList);
          setSubjects(subjList);
          setMarks(studentMarks);
        }
      } catch (err) {
        console.error("Failed to load child transcript:", err);
      } finally {
        setLoading(false);
      }
    };
    loadChildReport();
  }, [school, selectedChildId]);

  const getSubjectName = (id: string) => {
    return subjects.find(s => s.id === id)?.name || id;
  };

  const calculateAggregate = () => {
    if (marks.length === 0) return { obtained: 0, total: 0, percentage: 0, grade: 'N/A' };
    
    let obtainedSum = 0;
    let totalSum = 0;

    marks.forEach(m => {
      obtainedSum += m.marksObtained;
      totalSum += m.maxMarks;
    });

    const percentage = parseFloat(((obtainedSum / totalSum) * 100).toFixed(1));
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    return { obtained: obtainedSum, total: totalSum, percentage, grade };
  };

  const aggregate = calculateAggregate();

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading child report card...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>Child Academic Report</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Review grades, test performance sheets, and feedback details.</p>
        </div>
        <button onClick={handlePrint} className="btn btn-secondary">
          <Printer size={16} />
          <span>Print Report Card</span>
        </button>
      </div>

      {marks.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
          No exam grades registered for your child yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Table */}
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Assessment Schedule</th>
                  <th>Marks Obtained</th>
                  <th>Max Score</th>
                  <th>Teacher Feedback</th>
                </tr>
              </thead>
              <tbody>
                {marks.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{getSubjectName(m.subjectId)}</td>
                    <td>{m.examName}</td>
                    <td style={{ fontWeight: 700, color: m.marksObtained < 50 ? 'var(--danger)' : 'var(--text-primary)' }}>
                      {m.marksObtained}
                    </td>
                    <td>{m.maxMarks}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{m.remarks || 'No feedback'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Aggregates Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary)',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Cumulative Score
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {aggregate.obtained} / {aggregate.total}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Percentage
              </span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                {aggregate.percentage}%
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                Final Grade
              </span>
              <div style={{ marginTop: '4px' }}>
                <span className={`badge ${aggregate.grade === 'F' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '1rem', padding: '6px 14px', fontWeight: 800 }}>
                  {aggregate.grade}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
export default Reports;
