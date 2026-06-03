/*
 * OW Hub notification module
 */

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, db } from './firebase.js';

export function watchMatches(callback) {
  const matchesQuery = query(collection(db, COLLECTIONS.matches), orderBy('createdAt', 'desc'));
  return onSnapshot(matchesQuery, callback);
}

export function getUserRelatedMatches(snapshot, uid) {
  if (!snapshot || !uid) return [];
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((match) => match.fromUid === uid || match.toUid === uid);
}

export function hasPendingIncomingMatch(matches, uid) {
  return matches.some((match) => match.toUid === uid && match.status === 'pending');
}

export function getSentRequestPostIds(matches, uid) {
  return new Set(
    matches
      .filter((match) => match.fromUid === uid)
      .map((match) => match.postId)
  );
}

export function markMatchRejected(matchId) {
  return updateDoc(doc(db, COLLECTIONS.matches, matchId), {
    status: 'rejected',
    updatedAt: Date.now(),
  });
}

export function removeMatch(matchId) {
  return deleteDoc(doc(db, COLLECTIONS.matches, matchId));
}
