/**
 * Global keyboard shortcut handler.
 * @module shortcuts
 */

import { SPEED_STEP, VOLUME_STEP } from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';
import { showToast } from './toast.js';
import { togglePlayPause, goToBeginning, toggleMute, setVolume } from './player.js';
import {
    setLoopStartToCurrent,
    setLoopEndToCurrent,
    restartLoop,
    updateLoopVisuals,
} from './loop.js';
import { setSpeed } from './speed.js';
import { toggleMetronome } from './metronome.js';

/**
 * Route keydown events to the appropriate action.
 * Ignored when focus is inside a text input (range inputs are allowed).
 * @param {KeyboardEvent} e
 */
export function handleShortcut(e) {
    const tag = e.target.tagName;
    const type = (e.target.type || '').toLowerCase();
    if (tag === 'TEXTAREA' || (tag === 'INPUT' && type !== 'range')) return;

    const code = e.code;
    const key = e.key;

    if (code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    } else if (code === 'BracketLeft') {
        setLoopStartToCurrent();
    } else if (code === 'BracketRight') {
        setLoopEndToCurrent();
    } else if (code === 'KeyR') {
        restartLoop();
    } else if (code === 'KeyL') {
        dom.loopToggle.checked = !dom.loopToggle.checked;
        state.loopEnabled = dom.loopToggle.checked;
        updateLoopVisuals();
        showToast('Loop ' + (state.loopEnabled ? 'enabled' : 'disabled'), 'accent');
    } else if (code === 'Minus' || key === '-' || key === '_') {
        setSpeed(state.currentSpeed - SPEED_STEP);
        showToast('Speed: ' + state.currentSpeed.toFixed(2) + 'x', 'accent');
    } else if (code === 'Equal' || key === '=' || key === '+') {
        setSpeed(state.currentSpeed + SPEED_STEP);
        showToast('Speed: ' + state.currentSpeed.toFixed(2) + 'x', 'accent');
    } else if (code === 'ArrowUp') {
        e.preventDefault();
        const vUp = Math.min(100, parseInt(dom.volumeSlider.value) + VOLUME_STEP);
        dom.volumeSlider.value = vUp;
        setVolume(vUp);
        showToast('Volume: ' + vUp + '%', 'accent');
    } else if (code === 'ArrowDown') {
        e.preventDefault();
        const vDn = Math.max(0, parseInt(dom.volumeSlider.value) - VOLUME_STEP);
        dom.volumeSlider.value = vDn;
        setVolume(vDn);
        showToast('Volume: ' + vDn + '%', 'accent');
    } else if (code === 'KeyM') {
        if (!state.playerReady || !state.player) return;
        toggleMute();
        showToast(state.player.isMuted() ? 'Muted' : 'Unmuted', 'accent');
    } else if (code === 'KeyT') {
        toggleMetronome();
        showToast('Metronome ' + (state.metroPlaying ? 'ON' : 'OFF'), 'accent');
    } else if (code === 'Home') {
        e.preventDefault();
        goToBeginning();
        showToast('Jump to beginning', 'accent');
    }
}
