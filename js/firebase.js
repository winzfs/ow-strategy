/*
 * OW Hub Firebase initialization
 *
 * Keep Firebase app/auth/db setup in one place. This file intentionally exports
 * only shared instances and constants. Feature modules should import from here.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyA96CFg3o1TpD5lu-0rYMlIp16Ev8URDuw',
  authDomain: 'ow-party-97936.firebaseapp.com',
  projectId: 'ow-party-97936',
  storageBucket: 'ow-party-97936.firebasestorage.app',
  messagingSenderId: '15782204013',
  appId: '1:15782204013:web:5c74ef2e603c311fc82564',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const COLLECTIONS = Object.freeze({
  users: 'users',
  parties: 'parties',
  matches: 'matches',
  community: 'community',
  comments: 'comments',
  presences: 'presences',
  ratings: 'ratings',
  reports: 'reports',
});
