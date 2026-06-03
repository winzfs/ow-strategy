function hasMainController() {
  return Boolean(window.OWHub?.main?.toggleSidebar);
}

function setSidebarOpen(isOpen) {
  const sidebar = document.querySelector('#sidebar');
  const overlay = document.querySelector('#sidebar-overlay');
  const button = document.querySelector('#hamburger-btn');

  if (sidebar) {
    sidebar.classList.toggle('is-active', isOpen);
    sidebar.classList.toggle('active', isOpen);
  }

  if (overlay) {
    overlay.classList.toggle('is-active', isOpen);
    overlay.classList.toggle('active', isOpen);
  }

  if (button) {
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }
}

function initSidebarFallback() {
  const button = document.querySelector('#hamburger-btn');
  const sidebar = document.querySelector('#sidebar');
  const overlay = document.querySelector('#sidebar-overlay');

  if (!button || !sidebar) return;

  button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', function (event) {
    if (hasMainController()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const isOpen = sidebar.classList.contains('is-active') || sidebar.classList.contains('active');
    setSidebarOpen(!isOpen);
  }, true);

  if (overlay) {
    overlay.addEventListener('click', function (event) {
      if (hasMainController()) return;

      event.stopImmediatePropagation();
      setSidebarOpen(false);
    }, true);
  }

  sidebar.querySelectorAll('[data-page-target], a').forEach(function (item) {
    item.addEventListener('click', function () {
      if (hasMainController()) return;
      setSidebarOpen(false);
    });
  });
}

document.addEventListener('DOMContentLoaded', initSidebarFallback);
