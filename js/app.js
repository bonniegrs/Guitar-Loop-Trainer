/**
 * Application entry point — imports all modules and wires up event listeners.
 * @module app
 */

import { state } from './state.js';
import { dom } from './dom.js';
import { showToast } from './toast.js';
import { addToPlaylist, getPlaylistItem, debouncedSave } from './storage.js';
import {
    loadYouTubeAPI, createPlayer, stopMonitor,
    extractVideoId, fetchVideoTitle,
    togglePlayPause, stopVideo, goToBeginning, toggleMute, setVolume,
} from './player.js';
import { updateLoopVisuals, setLoopStartToCurrent, setLoopEndToCurrent, resetLoop, restartLoop, onThumbMouseDown, onDocumentMouseMove, onDocumentMouseUp, onTrackClick } from './loop.js';
import { updateSpeedDisplay, setSpeed } from './speed.js';
import { toggleMetronome, setMetroBpm, tapTempo, restoreMetroSettings, progAdjust } from './metronome.js';
import { renderPlaylist, removeFromPlaylist, exportPlaylist, importPlaylist, autoLoadFromFile } from './playlist.js';
import { handleShortcut } from './shortcuts.js';

// ─── Video Loading (orchestrates player + playlist) ────

async function loadVideo(url) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        showToast('Invalid video URL', 'danger');
        return;
    }

    state.currentVideoId = videoId;
    state.loopStartPercent = 0;
    state.loopEndPercent = 100;
    state.videoDuration = 0;

    stopMonitor();
    createPlayer(videoId);

    const title = await fetchVideoTitle(videoId);
    addToPlaylist(videoId, title);
    renderPlaylist();
    dom.urlInput.value = '';
}

function restoreCurrentVideoSettings() {
    if (!state.currentVideoId) return;
    const item = getPlaylistItem(state.currentVideoId);
    if (!item) return;

    state.currentSpeed = item.speed || 1.0;
    dom.speedSlider.value = state.currentSpeed;
    updateSpeedDisplay();
    if (state.playerReady && state.player) state.player.setPlaybackRate(state.currentSpeed);

    const vol = (item.volume !== undefined) ? item.volume : parseInt(dom.volumeSlider.value);
    if (state.playerReady && state.player) state.player.setVolume(vol);
    dom.volumeSlider.value = vol;
    dom.volumeLabel.textContent = vol;

    if (item.loopEnabled !== undefined) {
        state.loopEnabled = item.loopEnabled;
    } else {
        state.loopEnabled = true;
    }
    dom.loopToggle.checked = state.loopEnabled;

    if (item.loopEnd > 0 && state.videoDuration > 0) {
        state.loopStartPercent = (item.loopStart / state.videoDuration) * 100;
        state.loopEndPercent = (item.loopEnd / state.videoDuration) * 100;
        updateLoopVisuals();
    }
    restoreMetroSettings(item);
}

// ─── URL Bar ───────────────────────────────────

dom.loadBtn.addEventListener('click', () => loadVideo(dom.urlInput.value.trim()));
dom.urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadVideo(dom.urlInput.value.trim());
});

// ─── Transport ─────────────────────────────────

dom.playPauseBtn.addEventListener('click', togglePlayPause);
dom.stopBtn.addEventListener('click', stopVideo);
dom.goToStartBtn.addEventListener('click', goToBeginning);
dom.muteBtn.addEventListener('click', toggleMute);
dom.volumeSlider.addEventListener('input', () => setVolume(parseInt(dom.volumeSlider.value)));
dom.volumeSlider.addEventListener('change', () => debouncedSave());
dom.playerOverlay.addEventListener('click', togglePlayPause);

// ─── Loop Region ───────────────────────────────

dom.loopToggle.addEventListener('change', () => {
    state.loopEnabled = dom.loopToggle.checked;
    updateLoopVisuals();
    debouncedSave();
});
dom.setStartBtn.addEventListener('click', setLoopStartToCurrent);
dom.setEndBtn.addEventListener('click', setLoopEndToCurrent);
dom.restartLoopBtn.addEventListener('click', restartLoop);
dom.resetLoopBtn.addEventListener('click', resetLoop);

dom.thumbStart.addEventListener('mousedown', e => onThumbMouseDown('start', e));
dom.thumbEnd.addEventListener('mousedown', e => onThumbMouseDown('end', e));
document.addEventListener('mousemove', onDocumentMouseMove);
document.addEventListener('mouseup', onDocumentMouseUp);
dom.loopTrack.addEventListener('click', onTrackClick);

// ─── Speed ─────────────────────────────────────

dom.speedSlider.addEventListener('input', () => setSpeed(parseFloat(dom.speedSlider.value)));
dom.speedLabels.forEach(label => {
    label.addEventListener('click', () => setSpeed(parseFloat(label.dataset.value)));
});

// ─── Playlist ──────────────────────────────────

