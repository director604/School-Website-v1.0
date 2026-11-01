import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer, 
  setDoc, 
  collection, 
  getDocs,
  query,
  where,
  limit,
  updateDoc,
  deleteDoc,
  increment
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  SchoolInfo, 
  StaffMember, 
  BoardMember, 
  NewsPost, 
  GalleryAlbum, 
  UserProfile,
  UserRole,
  UserStatus,
  SiteStats,
  DriveSettings
} from './types';
import { 
  initialSchoolInfo, 
  initialStaff, 
  initialBoardMembers, 
  initialNews, 
  initialGallery,
  initialDriveSettings,
  initialVideos,
  initialPublicDocuments
} from './data/initialData';

// 1. Initialize Firebase App & Services
// Supports both Vite environment variables (import.meta.env) for Cloudflare/GitHub and fallback to config JSON
const env = import.meta.env;

export const firebaseConfigOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || (firebaseConfig as any)?.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseConfig as any)?.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || (firebaseConfig as any)?.projectId || 'gen-lang-client-0278533342',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseConfig as any)?.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseConfig as any)?.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || (firebaseConfig as any)?.appId || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || (firebaseConfig as any)?.measurementId || ''
};

// Firestore Database ID (authoritative from firebase-applet-config.json)
export const firestoreDatabaseId: string =
  (firebaseConfig as any)?.firestoreDatabaseId ||
  'ai-studio-bannareeschoolv2-815a30b2-8e41-4fc7-940b-ce136fae275e';

export const app = initializeApp(firebaseConfigOptions);
export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);

// 2. Google Auth Provider for Clean Authentication
// Workspace Google Drive scopes
export const driveScopes = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.scripts'
];

export const authProvider = new GoogleAuthProvider();
// Add Drive scopes so standard login directly includes Drive access
driveScopes.forEach(scope => {
  authProvider.addScope(scope);
});
authProvider.setCustomParameters({
  prompt: 'consent select_account'
});
export const googleAuthProvider = authProvider; // standard alias

// Workspace provider when accessing Google Drive explicitly
export const workspaceProvider = new GoogleAuthProvider();
driveScopes.forEach(scope => {
  workspaceProvider.addScope(scope);
});
workspaceProvider.setCustomParameters({
  prompt: 'consent select_account'
});

// In-memory access token cache (Workspace guideline: never store in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// 3. Error Handling conforming strictly to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 4. Test Firestore Connection on Boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}
testConnection();

