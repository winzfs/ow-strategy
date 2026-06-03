/*
 * OW Hub sanitize utilities
 *
 * User-generated values must never be inserted into HTML without escaping.
 * Prefer textContent/createElement when possible. Use these helpers only when
 * string-template rendering is unavoidable during the gradual refactor.
 */

export function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function stripControlChars(value) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, '');
}

export function stripHTMLUnsafeChars(value) {
  return String(value ?? '')
    .replaceAll('<', '')
    .replaceAll('>', '')
    .replaceAll('&', '')
    .replaceAll('"', '')
    .replaceAll("'", '');
}

export function normalizeText(value, options = {}) {
  const { maxLength = 500, trim = true } = options;
  const text = stripControlChars(value);
  const normalized = trim ? text.trim() : text;
  return normalized.slice(0, maxLength);
}

export function normalizeBattleTag(value) {
  return stripHTMLUnsafeChars(normalizeText(value, { maxLength: 40 }));
}

export function isValidBattleTag(value) {
  const btag = normalizeBattleTag(value);
  return /^[^#\s][^#]{1,24}#[0-9]{3,8}$/.test(btag);
}

export function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clampNumber(value, min, max, fallback = min) {
  const number = safeNumber(value, fallback);
  return Math.min(max, Math.max(min, number));
}

export function createTextElement(tagName, text, className) {
  const el = document.createElement(tagName);
  if (className) el.className = className;
  el.textContent = String(text ?? '');
  return el;
}
