/**
 * Lightweight toast notification system.
 * @module toast
 */

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
    el.textContent = message;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
        el.classList.add('toast-out');
        setTimeout(() => el.remove(), 300);
    }, 2200);
}
