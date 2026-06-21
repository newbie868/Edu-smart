import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { FileText, Plus, Award, Printer, Trash } from 'lucide-react';

export const Exams: React.FC = () => {
  const { school } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam schedule form
  const [name, setName] = useState('');
  const [examClassId, setExamClassId] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');

  // Report card viewer selections
  const [reportClassId, setReportClassId] = useState('');
  const [reportStudentId, setReportStudentId] = useState('');

  const loadData = async () => {
    if (!school) return;
    setLoading(true);
    try {
      const cList = await dbService.getClasses(school.id);
      const subjList = await dbService.getSubjects(school.id);
      const uList = await dbService.getUsers(school.id);
      
      setClasses(cList);
      setSubjects(subjList);
      setStudents(uList.filter(u => u.role === 'student'));
      
      const allExams = [];
      const allMarks = [];
      
      for (const cls of cList) {
        const classExams = await dbService.getExams(school.id, cls.id);
        allExams.push(...classExams);
        
        for (const ex of classExams) {
          const examMarks = await dbService.getMarks(school.id, ex.id);
          allMarks.push(...examMarks);
        }
      }
      
      setExams(allExams);
      setMarks(allMarks);
    } catch (err) {
      console.error("Failed to load exams:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [school]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    try {
      await dbService.createExam({
        schoolId: school.id,
        name,
        classId: examClassId,
        subjectId: examSubjectId,
        date,
        maxMarks: parseInt(maxMarks)
      });
      setName('');
      setExamClassId('');
      setExamSubjectId('');
      setDate('');
      setMaxMarks('100');
      loadData();
    } catch (err) {
      alert("Failed to establish exam: " + err);
    }
  };

  const handleDeleteExam = async (examId: string, examName: string) => {
    if (!school) return;
    if (!window.confirm(`Are you sure you want to delete exam "${examName}"?`)) return;
    try {
      await dbService.deleteExam(school.id, examId);
      loadData();
    } catch (err) {
      alert("Failed to delete exam: " + err);
    }
  };

  const getClassName = (classId: string) => {
    return classes.find(c => c.id === classId)?.name || classId;
  };

  const getSubjectName = (subId: string) => {
    return subjects.find(s => s.id === subId)?.name || subId;
  };

  const getStudentName = (uid: string) => {
    return students.find(s => s.uid === uid)?.name || uid;
  };

  const getStudentReportCardMarks = () => {
    if (!reportStudentId) return [];
    
    const student = students.find(s => s.uid === reportStudentId);
    if (!student || !student.studentDetails) return [];
    
    const studentClassId = student.studentDetails.classId;
    const studentExams = exams.filter(ex => ex.classId === studentClassId);
    
    return studentExams.map(ex => {
      const studentMark = marks.find(m => m.examId === ex.id && m.studentId === reportStudentId);
      return {
        examName: ex.name,
        subjectName: getSubjectName(ex.subjectId),
        marksObtained: studentMark ? studentMark.marksObtained : null,
        maxMarks: ex.maxMarks,
        remarks: studentMark ? studentMark.remarks : 'No record'
      };
    });
  };

  const reportCardMarks = getStudentReportCardMarks();

  const calculateAggregate = () => {
    if (reportCardMarks.length === 0) return { obtained: 0, total: 0, percentage: 0, grade: 'N/A' };
    
    let obtainedSum = 0;
    let totalSum = 0;
    let validCount = 0;

    reportCardMarks.forEach(m => {
      if (m.marksObtained !== null) {
        obtainedSum += m.marksObtained;
        totalSum += m.maxMarks;
        validCount++;
      }
    });

    if (validCount === 0) return { obtained: 0, total: 0, percentage: 0, grade: 'N/A' };
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
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading exams workspace...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Upper Grid: Setup + Exam Schedules */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Setup Exam */}
        <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            Onboard Exam Schedule
          </h3>
          <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Exam Title</label>
              <input type="text" className="form-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mid-Term Examination" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Class</label>
                <select className="form-select" required value={examClassId} onChange={e => setExamClassId(e.target.value)}>
                  <option value="">Choose Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" required value={examSubjectId} onChange={e => setExamSubjectId(e.target.value)}>
                  <option value="">Choose Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Marks</label>
                <input type="number" className="form-input" required value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '6px' }}>
              <Plus size={16} />
              <span>Schedule Exam</span>
            </button>
          </form>
        </div>

        {/* List of Schedules */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '20px' }}>
            Current Exam Schedules
          </h3>
          {exams.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>No exams scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
              {exams.map(ex => (
                <div 
                  key={ex.id}
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
                    <h4 style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ex.name}</h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Class: <span style={{ fontWeight: 500 }}>{getClassName(ex.classId)}</span> • Subject: <span style={{ fontWeight: 500 }}>{getSubjectName(ex.subjectId)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                        Max: {ex.maxMarks}
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(ex.date).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteExam(ex.id, ex.name)}
                      className="btn-icon"
                      style={{ color: 'var(--danger)', padding: '4px' }}
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Lower Section: Report Card Generator */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} style={{ color: 'var(--warning)' }} />
          Academic Report Card Generator
        </h3>

        {/* Filter selectors */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Grade / Class</label>
            <select className="form-select" value={reportClassId} onChange={e => {
              setReportClassId(e.target.value);
              setReportStudentId('');
            }}>
              <option value="">Choose Class</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">Student</label>
            <select className="form-select" value={reportStudentId} onChange={e => setReportStudentId(e.target.value)}>
              <option value="">Choose Student</option>
              {students.filter(s => s.studentDetails?.classId === reportClassId).map(s => (
                <option key={s.uid} value={s.uid}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Report Card Template */}
        {reportClassId && reportStudentId && (
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '32px',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--border-color)',
            position: 'relative'
          }} id="report-card-pdf-area">
            
            {/* Watermark / Print Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--primary)' }}>EDU-SMART ACADEMY</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>OFFICIAL STUDENT TRANSCRIPT</span>
              </div>
              <button 
                onClick={handlePrint}
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '0.8rem' }}
              >
                <Printer size={16} />
                <span>Print Transcript</span>
              </button>
            </div>

            {/* Student Metadata Card */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Student Name</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>{getStudentName(reportStudentId)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Enrollment No</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {students.find(s => s.uid === reportStudentId)?.studentDetails?.admissionNo}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Class Level</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>{getClassName(reportClassId)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Roll Number</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                  {students.find(s => s.uid === reportStudentId)?.studentDetails?.rollNo}
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <div className="table-container" style={{ marginBottom: '30px', background: 'var(--bg-secondary)' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Assessment Title</th>
                    <th>Score Obtained</th>
                    <th>Maximum Score</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCardMarks.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No exams matching this student's class levels.</td>
                    </tr>
                  ) : (
                    reportCardMarks.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{m.subjectName}</td>
                        <td>{m.examName}</td>
                        <td style={{ fontWeight: 700, color: m.marksObtained === null ? 'var(--text-muted)' : m.marksObtained < 50 ? 'var(--danger)' : 'var(--text-primary)' }}>
                          {m.marksObtained ?? 'Pending'}
                        </td>
                        <td>{m.maxMarks}</td>
                        <td>{m.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summarized Grades Card */}
            {reportCardMarks.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                border: '1px solid var(--primary)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Cumulative Score</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    {aggregate.obtained} / {aggregate.total}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Aggregated Percentage</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    {aggregate.percentage}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Calculated Grade</span>
                  <span className={`badge ${aggregate.grade === 'F' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '1.1rem', padding: '6px 14px', marginTop: '4px', fontWeight: 800 }}>
                    {aggregate.grade}
                  </span>
                </div>
              </div>
            )}

          </div>
        )}

        {!reportStudentId && (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            Please select a Grade and Pupil profile above to review or print official transcripts.
          </div>
        )}
      </div>

    </div>
  );
};
export default Exams;