dom.playlistContainer.addEventListener('click', e => {
    const removeBtn = e.target.closest('[data-remove]');
    if (removeBtn) {
        e.stopPropagation();
        removeFromPlaylist(removeBtn.dataset.remove);
        return;
    }

    const item = e.target.closest('.playlist-item');
    if (item) {
        const videoId = item.dataset.id;
        const entry = getPlaylistItem(videoId);
        if (entry) {
            state.currentVideoId = videoId;
            state.loopStartPercent = 0;
            state.loopEndPercent = 100;
            state.videoDuration = 0;
            state.currentSpeed = entry.speed || 1.0;
            dom.speedSlider.value = state.currentSpeed;
            updateSpeedDisplay();
            restoreMetroSettings(entry);

            stopMonitor();
            createPlayer(videoId);
            renderPlaylist();
        }
    }
});

dom.exportBtn.addEventListener('click', exportPlaylist);
dom.importBtn.addEventListener('click', () => dom.importFile.click());
dom.importFile.addEventListener('change', e => {
    if (e.target.files[0]) {
        importPlaylist(e.target.files[0], restoreCurrentVideoSettings);
        e.target.value = '';
    }
});

// ─── Metronome ─────────────────────────────────

dom.metroToggleBtn.addEventListener('click', toggleMetronome);
dom.bpmSlider.addEventListener('input', () => setMetroBpm(parseInt(dom.bpmSlider.value)));
dom.bpmMinusBtn.addEventListener('click', () => setMetroBpm(state.metroBpm - 1));
dom.bpmPlusBtn.addEventListener('click', () => setMetroBpm(state.metroBpm + 1));
dom.tapTempoBtn.addEventListener('click', tapTempo);

// ─── Progressive Tempo ─────────────────────────

dom.progToggle.addEventListener('change', () => {
    state.progEnabled = dom.progToggle.checked;
    dom.progBody.classList.toggle('open', state.progEnabled);
    debouncedSave();
});
dom.progStep.addEventListener('change', () => debouncedSave());
dom.progBars.addEventListener('change', () => debouncedSave());

document.querySelectorAll('.prog-adj').forEach(btn => {
    let holdTimer = null;
    let holdInterval = null;

    function startHold() {
        const target = document.getElementById(btn.dataset.target);
        const dir = parseInt(btn.dataset.dir);
        progAdjust(target, dir);
        holdTimer = setTimeout(() => {
            holdInterval = setInterval(() => progAdjust(target, dir), 80);
        }, 400);
    }

    function stopHold() {
        clearTimeout(holdTimer);
        clearInterval(holdInterval);
        holdTimer = null;
        holdInterval = null;
        debouncedSave();
    }

    btn.addEventListener('mousedown', e => { e.preventDefault(); startHold(); });
    btn.addEventListener('mouseup', stopHold);
    btn.addEventListener('mouseleave', stopHold);
    btn.addEventListener('touchstart', e => { e.preventDefault(); startHold(); });
    btn.addEventListener('touchend', stopHold);
});

// ─── Metronome Volume ──────────────────────────

dom.metroVolSlider.addEventListener('input', () => {
    state.metroVolume = parseInt(dom.metroVolSlider.value);
    dom.metroVolLabel.textContent = state.metroVolume;
    if (state.metroMasterGain) state.metroMasterGain.gain.value = state.metroVolume / 100;
    if (state.metroMuted && state.metroVolume > 0) {
        state.metroMuted = false;
        dom.metroVolIcon.style.display = '';
        dom.metroMutedIcon.style.display = 'none';
    }
    debouncedSave();
});

dom.metroMuteBtn.addEventListener('click', () => {
    state.metroMuted = !state.metroMuted;
    if (state.metroMuted) {
        state.metroVolBeforeMute = state.metroVolume;
        state.metroVolume = 0;
        dom.metroVolSlider.value = 0;
        dom.metroVolLabel.textContent = '0';
    } else {
        state.metroVolume = state.metroVolBeforeMute || 50;
        dom.metroVolSlider.value = state.metroVolume;
        dom.metroVolLabel.textContent = state.metroVolume;
    }
    if (state.metroMasterGain) state.metroMasterGain.gain.value = state.metroVolume / 100;
    dom.metroVolIcon.style.display = state.metroMuted ? 'none' : '';
    dom.metroMutedIcon.style.display = state.metroMuted ? '' : 'none';
    debouncedSave();
});

// ─── Global ────────────────────────────────────

document.addEventListener('keydown', handleShortcut);

document.addEventListener('change', e => {
    if (e.target.type === 'range') e.target.blur();
});

// ─── Init ──────────────────────────────────────

async function init() {
    loadYouTubeAPI();
    await autoLoadFromFile(restoreCurrentVideoSettings);
    renderPlaylist();
    updateSpeedDisplay();
    updateLoopVisuals();
    dom.loopToggle.checked = true;
}

init();
