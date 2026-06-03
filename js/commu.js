/* Community page bootstrap */

import { showToast } from './ui.js';

function exposeCommunityBootstrap() {
  window.OWHub = window.OWHub || {};
  window.OWHub.community = {
    ...(window.OWHub.community || {}),
    showToast,
  };
}

document.addEventListener('DOMContentLoaded', exposeCommunityBootstrap);
