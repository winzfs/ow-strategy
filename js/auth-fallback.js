import {
  loginWithEmail,
  logout,
  registerWithEmail,
  resetPassword,
  watchAuth,
} from './auth.js';
import { getProfile, getAverageRating } from './profile.js';

function qs(selector, root = document) {
  return root.querySelector(selector);
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

function setProfileSummary(text) {
  const legacySummary = qs('#profile-summary');
  if (legacySummary) legacySummary.textContent = text;
}

function renderLoggedOut(panel) {
  panel.innerHTML = `
    <div class="auth-fallback-box">
      <p class="auth-fallback-title">OW HUB 로그인</p>
      <input class="form-input" id="login-email" type="email" autocomplete="email" placeholder="이메일">
      <input class="form-input" id="login-password" type="password" autocomplete="current-password" placeholder="비밀번호">
      <button class="btn btn-primary btn-block" id="btn-login" type="button">로그인</button>
      <button class="btn btn-secondary btn-block" id="btn-register" type="button">회원가입</button>
      <button class="btn btn-secondary btn-block" id="btn-reset-password" type="button">비밀번호 찾기</button>
    </div>
  `;

  qs('#btn-login')?.addEventListener('click', async function () {
    try {
      await loginWithEmail(getValue('login-email'), getValue('login-password'));
      toast('로그인되었습니다.', 'success');
    } catch (error) {
      console.error('[auth-fallback:login]', error);
      toast(error.message || '로그인에 실패했습니다.', 'error');
    }
  });

  qs('#btn-register')?.addEventListener('click', async function () {
    try {
      await registerWithEmail(getValue('login-email'), getValue('login-password'));
      toast('회원가입이 완료되었습니다. 인증 메일을 확인해주세요.', 'success');
    } catch (error) {
      console.error('[auth-fallback:register]', error);
      toast(error.message || '회원가입에 실패했습니다.', 'error');
    }
  });

  qs('#btn-reset-password')?.addEventListener('click', async function () {
    try {
      await resetPassword(getValue('login-email'));
      toast('비밀번호 재설정 메일을 보냈습니다.', 'success');
    } catch (error) {
      console.error('[auth-fallback:reset]', error);
      toast(error.message || '비밀번호 재설정에 실패했습니다.', 'error');
    }
  });

  setProfileSummary('로그인 필요');
}

async function renderLoggedIn(panel, user) {
  let profile = null;
  try {
    profile = await getProfile(user.uid);
  } catch (error) {
    console.warn('[auth-fallback:profile]', error);
  }

  const btag = profile?.btag || user.email || '프로필을 설정하세요';
  const rating = getAverageRating(profile) || '신규';

  panel.innerHTML = `
    <div class="auth-fallback-box">
      <p class="auth-fallback-title">로그인됨</p>
      <div class="profile-btag">${btag}</div>
      <div class="profile-meta">매너 평점: ${rating}</div>
      <button class="btn btn-secondary btn-block" id="btn-logout" type="button">로그아웃</button>
    </div>
  `;

  qs('#btn-logout')?.addEventListener('click', async function () {
    try {
      await logout();
      toast('로그아웃되었습니다.', 'success');
    } catch (error) {
      console.error('[auth-fallback:logout]', error);
      toast('로그아웃에 실패했습니다.', 'error');
    }
  });

  setProfileSummary(btag);
}

function initAuthFallback() {
  const panel = qs('#auth-panel');
  if (!panel) return;

  watchAuth(function (user) {
    if (user) {
      renderLoggedIn(panel, user);
    } else {
      renderLoggedOut(panel);
    }
  });
}

document.addEventListener('DOMContentLoaded', initAuthFallback);
