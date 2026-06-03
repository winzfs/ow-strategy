/*
 * OW Hub tier maker module
 */

export const HERO_IMAGE_PATH = 'img/heroes/';

export const HEROES_BY_ROLE = Object.freeze({
  tank: ['dva', 'doomfist', 'junkerqueen', 'orisa', 'ramattra', 'reinhardt', 'roadhog', 'sigma', 'winston', 'wreckingball', 'zarya', 'mauga', 'hazard'],
  damage: ['ashe', 'bastion', 'cassidy', 'echo', 'genji', 'hanzo', 'junkrat', 'mei', 'pharah', 'reaper', 'sojourn', 'soldier76', 'sombra', 'symmetra', 'torbjorn', 'tracer', 'widowmaker', 'venture', 'freja', 'vendetta'],
  support: ['ana', 'baptiste', 'brigitte', 'illari', 'kiriko', 'lifeweaver', 'lucio', 'mercy', 'moira', 'zenyatta', 'juno', 'wuyang'],
});

export const DEFAULT_TIERS = Object.freeze([
  { name: 'S', color: '#ff7f7f' },
  { name: 'A', color: '#ffbf7f' },
  { name: 'B', color: '#ffff7f' },
  { name: 'C', color: '#7fff7f' },
  { name: 'D', color: '#7fbfff' },
]);

const state = {
  currentDrag: null,
  touchOffset: { x: 0, y: 0 },
  activeTab: 'tank',
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function createHeroElement(id, role) {
  const hero = document.createElement('div');
  hero.className = 'hero-chip';
  hero.style.backgroundImage = `url('${HERO_IMAGE_PATH}${id}.png')`;
  hero.dataset.role = role;
  hero.dataset.id = id;

  const label = document.createElement('span');
  label.className = 'hero-chip-label';
  label.textContent = id;

  const deleteOverlay = document.createElement('button');
  deleteOverlay.className = 'del-overlay';
  deleteOverlay.type = 'button';
  deleteOverlay.textContent = '×';
  deleteOverlay.addEventListener('click', (event) => {
    event.stopPropagation();
    returnToRoster(hero);
  });

  hero.append(label, deleteOverlay);
  hero.addEventListener('touchstart', handleTouchStart, { passive: false });
  hero.addEventListener('touchmove', handleTouchMove, { passive: false });
  hero.addEventListener('touchend', handleTouchEnd);
  hero.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!hero.closest('.tier-row')) return;
    const isSelected = hero.classList.contains('selected');
    qsa('.hero-chip').forEach((item) => item.classList.remove('selected'));
    if (!isSelected) hero.classList.add('selected');
  });

  return hero;
}

export function createTierRow(tier) {
  const row = document.createElement('div');
  row.className = 'tier-row';

  const removeButton = document.createElement('button');
  removeButton.className = 'row-del';
  removeButton.type = 'button';
  removeButton.textContent = '×';
  removeButton.addEventListener('click', () => removeTierRow(row));

  const label = document.createElement('div');
  label.className = 'tier-label';
  label.contentEditable = 'true';
  label.textContent = tier.name;
  label.style.background = tier.color;

  const dropzone = document.createElement('div');
  dropzone.className = 'tier-dropzone dropzone';

  row.append(removeButton, label, dropzone);
  return row;
}

export function buildDefaultTierBoard(container, tiers = DEFAULT_TIERS) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  tiers.forEach((tier) => fragment.appendChild(createTierRow(tier)));
  container.replaceChildren(fragment);
}

export function buildHeroRoster(container, role) {
  if (!container) return;
  const fragment = document.createDocumentFragment();
  (HEROES_BY_ROLE[role] || []).forEach((id) => {
    fragment.appendChild(createHeroElement(id, role));
  });
  container.replaceChildren(fragment);
}

