/**
 * Lightweight toast notification system.
 * @module toast
 */

import { TOAST_DISPLAY_MS, TOAST_EXIT_MS } from './config.js';
import { dom } from './dom.js';

/**
 * Display a brief toast message in the bottom-right corner.
 * @param {string} message
 * @param {'accent'|'danger'|'success'} [type='accent']
 */
export function showToast(message, type) {
    type = type || 'accent';
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.textContent = message;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
        el.classList.add('toast-out');
        setTimeout(() => el.remove(), TOAST_EXIT_MS);
    }, TOAST_DISPLAY_MS);
}