// 5. Auth Helper Functions
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null, role: UserRole) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const role = await syncUserProfile(user);
        if (onAuthSuccess) {
          onAuthSuccess(user, cachedAccessToken, role);
        }
      } catch (err) {
        console.error('Error syncing profile:', err);
        if (onAuthSuccess) {
          onAuthSuccess(user, cachedAccessToken, 'teacher');
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; role: UserRole } | null> => {
  try {
    isSigningIn = true;
    // Use authProvider for standard sign-in to prevent OAuth 403 access_denied in test mode
    const result = await signInWithPopup(auth, authProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      try {
        sessionStorage.setItem('bnr_drive_token', credential.accessToken);
      } catch (e) {}
    }

    const role = await syncUserProfile(result.user);
    return {
      user: result.user,
      accessToken: cachedAccessToken || '',
      role
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const clearAccessToken = () => {
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem('bnr_drive_token');
  } catch (e) {}
};

export const connectGoogleDrive = async (): Promise<string | null> => {
  try {
    clearAccessToken();
    const result = await signInWithPopup(auth, workspaceProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      try {
        sessionStorage.setItem('bnr_drive_token', credential.accessToken);
      } catch (e) {}
      return cachedAccessToken;
    }
    return null;
  } catch (err: any) {
    console.error('Google Drive connection error:', err);
    throw new Error('ไม่สามารถเชื่อมต่อสิทธิ์ Google Drive ได้: ' + (err.message || 'กรุณาลองใหม่อีกครั้ง'));
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const storedToken = sessionStorage.getItem('bnr_drive_token');
    if (storedToken) {
      cachedAccessToken = storedToken;
      return cachedAccessToken;
    }
  } catch (e) {}
  return null;
};

export const logout = async () => {
  await signOut(auth);
  clearAccessToken();
};

// 6. User Profile & Admin Role Sync
export async function syncUserProfile(user: User): Promise<UserRole> {
  const emailLower = (user.email || '').toLowerCase().trim();
  if (!emailLower) {
    await signOut(auth);
    throw new Error('ไม่พบข้อมูลอีเมลสำหรับบัญชีนี้');
  }

  // ตรวจสอบกับ system_settings/roles หรือค่าเริ่มต้น
  let configuredSuperAdmin = 'engine@bnr.ac.th';
  let configuredAdmins: string[] = [];

  try {
    const rolesSnap = await getDoc(doc(db, 'system_settings', 'roles'));
    if (rolesSnap.exists()) {
      const rolesData = rolesSnap.data() as any;
      if (rolesData.superAdminEmail) configuredSuperAdmin = rolesData.superAdminEmail.toLowerCase().trim();
      if (Array.isArray(rolesData.adminEmails)) {
        configuredAdmins = rolesData.adminEmails.map((e: string) => (e || '').toLowerCase().trim());
      }
    }
  } catch (err) {
    console.warn('Could not read roles config:', err);
  }

  const isSuperAdminEmail = emailLower === configuredSuperAdmin || 
                            emailLower === 'director@bnr.ac.th' ||
                            emailLower === 'engine@bnr.ac.th' ||
                            emailLower === 'sirasit@bnr.ac.th' ||
                            emailLower === 'sirasit.p@gmail.com';

  const isConfiguredAdmin = configuredAdmins.includes(emailLower);
  const emailKey = emailLower.replace(/[^a-z0-9]/g, '_');
  const userDocRef = doc(db, 'users', emailKey);
  const adminDocRef = doc(db, 'admins', user.uid);

  try {
    // 1. Check if user document exists in 'users' collection by emailKey or UID
    let userDoc = await getDoc(userDocRef);
    let userProfileData: UserProfile | null = null;
    let isRegisteredInUsers = false;

    if (userDoc.exists()) {
      userProfileData = userDoc.data() as UserProfile;
      isRegisteredInUsers = true;
    } else {
      // 2. Check by query email
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', emailLower));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const matchedDoc = qSnap.docs[0];
          isRegisteredInUsers = true;
          userProfileData = matchedDoc.data() as UserProfile;
        } else {
          const sampleSnap = await getDocs(query(usersRef, limit(1)));
          if (sampleSnap.empty) {
            isRegisteredInUsers = true;
          }
        }
      } catch (e) {
        console.warn('Error checking users collection for existing email:', e);
      }
    }

    // 3. ENFORCE ACCESS CONTROL: Block unregistered emails (allow any @bnr.ac.th school email automatically)
    const isBnrDomain = emailLower.endsWith('@bnr.ac.th');
    const isAllowedEmail = isSuperAdminEmail || isConfiguredAdmin || isRegisteredInUsers || isBnrDomain;

    if (!isAllowedEmail) {
      await signOut(auth);
      throw new Error(`อีเมล "${user.email}" ยังไม่อยู่ในระบบโรงเรียนบ้านนารี กรุณาติดต่อผู้ดูแลระบบเพื่อเพิ่มชื่อเข้าสู่ระบบก่อนลงชื่อเข้าใช้งาน`);
    }

    // 4. ENFORCE ACCESS CONTROL: Block suspended accounts
    if (userProfileData && userProfileData.status === 'suspended' && !isSuperAdminEmail) {
      await signOut(auth);
      throw new Error(`บัญชีผู้ใช้งาน "${user.email}" ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบโรงเรียน`);
    }

    // Determine role
    let role: UserRole = isSuperAdminEmail ? 'superadmin' : (isConfiguredAdmin ? 'admin' : 'editor');

    if (userProfileData) {
      const storedRole = userProfileData.role as string;
      if (isSuperAdminEmail) {
        role = 'superadmin';
      } else if (isConfiguredAdmin) {
        role = 'admin';
      } else if (storedRole === 'admin' || storedRole === 'superadmin') {
        role = 'admin';
      } else if (storedRole === 'teacher' || storedRole === 'editor') {
        role = 'editor';
      } else {
        role = (userProfileData.role as UserRole) || 'editor';
      }
    }

    // Save/Update user profile
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || userProfileData?.displayName || (isSuperAdminEmail ? 'ผู้อำนวยการโรงเรียน (Super Admin)' : 'บุคลากรโรงเรียนบ้านนารี'),
      photoURL: user.photoURL || userProfileData?.photoURL || '',
      role: role,
      department: userProfileData?.department || (isSuperAdminEmail ? 'กลุ่มงานบริหารและอำนวยการ' : 'กลุ่มสาระการเรียนรู้'),
      status: 'active',
      createdAt: userProfileData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userDocRef, newProfile, { merge: true });

    if (role === 'superadmin' || role === 'admin' || isSuperAdminEmail) {
      const adminSnap = await getDoc(adminDocRef);
      if (!adminSnap.exists()) {
        await setDoc(adminDocRef, {
          uid: user.uid,
          email: user.email,
          grantedBy: isSuperAdminEmail ? 'system_director' : 'super_admin',
          createdAt: new Date().toISOString()
        });
      }
    }

    return role;
  } catch (error: any) {
    if (error.message && error.message.includes('ยังไม่อยู่ในระบบ')) {
      throw error;
    }
    if (error.message && error.message.includes('ถูกระงับการใช้งาน')) {
      throw error;
    }
    console.warn('Could not sync user profile to remote Firestore:', error);
    return isSuperAdminEmail ? 'superadmin' : 'editor';
  }
}

