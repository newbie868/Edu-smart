import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, addDoc, deleteDoc, writeBatch
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

  async createSchoolWithPrincipal(schoolData: any, principalData: any): Promise<{ school: any, principal: any }> {
    console.log("[dbService] createSchoolWithPrincipal called. schoolData:", schoolData, "principalData:", principalData);
    try {
      const batch = writeBatch(db);
      
      const schoolRef = doc(collection(db, 'schools'));
      const schoolId = schoolRef.id;
      const schoolDoc = { 
        ...schoolData, 
        id: schoolId, 
        createdAt: new Date().toISOString() 
      };
      
      const userRef = doc(collection(db, 'users'));
      const userDocId = userRef.id;
      const principalDoc = {
        uid: principalData.uid,
        isActive: true,
        createdAt: new Date().toISOString(),
        ...principalData,
        schoolId: schoolId,
        email: principalData.email.toLowerCase()
      };
      
      schoolDoc.principalId = principalData.uid;
      
      console.log("[dbService] Staging school write in batch:", { path: "schools/" + schoolId, data: schoolDoc });
      batch.set(schoolRef, schoolDoc);
      
      console.log("[dbService] Staging principal user write in batch:", { path: "users/" + userDocId, data: principalDoc });
      batch.set(userRef, principalDoc);
      
      console.log("[dbService] Committing batch write...");
      await batch.commit();
      console.log("[dbService] Batch write committed successfully!");
      
      return { 
        school: schoolDoc, 
        principal: { docId: userDocId, ...principalDoc } 
      };
    } catch (err) {
      console.error("[dbService] Error committing createSchoolWithPrincipal batch:", err);
      throw err;
    }
  },

  async updateSchool(schoolId: string, data: any): Promise<any> {
    console.log("[dbService] updateSchool called for schoolId:", schoolId, "data:", data);
    try {
      await updateDoc(doc(db, 'schools', schoolId), data);
      console.log("[dbService] updateSchool completed successfully");
      return { id: schoolId, ...data };
    } catch (err) {
      console.error("[dbService] Error in updateSchool:", err);
      throw err;
    }
  },

  // --- USERS ---
  async getUser(uid: string): Promise<any> {
    console.log("[dbService] getUser called with uid:", uid);
    try {
      const q = query(collection(db, 'users'), where('uid', '==', uid));
      const snap = await getDocs(q);
      console.log("[dbService] getUser query completed. Empty result:", snap.empty);
      if (!snap.empty) {
        console.log("[dbService] getUser found document:", { docId: snap.docs[0].id, data: snap.docs[0].data() });
        return { docId: snap.docs[0].id, ...snap.docs[0].data() as any };
      }
      return null;
    } catch (err) {
      console.error("[dbService] Error in getUser:", err);
      throw err;
    }
  },

  async getUserByEmail(email: string): Promise<any> {
    console.log("[dbService] getUserByEmail called with email:", email);
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
      const snap = await getDocs(q);
      console.log("[dbService] getUserByEmail query completed. Empty result:", snap.empty);
      if (!snap.empty) {
        console.log("[dbService] getUserByEmail found document:", { docId: snap.docs[0].id, data: snap.docs[0].data() });
        return { docId: snap.docs[0].id, ...snap.docs[0].data() as any };
      }
      return null;
    } catch (err) {
      console.error("[dbService] Error in getUserByEmail:", err);
      throw err;
    }
  },

  async createUser(uid: string, userData: any): Promise<any> {
    console.log("[dbService] createUser called with uid:", uid, "userData:", userData);
    try {
      const newUser = {
        uid,
        isActive: true,
        createdAt: new Date().toISOString(),
        ...userData,
        email: userData.email.toLowerCase()
      };
      // Let Firestore auto-generate the document ID
      const docRef = await addDoc(collection(db, 'users'), newUser);
      console.log("[dbService] createUser added document. docId:", docRef.id, "newUser:", newUser);
      return { docId: docRef.id, ...newUser };
    } catch (err) {
      console.error("[dbService] Error in createUser:", err);
      throw err;
    }
  },

  async syncUserMapping(docId: string, profile: any): Promise<void> {
    const uid = profile.uid;
    console.log("[dbService] syncUserMapping called. docId:", docId, "profile:", profile);
    if (uid && !uid.startsWith('user-')) {
      const syncFields = {
        docId,
        role: profile.role,
        schoolId: profile.schoolId || null,
        isActive: profile.isActive
      };
      try {
        console.log("[dbService] syncUserMapping: Attempting to set mapping at user_mappings/" + uid, syncFields);
        await setDoc(doc(db, 'user_mappings', uid), syncFields, { merge: true });
        console.log("[dbService] syncUserMapping: Successfully wrote user_mappings/" + uid);
      } catch (err) {
        console.error("[dbService] syncUserMapping failed for user_mappings/" + uid + ":", err);
        throw err;
      }
    } else {
      console.log("[dbService] syncUserMapping skipped. Missing or temporary UID:", uid);
    }
  },

  async updateUser(uid: string, data: any): Promise<any> {
    console.log("[dbService] updateUser called with uid:", uid, "data:", data);
    try {
      const q = query(collection(db, 'users'), where('uid', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docId = snap.docs[0].id;
        const userDoc = snap.docs[0].data();
        console.log("[dbService] updateUser found doc. docId:", docId, "Original data:", userDoc);
        
        console.log("[dbService] updateUser: Updating users/" + docId, data);
        await updateDoc(doc(db, 'users', docId), data);
        console.log("[dbService] updateUser: Successfully updated users/" + docId);
        
        const mergedUser = { ...userDoc, ...data };
        await dbService.syncUserMapping(docId, mergedUser);
        return { docId, uid, ...data };
      }
      console.error("[dbService] updateUser: User not found with uid:", uid);
      throw new Error("User not found");
    } catch (err) {
      console.error("[dbService] Error in updateUser:", err);
      throw err;
    }
  },

  async updateUserByDocId(docId: string, data: any): Promise<any> {
    console.log("[dbService] updateUserByDocId called with docId:", docId, "data:", data);
    try {
      const snap = await getDoc(doc(db, 'users', docId));
      if (snap.exists()) {
        const userDoc = snap.data();
        console.log("[dbService] updateUserByDocId found doc. Original data:", userDoc);
        
        console.log("[dbService] updateUserByDocId: Updating users/" + docId, data);
        await updateDoc(doc(db, 'users', docId), data);
        console.log("[dbService] updateUserByDocId: Successfully updated users/" + docId);
        
        const mergedUser = { ...userDoc, ...data };
        await dbService.syncUserMapping(docId, mergedUser);
        return { docId, ...mergedUser };
      }
      console.error("[dbService] updateUserByDocId: User not found with docId:", docId);
      throw new Error("User not found");
    } catch (err) {
      console.error("[dbService] Error in updateUserByDocId:", err);
      throw err;
    }
  },

  async getUsers(schoolId: string | null): Promise<any[]> {
    const q = schoolId 
      ? query(collection(db, 'users'), where('schoolId', '==', schoolId))
      : query(collection(db, 'users'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ docId: d.id, ...d.data() as any }));
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

  async migrateUserReferences(oldUid: string, newUid: string, role: string, schoolId: string | null): Promise<void> {
    if (oldUid === newUid) return;

    // 1. School (principal link)
    if (role === 'principal' && schoolId) {
      await updateDoc(doc(db, 'schools', schoolId), { principalId: newUid });
    }

    // 2. Sections (class teacher link)
    if (role === 'teacher' && schoolId) {
      const sectionsQuery = query(collection(db, 'sections'), where('classTeacherId', '==', oldUid));
      const sectionsSnap = await getDocs(sectionsQuery);
      for (const sectionDoc of sectionsSnap.docs) {
        await updateDoc(doc(db, 'sections', sectionDoc.id), { classTeacherId: newUid });
      }
    }

    // 3. Timetable slots (teacher link)
    if (role === 'teacher' && schoolId) {
      const timetableQuery = query(collection(db, 'timetable'), where('schoolId', '==', schoolId));
      const timetableSnap = await getDocs(timetableQuery);
      for (const ttDoc of timetableSnap.docs) {
        const data = ttDoc.data();
        if (data.slots) {
          let changed = false;
          const updatedSlots = data.slots.map((slot: any) => {
            if (slot.teacherId === oldUid) {
              changed = true;
              return { ...slot, teacherId: newUid };
            }
            return slot;
          });
          if (changed) {
            await updateDoc(doc(db, 'timetable', ttDoc.id), { slots: updatedSlots });
          }
        }
      }
    }

    // 4. Parents (referencing a student)
    if (role === 'student' && schoolId) {
      const parentsQuery = query(
        collection(db, 'users'), 
        where('schoolId', '==', schoolId),
        where('role', '==', 'parent'),
        where('parentDetails.studentIds', 'array-contains', oldUid)
      );
      const parentsSnap = await getDocs(parentsQuery);
      for (const parentDoc of parentsSnap.docs) {
        const parentData = parentDoc.data();
        if (parentData.parentDetails && parentData.parentDetails.studentIds) {
          const updatedStudentIds = parentData.parentDetails.studentIds.map(
            (sId: string) => sId === oldUid ? newUid : sId
          );
          await updateDoc(doc(db, 'users', parentDoc.id), {
            parentDetails: {
              ...parentData.parentDetails,
              studentIds: updatedStudentIds
            }
          });
        }
      }
    }

    // 5. Students (referencing a parent)
    if (role === 'parent' && schoolId) {
      const studentsQuery = query(
        collection(db, 'users'),
        where('schoolId', '==', schoolId),
        where('role', '==', 'student'),
        where('studentDetails.parentId', '==', oldUid)
      );
      const studentsSnap = await getDocs(studentsQuery);
      for (const studentDoc of studentsSnap.docs) {
        const studentData = studentDoc.data();
        if (studentData.studentDetails) {
          await updateDoc(doc(db, 'users', studentDoc.id), {
            studentDetails: {
              ...studentData.studentDetails,
              parentId: newUid
            }
          });
        }
      }
    }

    // 6. Marks (referencing a student)
    if (role === 'student' && schoolId) {
      const marksQuery = query(collection(db, 'marks'), where('schoolId', '==', schoolId), where('studentId', '==', oldUid));
      const marksSnap = await getDocs(marksQuery);
      for (const markDoc of marksSnap.docs) {
        const markData = markDoc.data();
        const newMarkDocId = `${markData.examId}_${newUid}`;
        await setDoc(doc(db, 'marks', newMarkDocId), { ...markData, studentId: newUid });
        await deleteDoc(doc(db, 'marks', markDoc.id));
      }
    }

    // 7. Fees (referencing a student)
    if (role === 'student' && schoolId) {
      const feesQuery = query(collection(db, 'fees'), where('schoolId', '==', schoolId), where('studentId', '==', oldUid));
      const feesSnap = await getDocs(feesQuery);
      for (const feeDoc of feesSnap.docs) {
        await updateDoc(doc(db, 'fees', feeDoc.id), { studentId: newUid });
      }
    }

    // 8. Attendance records (referencing a student in records map)
    if (role === 'student' && schoolId) {
      const attendanceQuery = query(collection(db, 'attendance'), where('schoolId', '==', schoolId));
      const attendanceSnap = await getDocs(attendanceQuery);
      for (const attDoc of attendanceSnap.docs) {
        const attData = attDoc.data();
        if (attData.records && attData.records[oldUid]) {
          const updatedRecords = { ...attData.records };
          updatedRecords[newUid] = updatedRecords[oldUid];
          delete updatedRecords[oldUid];
          await updateDoc(doc(db, 'attendance', attDoc.id), { records: updatedRecords });
        }
      }
    }
  },

  async deleteUser(uid: string): Promise<void> {
    const q = query(collection(db, 'users'), where('uid', '==', uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docId = snap.docs[0].id;
      await deleteDoc(doc(db, 'users', docId));
      
      // Also delete the user mapping if it exists
      try {
        await deleteDoc(doc(db, 'user_mappings', uid));
      } catch (err) {
        console.warn("Could not delete user mapping:", err);
      }
    }
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
