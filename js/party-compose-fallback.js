import { auth } from './firebase.js';
import { createParty } from './party.js';
import { getAverageRating, getProfile } from './profile.js';

function qs(selector) {
  return document.querySelector(selector);
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

function getValue(id) {
  return qs(`#${id}`)?.value || '';
}

async function handleCreatePartyFallback(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const user = auth.currentUser;
  if (!user) {
    toast('로그인 후 파티를 모집할 수 있습니다.', 'error');
    document.querySelector('#sidebar')?.classList.add('is-active', 'active');
    document.querySelector('#sidebar-overlay')?.classList.add('is-active', 'active');
    return;
  }

  try {
    const profile = await getProfile(user.uid).catch(function () { return null; });
    await createParty({
      btag: getValue('party-btag') || profile?.btag || user.email || '',
      pos: getValue('party-role'),
      tier: getValue('party-tier'),
      tierNum: getValue('party-tier-num'),
      maxp: getValue('party-maxp'),
      desc: getValue('party-desc'),
      ownerRate: getAverageRating(profile) || '신규',
    }, user, { closeExisting: true });
    toast('파티 모집글을 등록했습니다.', 'success');
    const desc = qs('#party-desc');
    if (desc) desc.value = '';
  } catch (error) {
    console.error('[party-compose-fallback]', error);
    toast(error.message || '파티 등록에 실패했습니다.', 'error');
  }
}

function initPartyComposeFallback() {
  const button = qs('#btn-create-party');
  if (!button) return;
  button.addEventListener('click', handleCreatePartyFallback, true);
}

document.addEventListener('DOMContentLoaded', initPartyComposeFallback);
