/*
 * OW Hub community module
 */

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS, db } from './firebase.js';
import { COMMUNITY_LIMITS } from './config.js';
import { normalizeText } from './sanitize.js';
import { getPublicBattleTagName } from './profile.js';

export function normalizePostDraft(input, user, profile) {
  return {
    uid: user.uid,
    author: getPublicBattleTagName(profile?.btag, '익명 요원'),
    title: normalizeText(input.title, { maxLength: COMMUNITY_LIMITS.titleMaxLength }),
    content: normalizeText(input.content, { maxLength: COMMUNITY_LIMITS.contentMaxLength }),
    likes: [],
    commentCount: 0,
    reportCount: 0,
    deleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function watchCommunityPosts(callback) {
  const postsQuery = query(collection(db, COLLECTIONS.community), orderBy('createdAt', 'desc'));
  return onSnapshot(postsQuery, callback);
}

export function createCommunityPost(input, user, profile) {
  if (!user) throw new Error('로그인이 필요합니다.');
  const post = normalizePostDraft(input, user, profile);
  if (!post.title || !post.content) throw new Error('제목과 내용을 모두 입력하세요.');
  return addDoc(collection(db, COLLECTIONS.community), post);
}

export function toggleLike(postId, uid, authorUid, currentLikes = []) {
  if (!uid) throw new Error('로그인이 필요합니다.');
  if (uid === authorUid) throw new Error('본인 글은 추천할 수 없습니다.');

  const postRef = doc(db, COLLECTIONS.community, postId);
  const alreadyLiked = currentLikes.includes(uid);
  return updateDoc(postRef, {
    likes: alreadyLiked ? arrayRemove(uid) : arrayUnion(uid),
    updatedAt: Date.now(),
  });
}

export async function getComments(postId) {
  const commentsQuery = query(collection(db, COLLECTIONS.comments), where('postId', '==', postId));
  const snap = await getDocs(commentsQuery);
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((comment) => !comment.deleted)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export async function addComment(postId, content, user, profile) {
  if (!user) throw new Error('로그인이 필요합니다.');

  const normalizedContent = normalizeText(content, { maxLength: COMMUNITY_LIMITS.commentMaxLength });
  if (!normalizedContent) throw new Error('내용을 입력해주세요.');

  await addDoc(collection(db, COLLECTIONS.comments), {
    postId,
    uid: user.uid,
    author: getPublicBattleTagName(profile?.btag, '익명'),
    content: normalizedContent,
    deleted: false,
    createdAt: Date.now(),
  });

  await updateDoc(doc(db, COLLECTIONS.community, postId), {
    commentCount: increment(1),
    updatedAt: Date.now(),
  });
}

export function deletePost(postId) {
  return deleteDoc(doc(db, COLLECTIONS.community, postId));
}
