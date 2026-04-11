/**
 * Playlist persistence via localStorage.
 * @module storage
 */

import {
    STORAGE_KEY, MAX_PLAYLIST, DEBOUNCE_SAVE_MS,
    PROG_DEFAULT_START, PROG_DEFAULT_END, PROG_DEFAULT_STEP, PROG_DEFAULT_BARS,
} from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';

/**
 * Load the playlist array from localStorage.
 * @returns {Array<Object>}
 */
export function loadPlaylist() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

/**
 * Persist the playlist array to localStorage.
 * @param {Array<Object>} list
 */
export function savePlaylist(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
        // QuotaExceededError or security restriction — silently degrade
    }
}

/**
 * Add or promote a video to the top of the playlist.
 * @param {string} videoId
 * @param {string} title
 */
export function addToPlaylist(videoId, title) {
    const list = loadPlaylist();

    const existingIdx = list.findIndex(v => v.videoId === videoId);
    if (existingIdx !== -1) {
        const [item] = list.splice(existingIdx, 1);
        item.title = title || item.title;
        item.lastPlayed = Date.now();
        list.unshift(item);
    } else {
        list.unshift({
            videoId,
            title,
            url: 'https://www.youtube.com/watch?v=' + videoId,
            loopStart: 0,
            loopEnd: 0,
            speed: 1.0,
            lastPlayed: Date.now(),
        });
    }

    while (list.length > MAX_PLAYLIST) list.pop();
    savePlaylist(list);
}

/**
 * Look up a single playlist entry by video ID.
 * @param {string} videoId
 * @returns {Object|null}
 */
export function getPlaylistItem(videoId) {
    return loadPlaylist().find(v => v.videoId === videoId) || null;
}

/**
 * Persist the current video's loop, speed, volume, and metronome settings
 * back into its playlist entry.
 */
export function saveCurrentVideoSettings() {
    if (!state.currentVideoId) return;
    const list = loadPlaylist();
    const item = list.find(v => v.videoId === state.currentVideoId);
    if (!item) return;

    if (state.videoDuration > 0) {
        item.loopStart = (state.loopStartPercent / 100) * state.videoDuration;
        item.loopEnd = (state.loopEndPercent / 100) * state.videoDuration;
    }
    item.loopEnabled = state.loopEnabled;
    item.speed = state.currentSpeed;
    item.volume = parseInt(dom.volumeSlider.value);
    item.bpm = state.metroBpm;
    item.metroVolume = state.metroVolume;
    item.progEnabled = state.progEnabled;
    item.progStart = parseInt(dom.progStartBpm.dataset.value) || PROG_DEFAULT_START;
    item.progEnd = parseInt(dom.progEndBpm.dataset.value) || PROG_DEFAULT_END;
    item.progStep = parseInt(dom.progStep.value) || PROG_DEFAULT_STEP;
    item.progBars = parseInt(dom.progBars.value) || PROG_DEFAULT_BARS;
    savePlaylist(list);
}

/**
 * Debounced wrapper around saveCurrentVideoSettings (500 ms).
 */
export function debouncedSave() {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveCurrentVideoSettings, DEBOUNCE_SAVE_MS);
}
