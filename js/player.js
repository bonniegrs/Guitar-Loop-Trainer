/**
 * YouTube IFrame player: creation, error handling, transport, playback monitoring.
 * @module player
 */

import { state } from './state.js';
import { dom } from './dom.js';
import { showToast } from './toast.js';
import { getPlaylistItem } from './storage.js';
import { updateLoopVisuals } from './loop.js';
import { updateSpeedDisplay } from './speed.js';
import { restoreMetroSettings } from './metronome.js';
import { formatTime } from './utils.js';

const YT_ERRORS = {
    2: 'Invalid video ID or parameter.',
    5: 'This video cannot be played in an HTML5 player.',
    100: 'Video not found \u2014 it may have been removed or set to private.',
    101: 'The video owner does not allow embedded playback.',
    150: 'The video owner does not allow embedded playback.',
};

// ─── YouTube API Bootstrap ─────────────────────

/** Inject the YouTube IFrame API script tag. */
export function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
    state.playerReady = false;
};

// ─── Player Lifecycle ──────────────────────────

function prepareWrapper() {
    const wrapper = document.querySelector('.player-wrapper');
    const placeholder = wrapper.querySelector('.player-placeholder');
    if (placeholder) placeholder.remove();
    const blocked = wrapper.querySelector('.embed-blocked');
    if (blocked) blocked.remove();

    if (state.player && state.player.destroy) {
        try { state.player.destroy(); } catch (_) { /* ignored */ }
        state.player = null;
        state.playerReady = false;
    }

    const oldContainer = document.getElementById('ytplayer');
    if (oldContainer) oldContainer.remove();

    const container = document.createElement('div');
    container.id = 'ytplayer';
    wrapper.appendChild(container);
    return wrapper;
}

function buildPlayerVars() {
    const vars = {
        autoplay: 1,
        controls: 1,
        enablejsapi: 1,
        fs: 1,
        rel: 0,
    };
    const origin = window.location.protocol === 'file:' ? undefined : window.location.origin;
    if (origin) vars.origin = origin;
    return vars;
}

/**
 * Create and embed a new YouTube player for the given video.
 * @param {string} videoId
 */
export function createPlayer(videoId) {
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
        showToast('Video API still loading, please try again\u2026', 'danger');
        return;
    }
    state.usingNocookie = false;
    prepareWrapper();
    state.player = new YT.Player('ytplayer', {
        videoId: videoId,
        playerVars: buildPlayerVars(),
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerError,
        },
    });
    updateTransportControls();
}

function createPlayerNocookie(videoId) {
    state.usingNocookie = true;
    prepareWrapper();
    state.player = new YT.Player('ytplayer', {
        videoId: videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: buildPlayerVars(),
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
            onError: onPlayerErrorFinal,
        },
    });
    showToast('Using privacy-enhanced player \u2014 use controls below', 'accent');
    updateTransportControls();
}

// ─── Error Handling ────────────────────────────

function onPlayerError(event) {
    const code = event.data;
    console.error('[Guitar Looper Trainer] Player error', code);
    if ((code === 101 || code === 150) && !state.usingNocookie) {
        showToast('Embedding blocked \u2014 retrying with alternate player\u2026', 'accent');
        createPlayerNocookie(state.currentVideoId);
    } else {
        const msg = YT_ERRORS[code] || 'Player error (code ' + code + ').';
        showToast(msg, 'danger');
    }
}

function onPlayerErrorFinal(event) {
    const code = event.data;
    console.error('[Guitar Looper Trainer] Alternate player error', code);
    showEmbedBlockedFallback();
}

function showEmbedBlockedFallback() {
    const wrapper = document.querySelector('.player-wrapper');
    const startSec = Math.floor((state.loopStartPercent / 100) * state.videoDuration) || 0;
    const url = 'https://www.youtube.com/watch?v=' + state.currentVideoId
        + (startSec > 0 ? '&t=' + startSec : '');

    let fallback = wrapper.querySelector('.embed-blocked');
    if (fallback) fallback.remove();

    fallback = document.createElement('div');
    fallback.className = 'embed-blocked';
    fallback.innerHTML =
        '<div class="embed-blocked-inner">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">' +
                '<circle cx="12" cy="12" r="10"/>' +
                '<line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' +
            '</svg>' +
            '<h3>Video cannot be embedded</h3>' +
            '<p>Both standard and privacy-enhanced players were blocked by the video owner.</p>' +
            '<a href="' + url + '" target="_blank" rel="noopener" class="btn-open-yt">' +
                '\u25B6 Open on YouTube' +
            '</a>' +
            '<span class="embed-blocked-hint">Loop and speed settings cannot be carried over \u2014 try a different video</span>' +
        '</div>';
    wrapper.appendChild(fallback);
}

// ─── Player Events ─────────────────────────────

