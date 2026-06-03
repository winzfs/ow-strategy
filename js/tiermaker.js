/*
 * OW Hub tier maker module
 *
 * The current tiermaker.html has inline drag/drop logic. Move that logic here
 * gradually when the page is connected to this module.
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

export function createHeroElement(id, role) {
  const hero = document.createElement('div');
  hero.className = 'hero-chip';
  hero.style.backgroundImage = `url('${HERO_IMAGE_PATH}${id}.png')`;
  hero.dataset.role = role;
  hero.dataset.id = id;

  const label = document.createElement('span');
  label.className = 'hero-chip-label';
  label.textContent = id;
  hero.appendChild(label);

  return hero;
}

export function createTierRow(tier) {
  const row = document.createElement('div');
  row.className = 'tier-row';

  const label = document.createElement('div');
  label.className = 'tier-label';
  label.contentEditable = 'true';
  label.textContent = tier.name;
  label.style.background = tier.color;

  const dropzone = document.createElement('div');
  dropzone.className = 'tier-dropzone dropzone';

  row.append(label, dropzone);
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
