/*
 * Community page bootstrap
 *
 * This module owns the community page behavior so commu.html can stay focused
 * on structure. It keeps all user-generated values rendered through DOM APIs.
 */

import {
  addComment,
  createCommunityPost,
  deletePost,
  getComments,
  toggleLike,
  watchCommunityPosts,
} from './community.js';
import { auth, db, COLLECTIONS } from './firebase.js';
import { getProfile, getPublicBattleTagName } from './profile.js';
import { isAdminUser, logout, watchAuth } from './auth.js';
import {
  createTextElement,
  renderEmptyState,
  replaceChildrenFromArray,
  qs,
  showToast,
} from './ui.js';
import { doc, getDoc, getDocs, query, collection, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const state = {
  user: null,
  profile: null,
  posts: [],
  openCommentId: null,
  unsubPosts: null,
};

function formatRelativeTime(timestamp) {
  if (!timestamp) return '방금 전';
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

function getAuthUI() {
  return qs('#auth-ui');
}

function getSidebarLogout() {
  return qs('#sidebar-logout-container');
}

function updateAuthUI() {
  const authUI = getAuthUI();
  const sidebarLogout = getSidebarLogout();
  const btagDisplay = qs('#my-btag-display');

  if (state.user) {
    const btag = getPublicBattleTagName(state.profile?.btag, '익명 요원');
    if (btagDisplay) btagDisplay.textContent = state.profile?.btag || '익명 요원';

    const logoutButton = document.createElement('button');
    logoutButton.className = 'btn btn-secondary';
    logoutButton.textContent = '로그아웃';
    logoutButton.addEventListener('click', async () => {
      await logout();
      location.reload();
    });

    const sidebarButton = logoutButton.cloneNode(true);
    sidebarButton.className = 'btn btn-secondary btn-block';
    sidebarButton.addEventListener('click', async () => {
      await logout();
      location.reload();
    });

    if (authUI) authUI.replaceChildren(logoutButton);
    if (sidebarLogout) sidebarLogout.replaceChildren(sidebarButton);
    loadMyPosts().catch(console.error);
    return;
  }

  if (btagDisplay) btagDisplay.textContent = '-';

  const loginButton = document.createElement('button');
  loginButton.className = 'btn btn-primary';
  loginButton.textContent = '로그인';
  loginButton.addEventListener('click', () => {
    location.href = 'index.html';
  });

  const sidebarButton = loginButton.cloneNode(true);
  sidebarButton.className = 'btn btn-primary btn-block';
  sidebarButton.addEventListener('click', () => {
    location.href = 'index.html';
  });

  if (authUI) authUI.replaceChildren(loginButton);
  if (sidebarLogout) sidebarLogout.replaceChildren(sidebarButton);
}

function toggleSidebar() {
  const sidebar = qs('#sidebar');
  const overlay = qs('#sidebar-overlay');
  const isOpen = sidebar?.classList.contains('is-active');

  sidebar?.classList.toggle('is-active', !isOpen);
  overlay?.classList.toggle('is-active', !isOpen);

  if (!isOpen) loadMyPosts().catch(console.error);
}

function createPostActions(post) {
  const actions = document.createElement('div');
  actions.className = 'community-post-actions';

  const likeButton = document.createElement('button');
  likeButton.className = 'community-action';
  likeButton.textContent = `🧡 추천 ${(post.likes || []).length}`;
  likeButton.addEventListener('click', async () => {
    try {
      await toggleLike(post.id, state.user?.uid, post.uid, post.likes || []);
    } catch (error) {
      showToast(error.message || '추천 처리에 실패했습니다.', 'error');
    }
  });

  const commentButton = document.createElement('button');
  commentButton.className = 'community-action';
  commentButton.textContent = `💬 댓글 ${post.commentCount || 0}`;
  commentButton.addEventListener('click', () => toggleComments(post.id));

  actions.append(likeButton, commentButton);
  return actions;
}

function createDeleteButton(post) {
  const canDelete = state.user && (state.user.uid === post.uid || isAdminUser(state.user));
  if (!canDelete) return null;

  const button = document.createElement('button');
  button.className = 'community-action';
  button.style.color = '#ff3c3c';
  button.textContent = '삭제';
  button.addEventListener('click', async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    try {
      await deletePost(post.id);
      showToast('게시글을 삭제했습니다.', 'success');
    } catch (error) {
      console.error('[community:delete]', error);
      showToast('삭제 중 문제가 발생했습니다.', 'error');
    }
  });
  return button;
}

function createCommentPanel(postId) {
  const panel = document.createElement('div');
  panel.className = 'comment-panel';
  panel.id = `cmt-sec-${postId}`;
  panel.hidden = state.openCommentId !== postId;

  const list = document.createElement('div');
  list.className = 'comment-list';
  list.id = `cmt-list-${postId}`;

  const form = document.createElement('div');
  form.className = 'comment-form';

  const input = document.createElement('input');
  input.className = 'form-input';
  input.id = `cmt-in-${postId}`;
  input.placeholder = '댓글 입력...';

  const button = document.createElement('button');
  button.className = 'btn btn-primary';
  button.textContent = '등록';
  button.addEventListener('click', () => submitComment(postId, input));

  form.append(input, button);
  panel.append(list, form);
  return panel;
}

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'community-post';
  article.id = `post-${post.id}`;

  const meta = document.createElement('div');
  meta.className = 'community-post-meta';

  const authorTime = document.createElement('span');
  const author = document.createElement('b');
  author.className = 'community-post-author';
  author.textContent = post.author || '익명';
  authorTime.append(author, document.createTextNode(` • ${formatRelativeTime(post.createdAt)}`));

  const deleteButton = createDeleteButton(post);
  meta.append(authorTime);
  if (deleteButton) meta.append(deleteButton);

  const title = createTextElement('h4', post.title || '제목 없음', 'community-post-title');
  const content = createTextElement('p', post.content || '', 'community-post-content');
  const actions = createPostActions(post);
  const commentPanel = createCommentPanel(post.id);

  article.append(meta, title, content, actions, commentPanel);
  return article;
}

