/*
 * OW Hub auth module
 *
 * Authentication-specific logic belongs here. During the gradual refactor,
 * existing inline auth code can be moved here piece by piece.
 */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { auth } from './firebase.js';
import { isAdminEmail } from './config.js';
import { normalizeText } from './sanitize.js';

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function isAdminUser(user) {
  return Boolean(user?.email && isAdminEmail(user.email));
}

export async function loginWithEmail(email, password) {
  const normalizedEmail = normalizeText(email, { maxLength: 120 }).toLowerCase();
  const normalizedPassword = String(password ?? '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }

  return signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);
}

export async function registerWithEmail(email, password) {
  const normalizedEmail = normalizeText(email, { maxLength: 120 }).toLowerCase();
  const normalizedPassword = String(password ?? '');

  if (!normalizedEmail || !normalizedPassword) {
    throw new Error('이메일과 비밀번호를 입력해주세요.');
  }

  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);

  if (!isAdminEmail(normalizedEmail)) {
    await sendEmailVerification(credential.user);
    await signOut(auth);
  }

  return credential;
}

export async function resetPassword(email) {
  const normalizedEmail = normalizeText(email, { maxLength: 120 }).toLowerCase();
  if (!normalizedEmail) throw new Error('이메일을 입력해주세요.');
  return sendPasswordResetEmail(auth, normalizedEmail);
}

export function logout() {
  return signOut(auth);
}
