/*
 * OW Hub profile module
 */

import {
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, db } from './firebase.js';
import { normalizeBattleTag } from './sanitize.js';

export function normalizeProfileDraft(input) {
  return {
    btag: normalizeBattleTag(input.btag),
    탱커: {
      tier: input.tankTier,
      num: String(input.tankNum || '1'),
    },
    딜러: {
      tier: input.dpsTier,
      num: String(input.dpsNum || '1'),
    },
    지원: {
      tier: input.supportTier,
      num: String(input.supportNum || '1'),
    },
    updatedAt: Date.now(),
  };
}

export async function getProfile(uid) {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

export async function saveProfile(uid, input) {
  const profile = normalizeProfileDraft(input);
  await setDoc(doc(db, COLLECTIONS.users, uid), profile, { merge: true });
  return profile;
}

export function getDisplayBattleTag(profile, fallback = '프로필을 설정하세요') {
  return profile?.btag || fallback;
}

export function getPublicBattleTagName(btag, fallback = '익명') {
  if (!btag) return fallback;
  return String(btag).split('#')[0] || fallback;
}

export function getAverageRating(profile) {
  const count = Number(profile?.rateCount || 0);
  const total = Number(profile?.rateTotal || 0);
  if (!count) return null;
  return (total / count).toFixed(1);
}
