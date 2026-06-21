// Seed data for the Local Sandbox Mode

export const SEED_SCHOOLS = [
  {
    id: "school-springfield",
    name: "Springfield Academy",
    logoUrl: "https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=150&h=150&fit=crop&crop=faces",
    address: "742 Evergreen Terrace, Springfield",
    phone: "555-0199",
    isActive: true,
    planName: "Premium",
    planExpiry: "2027-06-30T23:59:59.000Z",
    principalId: "user-principal-skinner",
    createdAt: "2025-09-01T08:00:00.000Z"
  },
  {
    id: "school-shelbyville",
    name: "Shelbyville Elementary",
    logoUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&h=150&fit=crop&crop=faces",
    address: "101 Maple Road, Shelbyville",
    phone: "555-0144",
    isActive: true,
    planName: "Basic",
    planExpiry: "2026-09-15T23:59:59.000Z",
    principalId: "user-principal-shelby",
    createdAt: "2025-10-10T08:00:00.000Z"
  },
  {
    id: "school-expired",
    name: "Legacy Prep School",
    logoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&h=150&fit=crop&crop=faces",
    address: "200 Old Oak Lane",
    phone: "555-0100",
    isActive: true,
    planName: "Premium",
    planExpiry: "2026-01-01T00:00:00.000Z", // Expired
    principalId: "user-principal-expired",
    createdAt: "2024-01-01T08:00:00.000Z"
  }
];

export const SEED_USERS = [
  // Super Admin
  {
    uid: "user-superadmin",
    email: "admin@edusmart.com",
    name: "Elizabeth Vance",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
    role: "super_admin",
    schoolId: null,
    isActive: true,
    createdAt: "2025-01-01T00:00:00.000Z"
  },
  // Springfield Academy Principal
  {
    uid: "user-principal-skinner",
    email: "principal@springfield.edu",
    name: "Seymour Skinner",
    photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=faces",
    role: "principal",
    schoolId: "school-springfield",
    isActive: true,
    createdAt: "2025-09-01T08:00:00.000Z"
  },
  // Shelbyville Principal
  {
    uid: "user-principal-shelby",
    email: "principal@shelbyville.edu",
    name: "Shelby Miller",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
    role: "principal",
    schoolId: "school-shelbyville",
    isActive: true,
    createdAt: "2025-10-10T08:00:00.000Z"
  },
  // Springfield Teachers
  {
    uid: "user-teacher-krabappel",
    email: "krabappel@springfield.edu",
    name: "Edna Krabappel",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces",
    role: "teacher",
    schoolId: "school-springfield",
    isActive: true,
    createdAt: "2025-09-02T08:00:00.000Z",
    teacherDetails: {
      employeeId: "EMP-001",
      designation: "Homeroom Teacher & Lead Instructor",
      subjects: ["subj-math", "subj-english"]
    }
  },
  {
    uid: "user-teacher-hoover",
    email: "hoover@springfield.edu",
    name: "Elizabeth Hoover",
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=faces",
    role: "teacher",
    schoolId: "school-springfield",
    isActive: true,
    createdAt: "2025-09-02T08:00:00.000Z",
    teacherDetails: {
      employeeId: "EMP-002",
      designation: "Science & Arts Instructor",
      subjects: ["subj-science", "subj-history"]
    }
  },
  // Springfield Parents
  {
    uid: "user-parent-homer",
    email: "homer@simpsons.com",
    name: "Homer Simpson",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=faces",
    role: "parent",
    schoolId: "school-springfield",
    isActive: true,
    createdAt: "2025-09-03T08:00:00.000Z",
    parentDetails: {
      studentIds: ["user-student-bart", "user-student-lisa"],
      phone: "555-0103"
    }
  },
  // Springfield Students
  {
    uid: "user-student-bart",
    email: "bart@simpsons.com",
    name: "Bart Simpson",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=faces",
    role: "student",
    schoolId: "school-springfield",
    isActive: true,
    createdAt: "2025-09-03T08:30:00.000Z",
    studentDetails: {
      admissionNo: "ADM-99402",
      classId: "class-10",
      sectionId: "sect-10a",
      rollNo: "04",
      parentId: "user-parent-homer"
    }
  },
  {
    uid: "user-student-lisa",
    email: "lisa@simpsons.com",
    name: "Lisa Simpson",
    photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=faces",
    role: "student",
    schoolId: "school-springfield",
    isActive: true,
    createdAt: "2025-09-03T08:35:00.000Z",
    studentDetails: {
      admissionNo: "ADM-99403",
      classId: "class-9",
      sectionId: "sect-9b",
      rollNo: "01",
      parentId: "user-parent-homer"
    }
  }
];

