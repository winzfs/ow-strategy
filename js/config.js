/*
 * OW Hub public app configuration
 *
 * Do not place secrets here. This file is shipped to the browser.
 */

export const APP_CONFIG = Object.freeze({
  appName: 'OW Hub',
  appUrl: 'https://owhub.vercel.app',
  supportEmail: '',
  discordInviteUrl: '',
});

export const ADMIN_EMAILS = Object.freeze([
  'jazzhjm@gmail.com',
]);

export const ROLES = Object.freeze({
  tank: '탱커',
  dps: '딜러',
  support: '지원',
});

export const ROLE_LIST = Object.freeze([
  ROLES.tank,
  ROLES.dps,
  ROLES.support,
]);

export const TIERS = Object.freeze([
  '배치',
  '브론즈',
  '실버',
  '골드',
  '플래티넘',
  '다이아몬드',
  '마스터',
  '그랜드마스터',
  '챔피언',
]);

export const TIER_NUMBERS = Object.freeze(['1', '2', '3', '4', '5']);

export const PARTY_LIMITS = Object.freeze({
  minMembers: 2,
  maxMembers: 5,
  descriptionMaxLength: 300,
  requestMessageMaxLength: 300,
  activeHours: 2,
});

export const COMMUNITY_LIMITS = Object.freeze({
  titleMaxLength: 80,
  contentMaxLength: 2000,
  commentMaxLength: 500,
});

export const ICON_URLS = Object.freeze({
  탱커: './img/tank.png',
  딜러: './img/dps.png',
  지원: './img/sup.png',
  배치: './img/u.png',
  브론즈: './img/b.webp',
  실버: './img/s.webp',
  골드: './img/g.webp',
  플래티넘: './img/p.webp',
  다이아몬드: './img/d.png',
  마스터: './img/m.webp',
  그랜드마스터: './img/gm.webp',
  챔피언: './img/c.png',
});

export function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(String(email).toLowerCase());
}
