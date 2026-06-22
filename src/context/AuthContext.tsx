import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { dbService } from '../services/dbService';

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
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isPlanExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkUserStatus = async (uid: string, email: string, name: string, photoUrl?: string) => {
    try {
      console.log("[AuthContext] checkUserStatus started for:", { uid, email, name });
      
      console.log("[AuthContext] Performing dbService.getUser for uid:", uid);
      let profile = await dbService.getUser(uid);
      console.log("[AuthContext] dbService.getUser result:", profile);
      
      // If profile is not found by UID, search by email (for pre-created users logging in for the first time)
      if (!profile) {
        console.log("[AuthContext] Profile not found by UID, searching by email:", email);
        const preCreatedUser = await dbService.getUserByEmail(email);
        console.log("[AuthContext] dbService.getUserByEmail result:", preCreatedUser);
        
        if (preCreatedUser) {
          const oldUid = preCreatedUser.uid;
          // Bind the Google UID to the pre-created user document in-place
          const updatedFields = {
            uid: uid,
            photoUrl: photoUrl || preCreatedUser.photoUrl || '',
            name: name || preCreatedUser.name
          };
          console.log("[AuthContext] Attempting to bind Google UID via updateUserByDocId:", {
            docId: preCreatedUser.docId,
            updatedFields
          });
          await dbService.updateUserByDocId(preCreatedUser.docId, updatedFields);
          console.log("[AuthContext] updateUserByDocId completed successfully");
          
          profile = {
            ...preCreatedUser,
            ...updatedFields
          };
          
          console.log("[AuthContext] Attempting to migrate user references from oldUid to newUid:", {
            oldUid,
            uid,
            role: profile.role,
            schoolId: profile.schoolId
          });
          await dbService.migrateUserReferences(oldUid, uid, profile.role, profile.schoolId);
          console.log("[AuthContext] migrateUserReferences completed successfully");
        }
      } else {
        console.log("[AuthContext] Profile found by UID. Attempting to sync user mapping:", {
          docId: profile.docId,
          profile
        });
        // Self-healing: Always sync mapping document on subsequent logins
        await dbService.syncUserMapping(profile.docId, profile);
        console.log("[AuthContext] syncUserMapping completed successfully");
      }

      if (!profile) {
        console.log("[AuthContext] Access Denied: No matching user found in database");
        throw new Error("Access Denied: Your email is not registered on Edu-Smart. Please contact your school administrator.");
      }

      if (!profile.isActive) {
        console.log("[AuthContext] Access Denied: User is inactive");
        throw new Error("Your account has been deactivated. Please contact the administrator.");
      }

      console.log("[AuthContext] Setting user state:", profile);
      setUser(profile as UserProfile);

      // If user belongs to a school, fetch the school tenant details
      if (profile.schoolId) {
        console.log("[AuthContext] Fetching school profile:", profile.schoolId);
        const schoolProfile = await dbService.getSchool(profile.schoolId);
        console.log("[AuthContext] getSchool result:", schoolProfile);
        
        if (schoolProfile) {
          if (!schoolProfile.isActive) {
            setUser(null);
            console.log("[AuthContext] Access Denied: School is inactive");
            throw new Error(`The school "${schoolProfile.name}" is currently disabled. Please contact the platform admin.`);
          }
          setSchool(schoolProfile as SchoolProfile);
        } else {
          setUser(null);
          console.log("[AuthContext] Access Denied: School profile not found");
          throw new Error("Access Denied: School profile details not found.");
        }
      } else {
        setSchool(null);
      }
      setError(null);
    } catch (err: any) {
      console.error("[AuthContext] Error in checkUserStatus:", err);
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

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setSchool(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to log out.");
    } finally {
      setLoading(false);
    }
  };

  // Check Firebase Session
  useEffect(() => {
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
  }, []);

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
      loginWithGoogle,
      logout,
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