export const SEED_CLASSES = [
  { id: "class-10", schoolId: "school-springfield", name: "Grade 10", createdAt: "2025-09-01T09:00:00.000Z" },
  { id: "class-9", schoolId: "school-springfield", name: "Grade 9", createdAt: "2025-09-01T09:05:00.000Z" }
];

export const SEED_SECTIONS = [
  { id: "sect-10a", schoolId: "school-springfield", classId: "class-10", name: "Section A", classTeacherId: "user-teacher-krabappel" },
  { id: "sect-9b", schoolId: "school-springfield", classId: "class-9", name: "Section B", classTeacherId: "user-teacher-hoover" }
];

export const SEED_SUBJECTS = [
  { id: "subj-math", schoolId: "school-springfield", name: "Mathematics", code: "MATH-10" },
  { id: "subj-english", schoolId: "school-springfield", name: "English Literature", code: "ENGL-10" },
  { id: "subj-science", schoolId: "school-springfield", name: "General Science", code: "SCI-09" },
  { id: "subj-history", schoolId: "school-springfield", name: "World History", code: "HIST-09" }
];

export const SEED_TIMETABLE = [
  {
    id: "tt-1",
    schoolId: "school-springfield",
    classId: "class-10",
    sectionId: "sect-10a",
    day: "Monday",
    slots: [
      { time: "09:00 - 10:00", subjectId: "subj-math", teacherId: "user-teacher-krabappel" },
      { time: "10:15 - 11:15", subjectId: "subj-english", teacherId: "user-teacher-krabappel" },
      { time: "11:30 - 12:30", subjectId: "subj-science", teacherId: "user-teacher-hoover" }
    ]
  },
  {
    id: "tt-2",
    schoolId: "school-springfield",
    classId: "class-9",
    sectionId: "sect-9b",
    day: "Monday",
    slots: [
      { time: "09:00 - 10:00", subjectId: "subj-science", teacherId: "user-teacher-hoover" },
      { time: "10:15 - 11:15", subjectId: "subj-history", teacherId: "user-teacher-hoover" },
      { time: "11:30 - 12:30", subjectId: "subj-math", teacherId: "user-teacher-krabappel" }
    ]
  }
];

export const SEED_ATTENDANCE = [
  {
    id: "att-1",
    schoolId: "school-springfield",
    classId: "class-10",
    sectionId: "sect-10a",
    date: new Date().toISOString().split('T')[0], // Today
    records: {
      "user-student-bart": "present"
    },
    markedBy: "user-teacher-krabappel",
    updatedAt: new Date().toISOString()
  },
  {
    id: "att-2",
    schoolId: "school-springfield",
    classId: "class-9",
    sectionId: "sect-9b",
    date: new Date().toISOString().split('T')[0],
    records: {
      "user-student-lisa": "present"
    },
    markedBy: "user-teacher-hoover",
    updatedAt: new Date().toISOString()
  }
];

export const SEED_HOMEWORK = [
  {
    id: "hw-1",
    schoolId: "school-springfield",
    classId: "class-10",
    sectionId: "sect-10a",
    subjectId: "subj-math",
    title: "Quadratic Equations Practice",
    description: "Solve problems 1 to 15 on page 42 of the textbook. Show all workings clearly.",
    dueDate: new Date(Date.now() + 24 * 3600000 * 2).toISOString().split('T')[0], // 2 days from now
    teacherId: "user-teacher-krabappel",
    createdAt: new Date().toISOString()
  },
  {
    id: "hw-2",
    schoolId: "school-springfield",
    classId: "class-9",
    sectionId: "sect-9b",
    subjectId: "subj-science",
    title: "Photosynthesis Diagram",
    description: "Draw and label a detailed diagram explaining the light-dependent reactions.",
    dueDate: new Date(Date.now() + 24 * 3600000).toISOString().split('T')[0], // tomorrow
    teacherId: "user-teacher-hoover",
    createdAt: new Date().toISOString()
  }
];