// User Management Services (for Admin Dashboard)
export async function fetchUsersList(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      list.push({
        ...data,
        uid: docSnap.id,
        role: (data.role as string) === 'teacher' ? 'editor' : (data.role || 'editor')
      });
    });
    return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'users');
  }
}

export async function updateUserRole(targetUid: string, newRole: UserRole, targetEmail?: string): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  const adminRef = doc(db, 'admins', targetUid);

  try {
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });

    if (newRole === 'admin') {
      await setDoc(adminRef, {
        uid: targetUid,
        email: targetEmail || '',
        grantedBy: auth.currentUser?.email || 'admin',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } else {
      await deleteDoc(adminRef).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
  }
}

export async function updateUserStatus(targetUid: string, newStatus: UserStatus): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  try {
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUid}`);
  }
}

export async function addUserProfile(profile: Partial<UserProfile>): Promise<void> {
  const emailLower = (profile.email || '').trim().toLowerCase();
  const emailKey = emailLower ? emailLower.replace(/[^a-z0-9]/g, '_') : `user-${Date.now()}`;
  const uid = profile.uid || emailKey;
  const userRef = doc(db, 'users', uid);
  const adminRef = doc(db, 'admins', uid);

  const newProfile: UserProfile = {
    uid: uid,
    email: emailLower,
    displayName: profile.displayName || 'ผู้ใช้งานระบบ',
    photoURL: profile.photoURL || '',
    role: profile.role || 'editor',
    department: profile.department || 'กลุ่มสาระการเรียนรู้',
    status: profile.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, newProfile, { merge: true });

    if (newProfile.role === 'admin') {
      await setDoc(adminRef, {
        uid: uid,
        email: newProfile.email,
        grantedBy: auth.currentUser?.email || 'admin',
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

export async function updateUserProfile(uid: string, updatedData: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const adminRef = doc(db, 'admins', uid);

  try {
    const payload = {
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(userRef, payload);

    if (updatedData.role) {
      if (updatedData.role === 'admin') {
        await setDoc(adminRef, {
          uid: uid,
          email: updatedData.email || '',
          grantedBy: auth.currentUser?.email || 'admin',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } else {
        await deleteDoc(adminRef).catch(() => {});
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const adminRef = doc(db, 'admins', uid);

  try {
    await deleteDoc(userRef);
    await deleteDoc(adminRef).catch(() => {});
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}`);
  }
}

