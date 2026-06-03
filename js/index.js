/*
 * OW Hub main page controller
 *
 * Owns auth, profile, party listing, party creation and match requests for index.html.
 */

import { auth } from './firebase.js';
import {
  loginWithEmail,
  logout,
  registerWithEmail,
  resetPassword,
  watchAuth,
} from './auth.js';
import {
  createMatchRequest,
  createParty,
  acceptMatch,
  closeParty,
  watchParties,
} from './party.js';
import { getProfile, getAverageRating, getPublicBattleTagName, saveProfile } from './profile.js';
import {
  getSentRequestPostIds,
  getUserRelatedMatches,
  hasPendingIncomingMatch,
  markMatchRejected,
  removeMatch,
  watchMatches,
} from './notification.js';
import { ROLE_LIST, TIERS, TIER_NUMBERS, ICON_URLS } from './config.js';
import {
  createTextElement,
  renderEmptyState,
  replaceChildrenFromArray,
  qs,
  qsa,
  showElement,
  hideElement,
  showToast,
} from './ui.js';

const state = {
  user: null,
  profile: null,
  parties: [],
  matches: [],
  filters: {
    roles: new Set(),
    tiers: new Set(),
  },
  unsubParties: null,
  unsubMatches: null,
};

function optionList(values, selectedValue = '') {
  return values.map((value) => `<option value="${value}" ${value === selectedValue ? 'selected' : ''}>${value}</option>`).join('');
}

function tierNumberOptions(selectedValue = '1') {
  return TIER_NUMBERS.map((value) => `<option value="${value}" ${value === String(selectedValue) ? 'selected' : ''}>${value}</option>`).join('');
}

function roleClass(role) {
  if (role === '탱커') return 'badge-role-tank';
  if (role === '딜러') return 'badge-role-dps';
  if (role === '지원') return 'badge-role-support';
  return 'badge-muted';
}

function getTierIcon(tier) {
  return ICON_URLS[tier] || '';
}

function createBadge(text, className = 'badge-muted') {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function createTierBadge(tier, tierNum) {
  const badge = document.createElement('span');
  badge.className = 'badge badge-muted';
  const icon = getTierIcon(tier);
  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.alt = tier;
    img.style.width = '16px';
    img.style.height = '16px';
    badge.append(img);
  }
  badge.append(document.createTextNode(`${tier || '티어'} ${tierNum || ''}`.trim()));
  return badge;
}

function getProfileRole(profile, role) {
  return profile?.[role] || { tier: '배치', num: '1' };
}

function getFormValue(id) {
  return qs(`#${id}`)?.value || '';
}

function setText(id, text) {
  const el = qs(`#${id}`);
  if (el) el.textContent = text;
}

function showPage(pageName) {
  qsa('.page').forEach((page) => {
    const active = page.dataset.page === pageName;
    page.classList.toggle('active', active);
    page.classList.toggle('is-active', active);
  });

  qsa('.sidebar-menu-item[data-page]').forEach((item) => {
    const active = item.dataset.page === pageName;
    item.classList.toggle('active', active);
    item.classList.toggle('is-active', active);
  });

  closeSidebar();
}

function openSidebar() {
  qs('#sidebar')?.classList.add('is-active', 'active');
  qs('#sidebar-overlay')?.classList.add('is-active', 'active');
}

function closeSidebar() {
  qs('#sidebar')?.classList.remove('is-active', 'active');
  qs('#sidebar-overlay')?.classList.remove('is-active', 'active');
}

function toggleSidebar() {
  const sidebar = qs('#sidebar');
  if (sidebar?.classList.contains('is-active') || sidebar?.classList.contains('active')) closeSidebar();
  else openSidebar();
}

function renderAuthPanel() {
  const panel = qs('#auth-panel');
  const profileSummary = qs('#profile-summary');
  if (!panel) return;

  if (state.user) {
    const btag = state.profile?.btag || '프로필을 설정하세요';
    const rating = getAverageRating(state.profile) || '신규';
    panel.innerHTML = '';

    const title = createTextElement('div', btag, 'profile-btag');
    title.style.fontWeight = '900';
    title.style.color = 'var(--color-accent)';

    const meta = createTextElement('div', `매너 평점: ${rating}`, 'profile-meta');
    meta.style.color = 'var(--color-text-muted)';
    meta.style.fontSize = '12px';
    meta.style.marginTop = '4px';

    const logoutButton = document.createElement('button');
    logoutButton.className = 'btn btn-secondary btn-block';
    logoutButton.textContent = '로그아웃';
    logoutButton.addEventListener('click', async () => {
      await logout();
      location.reload();
    });

    panel.append(title, meta, logoutButton);
    if (profileSummary) profileSummary.textContent = btag;
    return;
  }

  panel.innerHTML = `
    <input class="form-input" id="login-email" type="email" placeholder="이메일">
    <input class="form-input" id="login-password" type="password" placeholder="비밀번호">
    <button class="btn btn-primary btn-block" id="btn-login" type="button">로그인</button>
    <button class="btn btn-secondary btn-block" id="btn-register" type="button">회원가입</button>
    <button class="btn btn-secondary btn-block" id="btn-reset-password" type="button">비밀번호 찾기</button>
  `;
  if (profileSummary) profileSummary.textContent = '로그인 필요';

  qs('#btn-login')?.addEventListener('click', handleLogin);
  qs('#btn-register')?.addEventListener('click', handleRegister);
  qs('#btn-reset-password')?.addEventListener('click', handleResetPassword);
}

