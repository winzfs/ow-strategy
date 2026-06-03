/*
 * OW Hub presence module
 */

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, db } from './firebase.js';

const GUEST_ID_KEY = 'owhub_guest_id';
const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;
const UPDATE_INTERVAL_MS = 4 * 60 * 1000;

export function getGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `guest_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

export function getPresenceId(user) {
  return user?.uid || getGuestId();
}

export async function updatePresence(user) {
  const id = getPresenceId(user);
  await setDoc(doc(db, COLLECTIONS.presences, id), {
    lastSeen: Date.now(),
    isGuest: !user,
  }, { merge: true });
}

export function startPresenceHeartbeat(getUser, onError = console.error) {
  const run = () => {
    Promise.resolve(updatePresence(getUser?.())).catch(onError);
  };

  run();
  const timer = window.setInterval(run, UPDATE_INTERVAL_MS);
  return () => window.clearInterval(timer);
}

export function watchPresence(callback) {
  return onSnapshot(collection(db, COLLECTIONS.presences), (snap) => {
    const now = Date.now();
    const activeCount = snap.docs.reduce((count, item) => {
      const lastSeen = Number(item.data().lastSeen || 0);
      return now - lastSeen < ACTIVE_THRESHOLD_MS ? count + 1 : count;
    }, 0);

    callback({ activeCount, snapshot: snap });
  });
}

export function getActivityDisplayCount(activeCount, partyCount = 0, options = {}) {
  const { mode = 'honest' } = options;

  if (mode === 'activityIndex') {
    return activeCount + 3 + partyCount * 2;
  }

  return activeCount;
}