export function returnToRoster(heroEl) {
  if (!heroEl) return;
  const role = heroEl.dataset.role;
  const roster = qs(`#roster-${role}`);
  if (!roster) return;

  heroEl.classList.remove('selected', 'dragging', 'is-dragging', 'placeholder', 'is-placeholder');
  heroEl.style.position = '';
  heroEl.style.left = '';
  heroEl.style.top = '';
  heroEl.style.width = '';
  heroEl.style.height = '';
  roster.appendChild(heroEl);
}

function handleTouchStart(event) {
  const touch = event.touches[0];
  const target = event.currentTarget;

  qsa('.hero-chip').forEach((hero) => hero.classList.remove('selected'));
  state.currentDrag = target;

  const rect = target.getBoundingClientRect();
  state.touchOffset.x = touch.clientX - rect.left;
  state.touchOffset.y = touch.clientY - rect.top;

  target.classList.add('dragging', 'is-dragging');
  target.style.left = `${touch.clientX - state.touchOffset.x}px`;
  target.style.top = `${touch.clientY - state.touchOffset.y}px`;
}

function handleTouchMove(event) {
  if (!state.currentDrag) return;
  event.preventDefault();

  const touch = event.touches[0];
  state.currentDrag.style.left = `${touch.clientX - state.touchOffset.x}px`;
  state.currentDrag.style.top = `${touch.clientY - state.touchOffset.y}px`;
}

function handleTouchEnd(event) {
  if (!state.currentDrag) return;

  const dragged = state.currentDrag;
  dragged.classList.remove('dragging', 'is-dragging');
  dragged.style.position = '';
  dragged.style.left = '';
  dragged.style.top = '';

  const touch = event.changedTouches[0];
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const dropzone = elementBelow ? elementBelow.closest('.dropzone') : null;

  if (dropzone) dropzone.appendChild(dragged);
  else returnToRoster(dragged);

  state.currentDrag = null;
}

export function showBoard(role) {
  state.activeTab = role;

  qsa('.tier-tab-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.role === role);
    button.classList.toggle('is-active', button.dataset.role === role);
  });

  qsa('.tier-board-container').forEach((board) => {
    const isActive = board.dataset.role === role;
    board.classList.toggle('active', isActive);
    board.classList.toggle('is-active', isActive);
  });
}

export function addTierRow() {
  const container = qs(`#board-${state.activeTab} .tier-box`);
  if (!container) return;
  container.appendChild(createTierRow({ name: 'N', color: '#888888' }));
}

export function removeTierRow(row) {
  if (!row) return;
  row.querySelectorAll('.hero-chip').forEach(returnToRoster);
  row.remove();
}

export function saveImage() {
  qsa('.hero-chip').forEach((hero) => hero.classList.remove('selected'));
  const target = qs('#capture-area');
  if (!target || !window.html2canvas) return;

  window.html2canvas(target, {
    backgroundColor: '#121418',
    scale: 2,
  }).then((canvas) => {
    const link = document.createElement('a');
    link.download = `ow2-${state.activeTab}-tierlist.png`;
    link.href = canvas.toDataURL();
    link.click();
  });
}

function bindEvents() {
  qsa('.tier-tab-button').forEach((button) => {
    button.addEventListener('click', () => showBoard(button.dataset.role));
  });

  qs('#btn-add-tier')?.addEventListener('click', addTierRow);
  qs('#btn-save-image')?.addEventListener('click', saveImage);

  document.addEventListener('click', () => {
    qsa('.hero-chip').forEach((hero) => hero.classList.remove('selected'));
  });
}

function initBoards() {
  ['tank', 'damage', 'support'].forEach((role) => {
    buildDefaultTierBoard(qs(`#board-${role} .tier-box`));
    buildHeroRoster(qs(`#roster-${role}`), role);
  });
  showBoard('tank');
}

export function initTierMaker() {
  initBoards();
  bindEvents();

  window.OWHub = window.OWHub || {};
  window.OWHub.tiermaker = {
    showBoard,
    addTierRow,
    saveImage,
    returnToRoster,
  };
}

document.addEventListener('DOMContentLoaded', initTierMaker);