async function handleLogin() {
  try {
    await loginWithEmail(getFormValue('login-email'), getFormValue('login-password'));
    showToast('로그인되었습니다.', 'success');
  } catch (error) {
    console.error('[auth:login]', error);
    showToast('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.', 'error');
  }
}

async function handleRegister() {
  try {
    await registerWithEmail(getFormValue('login-email'), getFormValue('login-password'));
    showToast('회원가입이 완료되었습니다. 인증 메일을 확인해주세요.', 'success');
  } catch (error) {
    console.error('[auth:register]', error);
    showToast('회원가입에 실패했습니다.', 'error');
  }
}

async function handleResetPassword() {
  try {
    await resetPassword(getFormValue('login-email'));
    showToast('비밀번호 재설정 메일을 보냈습니다.', 'success');
  } catch (error) {
    console.error('[auth:reset]', error);
    showToast('비밀번호 재설정 메일 발송에 실패했습니다.', 'error');
  }
}

function renderProfileForm() {
  const form = qs('#profile-form');
  if (!form) return;

  if (!state.user) {
    renderEmptyState(form, '로그인 후 프로필을 설정할 수 있습니다.');
    return;
  }

  const tank = getProfileRole(state.profile, '탱커');
  const dps = getProfileRole(state.profile, '딜러');
  const support = getProfileRole(state.profile, '지원');

  form.innerHTML = `
    <label class="form-label" for="profile-btag">배틀태그</label>
    <input class="form-input" id="profile-btag" placeholder="예: Player#1234" value="${state.profile?.btag || ''}">

    <div class="pos-group">
      <strong>탱커</strong>
      <select class="form-select" id="profile-tank-tier">${optionList(TIERS, tank.tier)}</select>
      <select class="form-select" id="profile-tank-num">${tierNumberOptions(tank.num)}</select>
    </div>
    <div class="pos-group">
      <strong>딜러</strong>
      <select class="form-select" id="profile-dps-tier">${optionList(TIERS, dps.tier)}</select>
      <select class="form-select" id="profile-dps-num">${tierNumberOptions(dps.num)}</select>
    </div>
    <div class="pos-group">
      <strong>지원</strong>
      <select class="form-select" id="profile-support-tier">${optionList(TIERS, support.tier)}</select>
      <select class="form-select" id="profile-support-num">${tierNumberOptions(support.num)}</select>
    </div>
    <button class="btn btn-primary btn-block" id="btn-save-profile" type="button">프로필 저장</button>
  `;

  qs('#btn-save-profile')?.addEventListener('click', handleSaveProfile);
}

async function handleSaveProfile() {
  try {
    state.profile = await saveProfile(state.user.uid, {
      btag: getFormValue('profile-btag'),
      tankTier: getFormValue('profile-tank-tier'),
      tankNum: getFormValue('profile-tank-num'),
      dpsTier: getFormValue('profile-dps-tier'),
      dpsNum: getFormValue('profile-dps-num'),
      supportTier: getFormValue('profile-support-tier'),
      supportNum: getFormValue('profile-support-num'),
    });
    renderAuthPanel();
    showToast('프로필을 저장했습니다.', 'success');
  } catch (error) {
    console.error('[profile:save]', error);
    showToast('프로필 저장에 실패했습니다.', 'error');
  }
}

function renderPartyForm() {
  const form = qs('#party-form');
  if (!form) return;

  if (!state.user) {
    renderEmptyState(form, '로그인 후 파티를 모집할 수 있습니다.');
    return;
  }

  const btag = state.profile?.btag || '';
  form.innerHTML = `
    <label class="form-label" for="party-btag">배틀태그</label>
    <input class="form-input" id="party-btag" placeholder="프로필 배틀태그" value="${btag}">
    <label class="form-label" for="party-role">포지션</label>
    <select class="form-select" id="party-role">${optionList(ROLE_LIST, '딜러')}</select>
    <label class="form-label" for="party-tier">티어</label>
    <select class="form-select" id="party-tier">${optionList(TIERS, '플래티넘')}</select>
    <select class="form-select" id="party-tier-num">${tierNumberOptions('1')}</select>
    <label class="form-label" for="party-maxp">모집 인원</label>
    <select class="form-select" id="party-maxp">${[2, 3, 4, 5].map((n) => `<option value="${n}">${n}명</option>`).join('')}</select>
    <label class="form-label" for="party-desc">설명</label>
    <textarea class="form-textarea" id="party-desc" placeholder="예: 빠대/경쟁/마이크 여부 등을 적어주세요." maxlength="300"></textarea>
    <button class="btn btn-primary btn-block" id="btn-create-party" type="button">파티 모집하기</button>
  `;

  qs('#btn-create-party')?.addEventListener('click', handleCreateParty);
}

