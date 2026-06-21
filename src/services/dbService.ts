import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, addDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import * as seed from '../utils/mockData';

// DB Mode: 'firebase' | 'sandbox'
export const getDbMode = (): 'firebase' | 'sandbox' => {
  const mode = localStorage.getItem('edu_smart_mode');
  return mode === 'firebase' ? 'firebase' : 'sandbox';
};

export const setDbMode = (mode: 'firebase' | 'sandbox') => {
  localStorage.setItem('edu_smart_mode', mode);
};

// Initial local storage seeding for sandbox
const initializeSandbox = () => {
  if (!localStorage.getItem('edu_smart_seeded')) {
    localStorage.setItem('edu_schools', JSON.stringify(seed.SEED_SCHOOLS));
    localStorage.setItem('edu_users', JSON.stringify(seed.SEED_USERS));
    localStorage.setItem('edu_classes', JSON.stringify(seed.SEED_CLASSES));
    localStorage.setItem('edu_sections', JSON.stringify(seed.SEED_SECTIONS));
    localStorage.setItem('edu_subjects', JSON.stringify(seed.SEED_SUBJECTS));
    localStorage.setItem('edu_timetable', JSON.stringify(seed.SEED_TIMETABLE));
    localStorage.setItem('edu_attendance', JSON.stringify(seed.SEED_ATTENDANCE));
    localStorage.setItem('edu_homework', JSON.stringify(seed.SEED_HOMEWORK));
    localStorage.setItem('edu_study_materials', JSON.stringify(seed.SEED_STUDY_MATERIALS));
    localStorage.setItem('edu_exams', JSON.stringify(seed.SEED_EXAMS));
    localStorage.setItem('edu_marks', JSON.stringify(seed.SEED_MARKS));
    localStorage.setItem('edu_fees', JSON.stringify(seed.SEED_FEES));
    localStorage.setItem('edu_notices', JSON.stringify(seed.SEED_NOTICES));
    localStorage.setItem('edu_leaves', JSON.stringify(seed.SEED_LEAVES));
    localStorage.setItem('edu_messages', JSON.stringify(seed.SEED_MESSAGES));
    localStorage.setItem('edu_smart_seeded', 'true');
  }
};

initializeSandbox();

