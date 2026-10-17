// lib/firebase-auth.ts — Auth Firebase réelle (Google, GitHub, email)
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  deleteUser,
  getAdditionalUserInfo,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level?: string;
  languages?: string[];
  interests?: string[];
  goal?: string;
  createdAt?: Date;
  provider: 'google' | 'github' | 'email';
};

async function createOrUpdateUserDoc(user: FirebaseUser, provider: 'google' | 'github' | 'email') {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      provider,
      createdAt: new Date(),
    };
    const profileData = {
      ...profile,
      ...(user.photoURL ? { photoURL: user.photoURL } : {}),
      role: 'user',
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, profileData);
  } else {
    await setDoc(userRef, { email: user.email || '', displayName: user.displayName || user.email?.split('@')[0] || 'User', updatedAt: serverTimestamp() }, { merge: true });
  }
  return userRef;
}

export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await deleteUser(result.user);
      throw new Error('La création de nouveaux comptes est désactivée.');
    }
    await createOrUpdateUserDoc(result.user, 'google');
    return {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      photoURL: result.user.photoURL || undefined,
      provider: 'google',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur de connexion Google');
  }
}

export async function signInWithGithub(): Promise<UserProfile> {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await deleteUser(result.user);
      throw new Error('La création de nouveaux comptes est désactivée.');
    }
    await createOrUpdateUserDoc(result.user, 'github');
    return {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
      photoURL: result.user.photoURL || undefined,
      provider: 'github',
    };
  } catch (error: any) {
    throw new Error(error.message || 'Erreur de connexion GitHub');
  }
}

export async function signInWithEmail(email: string, password: string): Promise<UserProfile> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserDoc(result.user, 'email');
    return {
      uid: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      photoURL: result.user.photoURL || undefined,
      provider: 'email',
    };
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Adresse e-mail ou mot de passe incorrect. Vérifie aussi que ce compte existe dans le projet Firebase configuré.');
    }
    if (error.code === 'auth/too-many-requests') throw new Error('Trop de tentatives. Réessaie plus tard ou réinitialise le mot de passe.');
    if (error.code === 'auth/multi-factor-auth-required' || error.code === 'auth/operation-not-allowed') {
      throw error;
    }
    if (error.code === 'auth/user-not-found') {
      throw new Error('Aucun compte avec cet email');
    }
    if (error.code === 'auth/wrong-password') {
      throw new Error('Mot de passe incorrect');
    }
    throw new Error(error.message || 'Erreur de connexion');
  }
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export async function getCurrentIdToken(): Promise<string> {
  if (!auth.currentUser) throw new Error('Session Firebase introuvable.');
  return auth.currentUser.getIdToken(true);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function checkPasswordResetCode(code: string): Promise<string> {
  return verifyPasswordResetCode(auth, code);
}

export async function applyPasswordReset(code: string, password: string): Promise<void> {
  await confirmPasswordReset(auth, code, password);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function saveOnboarding(
  uid: string,
  data: { level: string; languages: string[]; interests: string[]; goal: string }
) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { ...data, onboardedAt: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return userSnap.data() as UserProfile;
}
