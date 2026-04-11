/**
 * Playback speed control (0.25x – 2.0x).
 * @module speed
 */

import { SPEED_MIN, SPEED_MAX, SPEED_MATCH_EPSILON } from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';
import { saveCurrentVideoSettings } from './storage.js';
import { renderPlaylist } from './playlist.js';

/**
 * Refresh the speed badge text and highlight the matching preset label.
 */
export function updateSpeedDisplay() {
    dom.speedValue.textContent = state.currentSpeed.toFixed(2) + 'x';
    dom.speedLabels.forEach(label => {
        const val = parseFloat(label.dataset.value);
        label.classList.toggle('active', Math.abs(val - state.currentSpeed) < SPEED_MATCH_EPSILON);
    });
}

/**
 * Clamp a playback rate to the valid range and round to two decimals.
 * @param {number} rate
 * @returns {number}
 */
export function clampSpeed(rate) {
    return Math.round(Math.max(SPEED_MIN, Math.min(SPEED_MAX, rate)) * 100) / 100;
}

/**
 * Clamp and apply a new playback rate.
 * @param {number} rate
 */
export function setSpeed(rate) {
    state.currentSpeed = clampSpeed(rate);
    dom.speedSlider.value = state.currentSpeed;
    updateSpeedDisplay();
    if (state.playerReady && state.player) {
        state.player.setPlaybackRate(state.currentSpeed);
    }
    saveCurrentVideoSettings();
    renderPlaylist();
}