async function handleCreateParty() {
  try {
    await createParty({
      btag: getFormValue('party-btag'),
      pos: getFormValue('party-role'),
      tier: getFormValue('party-tier'),
      tierNum: getFormValue('party-tier-num'),
      maxp: getFormValue('party-maxp'),
      desc: getFormValue('party-desc'),
      ownerRate: getAverageRating(state.profile) || '신규',
    }, state.user, { closeExisting: true });
    showToast('파티 모집글을 등록했습니다.', 'success');
  } catch (error) {
    console.error('[party:create]', error);
    showToast(error.message || '파티 등록에 실패했습니다.', 'error');
  }
}

function isPartyVisible(party) {
  if (party.deleted) return false;
  if (party.expiresAt && party.expiresAt < Date.now()) return false;
  if (state.filters.roles.size && !state.filters.roles.has(party.pos)) return false;
  if (state.filters.tiers.size && !state.filters.tiers.has(party.tier)) return false;
  return true;
}

function createPartyCard(party) {
  const card = document.createElement('article');
  card.className = 'party-card';

  const header = document.createElement('div');
  header.className = 'party-card-header';

  const owner = document.createElement('div');
  owner.className = 'party-card-owner';
  owner.append(createTextElement('strong', party.btag || '익명', 'party-owner'));

  const badges = document.createElement('div');
  badges.className = 'party-card-badges';
  badges.append(createBadge(party.pos || '포지션', roleClass(party.pos)));
  badges.append(createTierBadge(party.tier, party.tierNum));
  badges.append(createBadge(`${(party.members?.length || 0) + 1}/${party.maxp || 5}`, 'badge-muted'));
  badges.append(createBadge(`평점 ${party.ownerRate || '신규'}`, 'badge-muted'));

  header.append(owner, badges);

  const desc = createTextElement('p', party.desc || '내용 없음', 'party-card-desc');

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '8px';
  actions.style.flexWrap = 'wrap';

  if (state.user?.uid === party.uid) {
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-danger';
    closeButton.textContent = '모집 종료';
    closeButton.addEventListener('click', async () => {
      await closeParty(party.id);
      showToast('모집을 종료했습니다.', 'success');
    });
    actions.append(closeButton);
  } else {
    const requestButton = document.createElement('button');
    requestButton.className = 'btn btn-primary';
    const sentPostIds = getSentRequestPostIds(state.matches, state.user?.uid);
    requestButton.textContent = sentPostIds.has(party.id) ? '신청됨' : '파티 신청';
    requestButton.disabled = !state.user || sentPostIds.has(party.id);
    requestButton.addEventListener('click', () => handleRequestParty(party));
    actions.append(requestButton);
  }

  card.append(header, desc, actions);
  return card;
}

async function handleRequestParty(party) {
  if (!state.user) {
    showToast('로그인이 필요합니다.', 'error');
    return;
  }

  try {
    const role = getProfileRole(state.profile, party.pos || '딜러');
    await createMatchRequest({
      postId: party.id,
      toUid: party.uid,
      toBtag: party.btag,
      fromBtag: state.profile?.btag || auth.currentUser?.email || '익명',
      reqPos: party.pos,
      reqTier: role.tier || party.tier,
      reqTierNum: role.num || party.tierNum,
      leaderPos: party.pos,
      leaderTier: party.tier,
      leaderTierNum: party.tierNum,
      message: '파티 신청합니다.',
    }, state.user);
    showToast('파티 신청을 보냈습니다.', 'success');
  } catch (error) {
    console.error('[party:request]', error);
    showToast(error.message || '파티 신청에 실패했습니다.', 'error');
  }
}

function renderParties() {
  const list = qs('#party-list');
  if (!list) return;
  const visibleParties = state.parties.filter(isPartyVisible);
  if (!visibleParties.length) {
    renderEmptyState(list, '조건에 맞는 파티가 없습니다.');
    return;
  }
  replaceChildrenFromArray(list, visibleParties, createPartyCard);
}

