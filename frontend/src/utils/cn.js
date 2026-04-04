/**
 * cn — className utility
 * Merges class names, filtering falsy values.
 * Drop-in replacement for clsx (already installed as a dep).
 *
 * Usage:
 *   cn('card', isActive && 'card--active', undefined)
 *   // → 'card card--active'
 */

import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(...inputs);
}

/**
 * formatDate — ISO date string → human-readable
 * @param {string|Date} date
 * @param {Intl.DateTimeFormatOptions} opts
 */
export function formatDate(date, opts = {}) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...opts,
  }).format(new Date(date));
}

/**
 * truncate — shorten a string to `maxLen` chars
 */
export function truncate(str, maxLen = 60) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '…';
}

/**
 * sleep — await-able delay
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