export const SEED_STUDY_MATERIALS = [
  {
    id: "sm-1",
    schoolId: "school-springfield",
    classId: "class-10",
    sectionId: "sect-10a",
    subjectId: "subj-english",
    title: "Shakespearean Tragedy Themes Study Guide",
    description: "A summary document outlining major character archetypes and motifs in Hamlet.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    teacherId: "user-teacher-krabappel",
    createdAt: new Date().toISOString()
  }
];

export const SEED_EXAMS = [
  {
    id: "exam-midterm-math",
    schoolId: "school-springfield",
    name: "Mid-Term Mathematics",
    classId: "class-10",
    subjectId: "subj-math",
    date: new Date().toISOString().split('T')[0],
    maxMarks: 100
  },
  {
    id: "exam-midterm-science",
    schoolId: "school-springfield",
    name: "Mid-Term General Science",
    classId: "class-9",
    subjectId: "subj-science",
    date: new Date().toISOString().split('T')[0],
    maxMarks: 100
  }
];

export const SEED_MARKS = [
  {
    id: "marks-1",
    schoolId: "school-springfield",
    examId: "exam-midterm-math",
    studentId: "user-student-bart",
    marksObtained: 55,
    remarks: "Needs major improvement in algebraic formulas.",
    enteredBy: "user-teacher-krabappel",
    updatedAt: new Date().toISOString()
  },
  {
    id: "marks-2",
    schoolId: "school-springfield",
    examId: "exam-midterm-science",
    studentId: "user-student-lisa",
    marksObtained: 99,
    remarks: "Exceptional depth of knowledge and analytical skills.",
    enteredBy: "user-teacher-hoover",
    updatedAt: new Date().toISOString()
  }
];

export const SEED_FEES = [
  {
    id: "fee-1",
    schoolId: "school-springfield",
    studentId: "user-student-bart",
    title: "Autumn Term Tuition Fee",
    amount: 1200,
    dueDate: new Date(Date.now() - 24 * 3600000 * 5).toISOString().split('T')[0], // Overdue
    status: "unpaid"
  },
  {
    id: "fee-2",
    schoolId: "school-springfield",
    studentId: "user-student-lisa",
    title: "Autumn Term Tuition Fee",
    amount: 1200,
    dueDate: new Date(Date.now() - 24 * 3600000 * 5).toISOString().split('T')[0],
    status: "paid",
    paidAt: new Date(Date.now() - 24 * 3600000 * 10).toISOString(),
    paymentMethod: "Credit Card"
  }
];

export const SEED_NOTICES = [
  {
    id: "notice-global-1",
    schoolId: "global",
    title: "Edu-Smart Platform System Upgrade Scheduled",
    content: "Edu-Smart will undergo a scheduled maintenance on Saturday, 28th June from 01:00 AM to 04:00 AM UTC. Expect brief service outages during this window.",
    targetAudience: "all",
    createdBy: "user-superadmin",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString() // yesterday
  },
  {
    id: "notice-school-1",
    schoolId: "school-springfield",
    title: "Annual Sports Day Registration",
    content: "Registrations for the Annual Springfield Track & Field Meet are now open. Please sign up via the physical forms in the gym or coordinate with your homeroom teachers.",
    targetAudience: "all",
    createdBy: "user-principal-skinner",
    createdAt: new Date().toISOString()
  }
];

export const SEED_LEAVES = [
  {
    id: "leave-1",
    schoolId: "school-springfield",
    userId: "user-teacher-krabappel",
    role: "teacher",
    reason: "Dental procedure appointment",
    startDate: new Date(Date.now() + 24 * 3600000 * 3).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 3600000 * 3).toISOString().split('T')[0],
    status: "pending",
    createdAt: new Date().toISOString()
  }
];

export const SEED_MESSAGES = [
  {
    id: "msg-1",
    schoolId: "school-springfield",
    senderId: "user-teacher-krabappel",
    receiverId: "user-parent-homer",
    content: "Hi Homer, just writing to let you know that Bart has forgotten his homework for the third consecutive day this week.",
    createdAt: new Date(Date.now() - 24 * 3600000 * 2).toISOString(),
    readStatus: true
  },
  {
    id: "msg-2",
    schoolId: "school-springfield",
    senderId: "user-parent-homer",
    receiverId: "user-teacher-krabappel",
    content: "D'oh! I will talk to him tonight. Thanks for the heads up, Edna.",
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    readStatus: true
  }
];
