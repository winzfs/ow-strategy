/*
 * OW Hub party module
 *
 * Party finding, requests, acceptance and cleanup logic should live here.
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  updateDoc,
  where,
  writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, db } from './firebase.js';
import { PARTY_LIMITS } from './config.js';
import { clampNumber, normalizeBattleTag, normalizeText } from './sanitize.js';

export function getPartyExpiresAt(createdAt = Date.now()) {
  return createdAt + PARTY_LIMITS.activeHours * 60 * 60 * 1000;
}

export function normalizePartyDraft(input, user) {
  const now = Date.now();
  const maxp = clampNumber(input.maxp, PARTY_LIMITS.minMembers, PARTY_LIMITS.maxMembers, PARTY_LIMITS.maxMembers);

  return {
    btag: normalizeBattleTag(input.btag),
    uid: user.uid,
    ownerRate: input.ownerRate || '신규',
    pos: input.pos,
    tier: input.tier,
    tierNum: String(input.tierNum || ''),
    maxp,
    desc: normalizeText(input.desc, { maxLength: PARTY_LIMITS.descriptionMaxLength }),
    members: [],
    deleted: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: getPartyExpiresAt(now),
  };
}

export function watchParties(callback) {
  const partiesQuery = query(collection(db, COLLECTIONS.parties), orderBy('createdAt', 'desc'));
  return onSnapshot(partiesQuery, callback);
}

export async function closeActivePartiesForUser(uid) {
  const activeQuery = query(
    collection(db, COLLECTIONS.parties),
    where('uid', '==', uid),
    where('deleted', '==', false)
  );
  const snap = await getDocs(activeQuery);
  if (snap.empty) return 0;

  const batch = writeBatch(db);
  snap.forEach((oldDoc) => {
    batch.update(oldDoc.ref, {
      deleted: true,
      updatedAt: Date.now(),
    });
  });
  await batch.commit();
  return snap.size;
}

export async function createParty(input, user, options = {}) {
  if (!user) throw new Error('로그인이 필요한 서비스입니다.');
  if (options.closeExisting) await closeActivePartiesForUser(user.uid);

  const party = normalizePartyDraft(input, user);
  return addDoc(collection(db, COLLECTIONS.parties), party);
}

export async function createMatchRequest(input, user) {
  if (!user) throw new Error('로그인이 필요한 서비스입니다.');
  if (!input?.postId) throw new Error('신청할 파티 정보가 없습니다.');

  const now = Date.now();
  const matchId = `${user.uid}_${input.postId}`;
  const matchRef = doc(db, COLLECTIONS.matches, matchId);
  const partyRef = doc(db, COLLECTIONS.parties, input.postId);

  await runTransaction(db, async (transaction) => {
    const [matchSnap, partySnap] = await Promise.all([
      transaction.get(matchRef),
      transaction.get(partyRef),
    ]);

    if (!partySnap.exists()) throw new Error('파티를 찾을 수 없습니다.');

    const party = partySnap.data();
    const members = Array.isArray(party.members) ? party.members : [];
    const currentCount = members.length + 1;
    const maxCount = party.maxp || PARTY_LIMITS.maxMembers;

    if (party.deleted) throw new Error('종료된 파티입니다.');
    if (party.expiresAt && party.expiresAt < now) throw new Error('만료된 파티입니다.');
    if (party.uid === user.uid) throw new Error('자신의 파티에는 신청할 수 없습니다.');
    if (currentCount >= maxCount) throw new Error('이미 마감된 파티입니다.');
    if (members.some((member) => member.uid === user.uid)) throw new Error('이미 참여 중인 파티입니다.');

    if (matchSnap.exists()) {
      const existing = matchSnap.data();
      if (existing.status === 'pending') throw new Error('이미 신청한 파티입니다.');
      if (existing.status === 'accepted') throw new Error('이미 수락된 파티입니다.');
    }

    transaction.set(matchRef, {
      fromUid: user.uid,
      fromBtag: normalizeBattleTag(input.fromBtag),
      reqPos: input.reqPos || party.pos,
      reqTier: input.reqTier || party.tier,
      reqTierNum: String(input.reqTierNum || party.tierNum || ''),
      toUid: party.uid,
      toBtag: normalizeBattleTag(party.btag || input.toBtag),
      leaderPos: party.pos || input.leaderPos || '정보없음',
      leaderTier: party.tier || input.leaderTier || '',
      leaderTierNum: String(party.tierNum || input.leaderTierNum || ''),
      postId: input.postId,
      message: normalizeText(input.message, { maxLength: PARTY_LIMITS.requestMessageMaxLength }),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }, { merge: false });
  });

  return matchRef;
}

export async function acceptMatch(matchId) {
  const matchRef = doc(db, COLLECTIONS.matches, matchId);

  return runTransaction(db, async (transaction) => {
    const matchSnap = await transaction.get(matchRef);
    if (!matchSnap.exists()) throw new Error('신청 정보를 찾을 수 없습니다.');

    const match = matchSnap.data();
    if (match.status !== 'pending') throw new Error('이미 처리된 신청입니다.');

    const partyRef = doc(db, COLLECTIONS.parties, match.postId);
    const partySnap = await transaction.get(partyRef);
    if (!partySnap.exists()) throw new Error('파티를 찾을 수 없습니다.');

    const party = partySnap.data();
    const members = Array.isArray(party.members) ? party.members : [];
    const currentCount = members.length + 1;
    const maxCount = party.maxp || PARTY_LIMITS.maxMembers;

    if (party.deleted) throw new Error('종료된 파티입니다.');
    if (currentCount >= maxCount) throw new Error('이미 마감된 파티입니다.');
    if (members.some((member) => member.uid === match.fromUid)) throw new Error('이미 참여 중인 유저입니다.');

    const nextMember = {
      uid: match.fromUid,
      btag: match.fromBtag,
      pos: match.reqPos,
      tier: match.reqTier,
      tierNum: match.reqTierNum,
    };

    transaction.update(matchRef, {
      status: 'accepted',
      updatedAt: Date.now(),
    });
    transaction.update(partyRef, {
      members: [...members, nextMember],
      updatedAt: Date.now(),
    });

    return nextMember;
  });
}

export function closeParty(postId) {
  return updateDoc(doc(db, COLLECTIONS.parties, postId), {
    deleted: true,
    updatedAt: Date.now(),
  });
}

export async function getParty(postId) {
  const snap = await getDoc(doc(db, COLLECTIONS.parties, postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
