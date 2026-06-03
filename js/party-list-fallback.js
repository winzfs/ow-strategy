import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { auth, COLLECTIONS, db } from './firebase.js';
import { closeParty } from './party.js';
import { ICON_URLS } from './config.js';

function qs(selector) {
  return document.querySelector(selector);
}

function hasMainController() {
  return Boolean(window.OWHub?.main?.renderParties);
}

function ensureToastRoot() {
  let root = qs('#toast-root');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'toast-root';
  root.className = 'toast-root';
  document.body.appendChild(root);
  return root;
}

function toast(message, type) {
  const root = ensureToastRoot();
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'toast-error' : ''} ${type === 'success' ? 'toast-success' : ''}`.trim();
  el.textContent = message;
  root.appendChild(el);
  window.setTimeout(function () {
    el.remove();
  }, 2600);
}

function safeText(value, fallback) {
  return String(value || fallback || '');
}

function roleIcon(role) {
  if (role === '탱커') return '🛡️';
  if (role === '딜러') return '⚔️';
  if (role === '지원') return '💉';
  return '🎮';
}

function createBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = `badge ${className || 'badge-muted'}`;
  badge.textContent = text;
  return badge;
}

function createTierBadge(tier, tierNum) {
  const badge = document.createElement('span');
  badge.className = 'badge badge-muted party-tier-badge';
  const icon = ICON_URLS[tier];
  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.alt = '';
    img.width = 16;
    img.height = 16;
    badge.appendChild(img);
  }
  badge.appendChild(document.createTextNode(`${safeText(tier, '티어')} ${safeText(tierNum, '')}`.trim()));
  return badge;
}

function isVisibleParty(party) {
  if (!party) return false;
  if (party.deleted) return false;
  if (party.expiresAt && party.expiresAt < Date.now()) return false;
  return true;
}

function createPartyCard(party) {
  const card = document.createElement('article');
  card.className = 'party-card';

  const header = document.createElement('div');
  header.className = 'party-card-header';

  const owner = document.createElement('div');
  owner.className = 'party-card-owner';
  const ownerName = document.createElement('strong');
  ownerName.className = 'party-owner';
  ownerName.textContent = safeText(party.btag, '익명');
  owner.appendChild(ownerName);

  const badges = document.createElement('div');
  badges.className = 'party-card-badges';
  badges.appendChild(createBadge(`${roleIcon(party.pos)} ${safeText(party.pos, '포지션')}`, 'badge-muted'));
  badges.appendChild(createTierBadge(party.tier, party.tierNum));
  badges.appendChild(createBadge(`${(Array.isArray(party.members) ? party.members.length : 0) + 1}/${party.maxp || 5}`, 'badge-muted'));
  badges.appendChild(createBadge(`평점 ${party.ownerRate || '신규'}`, 'badge-muted'));

  header.appendChild(owner);
  header.appendChild(badges);

  const desc = document.createElement('p');
  desc.className = 'party-card-desc';
  desc.textContent = safeText(party.desc, '내용 없음');

  const actions = document.createElement('div');
  actions.className = 'party-card-actions';
  const user = auth.currentUser;

  if (user && user.uid === party.uid) {
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-danger';
    closeButton.type = 'button';
    closeButton.textContent = '모집 종료';
    closeButton.addEventListener('click', async function () {
      try {
        await closeParty(party.id);
        toast('모집을 종료했습니다.', 'success');
      } catch (error) {
        console.error('[party-list-fallback:close]', error);
        toast('모집 종료에 실패했습니다.', 'error');
      }
    });
    actions.appendChild(closeButton);
  } else {
    const requestButton = document.createElement('button');
    requestButton.className = 'btn btn-primary';
    requestButton.type = 'button';
    requestButton.textContent = '파티 신청';
    requestButton.addEventListener('click', function () {
      if (!auth.currentUser) {
        toast('로그인이 필요합니다.', 'error');
        document.querySelector('#sidebar')?.classList.add('is-active', 'active');
        document.querySelector('#sidebar-overlay')?.classList.add('is-active', 'active');
        return;
      }
      if (window.OWHub?.main?.openRequestModal) {
        window.OWHub.main.openRequestModal(party);
        return;
      }
      toast('신청 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.', 'error');
    });
    actions.appendChild(requestButton);
  }

  card.appendChild(header);
  card.appendChild(desc);
  card.appendChild(actions);
  return card;
}

function renderParties(parties) {
  if (hasMainController()) return;

  const list = qs('#party-list');
  if (!list) return;

  const visible = parties.filter(isVisibleParty);
  if (!visible.length) {
    list.innerHTML = '<div class="empty-state">조건에 맞는 파티가 없습니다.</div>';
    return;
  }

  const fragment = document.createDocumentFragment();
  visible.forEach(function (party) {
    fragment.appendChild(createPartyCard(party));
  });
  list.replaceChildren(fragment);
}

function initPartyListFallback() {
  const list = qs('#party-list');
  if (!list) return;

  const partiesQuery = query(collection(db, COLLECTIONS.parties), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(partiesQuery, function (snapshot) {
    if (hasMainController()) {
      unsubscribe();
      return;
    }

    const parties = snapshot.docs.map(function (item) {
      return { id: item.id, ...item.data() };
    });
    renderParties(parties);
  }, function (error) {
    if (hasMainController()) return;
    console.error('[party-list-fallback:watch]', error);
    list.innerHTML = '<div class="empty-state">파티 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
  });
}

document.addEventListener('DOMContentLoaded', initPartyListFallback);
