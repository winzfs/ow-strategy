/*
 * Index page bootstrap
 *
 * This file can be linked from index.html before moving inline scripts into modules.
 */

import { closeAllModals, showToast } from './ui.js';

function hideLegacyDebugUI() {
  const debugConsole = document.getElementById('debug-console');
  if (debugConsole) {
    debugConsole.style.display = 'none';
    debugConsole.hidden = true;
  }

  document.querySelectorAll('[data-debug-toggle="true"], .debug-toggle').forEach((button) => {
    button.style.display = 'none';
    button.hidden = true;
  });
}

function exposeSharedUI() {
  window.OWHub = window.OWHub || {};
  window.OWHub.ui = {
    ...(window.OWHub.ui || {}),
    closeAllModals,
    showToast,
  };
}

document.addEventListener('DOMContentLoaded', () => {
  hideLegacyDebugUI();
  exposeSharedUI();
});