// LocalStorage helpers
const getLocal = (key: string): any[] => {
  initializeSandbox();
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const saveLocal = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const dbService = {
  // --- SCHOOLS ---
  async getSchool(schoolId: string) {
    if (getDbMode() === 'firebase') {
      const snap = await getDoc(doc(db, 'schools', schoolId));
      return snap.exists() ? snap.data() : null;
    } else {
      const schools = getLocal('edu_schools');
      return schools.find(s => s.id === schoolId) || null;
    }
  },

  async getSchools() {
    if (getDbMode() === 'firebase') {
      const snap = await getDocs(collection(db, 'schools'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_schools');
    }
  },

  async createSchool(schoolData: any) {
    if (getDbMode() === 'firebase') {
      const schoolRef = doc(collection(db, 'schools'));
      const id = schoolRef.id;
      const docData = { ...schoolData, id, createdAt: new Date().toISOString() };
      await setDoc(schoolRef, docData);
      return docData;
    } else {
      const schools = getLocal('edu_schools');
      const newSchool = { ...schoolData, id: `school-${Date.now()}`, createdAt: new Date().toISOString() };
      schools.push(newSchool);
      saveLocal('edu_schools', schools);
      return newSchool;
    }
  },

  async updateSchool(schoolId: string, data: any) {
    if (getDbMode() === 'firebase') {
      await updateDoc(doc(db, 'schools', schoolId), data);
      return { id: schoolId, ...data };
    } else {
      const schools = getLocal('edu_schools');
      const idx = schools.findIndex(s => s.id === schoolId);
      if (idx !== -1) {
        schools[idx] = { ...schools[idx], ...data };
        saveLocal('edu_schools', schools);
        return schools[idx];
      }
      throw new Error("School not found");
    }
  },

  // --- USERS ---
  async getUser(uid: string) {
    if (getDbMode() === 'firebase') {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } else {
      const users = getLocal('edu_users');
      return users.find(u => u.uid === uid) || null;
    }
  },

  async getUserByEmail(email: string) {
    if (getDbMode() === 'firebase') {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      return snap.empty ? null : snap.docs[0].data();
    } else {
      const users = getLocal('edu_users');
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
  },

  async createUser(uid: string, userData: any) {
    const newUser = {
      uid,
      isActive: true,
      createdAt: new Date().toISOString(),
      ...userData,
      email: userData.email.toLowerCase()
    };
    if (getDbMode() === 'firebase') {
      await setDoc(doc(db, 'users', uid), newUser);
      return newUser;
    } else {
      const users = getLocal('edu_users');
      // If user exists, update, else add
      const idx = users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...newUser };
      } else {
        users.push(newUser);
      }
      saveLocal('edu_users', users);
      return newUser;
    }
  },

  async updateUser(uid: string, data: any) {
    if (getDbMode() === 'firebase') {
      await updateDoc(doc(db, 'users', uid), data);
      return { uid, ...data };
    } else {
      const users = getLocal('edu_users');
      const idx = users.findIndex(u => u.uid === uid);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data };
        saveLocal('edu_users', users);
        return users[idx];
      }
      throw new Error("User not found");
    }
  },

  async getUsers(schoolId: string | null) {
    if (getDbMode() === 'firebase') {
      const q = schoolId 
        ? query(collection(db, 'users'), where('schoolId', '==', schoolId))
        : query(collection(db, 'users'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } else {
      const users = getLocal('edu_users');
      if (schoolId === null) return users;
      return users.filter(u => u.schoolId === schoolId);
    }
  },

  // --- ACADEMICS (CLASSES, SECTIONS, SUBJECTS) ---
  async getClasses(schoolId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_classes').filter(c => c.schoolId === schoolId);
    }
  },

  async createClass(schoolId: string, name: string) {
    const classData = { schoolId, name, createdAt: new Date().toISOString() };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'classes'), classData);
      return { id: docRef.id, ...classData };
    } else {
      const classes = getLocal('edu_classes');
      const newClass = { id: `class-${Date.now()}`, ...classData };
      classes.push(newClass);
      saveLocal('edu_classes', classes);
      return newClass;
    }
  },

  async getSections(schoolId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(collection(db, 'sections'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_sections').filter(s => s.schoolId === schoolId);
    }
  },

  async createSection(schoolId: string, classId: string, name: string, classTeacherId?: string) {
    const sectionData = { schoolId, classId, name, classTeacherId };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'sections'), sectionData);
      return { id: docRef.id, ...sectionData };
    } else {
      const sections = getLocal('edu_sections');
      const newSection = { id: `sect-${Date.now()}`, ...sectionData };
      sections.push(newSection);
      saveLocal('edu_sections', sections);
      return newSection;
    }
  },

  async getSubjects(schoolId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_subjects').filter(s => s.schoolId === schoolId);
    }
  },

  async createSubject(schoolId: string, name: string, code: string) {
    const subjectData = { schoolId, name, code };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'subjects'), subjectData);
      return { id: docRef.id, ...subjectData };
    } else {
      const subjects = getLocal('edu_subjects');
      const newSubject = { id: `subj-${Date.now()}`, ...subjectData };
      subjects.push(newSubject);
      saveLocal('edu_subjects', subjects);
      return newSubject;
    }
  },

  // --- TIMETABLE ---
  async getTimetable(schoolId: string, classId: string, sectionId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(
        collection(db, 'timetable'), 
        where('schoolId', '==', schoolId),
        where('classId', '==', classId),
        where('sectionId', '==', sectionId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_timetable').filter(
        t => t.schoolId === schoolId && t.classId === classId && t.sectionId === sectionId
      );
    }
  },

  async saveTimetable(schoolId: string, classId: string, sectionId: string, day: string, slots: any[]) {
    const ttData = { schoolId, classId, sectionId, day, slots };
    if (getDbMode() === 'firebase') {
      // Find if exists
      const q = query(
        collection(db, 'timetable'),
        where('schoolId', '==', schoolId),
        where('classId', '==', classId),
        where('sectionId', '==', sectionId),
        where('day', '==', day)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(doc(db, 'timetable', snap.docs[0].id), { slots });
      } else {
        await addDoc(collection(db, 'timetable'), ttData);
      }
    } else {
      const timetables = getLocal('edu_timetable');
      const idx = timetables.findIndex(
        t => t.schoolId === schoolId && t.classId === classId && t.sectionId === sectionId && t.day === day
      );
      if (idx !== -1) {
        timetables[idx].slots = slots;
      } else {
        timetables.push({ id: `tt-${Date.now()}`, ...ttData });
      }
      saveLocal('edu_timetable', timetables);
    }
  },

  // --- ATTENDANCE ---
  async getAttendance(schoolId: string, classId: string, sectionId: string, date: string) {
    if (getDbMode() === 'firebase') {
      const docId = `${schoolId}_${classId}_${sectionId}_${date}`;
      const snap = await getDoc(doc(db, 'attendance', docId));
      return snap.exists() ? snap.data() : null;
    } else {
      const list = getLocal('edu_attendance');
      return list.find(
        a => a.schoolId === schoolId && a.classId === classId && a.sectionId === sectionId && a.date === date
      ) || null;
    }
  },

  async saveAttendance(schoolId: string, classId: string, sectionId: string, date: string, records: any, teacherId: string) {
    const attData = {
      schoolId,
      classId,
      sectionId,
      date,
      records,
      markedBy: teacherId,
      updatedAt: new Date().toISOString()
    };
    if (getDbMode() === 'firebase') {
      const docId = `${schoolId}_${classId}_${sectionId}_${date}`;
      await setDoc(doc(db, 'attendance', docId), attData);
    } else {
      const list = getLocal('edu_attendance');
      const idx = list.findIndex(
        a => a.schoolId === schoolId && a.classId === classId && a.sectionId === sectionId && a.date === date
      );
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...attData };
      } else {
        list.push({ id: `att-${Date.now()}`, ...attData });
      }
      saveLocal('edu_attendance', list);
    }
  },

  // --- HOMEWORK & STUDY MATERIALS ---
  async getHomeworks(schoolId: string, classId: string, sectionId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(
        collection(db, 'homework'), 
        where('schoolId', '==', schoolId),
        where('classId', '==', classId),
        where('sectionId', '==', sectionId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_homework').filter(
        h => h.schoolId === schoolId && h.classId === classId && h.sectionId === sectionId
      );
    }
  },

  async createHomework(homeworkData: any) {
    const hw = { ...homeworkData, createdAt: new Date().toISOString() };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'homework'), hw);
      return { id: docRef.id, ...hw };
    } else {
      const list = getLocal('edu_homework');
      const newHw = { id: `hw-${Date.now()}`, ...hw };
      list.push(newHw);
      saveLocal('edu_homework', list);
      return newHw;
    }
  },

  async getStudyMaterials(schoolId: string, classId: string, sectionId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(
        collection(db, 'study_materials'), 
        where('schoolId', '==', schoolId),
        where('classId', '==', classId),
        where('sectionId', '==', sectionId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_study_materials').filter(
        s => s.schoolId === schoolId && s.classId === classId && s.sectionId === sectionId
      );
    }
  },

  async createStudyMaterial(materialData: any) {
    const sm = { ...materialData, createdAt: new Date().toISOString() };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'study_materials'), sm);
      return { id: docRef.id, ...sm };
    } else {
      const list = getLocal('edu_study_materials');
      const newSm = { id: `sm-${Date.now()}`, ...sm };
      list.push(newSm);
      saveLocal('edu_study_materials', list);
      return newSm;
    }
  },

  // --- EXAMS & MARKS ---
  async getExams(schoolId: string, classId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(
        collection(db, 'exams'),
        where('schoolId', '==', schoolId),
        where('classId', '==', classId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_exams').filter(e => e.schoolId === schoolId && e.classId === classId);
    }
  },

  async createExam(examData: any) {
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'exams'), examData);
      return { id: docRef.id, ...examData };
    } else {
      const list = getLocal('edu_exams');
      const newExam = { id: `exam-${Date.now()}`, ...examData };
      list.push(newExam);
      saveLocal('edu_exams', list);
      return newExam;
    }
  },

  async getMarks(schoolId: string, examId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(
        collection(db, 'marks'),
        where('schoolId', '==', schoolId),
        where('examId', '==', examId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_marks').filter(m => m.schoolId === schoolId && m.examId === examId);
    }
  },

  async saveMark(schoolId: string, examId: string, studentId: string, marksObtained: number, remarks: string, enteredBy: string) {
    const markData = {
      schoolId,
      examId,
      studentId,
      marksObtained,
      remarks,
      enteredBy,
      updatedAt: new Date().toISOString()
    };
    if (getDbMode() === 'firebase') {
      const docId = `${examId}_${studentId}`;
      await setDoc(doc(db, 'marks', docId), markData);
    } else {
      const list = getLocal('edu_marks');
      const idx = list.findIndex(m => m.examId === examId && m.studentId === studentId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...markData };
      } else {
        list.push({ id: `mark-${Date.now()}`, ...markData });
      }
      saveLocal('edu_marks', list);
    }
  },

  // --- FEES ---
  async getFees(schoolId: string, studentId?: string) {
    if (getDbMode() === 'firebase') {
      const q = studentId 
        ? query(collection(db, 'fees'), where('schoolId', '==', schoolId), where('studentId', '==', studentId))
        : query(collection(db, 'fees'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      const list = getLocal('edu_fees').filter(f => f.schoolId === schoolId);
      if (studentId) return list.filter(f => f.studentId === studentId);
      return list;
    }
  },

  async createFee(feeData: any) {
    const newFee = { ...feeData, status: 'unpaid' };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'fees'), newFee);
      return { id: docRef.id, ...newFee };
    } else {
      const list = getLocal('edu_fees');
      const created = { id: `fee-${Date.now()}`, ...newFee };
      list.push(created);
      saveLocal('edu_fees', list);
      return created;
    }
  },

  async recordPayment(feeId: string, paymentMethod: string) {
    const payment = {
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod
    };
    if (getDbMode() === 'firebase') {
      await updateDoc(doc(db, 'fees', feeId), payment);
    } else {
      const list = getLocal('edu_fees');
      const idx = list.findIndex(f => f.id === feeId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payment };
        saveLocal('edu_fees', list);
      }
    }
  },

  // --- NOTICES ---
  async getNotices(schoolId: string) {
    if (getDbMode() === 'firebase') {
      // Fetch school notices OR global notices
      const q = query(
        collection(db, 'notices'), 
        where('schoolId', 'in', [schoolId, 'global'])
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      return getLocal('edu_notices')
        .filter(n => n.schoolId === schoolId || n.schoolId === 'global')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async createNotice(noticeData: any) {
    const notice = { ...noticeData, createdAt: new Date().toISOString() };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'notices'), notice);
      return { id: docRef.id, ...notice };
    } else {
      const list = getLocal('edu_notices');
      const newNotice = { id: `notice-${Date.now()}`, ...notice };
      list.push(newNotice);
      saveLocal('edu_notices', list);
      return newNotice;
    }
  },

  // --- LEAVE MANAGEMENT ---
  async getLeaves(schoolId: string) {
    if (getDbMode() === 'firebase') {
      const q = query(collection(db, 'leaves'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } else {
      return getLocal('edu_leaves').filter(l => l.schoolId === schoolId);
    }
  },

  async createLeaveRequest(leaveData: any) {
    const leave = { 
      ...leaveData, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'leaves'), leave);
      return { id: docRef.id, ...leave };
    } else {
      const list = getLocal('edu_leaves');
      const newLeave = { id: `leave-${Date.now()}`, ...leave };
      list.push(newLeave);
      saveLocal('edu_leaves', list);
      return newLeave;
    }
  },

  async resolveLeave(leaveId: string, status: 'approved' | 'rejected', resolvedBy: string) {
    const update = { status, resolvedBy };
    if (getDbMode() === 'firebase') {
      await updateDoc(doc(db, 'leaves', leaveId), update);
    } else {
      const list = getLocal('edu_leaves');
      const idx = list.findIndex(l => l.id === leaveId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...update };
        saveLocal('edu_leaves', list);
      }
    }
  },

  // --- MESSAGES ---
  async getMessages(schoolId: string, senderId: string, receiverId: string) {
    if (getDbMode() === 'firebase') {
      // Firestore does not easily support OR queries for sender/receiver in complex setups without multiple indexes,
      // but we can query by schoolId and then filter locally to guarantee reliability.
      const q = query(collection(db, 'messages'), where('schoolId', '==', schoolId));
      const snap = await getDocs(q);
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((m: any) => 
          (m.senderId === senderId && m.receiverId === receiverId) ||
          (m.senderId === receiverId && m.receiverId === senderId)
        )
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      return getLocal('edu_messages')
        .filter(m => 
          m.schoolId === schoolId && 
          ((m.senderId === senderId && m.receiverId === receiverId) ||
           (m.senderId === receiverId && m.receiverId === senderId))
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
  },

  async sendMessage(schoolId: string, senderId: string, receiverId: string, content: string) {
    const msg = {
      schoolId,
      senderId,
      receiverId,
      content,
      readStatus: false,
      createdAt: new Date().toISOString()
    };
    if (getDbMode() === 'firebase') {
      const docRef = await addDoc(collection(db, 'messages'), msg);
      return { id: docRef.id, ...msg };
    } else {
      const list = getLocal('edu_messages');
      const newMsg = { id: `msg-${Date.now()}`, ...msg };
      list.push(newMsg);
      saveLocal('edu_messages', list);
      return newMsg;
    }
  },

  // --- CRUD DELETIONS ---
  async deleteClass(schoolId: string, classId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'classes', classId));
    } else {
      const list = getLocal('edu_classes');
      saveLocal('edu_classes', list.filter(c => c.id !== classId));
    }
  },

  async deleteSection(schoolId: string, sectionId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'sections', sectionId));
    } else {
      const list = getLocal('edu_sections');
      saveLocal('edu_sections', list.filter(s => s.id !== sectionId));
    }
  },

  async deleteSubject(schoolId: string, subjectId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'subjects', subjectId));
    } else {
      const list = getLocal('edu_subjects');
      saveLocal('edu_subjects', list.filter(s => s.id !== subjectId));
    }
  },

  async deleteHomework(schoolId: string, homeworkId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'homework', homeworkId));
    } else {
      const list = getLocal('edu_homework');
      saveLocal('edu_homework', list.filter(h => h.id !== homeworkId));
    }
  },

  async deleteStudyMaterial(schoolId: string, materialId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'study_materials', materialId));
    } else {
      const list = getLocal('edu_study_materials');
      saveLocal('edu_study_materials', list.filter(s => s.id !== materialId));
    }
  },

  async deleteExam(schoolId: string, examId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'exams', examId));
    } else {
      const list = getLocal('edu_exams');
      saveLocal('edu_exams', list.filter(e => e.id !== examId));
    }
  },

  async deleteNotice(schoolId: string, noticeId: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'notices', noticeId));
    } else {
      const list = getLocal('edu_notices');
      saveLocal('edu_notices', list.filter(n => n.id !== noticeId));
    }
  },

  async deleteUser(uid: string) {
    if (getDbMode() === 'firebase') {
      await deleteDoc(doc(db, 'users', uid));
    } else {
      const list = getLocal('edu_users');
      saveLocal('edu_users', list.filter(u => u.uid !== uid));
    }
  },

  // --- STORAGE FILE UPLOAD ---
  async uploadFile(schoolId: string, folder: string, file: File): Promise<string> {
    if (getDbMode() === 'firebase') {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('../config/firebase');
      const fileId = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `schools/${schoolId}/${folder}/${fileId}`);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } else {
      // Sandbox Mode: convert to base64 Data URL for local file representation
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }
};
