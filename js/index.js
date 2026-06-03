/*
 * OW Hub main page controller
 *
 * Stable controller for index.html. UI must remain visible before login and
 * Firebase/listener failures must not break the whole page.
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
  acceptMatch,
  closeParty,
  createMatchRequest,
  createParty,
  watchParties,
} from './party.js';
import {
  getAverageRating,
  getProfile,
  getPublicBattleTagName,
  hasRatedUser,
  rateUser,
  saveProfile,
} from './profile.js';
import {
  getSentRequestPostIds,
  markMatchRejected,
  removeMatch,
  watchMatches,
} from './notification.js';
import { ICON_URLS, ROLE_LIST, TIERS, TIER_NUMBERS } from './config.js';
import {
  createTextElement,
  hideElement,
  qs,
  qsa,
  renderEmptyState,
  replaceChildrenFromArray,
  showElement,
  showToast,
} from './ui.js';

const state = {
  user: null,
  profile: null,
  parties: [],
  matches: [],
  pendingRequestParty: null,
  filters: {
    roles: new Set(),
    tiers: new Set(),
  },
  unsubParties: null,
  unsubMatches: null,
};

function safeRun(label, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`[index:${label}]`, error);
    return undefined;
  }
}

function getValue(id) {
  return qs(`#${id}`)?.value || '';
}

function setText(id, text) {
  const el = qs(`#${id}`);
  if (el) el.textContent = text;
}

function optionList(values, selected = '') {
  return values.map((value) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${value}</option>`).join('');
}

function tierNumberOptions(selected = '1') {
  return TIER_NUMBERS.map((value) => `<option value="${value}" ${value === String(selected) ? 'selected' : ''}>${value}</option>`).join('');
}

function roleIcon(role) {
  if (role === '탱커') return '🛡️';
  if (role === '딜러') return '⚔️';
  if (role === '지원') return '💉';
  return '🎮';
}

function roleClass(role) {
  if (role === '탱커') return 'badge-role-tank';
  if (role === '딜러') return 'badge-role-dps';
  if (role === '지원') return 'badge-role-support';
  return 'badge-muted';
}

function getProfileRole(profile, role) {
  return profile?.[role] || { tier: '배치', num: '1' };
}

function getRelatedMatches() {
  if (!state.user) return [];
  return state.matches.filter((match) => match.fromUid === state.user.uid || match.toUid === state.user.uid);
}

function openSidebar() {
  qs('#sidebar')?.classList.add('is-active', 'active');
  qs('#sidebar-overlay')?.classList.add('is-active', 'active');
  qs('#hamburger-btn')?.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  qs('#sidebar')?.classList.remove('is-active', 'active');
  qs('#sidebar-overlay')?.classList.remove('is-active', 'active');
  qs('#hamburger-btn')?.setAttribute('aria-expanded', 'false');
}

function toggleSidebar() {
  const sidebar = qs('#sidebar');
  const isOpen = sidebar?.classList.contains('is-active') || sidebar?.classList.contains('active');
  if (isOpen) closeSidebar();
  else openSidebar();
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

function createBadge(text, className = 'badge-muted') {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function createIconBadge(label, iconUrl, className = 'badge-muted') {
  const badge = document.createElement('span');
  badge.className = `badge ${className}`;
  if (iconUrl) {
    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = '';
    img.width = 16;
    img.height = 16;
    badge.append(img);
  }
  badge.append(document.createTextNode(label));
  return badge;
}

function createButton(id, text, className, onClick) {
  const button = document.createElement('button');
  button.id = id;
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

function createInput(id, options = {}) {
  const input = document.createElement('input');
  input.id = id;
  input.className = options.className || 'form-input';
  input.type = options.type || 'text';
  input.placeholder = options.placeholder || '';
  if (options.autocomplete) input.autocomplete = options.autocomplete;
  if (options.value) input.value = options.value;
  return input;
}

function createSelect(id, values, selected = '', labelMapper = (value) => value) {
  const select = document.createElement('select');
  select.id = id;
  select.className = 'form-select';
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = labelMapper(value);
    option.selected = String(value) === String(selected);
    select.append(option);
  });
  return select;
}

function createProfileRoleControls(label, tierId, tierNumId, roleData) {
  const row = document.createElement('div');
  row.className = 'pos-group';
  row.append(createTextElement('strong', label));
  row.append(createSelect(tierId, TIERS, roleData.tier));
  row.append(createSelect(tierNumId, TIER_NUMBERS, roleData.num));
  return row;
}

function renderAuthPanel() {
  const panel = qs('#auth-panel');
  if (!panel) return;

  const box = document.createElement('div');
  box.className = 'auth-fallback-box';

  if (!state.user) {
    box.append(createTextElement('p', 'OW HUB 로그인', 'auth-fallback-title'));
    box.append(createInput('login-email', { type: 'email', autocomplete: 'email', placeholder: '이메일' }));
    box.append(createInput('login-password', { type: 'password', autocomplete: 'current-password', placeholder: '비밀번호' }));
    box.append(createButton('btn-login', '로그인', 'btn btn-primary btn-block'));
    box.append(createButton('btn-register', '회원가입', 'btn btn-secondary btn-block'));
    box.append(createButton('btn-reset-password', '비밀번호 찾기', 'btn btn-secondary btn-block'));
    panel.replaceChildren(box);
    bindAuthButtons();
    return;
  }

  const btag = state.profile?.btag || state.user.email || '프로필을 설정하세요';
  const rating = getAverageRating(state.profile) || '신규';
  box.append(createTextElement('p', '로그인됨', 'auth-fallback-title'));
  box.append(createTextElement('div', btag, 'profile-btag'));
  box.append(createTextElement('div', `매너 평점: ${rating}`, 'profile-meta'));
  box.append(createButton('btn-logout', '로그아웃', 'btn btn-secondary btn-block', async () => {
    try {
      await logout();
      showToast('로그아웃되었습니다.', 'success');
    } catch (error) {
      showToast('로그아웃에 실패했습니다.', 'error');
    }
  }));
  panel.replaceChildren(box);
}

function bindAuthButtons() {
  qs('#btn-login')?.addEventListener('click', async () => {
    try {
      await loginWithEmail(getValue('login-email'), getValue('login-password'));
      showToast('로그인되었습니다.', 'success');
    } catch (error) {
      showToast(error.message || '로그인에 실패했습니다.', 'error');
    }
  });

  qs('#btn-register')?.addEventListener('click', async () => {
    try {
      await registerWithEmail(getValue('login-email'), getValue('login-password'));
      showToast('회원가입이 완료되었습니다. 인증 메일을 확인해주세요.', 'success');
    } catch (error) {
      showToast(error.message || '회원가입에 실패했습니다.', 'error');
    }
  });

  qs('#btn-reset-password')?.addEventListener('click', async () => {
    try {
      await resetPassword(getValue('login-email'));
      showToast('비밀번호 재설정 메일을 보냈습니다.', 'success');
    } catch (error) {
      showToast(error.message || '비밀번호 찾기에 실패했습니다.', 'error');
    }
  });
}

function renderPartyForm() {
  const form = qs('#party-form');
  if (!form) return;

  const btagInput = createInput('party-btag', {
    placeholder: '배틀태그#1234',
    value: state.profile?.btag || '',
  });

  const inlineRow = document.createElement('div');
  inlineRow.className = 'party-inline-row';
  inlineRow.append(createSelect('party-role', ROLE_LIST, '딜러', (role) => `${roleIcon(role)} ${role}`));
  inlineRow.append(createSelect('party-tier', TIERS, '플래티넘'));
  inlineRow.append(createSelect('party-tier-num', TIER_NUMBERS, '5'));

  const maxSelect = createSelect('party-maxp', [2, 3, 4, 5], 5, (n) => `${n}인 파티`);
  const desc = document.createElement('textarea');
  desc.id = 'party-desc';
  desc.className = 'form-textarea';
  desc.placeholder = '모집 내용 (마이크 유무, 경쟁/빠대, 분위기 등)';
  desc.maxLength = 300;
  desc.rows = 2;

  const createButtonEl = createButton('btn-create-party', '모집 시작', 'btn btn-primary btn-block', handleCreateParty);
  const children = [btagInput, inlineRow, maxSelect, desc, createButtonEl];
  if (!state.user) children.push(createTextElement('p', '로그인 후 모집글을 등록할 수 있습니다. 목록과 필터는 바로 확인할 수 있어요.', 'form-help'));
  form.replaceChildren(...children);
}

async function handleCreateParty() {
  if (!state.user) {
    showToast('로그인 후 파티를 모집할 수 있습니다.', 'error');
    openSidebar();
    return;
  }

  try {
    await createParty({
      btag: getValue('party-btag'),
      pos: getValue('party-role'),
      tier: getValue('party-tier'),
      tierNum: getValue('party-tier-num'),
      maxp: getValue('party-maxp'),
      desc: getValue('party-desc'),
      ownerRate: getAverageRating(state.profile) || '신규',
    }, state.user, { closeExisting: true });
    showToast('파티 모집글을 등록했습니다.', 'success');
  } catch (error) {
    showToast(error.message || '파티 등록에 실패했습니다.', 'error');
  }
}

function createFilterButton(value, type) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `filter-tag ${type === 'tier' ? 'filter-tag-tier' : 'filter-tag-role'}`;
  button.dataset.filterValue = value;
  button.dataset.filterType = type;

  const icon = ICON_URLS[value];
  if (icon) {
    const img = document.createElement('img');
    img.src = icon;
    img.alt = '';
    img.className = 'filter-icon';
    button.append(img);
  }
  button.append(document.createTextNode(type === 'role' ? value : value.replace('다이아몬드', '다이아').replace('그랜드마스터', '그마')));

  button.addEventListener('click', () => {
    const set = type === 'role' ? state.filters.roles : state.filters.tiers;
    if (set.has(value)) set.delete(value);
    else set.add(value);
    button.classList.toggle('active', set.has(value));
    button.classList.toggle('is-active', set.has(value));
    renderParties();
  });
  return button;
}

function renderFilters() {
  const roleFilter = qs('#role-filter');
  const tierFilter = qs('#tier-filter');
  if (roleFilter) replaceChildrenFromArray(roleFilter, ROLE_LIST, (role) => createFilterButton(role, 'role'));
  if (tierFilter) replaceChildrenFromArray(tierFilter, TIERS, (tier) => createFilterButton(tier, 'tier'));

  qs('#btn-filter-reset')?.addEventListener('click', () => {
    state.filters.roles.clear();
    state.filters.tiers.clear();
    qsa('.filter-tag').forEach((button) => button.classList.remove('active', 'is-active'));
    renderParties();
  });
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
  badges.append(createBadge(`${roleIcon(party.pos)} ${party.pos || '포지션'}`, roleClass(party.pos)));
  badges.append(createIconBadge(`${party.tier || '티어'} ${party.tierNum || ''}`.trim(), ICON_URLS[party.tier], 'badge-muted party-tier-badge'));
  badges.append(createBadge(`${(party.members?.length || 0) + 1}/${party.maxp || 5}`, 'badge-muted'));
  badges.append(createBadge(`평점 ${party.ownerRate || '신규'}`, 'badge-muted'));

  header.append(owner, badges);
  const desc = createTextElement('p', party.desc || '내용 없음', 'party-card-desc');

  const actions = document.createElement('div');
  actions.className = 'party-card-actions';

  if (state.user?.uid === party.uid) {
    const closeButton = document.createElement('button');
    closeButton.className = 'btn btn-danger';
    closeButton.textContent = '모집 종료';
    closeButton.addEventListener('click', async () => {
      try {
        await closeParty(party.id);
        showToast('모집을 종료했습니다.', 'success');
      } catch (error) {
        showToast('모집 종료에 실패했습니다.', 'error');
      }
    });
    actions.append(closeButton);
  } else {
    const sentPostIds = getSentRequestPostIds(state.matches, state.user?.uid);
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.type = 'button';
    button.textContent = sentPostIds.has(party.id) ? '신청됨' : '파티 신청';
    button.disabled = Boolean(state.user && sentPostIds.has(party.id));
    button.addEventListener('click', () => openRequestModal(party));
    actions.append(button);
  }

  card.append(header, desc, actions);
  return card;
}

function renderParties() {
  const list = qs('#party-list');
  if (!list) return;
  const parties = state.parties.filter(isPartyVisible);
  if (!parties.length) {
    renderEmptyState(list, '조건에 맞는 파티가 없습니다.');
    return;
  }
  replaceChildrenFromArray(list, parties, createPartyCard);
}

function openRequestModal(party) {
  if (!state.user) {
    showToast('로그인이 필요합니다.', 'error');
    openSidebar();
    return;
  }

  state.pendingRequestParty = party;
  const role = getProfileRole(state.profile, party.pos || '딜러');
  setText('request-modal-target', `${party.btag || '상대'}님의 ${party.pos || '파티'} 모집에 신청합니다.`);
  if (qs('#request-pos')) qs('#request-pos').value = party.pos || '딜러';
  if (qs('#request-tier')) qs('#request-tier').value = role.tier || party.tier || '배치';
  if (qs('#request-tier-num')) qs('#request-tier-num').value = role.num || party.tierNum || '1';
  if (qs('#request-btag')) qs('#request-btag').value = state.profile?.btag || state.user.email || '';
  if (qs('#request-msg')) qs('#request-msg').value = '파티 신청합니다.';

  qs('#request-modal')?.classList.add('is-active');
  qs('#request-modal')?.setAttribute('aria-hidden', 'false');
}

function closeRequestModal() {
  state.pendingRequestParty = null;
  qs('#request-modal')?.classList.remove('is-active');
  qs('#request-modal')?.setAttribute('aria-hidden', 'true');
}

async function handleConfirmRequest() {
  const party = state.pendingRequestParty;
  if (!party) return closeRequestModal();

  try {
    const role = getProfileRole(state.profile, party.pos || '딜러');
    await createMatchRequest({
      postId: party.id,
      fromBtag: getValue('request-btag') || state.profile?.btag || state.user?.email || '익명',
      reqPos: getValue('request-pos') || party.pos,
      reqTier: getValue('request-tier') || role.tier || party.tier,
      reqTierNum: getValue('request-tier-num') || role.num || party.tierNum,
      message: getValue('request-msg') || '파티 신청합니다.',
    }, state.user);
    showToast('파티 신청을 보냈습니다.', 'success');
    closeRequestModal();
  } catch (error) {
    showToast(error.message || '파티 신청에 실패했습니다.', 'error');
  }
}

function createRatingRow(targetUid, label, matchId) {
  const row = document.createElement('div');
  row.className = 'rating-row';
  row.append(createTextElement('span', label || '상대 평가', 'status-pill'));

  const contextId = matchId || 'global';
  hasRatedUser(targetUid, { matchId: contextId }).then((alreadyRated) => {
    if (alreadyRated) {
      row.replaceChildren(createTextElement('span', '평가 완료', 'status-pill'));
      return;
    }

    for (let score = 1; score <= 5; score += 1) {
      const button = document.createElement('button');
      button.className = 'rating-button';
      button.type = 'button';
      button.textContent = '★'.repeat(score);
      button.addEventListener('click', async () => {
        try {
          await rateUser(targetUid, score, { matchId: contextId });
          row.replaceChildren(createTextElement('span', '평가 완료', 'status-pill'));
          showToast('평가를 남겼습니다.', 'success');
        } catch (error) {
          showToast(error.message || '평가 저장에 실패했습니다.', 'error');
        }
      });
      row.append(button);
    }
  }).catch(() => {});

  return row;
}

function createAcceptedMatchCard(match) {
  const card = document.createElement('div');
  card.className = 'match-success-card';
  const isLeader = match.toUid === state.user.uid;
  const otherUid = isLeader ? match.fromUid : match.toUid;
  const otherBtag = isLeader ? match.fromBtag : match.toBtag;

  card.append(createTextElement('strong', '✅ 매칭 성공', 'match-success-title'));
  card.append(createTextElement('p', `${otherBtag || '상대'} 님과 매칭되었습니다. 배틀태그를 복사해서 게임에서 초대해보세요.`, 'request-meta'));

  const actions = document.createElement('div');
  actions.className = 'match-card-actions';
  const copyButton = document.createElement('button');
  copyButton.className = 'btn btn-primary';
  copyButton.textContent = '배틀태그 복사';
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(otherBtag || '');
      showToast('배틀태그를 복사했습니다.', 'success');
    } catch (error) {
      showToast('복사에 실패했습니다.', 'error');
    }
  });
  const doneButton = document.createElement('button');
  doneButton.className = 'btn btn-secondary';
  doneButton.textContent = '확인';
  doneButton.addEventListener('click', () => removeMatch(match.id));
  actions.append(copyButton, doneButton);
  card.append(actions, createRatingRow(otherUid, `${getPublicBattleTagName(otherBtag)} 평가`, match.id));
  return card;
}

function renderNotifications() {
  const list = qs('#notification-list');
  if (!list) return;

  if (!state.user) {
    renderEmptyState(list, '로그인 후 알림을 확인할 수 있습니다.');
    hideElement(qs('#nav-new-badge'));
    hideElement(qs('#side-new-badge'));
    return;
  }

  const related = getRelatedMatches();
  const incoming = related.filter((match) => match.toUid === state.user.uid && match.status !== 'accepted');
  const accepted = related.filter((match) => match.status === 'accepted');
  const hasNew = incoming.some((match) => match.status === 'pending') || accepted.length > 0;
  [qs('#nav-new-badge'), qs('#side-new-badge')].forEach((badge) => hasNew ? showElement(badge) : hideElement(badge));

  const cards = [...accepted, ...incoming];
  if (!cards.length) {
    renderEmptyState(list, '새 알림이 없습니다.');
    return;
  }

  replaceChildrenFromArray(list, cards, (match) => {
    if (match.status === 'accepted') return createAcceptedMatchCard(match);

    const card = document.createElement('div');
    card.className = 'request-card';
    card.append(createTextElement('strong', `${match.fromBtag || '익명'} 님의 파티 신청`, 'request-title'));
    card.append(createTextElement('p', `${match.reqPos || ''} / ${match.reqTier || ''} ${match.reqTierNum || ''} / 상태: ${match.status}`, 'request-meta'));

    const actions = document.createElement('div');
    actions.className = 'request-card-actions';
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
    card.append(actions);
    return card;
  });
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

  const label = document.createElement('label');
  label.className = 'form-label';
  label.htmlFor = 'profile-btag';
  label.textContent = '배틀태그';

  const btagInput = createInput('profile-btag', {
    placeholder: '예: Player#1234',
    value: state.profile?.btag || '',
  });

  form.replaceChildren(
    label,
    btagInput,
    createProfileRoleControls('🛡️ 탱커', 'profile-tank-tier', 'profile-tank-num', tank),
    createProfileRoleControls('⚔️ 딜러', 'profile-dps-tier', 'profile-dps-num', dps),
    createProfileRoleControls('💉 지원', 'profile-support-tier', 'profile-support-num', support),
    createButton('btn-save-profile', '정보 저장', 'btn btn-primary btn-block', handleSaveProfile)
  );
}

async function handleSaveProfile() {
  if (!state.user) return showToast('로그인이 필요합니다.', 'error');
  try {
    state.profile = await saveProfile(state.user.uid, {
      btag: getValue('profile-btag'),
      tankTier: getValue('profile-tank-tier'),
      tankNum: getValue('profile-tank-num'),
      dpsTier: getValue('profile-dps-tier'),
      dpsNum: getValue('profile-dps-num'),
      supportTier: getValue('profile-support-tier'),
      supportNum: getValue('profile-support-num'),
    });
    renderAuthPanel();
    renderPartyForm();
    showToast('프로필을 저장했습니다.', 'success');
  } catch (error) {
    showToast(error.message || '프로필 저장에 실패했습니다.', 'error');
  }
}

function bindStaticEvents() {
  qs('#hamburger-btn')?.addEventListener('click', toggleSidebar);
  qs('#sidebar-overlay')?.addEventListener('click', closeSidebar);
  qs('#btn-cancel-request')?.addEventListener('click', closeRequestModal);
  qs('#btn-confirm-send')?.addEventListener('click', handleConfirmRequest);
  qs('#request-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'request-modal') closeRequestModal();
  });
  qsa('[data-page-target]').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.pageTarget)));
}

function startListeners() {
  try {
    state.unsubParties?.();
    state.unsubParties = watchParties((snap) => {
      state.parties = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderParties();
    });
  } catch (error) {
    console.error('[index:watchParties]', error);
  }

  try {
    state.unsubMatches?.();
    state.unsubMatches = watchMatches((snap) => {
      state.matches = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      renderParties();
      renderNotifications();
    });
  } catch (error) {
    console.error('[index:watchMatches]', error);
  }
}

async function handleAuth(user) {
  state.user = user;
  state.profile = user ? await getProfile(user.uid).catch(() => null) : null;
  safeRun('renderAuthPanel', renderAuthPanel);
  safeRun('renderPartyForm', renderPartyForm);
  safeRun('renderProfileForm', renderProfileForm);
  safeRun('renderParties', renderParties);
  safeRun('renderNotifications', renderNotifications);
}

function exposeHooks() {
  window.OWHub = window.OWHub || {};
  window.OWHub.main = { showPage, toggleSidebar, renderParties, renderNotifications, openRequestModal, closeRequestModal };
  window.toggleSidebar = toggleSidebar;
  window.showPageAndClose = showPage;
}

function init() {
  safeRun('renderAuthPanel', renderAuthPanel);
  safeRun('renderPartyForm', renderPartyForm);
  safeRun('renderFilters', renderFilters);
  safeRun('renderProfileForm', renderProfileForm);
  safeRun('renderNotifications', renderNotifications);
  safeRun('bindStaticEvents', bindStaticEvents);
  safeRun('exposeHooks', exposeHooks);
  safeRun('startListeners', startListeners);

  watchAuth((user) => {
    handleAuth(user).catch((error) => {
      console.error('[index:auth]', error);
      showToast('로그인 상태를 불러오는 중 문제가 발생했습니다.', 'error');
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
