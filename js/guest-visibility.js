/*
 * Guest visibility fixes
 *
 * The party finder should remain visible before login. Actions that require login
 * should show a login-required toast through the main controller instead of being
 * hidden or disabled.
 */

function enableGuestPartyButtons(root = document) {
  const buttons = root.querySelectorAll('.party-card-actions .btn-primary[disabled]');
  buttons.forEach((button) => {
    if (button.textContent.trim() !== '파티 신청') return;
    button.disabled = false;
    button.removeAttribute('aria-disabled');
  });
}

function initGuestVisibility() {
  enableGuestPartyButtons();

  const list = document.querySelector('#party-list');
  if (!list) return;

  const observer = new MutationObserver(() => enableGuestPartyButtons(list));
  observer.observe(list, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', initGuestVisibility);