function renderPosts() {
  const list = qs('#comm-list');
  if (!list) return;

  const visiblePosts = state.posts.filter((post) => !post.deleted);
  if (!visiblePosts.length) {
    renderEmptyState(list, '아직 게시글이 없습니다.');
    return;
  }

  replaceChildrenFromArray(list, visiblePosts, createPostElement);
  if (state.openCommentId) loadCommentList(state.openCommentId).catch(console.error);
}

async function loadCommentList(postId) {
  const list = qs(`#cmt-list-${postId}`);
  if (!list) return;

  const comments = await getComments(postId);
  if (!comments.length) {
    renderEmptyState(list, '아직 댓글이 없습니다.');
    return;
  }

  replaceChildrenFromArray(list, comments, (comment) => {
    const item = document.createElement('div');
    item.className = 'comment-item';

    const author = document.createElement('b');
    author.textContent = comment.author || '익명';
    item.append(author, document.createTextNode(`: ${comment.content || ''}`));
    return item;
  });
}

function toggleComments(postId) {
  state.openCommentId = state.openCommentId === postId ? null : postId;
  renderPosts();
}

async function submitComment(postId, input) {
  try {
    await addComment(postId, input.value, state.user, state.profile);
    input.value = '';
    await loadCommentList(postId);
    showToast('댓글을 등록했습니다.', 'success');
  } catch (error) {
    showToast(error.message || '댓글 등록에 실패했습니다.', 'error');
  }
}

async function submitPost() {
  const titleInput = qs('#comm-title');
  const contentInput = qs('#comm-content');

  try {
    await createCommunityPost({
      title: titleInput?.value,
      content: contentInput?.value,
    }, state.user, state.profile);

    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    showToast('게시글이 등록되었습니다.', 'success');
  } catch (error) {
    showToast(error.message || '게시글 등록에 실패했습니다.', 'error');
  }
}

async function loadMyPosts() {
  const list = qs('#my-posts-list');
  if (!list || !state.user) return;

  const myPostsQuery = query(collection(db, COLLECTIONS.community), where('uid', '==', state.user.uid));
  const snap = await getDocs(myPostsQuery);
  const posts = snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (!posts.length) {
    renderEmptyState(list, '작성한 글이 없습니다.');
    return;
  }

  replaceChildrenFromArray(list, posts, (post) => {
    const item = document.createElement('div');
    item.className = 'my-post-item';
    item.addEventListener('click', () => {
      location.hash = `post-${post.id}`;
      toggleSidebar();
    });

    const title = createTextElement('div', post.title || '제목 없음', 'my-post-title');
    const stats = createTextElement('div', `🧡 ${(post.likes || []).length}  💬 ${post.commentCount || 0}`, 'my-post-stats');
    item.append(title, stats);
    return item;
  });
}

function toggleMyPosts() {
  const list = qs('#my-posts-list');
  const arrow = qs('#my-posts-arrow');
  if (!list) return;

  const shouldOpen = list.hidden;
  list.hidden = !shouldOpen;
  if (arrow) arrow.textContent = shouldOpen ? '▼' : '▶';
}

function bindEvents() {
  qs('#btn-comm-post')?.addEventListener('click', submitPost);
  qs('#sidebar-toggle')?.addEventListener('click', toggleSidebar);
  qs('#sidebar-overlay')?.addEventListener('click', toggleSidebar);
  qs('#my-posts-toggle')?.addEventListener('click', toggleMyPosts);
}

function startPostListener() {
  if (state.unsubPosts) state.unsubPosts();
  state.unsubPosts = watchCommunityPosts((snap) => {
    state.posts = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    renderPosts();
  });
}

function exposeLegacyHooks() {
  window.toggleSidebar = toggleSidebar;
  window.toggleMyPosts = toggleMyPosts;
  window.OWHub = window.OWHub || {};
  window.OWHub.community = {
    toggleSidebar,
    toggleMyPosts,
    renderPosts,
    loadMyPosts,
    showToast,
  };
}

async function handleAuth(user) {
  state.user = user;
  state.profile = user ? await getProfile(user.uid) : null;
  updateAuthUI();
  renderPosts();
}

function initCommunityPage() {
  bindEvents();
  exposeLegacyHooks();
  startPostListener();
  watchAuth((user) => {
    handleAuth(user).catch((error) => {
      console.error('[community:auth]', error);
      showToast('로그인 상태를 불러오는 중 문제가 발생했습니다.', 'error');
    });
  });
}

document.addEventListener('DOMContentLoaded', initCommunityPage);
