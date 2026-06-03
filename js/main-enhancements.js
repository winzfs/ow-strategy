/*
 * Main page enhancements
 *
 * Independent UI enhancements that do not need to live inside the main page
 * controller: activity status, Discord CTA, and party expiry hints.
 */

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, COLLECTIONS, db } from './firebase.js';
import {
  getActivityDisplayCount,
  startPresenceHeartbeat,
  watchPresence,
} from './presence.js';
import { APP_CONFIG } from './config.js';

const state = {
  activeCount: 0,
  activePartyCount: 0,
  unsubPresence: null,
  unsubPartyCount: null,
  stopHeartbeat: null,
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function setText(selector, text) {
  const target = qs(selector);
  if (target) target.textContent = text;
}

function getActivePartyCount(snapshot) {
  const now = Date.now();
  return snapshot.docs.reduce((count, item) => {
    const party = item.data();
    if (party.deleted) return count;
    if (party.expiresAt && party.expiresAt < now) return count;
    return count + 1;
  }, 0);
}

function updateActivityUI() {
  const activityIndex = getActivityDisplayCount(state.activeCount, state.activePartyCount, { mode: 'activityIndex' });
  setText('#activity-count', `${activityIndex}`);
  setText('#activity-party-count', `${state.activePartyCount}`);
  setText('#activity-copy', state.activePartyCount > 0 ? '지금 모집 중인 파티가 있어요.' : '첫 모집글을 올려보세요.');
  setText('#live-user-count', `전투 대기 중인 요원: ${activityIndex}명`);
  setText('#live-party-count', `ACTIVE MISSIONS: ${state.activePartyCount}`);
}

function setupPresence() {
  state.stopHeartbeat?.();
  state.stopHeartbeat = startPresenceHeartbeat(() => auth.currentUser, (error) => {
    console.warn('[presence:heartbeat]', error);
  });

  state.unsubPresence?.();
  state.unsubPresence = watchPresence(({ activeCount }) => {
    state.activeCount = activeCount;
    updateActivityUI();
  });
}

function setupPartyCount() {
  state.unsubPartyCount?.();
  const partiesQuery = query(collection(db, COLLECTIONS.parties), orderBy('createdAt', 'desc'));
  state.unsubPartyCount = onSnapshot(partiesQuery, (snapshot) => {
    state.activePartyCount = getActivePartyCount(snapshot);
    updateActivityUI();
  }, (error) => {
    console.warn('[activity:party-count]', error);
  });
}

function setupDiscordCTA() {
  const link = qs('#discord-cta-link');
  const status = qs('#discord-cta-status');
  if (!link) return;

  if (APP_CONFIG.discordInviteUrl) {
    link.href = APP_CONFIG.discordInviteUrl;
    link.removeAttribute('aria-disabled');
    link.classList.remove('is-disabled');
    if (status) status.textContent = '디스코드 실시간 파티방으로 이동';
    return;
  }

  link.href = '#';
  link.setAttribute('aria-disabled', 'true');
  link.classList.add('is-disabled');
  link.addEventListener('click', (event) => event.preventDefault());
  if (status) status.textContent = '디스코드 초대 링크를 config.js에 연결하면 활성화됩니다.';
}

function formatRemaining(expiresAt) {
  if (!expiresAt) return '';
  const remainingMs = expiresAt - Date.now();
  if (remainingMs <= 0) return '만료됨';
  const minutes = Math.ceil(remainingMs / 60000);
  if (minutes < 60) return `${minutes}분 후 만료`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes ? `${hours}시간 ${restMinutes}분 후 만료` : `${hours}시간 후 만료`;
}

function annotatePartyExpiry() {
  const visiblePartyIds = Array.from(document.querySelectorAll('#party-list .party-card'));
  visiblePartyIds.forEach((card) => {
    if (card.querySelector('.expiry-hint')) return;
    const hint = document.createElement('div');
    hint.className = 'expiry-hint';
    hint.textContent = '모집글은 등록 후 2시간 동안 노출됩니다.';
    card.appendChild(hint);
  });
}

function observePartyList() {
  const list = qs('#party-list');
  if (!list) return;

  const observer = new MutationObserver(() => annotatePartyExpiry());
  observer.observe(list, { childList: true });
  annotatePartyExpiry();
}

function initEnhancements() {
  setupPresence();
  setupPartyCount();
  setupDiscordCTA();
  observePartyList();
  updateActivityUI();
}

document.addEventListener('DOMContentLoaded', initEnhancements);
