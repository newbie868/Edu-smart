import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { dbService, getDbMode, setDbMode } from '../services/dbService';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoUrl?: string;
  role: 'super_admin' | 'principal' | 'teacher' | 'parent' | 'student';
  schoolId: string | null;
  isActive: boolean;
  createdAt: string;
  teacherDetails?: any;
  studentDetails?: any;
  parentDetails?: any;
}

interface SchoolProfile {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
  planName: 'Basic' | 'Premium';
  planExpiry: string;
  principalId: string;
}

interface AuthContextType {
  user: UserProfile | null;
  school: SchoolProfile | null;
  loading: boolean;
  error: string | null;
  dbMode: 'firebase' | 'sandbox';
  loginWithGoogle: () => Promise<void>;
  loginSandbox: (uid: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleDbMode: (mode: 'firebase' | 'sandbox') => void;
  isPlanExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbMode, setDbModeState] = useState<'firebase' | 'sandbox'>(getDbMode());

  const checkUserStatus = async (uid: string, email: string, name: string, photoUrl?: string) => {
    try {
      let profile = await dbService.getUser(uid);
      
      // If profile is not found by UID, search by email (for pre-created users logging in for the first time)
      if (!profile) {
        const preCreatedUser = await dbService.getUserByEmail(email);
        if (preCreatedUser) {
          // Bind the Google UID to the pre-created user document
          profile = await dbService.createUser(uid, {
            ...preCreatedUser,
            photoUrl: photoUrl || preCreatedUser.photoUrl || '',
            name: name || preCreatedUser.name
          });
          // Clean up the temporary pre-created document to prevent duplicate entries
          if (preCreatedUser.uid && preCreatedUser.uid !== uid) {
            await dbService.deleteUser(preCreatedUser.uid);
          }
        }
      }

      // Auto-provision Super Admin if email matches admin@edusmart.com and no user exists
      if (!profile && (email === 'admin@edusmart.com' || email.startsWith('admin@'))) {
        profile = await dbService.createUser(uid, {
          email,
          name,
          photoUrl: photoUrl || '',
          role: 'super_admin',
          schoolId: null,
          isActive: true
        });
      }

      if (!profile) {
        throw new Error("Access Denied: Your email is not registered on Edu-Smart. Please contact your school administrator.");
      }

      if (!profile.isActive) {
        throw new Error("Your account has been deactivated. Please contact the administrator.");
      }

      setUser(profile as UserProfile);

      // If user belongs to a school, fetch the school tenant details
      if (profile.schoolId) {
        const schoolProfile = await dbService.getSchool(profile.schoolId);
        if (schoolProfile) {
          if (!schoolProfile.isActive) {
            setUser(null);
            throw new Error(`The school "${schoolProfile.name}" is currently disabled. Please contact the platform admin.`);
          }
          setSchool(schoolProfile as SchoolProfile);
        } else {
          setUser(null);
          throw new Error("Access Denied: School profile details not found.");
        }
      } else {
        setSchool(null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to process user profile.");
      setUser(null);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  // Google Login (Firebase Auth)
  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      setDbMode('firebase');
      setDbModeState('firebase');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await checkUserStatus(
          result.user.uid,
          result.user.email || '',
          result.user.displayName || 'Google User',
          result.user.photoURL || undefined
        );
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Google Sign-In failed.");
      setLoading(false);
    }
  };

  // Sandbox login helper (Instant login without popups)
  const loginSandbox = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      setDbMode('sandbox');
      setDbModeState('sandbox');
      const profile = await dbService.getUser(uid);
      if (!profile) {
        throw new Error("Sandbox user profile not found.");
      }
      if (!profile.isActive) {
        throw new Error("Sandbox user is deactivated.");
      }

      setUser(profile as UserProfile);

      if (profile.schoolId) {
        const schoolProfile = await dbService.getSchool(profile.schoolId);
        if (schoolProfile) {
          if (!schoolProfile.isActive) {
            setUser(null);
            throw new Error(`The school "${schoolProfile.name}" is currently disabled.`);
          }
          setSchool(schoolProfile as SchoolProfile);
        } else {
          setSchool(null);
        }
      } else {
        setSchool(null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Sandbox login failed.");
      setUser(null);
      setSchool(null);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      if (dbMode === 'firebase') {
        await signOut(auth);
      }
      setUser(null);
      setSchool(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to log out.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Database Mode
  const toggleDbMode = (mode: 'firebase' | 'sandbox') => {
    setDbMode(mode);
    setDbModeState(mode);
    logout();
  };

  // Check Firebase Session
  useEffect(() => {
    if (dbMode === 'firebase') {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          await checkUserStatus(
            fbUser.uid,
            fbUser.email || '',
            fbUser.displayName || 'Google User',
            fbUser.photoURL || undefined
          );
        } else {
          setUser(null);
          setSchool(null);
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } else {
      // Local check
      const savedUserUid = localStorage.getItem('edu_smart_sandbox_uid');
      if (savedUserUid) {
        loginSandbox(savedUserUid).catch(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }
  }, [dbMode]);

  // Keep sandbox UID in localStorage for session persistence
  useEffect(() => {
    if (dbMode === 'sandbox' && user) {
      localStorage.setItem('edu_smart_sandbox_uid', user.uid);
    } else if (!user) {
      localStorage.removeItem('edu_smart_sandbox_uid');
    }
  }, [user, dbMode]);

  const isPlanExpired = React.useMemo(() => {
    if (!school) return false;
    const expiry = new Date(school.planExpiry);
    return expiry.getTime() < Date.now();
  }, [school]);

  return (
    <AuthContext.Provider value={{
      user,
      school,
      loading,
      error,
      dbMode,
      loginWithGoogle,
      loginSandbox,
      logout,
      toggleDbMode,
      isPlanExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