function createFilterButton(value, type) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'filter-tag';
  button.textContent = value;
  button.addEventListener('click', () => {
    const targetSet = type === 'role' ? state.filters.roles : state.filters.tiers;
    if (targetSet.has(value)) targetSet.delete(value);
    else targetSet.add(value);
    button.classList.toggle('active', targetSet.has(value));
    button.classList.toggle('is-active', targetSet.has(value));
    renderParties();
  });
  return button;
}

function renderFilters() {
  const roleFilter = qs('#role-filter');
  const tierFilter = qs('#tier-filter');
  if (roleFilter) replaceChildrenFromArray(roleFilter, ROLE_LIST, (role) => createFilterButton(role, 'role'));
  if (tierFilter) replaceChildrenFromArray(tierFilter, TIERS.filter((tier) => tier !== '배치'), (tier) => createFilterButton(tier, 'tier'));

  qs('#btn-filter-reset')?.addEventListener('click', () => {
    state.filters.roles.clear();
    state.filters.tiers.clear();
    qsa('.filter-tag').forEach((button) => button.classList.remove('active', 'is-active'));
    renderParties();
  });
}

function renderNotifications() {
  const list = qs('#notification-list');
  if (!list) return;

  if (!state.user) {
    renderEmptyState(list, '로그인 후 알림을 확인할 수 있습니다.');
    setText('nav-new-badge', '');
    hideElement(qs('#nav-new-badge'));
    return;
  }

  const related = getUserRelatedMatches({ docs: state.matches.map((match) => ({ id: match.id, data: () => match })) }, state.user.uid);
  const incoming = related.filter((match) => match.toUid === state.user.uid);
  const hasNew = hasPendingIncomingMatch(related, state.user.uid);
  const badge = qs('#nav-new-badge');
  if (badge) {
    if (hasNew) showElement(badge);
    else hideElement(badge);
  }

  if (!incoming.length) {
    renderEmptyState(list, '새 알림이 없습니다.');
    return;
  }

  replaceChildrenFromArray(list, incoming, (match) => {
    const card = document.createElement('div');
    card.className = 'request-card';

    const title = createTextElement('strong', `${match.fromBtag || '익명'} 님의 파티 신청`, 'request-title');
    const meta = createTextElement('p', `${match.reqPos || ''} / ${match.reqTier || ''} ${match.reqTierNum || ''} / 상태: ${match.status}`, 'request-meta');

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    if (match.status === 'pending') {
      const acceptButton = document.createElement('button');
      acceptButton.className = 'btn btn-primary';
      acceptButton.textContent = '수락';
      acceptButton.addEventListener('click', async () => {
        try {
          await acceptMatch(match.id);
          showToast('신청을 수락했습니다.', 'success');
        } catch (error) {
          showToast(error.message || '수락에 실패했습니다.', 'error');
        }
      });

      const rejectButton = document.createElement('button');
      rejectButton.className = 'btn btn-secondary';
      rejectButton.textContent = '거절';
      rejectButton.addEventListener('click', async () => {
        await markMatchRejected(match.id);
        showToast('신청을 거절했습니다.', 'success');
      });
      actions.append(acceptButton, rejectButton);
    } else {
      const removeButton = document.createElement('button');
      removeButton.className = 'btn btn-secondary';
      removeButton.textContent = '확인';
      removeButton.addEventListener('click', () => removeMatch(match.id));
      actions.append(removeButton);
    }

    card.append(title, meta, actions);
    return card;
  });
}

function startListeners() {
  if (state.unsubParties) state.unsubParties();
  if (state.unsubMatches) state.unsubMatches();

  state.unsubParties = watchParties((snap) => {
    state.parties = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderParties();
  });

  state.unsubMatches = watchMatches((snap) => {
    state.matches = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderParties();
    renderNotifications();
  });
}

async function handleAuth(user) {
  state.user = user;
  state.profile = user ? await getProfile(user.uid) : null;
  renderAuthPanel();
  renderProfileForm();
  renderPartyForm();
  renderParties();
  renderNotifications();
}

function bindEvents() {
  qs('#hamburger-btn')?.addEventListener('click', toggleSidebar);
  qs('#sidebar-overlay')?.addEventListener('click', closeSidebar);

  qsa('[data-page-target]').forEach((button) => {
    button.addEventListener('click', () => showPage(button.dataset.pageTarget));
  });
}

function exposeLegacyHooks() {
  window.toggleSidebar = toggleSidebar;
  window.showPageAndClose = showPage;
  window.OWHub = window.OWHub || {};
  window.OWHub.main = {
    showPage,
    toggleSidebar,
    renderParties,
    renderNotifications,
  };
}

function init() {
  hideElement(qs('#nav-new-badge'));
  renderFilters();
  bindEvents();
  exposeLegacyHooks();
  startListeners();
  watchAuth((user) => {
    handleAuth(user).catch((error) => {
      console.error('[auth:state]', error);
      showToast('로그인 상태를 불러오는 중 문제가 발생했습니다.', 'error');
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
