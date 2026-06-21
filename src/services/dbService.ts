import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, addDoc, deleteDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const dbService = {
  // --- SCHOOLS ---
  async getSchool(schoolId: string): Promise<any> {
    const snap = await getDoc(doc(db, 'schools', schoolId));
    return snap.exists() ? (snap.data() as any) : null;
  },

  async getSchools(): Promise<any[]> {
    const snap = await getDocs(collection(db, 'schools'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createSchool(schoolData: any): Promise<any> {
    const schoolRef = doc(collection(db, 'schools'));
    const id = schoolRef.id;
    const docData = { ...schoolData, id, createdAt: new Date().toISOString() };
    await setDoc(schoolRef, docData);
    return docData;
  },

  async updateSchool(schoolId: string, data: any): Promise<any> {
    await updateDoc(doc(db, 'schools', schoolId), data);
    return { id: schoolId, ...data };
  },

  // --- USERS ---
  async getUser(uid: string): Promise<any> {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as any) : null;
  },

  async getUserByEmail(email: string): Promise<any> {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
    const snap = await getDocs(q);
    return snap.empty ? null : (snap.docs[0].data() as any);
  },

  async createUser(uid: string, userData: any): Promise<any> {
    const newUser = {
      uid,
      isActive: true,
      createdAt: new Date().toISOString(),
      ...userData,
      email: userData.email.toLowerCase()
    };
    await setDoc(doc(db, 'users', uid), newUser);
    return newUser;
  },

  async updateUser(uid: string, data: any): Promise<any> {
    await updateDoc(doc(db, 'users', uid), data);
    return { uid, ...data };
  },

  async getUsers(schoolId: string | null): Promise<any[]> {
    const q = schoolId 
      ? query(collection(db, 'users'), where('schoolId', '==', schoolId))
      : query(collection(db, 'users'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as any);
  },

  // --- ACADEMICS (CLASSES, SECTIONS, SUBJECTS) ---
  async getClasses(schoolId: string): Promise<any[]> {
    const q = query(collection(db, 'classes'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createClass(schoolId: string, name: string): Promise<any> {
    const classData = { schoolId, name, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'classes'), classData);
    return { id: docRef.id, ...classData };
  },

  async getSections(schoolId: string): Promise<any[]> {
    const q = query(collection(db, 'sections'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createSection(schoolId: string, classId: string, name: string, classTeacherId?: string): Promise<any> {
    const sectionData = { schoolId, classId, name, classTeacherId };
    const docRef = await addDoc(collection(db, 'sections'), sectionData);
    return { id: docRef.id, ...sectionData };
  },

  async getSubjects(schoolId: string): Promise<any[]> {
    const q = query(collection(db, 'subjects'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createSubject(schoolId: string, name: string, code: string): Promise<any> {
    const subjectData = { schoolId, name, code };
    const docRef = await addDoc(collection(db, 'subjects'), subjectData);
    return { id: docRef.id, ...subjectData };
  },

  // --- TIMETABLE ---
  async getTimetable(schoolId: string, classId: string, sectionId: string): Promise<any[]> {
    const q = query(
      collection(db, 'timetable'), 
      where('schoolId', '==', schoolId),
      where('classId', '==', classId),
      where('sectionId', '==', sectionId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async saveTimetable(schoolId: string, classId: string, sectionId: string, day: string, slots: any[]): Promise<void> {
    const ttData = { schoolId, classId, sectionId, day, slots };
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
  },

  // --- ATTENDANCE ---
  async getAttendance(schoolId: string, classId: string, sectionId: string, date: string): Promise<any> {
    const docId = `${schoolId}_${classId}_${sectionId}_${date}`;
    const snap = await getDoc(doc(db, 'attendance', docId));
    return snap.exists() ? (snap.data() as any) : null;
  },

  async getAttendanceList(schoolId: string, classId: string, sectionId: string): Promise<any[]> {
    const q = query(
      collection(db, 'attendance'),
      where('schoolId', '==', schoolId),
      where('classId', '==', classId),
      where('sectionId', '==', sectionId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as any);
  },

  async saveAttendance(schoolId: string, classId: string, sectionId: string, date: string, records: any, teacherId: string): Promise<void> {
    const attData = {
      schoolId,
      classId,
      sectionId,
      date,
      records,
      markedBy: teacherId,
      updatedAt: new Date().toISOString()
    };
    const docId = `${schoolId}_${classId}_${sectionId}_${date}`;
    await setDoc(doc(db, 'attendance', docId), attData);
  },

  // --- HOMEWORK & STUDY MATERIALS ---
  async getHomeworks(schoolId: string, classId: string, sectionId: string): Promise<any[]> {
    const q = query(
      collection(db, 'homework'), 
      where('schoolId', '==', schoolId),
      where('classId', '==', classId),
      where('sectionId', '==', sectionId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createHomework(homeworkData: any): Promise<any> {
    const hw = { ...homeworkData, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'homework'), hw);
    return { id: docRef.id, ...hw };
  },

  async getStudyMaterials(schoolId: string, classId: string, sectionId: string): Promise<any[]> {
    const q = query(
      collection(db, 'study_materials'), 
      where('schoolId', '==', schoolId),
      where('classId', '==', classId),
      where('sectionId', '==', sectionId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createStudyMaterial(materialData: any): Promise<any> {
    const sm = { ...materialData, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'study_materials'), sm);
    return { id: docRef.id, ...sm };
  },

  // --- EXAMS & MARKS ---
  async getExams(schoolId: string, classId: string): Promise<any[]> {
    const q = query(
      collection(db, 'exams'),
      where('schoolId', '==', schoolId),
      where('classId', '==', classId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createExam(examData: any): Promise<any> {
    const docRef = await addDoc(collection(db, 'exams'), examData);
    return { id: docRef.id, ...examData };
  },

  async getMarks(schoolId: string, examId: string): Promise<any[]> {
    const q = query(
      collection(db, 'marks'),
      where('schoolId', '==', schoolId),
      where('examId', '==', examId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async saveMark(schoolId: string, examId: string, studentId: string, marksObtained: number, remarks: string, enteredBy: string): Promise<void> {
    const markData = {
      schoolId,
      examId,
      studentId,
      marksObtained,
      remarks,
      enteredBy,
      updatedAt: new Date().toISOString()
    };
    const docId = `${examId}_${studentId}`;
    await setDoc(doc(db, 'marks', docId), markData);
  },

  // --- FEES ---
  async getFees(schoolId: string, studentId?: string): Promise<any[]> {
    const q = studentId 
      ? query(collection(db, 'fees'), where('schoolId', '==', schoolId), where('studentId', '==', studentId))
      : query(collection(db, 'fees'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createFee(feeData: any): Promise<any> {
    const newFee = { ...feeData, status: 'unpaid' };
    const docRef = await addDoc(collection(db, 'fees'), newFee);
    return { id: docRef.id, ...newFee };
  },

  async recordPayment(feeId: string, paymentMethod: string): Promise<void> {
    const payment = {
      status: 'paid',
      paidAt: new Date().toISOString(),
      paymentMethod
    };
    await updateDoc(doc(db, 'fees', feeId), payment);
  },

  // --- NOTICES ---
  async getNotices(schoolId: string): Promise<any[]> {
    const q = query(
      collection(db, 'notices'), 
      where('schoolId', 'in', [schoolId, 'global'])
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createNotice(noticeData: any): Promise<any> {
    const notice = { ...noticeData, createdAt: new Date().toISOString() };
    const docRef = await addDoc(collection(db, 'notices'), notice);
    return { id: docRef.id, ...notice };
  },

  // --- LEAVE MANAGEMENT ---
  async getLeaves(schoolId: string): Promise<any[]> {
    const q = query(collection(db, 'leaves'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  },

  async createLeaveRequest(leaveData: any): Promise<any> {
    const leave = { 
      ...leaveData, 
      status: 'pending', 
      createdAt: new Date().toISOString() 
    };
    const docRef = await addDoc(collection(db, 'leaves'), leave);
    return { id: docRef.id, ...leave };
  },

  async resolveLeave(leaveId: string, status: 'approved' | 'rejected', resolvedBy: string): Promise<void> {
    const update = { status, resolvedBy };
    await updateDoc(doc(db, 'leaves', leaveId), update);
  },

  // --- MESSAGES ---
  async getMessages(schoolId: string, senderId: string, receiverId: string): Promise<any[]> {
    const q = query(collection(db, 'messages'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .filter((m: any) => 
        (m.senderId === senderId && m.receiverId === receiverId) ||
        (m.senderId === receiverId && m.receiverId === senderId)
      )
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async sendMessage(schoolId: string, senderId: string, receiverId: string, content: string): Promise<any> {
    const msg = {
      schoolId,
      senderId,
      receiverId,
      content,
      readStatus: false,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'messages'), msg);
    return { id: docRef.id, ...msg };
  },

  // --- CRUD DELETIONS ---
  async deleteClass(schoolId: string, classId: string): Promise<void> {
    await deleteDoc(doc(db, 'classes', classId));
  },

  async deleteSection(schoolId: string, sectionId: string): Promise<void> {
    await deleteDoc(doc(db, 'sections', sectionId));
  },

  async deleteSubject(schoolId: string, subjectId: string): Promise<void> {
    await deleteDoc(doc(db, 'subjects', subjectId));
  },

  async deleteHomework(schoolId: string, homeworkId: string): Promise<void> {
    await deleteDoc(doc(db, 'homework', homeworkId));
  },

  async deleteStudyMaterial(schoolId: string, materialId: string): Promise<void> {
    await deleteDoc(doc(db, 'study_materials', materialId));
  },

  async deleteExam(schoolId: string, examId: string): Promise<void> {
    await deleteDoc(doc(db, 'exams', examId));
  },

  async deleteNotice(schoolId: string, noticeId: string): Promise<void> {
    await deleteDoc(doc(db, 'notices', noticeId));
  },

  async deleteUser(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid));
  },

  // --- STORAGE FILE UPLOAD ---
  async uploadFile(schoolId: string, folder: string, file: File): Promise<string> {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../config/firebase');
    const fileId = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `schools/${schoolId}/${folder}/${fileId}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};
