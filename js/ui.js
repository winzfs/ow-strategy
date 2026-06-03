/*
 * OW Hub shared UI helpers
 *
 * Keep small, framework-free DOM helpers here while the app remains static HTML.
 * Avoid putting feature-specific business logic in this file.
 */

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function showElement(element) {
  if (!element) return;
  element.classList.remove('is-hidden');
  element.hidden = false;
}

export function hideElement(element) {
  if (!element) return;
  element.classList.add('is-hidden');
  element.hidden = true;
}

export function toggleElement(element, force) {
  if (!element) return false;
  const shouldShow = typeof force === 'boolean' ? force : element.classList.contains('is-hidden') || element.hidden;
  if (shouldShow) showElement(element);
  else hideElement(element);
  return shouldShow;
}

export function openModal(modal) {
  if (!modal) return;
  modal.classList.add('is-active');
  modal.style.display = 'flex';
}

export function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-active');
  modal.style.display = 'none';
}

export function closeAllModals() {
  qsa('.modal-overlay').forEach(closeModal);
}

export function setButtonLoading(button, isLoading, loadingText = '처리 중...') {
  if (!button) return;

  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add('is-disabled');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('is-disabled');
    delete button.dataset.originalText;
  }
}

export function ensureToastRoot() {
  let root = qs('#toast-root');
  if (root) return root;

  root = document.createElement('div');
  root.id = 'toast-root';
  root.className = 'toast-root';
  document.body.appendChild(root);
  return root;
}

export function showToast(message, type = 'default', options = {}) {
  const { duration = 2600 } = options;
  const root = ensureToastRoot();
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast-error' : ''} ${type === 'success' ? 'toast-success' : ''}`.trim();
  toast.textContent = String(message ?? '');
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, duration);
}

export function renderEmptyState(container, message) {
  if (!container) return;
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = message;
  container.replaceChildren(empty);
}

export function replaceChildrenFromArray(container, items, renderItem) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => {
    const child = renderItem(item, index);
    if (child) fragment.appendChild(child);
  });
  container.replaceChildren(fragment);
}

export function bindClickOutside(overlay, panel, onClose) {
  if (!overlay || !panel || typeof onClose !== 'function') return;
  overlay.addEventListener('click', (event) => {
    if (!panel.contains(event.target)) onClose(event);
  });
}
