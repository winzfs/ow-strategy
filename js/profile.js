/*
 * OW Hub profile module
 */

import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, COLLECTIONS, db } from './firebase.js';
import { clampNumber, normalizeBattleTag } from './sanitize.js';

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

export function getRatingId(fromUid, targetUid, matchId) {
  if (!fromUid || !targetUid) throw new Error('평가자 또는 대상 정보가 없습니다.');
  const contextId = matchId || 'global';
  return `${fromUid}_${targetUid}_${contextId}`;
}

export async function hasRatedUser(targetUid, options = {}) {
  const fromUid = options.fromUid || auth.currentUser?.uid;
  if (!fromUid || !targetUid) return false;

  const ratingId = getRatingId(fromUid, targetUid, options.matchId);
  const snap = await getDoc(doc(db, COLLECTIONS.ratings, ratingId));
  return snap.exists();
}

export async function rateUser(targetUid, score, options = {}) {
  const fromUid = options.fromUid || auth.currentUser?.uid;
  if (!fromUid) throw new Error('로그인이 필요합니다.');
  if (!targetUid) throw new Error('평가할 유저 정보가 없습니다.');
  if (fromUid === targetUid) throw new Error('본인은 평가할 수 없습니다.');

  const normalizedScore = clampNumber(score, 1, 5, 5);
  const matchId = options.matchId || 'global';
  const ratingId = getRatingId(fromUid, targetUid, matchId);
  const ratingRef = doc(db, COLLECTIONS.ratings, ratingId);
  const profileRef = doc(db, COLLECTIONS.users, targetUid);

  return runTransaction(db, async (transaction) => {
    const ratingSnap = await transaction.get(ratingRef);
    if (ratingSnap.exists()) {
      throw new Error('이미 평가한 유저입니다.');
    }

    const profileSnap = await transaction.get(profileRef);
    const profileData = profileSnap.exists() ? profileSnap.data() : {};
    const nextCount = Number(profileData.rateCount || 0) + 1;
    const nextTotal = Number(profileData.rateTotal || 0) + normalizedScore;
    const now = Date.now();

    transaction.set(ratingRef, {
      fromUid,
      toUid: targetUid,
      matchId,
      score: normalizedScore,
      createdAt: now,
    });

    transaction.set(profileRef, {
      rateCount: nextCount,
      rateTotal: nextTotal,
      updatedAt: now,
    }, { merge: true });

    return {
      rateCount: nextCount,
      rateTotal: nextTotal,
      average: (nextTotal / nextCount).toFixed(1),
    };
  });
}