// 7. Database Seeding & Data Management Services
export async function seedInitialSchoolDataIfNeeded(currentUser?: User | null) {
  // Optimization: Skip checking if we already did it in this browser environment
  try {
    if (localStorage.getItem('bnr_seeding_checked')) {
      return;
    }
  } catch (e) {}

  try {
    const schoolInfoRef = doc(db, 'school_info', 'main');
    const snap = await getDoc(schoolInfoRef);
    if (!snap.exists()) {
      console.log('Seeding initial school info...');
      await setDoc(schoolInfoRef, initialSchoolInfo);

      // Seed Staff
      for (const staff of initialStaff) {
        await setDoc(doc(db, 'staff', staff.id), staff);
      }

      // Seed Board Members
      for (const member of initialBoardMembers) {
        await setDoc(doc(db, 'board_members', member.id), member);
      }

      // Seed News
      for (const news of initialNews) {
        await setDoc(doc(db, 'news', news.id), {
          ...news,
          authorId: currentUser?.uid || 'system'
        });
      }

      // Seed Gallery
      for (const album of initialGallery) {
        await setDoc(doc(db, 'gallery', album.id), {
          ...album,
          authorId: currentUser?.uid || 'system'
        });
      }

      // Seed Video Gallery
      for (const video of initialVideos) {
        await setDoc(doc(db, 'video_gallery', video.id), {
          ...video,
          authorId: currentUser?.uid || 'system'
        });
      }

      // Seed Public Documents
      for (const pDoc of initialPublicDocuments) {
        await setDoc(doc(db, 'public_documents', pDoc.id), {
          ...pDoc,
          authorId: currentUser?.uid || 'system'
        });
      }

      // Seed Drive Settings
      await setDoc(doc(db, 'school_settings', 'main'), initialDriveSettings);

      console.log('Initial data seeded successfully.');
    } else {
      // Check if public_documents need seeding in existing database
      try {
        const pDocSnap = await getDocs(collection(db, 'public_documents'));
        if (pDocSnap.empty) {
          console.log('Seeding initial public documents into existing database...');
          for (const pDoc of initialPublicDocuments) {
            await setDoc(doc(db, 'public_documents', pDoc.id), {
              ...pDoc,
              authorId: currentUser?.uid || 'system'
            });
          }
        }
      } catch (e) {
        console.warn('Check public_documents collection note:', e);
      }

      // Check if drive settings exist specifically
      const driveSettingsRef = doc(db, 'school_settings', 'main');
      const driveSnap = await getDoc(driveSettingsRef);
      if (!driveSnap.exists()) {
        await setDoc(driveSettingsRef, initialDriveSettings);
      } else {
        const data = driveSnap.data() as DriveSettings;
        if (data.centralFolderId === '1aB2cD3eFgHiJkLmNoPqRsTuVwXyZ') {
          await updateDoc(driveSettingsRef, {
            centralFolderId: '',
            centralFolderUrl: ''
          }).catch(() => {});
        }
      }
    }
    
    // Mark as checked
    try {
      localStorage.setItem('bnr_seeding_checked', '1');
    } catch {}
    
  } catch (err) {
    console.warn('Seeding check note:', err);
  }
}

// 8. Website Page Hit Counter Tracking & Reset Service
export async function recordPageHit(): Promise<void> {
  const sessionKey = 'bnr_site_visited';
  const todayStr = new Date().toISOString().split('T')[0];
  
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (window.sessionStorage.getItem(sessionKey)) {
        return;
      }
    }
  } catch (e) {
    // sessionStorage might be restricted
  }

  const statRef = doc(db, 'site_stats', 'counter');

  try {
    // Mark session immediately to prevent concurrent calls
    try {
      window.sessionStorage?.setItem(sessionKey, '1');
    } catch {}

    // We still need to update the counter, but we can use increment() without getDoc if we don't care about isSameDay logic for one-time updates
    // Actually, to handle 'todayVisits', we do need to know the date.
    // Optimization: Use a local variable or just accept 1 read if session is new.
    const snap = await getDoc(statRef);
    if (!snap.exists()) {
      await setDoc(statRef, {
        id: 'counter',
        totalVisits: 1,
        todayVisits: 1,
        lastVisitedAt: new Date().toISOString(),
        lastDate: todayStr,
        updatedAt: new Date().toISOString()
      });
    } else {
      const data = snap.data();
      const isSameDay = data?.lastDate === todayStr;
      await updateDoc(statRef, {
        totalVisits: increment(1),
        todayVisits: isSameDay ? increment(1) : 1,
        lastVisitedAt: new Date().toISOString(),
        lastDate: todayStr,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn('Page hit counter recording note:', err);
  }
}

export async function resetPageHitCounter(newCount: number = 0, resetByEmail: string = 'admin'): Promise<void> {
  const statRef = doc(db, 'site_stats', 'counter');
  const todayStr = new Date().toISOString().split('T')[0];
  await setDoc(statRef, {
    id: 'counter',
    totalVisits: Number(newCount) || 0,
    todayVisits: 0,
    lastVisitedAt: new Date().toISOString(),
    lastDate: todayStr,
    resetAt: new Date().toISOString(),
    resetBy: resetByEmail,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

// 9. Modular Auth Primitives & Standard Exports
export {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
};
export type { User };

