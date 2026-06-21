import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { Award, ShieldCheck } from 'lucide-react';

export const MarksEntry: React.FC = () => {
  const { school, user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Selections
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');
  
  // Marks state
  const [marks, setMarks] = useState<{ [studentId: string]: { score: string; remarks: string } }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadFilters = async () => {
      if (!school) return;
      try {
        const cList = await dbService.getClasses(school.id);
        setClasses(cList);
      } catch (err) {
        console.error("Failed to load classes for grades:", err);
      }
    };
    loadFilters();
  }, [school]);

  // Load exams when class is selected
  useEffect(() => {
    const loadExams = async () => {
      if (!school || !selectedClassId) return;
      try {
        const examList = await dbService.getExams(school.id, selectedClassId);
        setExams(examList);
        setSelectedExamId('');
      } catch (err) {
        console.error("Failed to load exams:", err);
      }
    };
    loadExams();
  }, [school, selectedClassId]);

  // Load students and existing marks when exam is selected
  useEffect(() => {
    const loadStudentMarks = async () => {
      if (!school || !selectedClassId || !selectedExamId) return;
      setLoading(true);
      try {
        // Fetch students
        const uList = await dbService.getUsers(school.id);
        const filteredStudents = uList.filter(
          u => u.role === 'student' && 
               u.studentDetails && 
               u.studentDetails.classId === selectedClassId
        );
        setStudents(filteredStudents);

        // Fetch marks
        const existingMarks = await dbService.getMarks(school.id, selectedExamId);
        
        const initialMarksState: any = {};
        filteredStudents.forEach(s => {
          const match = existingMarks.find(m => m.studentId === s.uid);
          initialMarksState[s.uid] = {
            score: match ? match.marksObtained.toString() : '',
            remarks: match ? match.remarks || '' : ''
          };
        });
        setMarks(initialMarksState);
      } catch (err) {
        console.error("Failed to load student grade sheets:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentMarks();
  }, [school, selectedClassId, selectedExamId]);

  const handleScoreChange = (studentId: string, val: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: val
      }
    }));
  };

  const handleRemarksChange = (studentId: string, val: string) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: val
      }
    }));
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !user || !selectedExamId) return;

    try {
      const activeExam = exams.find(ex => ex.id === selectedExamId);
      const maxM = activeExam ? activeExam.maxMarks : 100;

      // Validation
      for (const studentId of Object.keys(marks)) {
        const scoreStr = marks[studentId].score;
        if (scoreStr !== '') {
          const numScore = parseFloat(scoreStr);
          if (isNaN(numScore) || numScore < 0 || numScore > maxM) {
            alert(`Invalid score for student. Scores must be between 0 and maximum marks (${maxM}).`);
            return;
          }
        }
      }

      // Save each record
      for (const studentId of Object.keys(marks)) {
        const item = marks[studentId];
        if (item.score !== '') {
          await dbService.saveMark(
            school.id,
            selectedExamId,
            studentId,
            parseFloat(item.score),
            item.remarks,
            user.uid
          );
        }
      }

      alert("Student grades saved successfully!");
    } catch (err) {
      alert("Failed to save grades: " + err);
    }
  };

  const getActiveExamMax = () => {
    return exams.find(e => e.id === selectedExamId)?.maxMarks || 100;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Filter Selection Panel */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Grade / Class</label>
            <select className="form-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">Choose Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Active Assessment / Exam</label>
            <select className="form-select" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} disabled={!selectedClassId}>
              <option value="">Choose Exam Schedule</option>
              {exams.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grade entry grid */}
      {selectedClassId && selectedExamId && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} style={{ color: 'var(--primary)' }} />
              Grade Book Entry Sheet
            </h3>
            <span className="badge badge-info" style={{ padding: '6px 12px' }}>
              Max Marks: {getActiveExamMax()}
            </span>
          </div>

          {loading ? (
            <div>Loading entry sheet...</div>
          ) : students.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No students registered in this class.</p>
          ) : (
            <form onSubmit={handleSaveMarks}>
              <div className="table-container" style={{ marginBottom: '20px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px' }}>Roll No</th>
                      <th>Student Name</th>
                      <th>Admission No</th>
                      <th style={{ width: '180px' }}>Score Obtained</th>
                      <th>Remarks / Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => {
                      const item = marks[s.uid] || { score: '', remarks: '' };
                      return (
                        <tr key={s.uid}>
                          <td>{s.studentDetails?.rollNo || '-'}</td>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.studentDetails?.admissionNo}</td>
                          <td>
                            <input
                              type="number"
                              className="form-input"
                              value={item.score}
                              onChange={e => handleScoreChange(s.uid, e.target.value)}
                              placeholder={`0 - ${getActiveExamMax()}`}
                              min={0}
                              max={getActiveExamMax()}
                              step="0.5"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              value={item.remarks}
                              onChange={e => handleRemarksChange(s.uid, e.target.value)}
                              placeholder="e.g. Excellent progress"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">
                  <ShieldCheck size={18} />
                  <span>Save Grades</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {!selectedExamId && (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }} className="glass-panel">
          Select class and assessment schedule in the filters above to populate the grade entry sheet.
        </div>
      )}

    </div>
  );
};
export default MarksEntry;
