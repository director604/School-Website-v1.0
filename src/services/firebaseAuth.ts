/**
 * Firebase Authentication Service Module
 * รองรับการทำงาน GoogleAuthProvider, Login / Logout, และ onAuthStateChanged listener
 * สามารถใช้งานร่วมกับ Cloudflare Pages, GitHub, และ Vite Environment Variables
 */

import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  Unsubscribe 
} from 'firebase/auth';
import { 
  auth, 
  authProvider, 
  workspaceProvider, 
  googleSignIn as baseGoogleSignIn, 
  logout as baseLogout, 
  initAuth as baseInitAuth,
  syncUserProfile,
  getAccessToken,
  connectGoogleDrive as baseConnectGoogleDrive
} from '../firebase';
import { UserRole } from '../types';

export { auth, authProvider, workspaceProvider, getAccessToken };
export const connectGoogleDrive = baseConnectGoogleDrive;
export type { User };

/**
 * ลงชื่อเข้าใช้ด้วย Google Account (Standard Authentication)
 */
export async function loginWithGoogle(): Promise<{ user: User; accessToken: string; role: UserRole } | null> {
  return await baseGoogleSignIn();
}

/**
 * ออกจากระบบ (Logout)
 */
export async function logoutUser(): Promise<void> {
  await baseLogout();
}

/**
 * ฟังการเปลี่ยนแปลงสถานะ Authentication (onAuthStateChanged listener)
 */
export function subscribeToAuthState(
  onUserChanged: (user: User | null, role?: UserRole) => void
): Unsubscribe {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      try {
        const role = await syncUserProfile(user);
        onUserChanged(user, role);
      } catch (err) {
        console.warn('Could not sync user profile in auth state change:', err);
        onUserChanged(user, 'editor');
      }
    } else {
      onUserChanged(null);
    }
  });
}

/**
 * ตรวจสอบผู้ใช้ปัจจุบัน
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
