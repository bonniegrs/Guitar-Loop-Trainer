/**
 * A/B loop region: markers, timeline, thumb dragging.
 * @module loop
 */

import { MIN_LOOP_WIDTH_PCT } from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';
import { formatTime } from './utils.js';
import { showToast } from './toast.js';
import { saveCurrentVideoSettings } from './storage.js';
import { renderPlaylist } from './playlist.js';

/** Redraw the loop region, thumb positions, and time labels. */
export function updateLoopVisuals() {
    const start = Math.min(state.loopStartPercent, state.loopEndPercent);
    const end = Math.max(state.loopStartPercent, state.loopEndPercent);

    dom.loopRegion.style.left = start + '%';
    dom.loopRegion.style.width = (end - start) + '%';

    dom.thumbStart.style.left = start + '%';
    dom.thumbEnd.style.left = end + '%';

    if (state.loopEnabled) {
        dom.loopRegion.classList.remove('disabled');
    } else {
        dom.loopRegion.classList.add('disabled');
    }

    const startSec = (start / 100) * state.videoDuration;
    const endSec = (end / 100) * state.videoDuration;

    dom.startTimeLabel.textContent = formatTime(startSec);
    dom.endTimeLabel.textContent = formatTime(endSec);
}

/** Set the loop-start marker to the current playback position. */
export function setLoopStartToCurrent() {
    if (!state.playerReady || !state.player || state.videoDuration <= 0) return;
    const t = state.player.getCurrentTime();
    state.loopStartPercent = (t / state.videoDuration) * 100;
    if (state.loopStartPercent >= state.loopEndPercent) {
        state.loopStartPercent = state.loopEndPercent - MIN_LOOP_WIDTH_PCT;
    }
    updateLoopVisuals();
    saveCurrentVideoSettings();
    renderPlaylist();
    showToast('Loop start set to ' + formatTime(t), 'accent');
}

/** Set the loop-end marker to the current playback position. */
export function setLoopEndToCurrent() {
    if (!state.playerReady || !state.player || state.videoDuration <= 0) return;
    const t = state.player.getCurrentTime();
    state.loopEndPercent = (t / state.videoDuration) * 100;
    if (state.loopEndPercent <= state.loopStartPercent) {
        state.loopEndPercent = state.loopStartPercent + MIN_LOOP_WIDTH_PCT;
    }
    updateLoopVisuals();
    saveCurrentVideoSettings();
    renderPlaylist();
    showToast('Loop end set to ' + formatTime(t), 'accent');
}

/** Reset the loop region to cover the full video. */
export function resetLoop() {
    state.loopStartPercent = 0;
    state.loopEndPercent = 100;
    updateLoopVisuals();
    saveCurrentVideoSettings();
    renderPlaylist();
    showToast('Loop reset', 'accent');
}

/** Seek to the loop-start position and resume playback. */
export function restartLoop() {
    if (!state.playerReady || !state.player || state.videoDuration <= 0) return;
    const startTime = (state.loopStartPercent / 100) * state.videoDuration;
    state.player.seekTo(startTime, true);
    state.player.playVideo();
}

// ─── Thumb Dragging ────────────────────────────

/**
 * Begin a loop-thumb drag operation.
 * @param {'start'|'end'} which
 * @param {MouseEvent} e
 */
export function onThumbMouseDown(which, e) {
    e.preventDefault();
    state.dragging = which;
    document.body.style.cursor = 'ew-resize';
    if (which === 'start') dom.thumbStart.classList.add('dragging');
    else dom.thumbEnd.classList.add('dragging');
}

/** @param {MouseEvent} e */
export function onDocumentMouseMove(e) {
    if (!state.dragging) return;
    const rect = dom.loopTrack.getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));

    if (state.dragging === 'start') {
        state.loopStartPercent = Math.min(pct, state.loopEndPercent - MIN_LOOP_WIDTH_PCT);
    } else {
        state.loopEndPercent = Math.max(pct, state.loopStartPercent + MIN_LOOP_WIDTH_PCT);
    }
    updateLoopVisuals();
}

export function onDocumentMouseUp() {
    if (!state.dragging) return;
    dom.thumbStart.classList.remove('dragging');
    dom.thumbEnd.classList.remove('dragging');
    document.body.style.cursor = '';
    state.dragging = null;
    saveCurrentVideoSettings();
    renderPlaylist();
}

/**
 * Click on the loop track to seek.
 * @param {MouseEvent} e
 */
export function onTrackClick(e) {
    if (state.dragging) return;
    if (!state.playerReady || !state.player || state.videoDuration <= 0) return;
    const rect = dom.loopTrack.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const seekTime = (pct / 100) * state.videoDuration;
    state.player.seekTo(seekTime, true);
}