function onPlayerReady() {
    state.playerReady = true;
    state.videoDuration = state.player.getDuration();
    dom.durationDisplay.textContent = formatTime(state.videoDuration);

    const item = getPlaylistItem(state.currentVideoId);

    const vol = (item && item.volume !== undefined) ? item.volume : parseInt(dom.volumeSlider.value);
    state.player.setVolume(vol);
    dom.volumeSlider.value = vol;
    dom.volumeLabel.textContent = vol;

    if (item && item.loopEnabled !== undefined) {
        state.loopEnabled = item.loopEnabled;
    } else {
        state.loopEnabled = true;
    }
    dom.loopToggle.checked = state.loopEnabled;

    state.player.setPlaybackRate(state.currentSpeed);

    updateLoopVisuals();
    startMonitor();

    if (item && item.loopEnd > 0 && state.videoDuration > 0) {
        state.loopStartPercent = (item.loopStart / state.videoDuration) * 100;
        state.loopEndPercent = (item.loopEnd / state.videoDuration) * 100;
        state.currentSpeed = item.speed || 1.0;
        dom.speedSlider.value = state.currentSpeed;
        updateSpeedDisplay();
        state.player.setPlaybackRate(state.currentSpeed);
        restoreMetroSettings(item);
        updateLoopVisuals();
        if (state.loopEnabled && item.loopStart > 0) {
            state.player.seekTo(item.loopStart, true);
        }
    } else if (item) {
        state.currentSpeed = item.speed || 1.0;
        dom.speedSlider.value = state.currentSpeed;
        updateSpeedDisplay();
        state.player.setPlaybackRate(state.currentSpeed);
        restoreMetroSettings(item);
    }
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        dom.headerEq.classList.add('active');
        startMonitor();

        if (state.videoDuration <= 0) {
            state.videoDuration = state.player.getDuration();
            dom.durationDisplay.textContent = formatTime(state.videoDuration);
            updateLoopVisuals();
        }
    } else {
        dom.headerEq.classList.remove('active');
    }

    updateTransportControls();

    if (event.data === YT.PlayerState.ENDED && state.loopEnabled) {
        const startTime = (state.loopStartPercent / 100) * state.videoDuration;
        state.player.seekTo(startTime, true);
        state.player.playVideo();
    }
}

// ─── Playback Monitor ──────────────────────────

/** Start the 100 ms polling loop that updates the playhead and enforces loop boundaries. */
export function startMonitor() {
    if (state.monitorInterval) return;
    state.monitorInterval = setInterval(monitorPlayback, 100);
}

/** Stop the playback-monitoring interval. */
export function stopMonitor() {
    if (state.monitorInterval) {
        clearInterval(state.monitorInterval);
        state.monitorInterval = null;
    }
}

function monitorPlayback() {
    if (!state.playerReady || !state.player || typeof state.player.getCurrentTime !== 'function') return;

    const currentTime = state.player.getCurrentTime();
    const percent = state.videoDuration > 0 ? (currentTime / state.videoDuration) * 100 : 0;

    dom.playheadEl.style.left = percent + '%';
    dom.currentTimeDisplay.textContent = formatTime(currentTime);

    if (state.loopEnabled && state.videoDuration > 0) {
        const endTime = (state.loopEndPercent / 100) * state.videoDuration;
        const startTime = (state.loopStartPercent / 100) * state.videoDuration;

        if (currentTime >= endTime) {
            state.player.seekTo(startTime, true);
        }
    }
}

// ─── Transport Controls ────────────────────────

/** Sync play/pause and mute button icons with the player's current state. */
export function updateTransportControls() {
    if (!state.playerReady || !state.player) {
        dom.iconPlay.style.display = '';
        dom.iconPause.style.display = 'none';
        return;
    }
    const ps = state.player.getPlayerState();
    const playing = ps === YT.PlayerState.PLAYING;
    dom.iconPlay.style.display = playing ? 'none' : '';
    dom.iconPause.style.display = playing ? '' : 'none';

    const muted = state.player.isMuted();
    dom.iconVol.style.display = muted ? 'none' : '';
    dom.iconMuted.style.display = muted ? '' : 'none';
}

export function togglePlayPause() {
    if (!state.playerReady || !state.player) return;
    const ps = state.player.getPlayerState();
    if (ps === YT.PlayerState.PLAYING) state.player.pauseVideo();
    else state.player.playVideo();
}

export function stopVideo() {
    if (!state.playerReady || !state.player) return;
    state.player.pauseVideo();
    const startTime = (state.loopStartPercent / 100) * state.videoDuration;
    state.player.seekTo(startTime, true);
    updateTransportControls();
}

export function goToBeginning() {
    if (!state.playerReady || !state.player) return;
    state.player.seekTo(0, true);
    updateTransportControls();
}

export function toggleMute() {
    if (!state.playerReady || !state.player) return;
    if (state.player.isMuted()) state.player.unMute();
    else state.player.mute();
    updateTransportControls();
}

/**
 * @param {number} val - Volume level 0–100
 */
export function setVolume(val) {
    if (!state.playerReady || !state.player) return;
    state.player.setVolume(val);
    dom.volumeLabel.textContent = val;
    if (state.player.isMuted() && val > 0) {
        state.player.unMute();
        updateTransportControls();
    }
}

// ─── URL Parsing ───────────────────────────────

/**
 * Extract an 11-character video ID from any common YouTube URL format.
 * @param {string} url
 * @returns {string|null}
 */
export function extractVideoId(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
    return null;
}

/**
 * Resolve a video title via the noembed service.
 * @param {string} videoId
 * @returns {Promise<string>}
 */
export async function fetchVideoTitle(videoId) {
    try {
        const res = await fetch('https://noembed.com/embed?url=https://www.youtube.com/watch?v=' + videoId);
        const data = await res.json();
        return data.title || 'Untitled Video';
    } catch {
        return 'Untitled Video';
    }
}
