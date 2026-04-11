/**
 * Web Audio metronome with tap-tempo and progressive tempo ramp.
 * @module metronome
 */

import {
    BPM_MIN,
    BPM_MAX,
    METRO_SCHEDULE_AHEAD,
    METRO_LOOKAHEAD_MS,
    METRO_ACCENT_FREQ,
    METRO_NORMAL_FREQ,
    METRO_ACCENT_GAIN,
    METRO_NORMAL_GAIN,
    METRO_NOTE_DURATION,
    BEATS_PER_BAR,
    PROG_DEFAULT_START,
    PROG_DEFAULT_END,
    PROG_DEFAULT_STEP,
    PROG_DEFAULT_BARS,
} from './config.js';
import { state } from './state.js';
import { dom } from './dom.js';
import { showToast } from './toast.js';
import { debouncedSave } from './storage.js';

// ─── Audio Scheduling ──────────────────────────

function metroClick(time, accent) {
    if (!state.metroAudioCtx || !state.metroMasterGain) return;
    const osc = state.metroAudioCtx.createOscillator();
    const gain = state.metroAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(state.metroMasterGain);
    osc.frequency.value = accent ? METRO_ACCENT_FREQ : METRO_NORMAL_FREQ;
    gain.gain.setValueAtTime(accent ? METRO_ACCENT_GAIN : METRO_NORMAL_GAIN, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + METRO_NOTE_DURATION);
    osc.start(time);
    osc.stop(time + METRO_NOTE_DURATION);
}

function flashDot(idx) {
    dom.metroDots.forEach(d => {
        d.classList.remove('flash', 'flash-down');
    });
    if (dom.metroDots[idx]) {
        dom.metroDots[idx].classList.add(idx === 0 ? 'flash' : 'flash-down');
    }
}

function metroScheduler() {
    if (!state.metroPlaying || !state.metroAudioCtx) return;
    while (state.metroNextNoteTime < state.metroAudioCtx.currentTime + METRO_SCHEDULE_AHEAD) {
        const accent = state.metroBeatCount % BEATS_PER_BAR === 0;
        metroClick(state.metroNextNoteTime, accent);

        const beatIdx = state.metroBeatCount % BEATS_PER_BAR;
        const delay = Math.max(
            0,
            (state.metroNextNoteTime - state.metroAudioCtx.currentTime) * 1000,
        );
        const id = setTimeout(() => {
            if (!state.metroPlaying) return;
            flashDot(beatIdx);
            progOnBeat();
        }, delay);
        state.pendingBeatTimers.push(id);

        state.metroNextNoteTime += 60.0 / state.metroBpm;
        state.metroBeatCount++;
    }
    state.metroTimerId = setTimeout(metroScheduler, METRO_LOOKAHEAD_MS);
}

// ─── Progressive Tempo ─────────────────────────

function progCalcTotalBeats() {
    const startVal = parseInt(dom.progStartBpm.dataset.value) || PROG_DEFAULT_START;
    const endVal = parseInt(dom.progEndBpm.dataset.value) || PROG_DEFAULT_END;
    const stepVal = parseInt(dom.progStep.value) || PROG_DEFAULT_STEP;
    const barsVal = parseInt(dom.progBars.value) || PROG_DEFAULT_BARS;
    const beatsPerStep = barsVal * BEATS_PER_BAR;
    const steps = Math.ceil((endVal - startVal) / stepVal);
    return steps * beatsPerStep;
}

function progUpdateProgress() {
    const total = progCalcTotalBeats();
    const pct = total > 0 ? (state.progTotalBeats / total) * 100 : 0;
    const endVal = parseInt(dom.progEndBpm.dataset.value) || PROG_DEFAULT_END;
    dom.progFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    dom.progText.textContent = state.progCurrentBpm + ' / ' + endVal + ' BPM';
}

function progReset() {
    state.progCurrentBpm = parseInt(dom.progStartBpm.dataset.value) || PROG_DEFAULT_START;
    state.progBeatsInStep = 0;
    state.progTotalBeats = 0;
    setMetroBpm(state.progCurrentBpm, true);
    progUpdateProgress();
    dom.progProgressRow.style.display = state.progEnabled ? 'flex' : 'none';
}

function progOnBeat() {
    if (!state.progEnabled) return;

    const endVal = parseInt(dom.progEndBpm.dataset.value) || PROG_DEFAULT_END;
    const stepVal = parseInt(dom.progStep.value) || PROG_DEFAULT_STEP;
    const barsVal = parseInt(dom.progBars.value) || PROG_DEFAULT_BARS;
    const beatsPerStep = barsVal * BEATS_PER_BAR;

    state.progBeatsInStep++;
    if (state.progCurrentBpm < endVal) state.progTotalBeats++;

    if (state.progBeatsInStep >= beatsPerStep && state.progCurrentBpm < endVal) {
        state.progCurrentBpm = Math.min(state.progCurrentBpm + stepVal, endVal);
        state.progBeatsInStep = 0;
        setMetroBpm(state.progCurrentBpm, true);
        showToast('Tempo \u2192 ' + state.progCurrentBpm + ' BPM', 'accent');
    }

    progUpdateProgress();
}

// ─── Public API ────────────────────────────────

/**
 * Clamp a BPM value to the valid range and round to an integer.
 * @param {number} val
 * @returns {number}
 */
export function clampBpm(val) {
    return Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(val)));
}

/**
 * Set the metronome BPM (clamped to BPM_MIN–BPM_MAX).
 * @param {number} val
 * @param {boolean} [skipSave=false]
 */
export function setMetroBpm(val, skipSave) {
    state.metroBpm = clampBpm(val);
    dom.metroBpmValue.textContent = state.metroBpm;
    dom.bpmSlider.value = state.metroBpm;
    if (!skipSave) debouncedSave();
}

/** Start the metronome click track. */
export function startMetronome() {
    if (!state.metroAudioCtx) {
        state.metroAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        state.metroMasterGain = state.metroAudioCtx.createGain();
        state.metroMasterGain.connect(state.metroAudioCtx.destination);
    }
    state.metroMasterGain.gain.value = state.metroVolume / 100;
    if (state.metroAudioCtx.state === 'suspended') state.metroAudioCtx.resume();
    state.metroPlaying = true;
    state.metroBeatCount = 0;
    state.metroNextNoteTime = state.metroAudioCtx.currentTime;
    if (state.progEnabled) progReset();
    metroScheduler();
    dom.metroToggleBtn.classList.add('active');
    dom.metroIconPlay.style.display = 'none';
    dom.metroIconStop.style.display = '';
}

/** Stop the metronome click track. */
export function stopMetronome() {
    state.metroPlaying = false;
    clearTimeout(state.metroTimerId);
    state.metroTimerId = null;
    state.pendingBeatTimers.forEach(id => clearTimeout(id));
    state.pendingBeatTimers = [];
    dom.metroToggleBtn.classList.remove('active');
    dom.metroIconPlay.style.display = '';
    dom.metroIconStop.style.display = 'none';
    dom.metroDots.forEach(d => {
        d.classList.remove('flash', 'flash-down');
    });
    dom.progProgressRow.style.display = 'none';
}

/** Toggle metronome on/off. */
export function toggleMetronome() {
    if (state.metroPlaying) stopMetronome();
    else startMetronome();
}

/** Detect BPM from rhythmic taps. */
export function tapTempo() {
    const now = Date.now();
    if (state.tapTimes.length > 0 && now - state.tapTimes[state.tapTimes.length - 1] > 2500) {
        state.tapTimes = [];
    }
    state.tapTimes.push(now);
    if (state.tapTimes.length > 8) state.tapTimes.shift();
    if (state.tapTimes.length >= 2) {
        let total = 0;
        for (let i = 1; i < state.tapTimes.length; i++) {
            total += state.tapTimes[i] - state.tapTimes[i - 1];
        }
        const avgMs = total / (state.tapTimes.length - 1);
        const detected = Math.round(60000 / avgMs);
        setMetroBpm(detected);
        showToast('BPM: ' + state.metroBpm + ' (' + state.tapTimes.length + ' taps)', 'accent');
    }
}

/**
 * Restore metronome settings from a saved playlist item.
 * @param {Object} item
 */
export function restoreMetroSettings(item) {
    if (!item) return;
    if (item.progStart !== undefined) {
        dom.progStartBpm.dataset.value = item.progStart;
        dom.progStartBpm.textContent = item.progStart;
    }
    if (item.progEnd !== undefined) {
        dom.progEndBpm.dataset.value = item.progEnd;
        dom.progEndBpm.textContent = item.progEnd;
    }
    if (item.progStep !== undefined) {
        dom.progStep.value = item.progStep;
    }
    if (item.progBars !== undefined) {
        dom.progBars.value = item.progBars;
    }
    state.progEnabled = !!item.progEnabled;
    dom.progToggle.checked = state.progEnabled;
    dom.progBody.classList.toggle('open', state.progEnabled);
    if (item.metroVolume !== undefined) {
        state.metroVolume = item.metroVolume;
        dom.metroVolSlider.value = state.metroVolume;
        dom.metroVolLabel.textContent = state.metroVolume;
        if (state.metroMasterGain) state.metroMasterGain.gain.value = state.metroVolume / 100;
    }
    if (item.bpm) setMetroBpm(item.bpm, true);
}

/**
 * Increment or decrement a progressive-tempo BPM element.
 * @param {HTMLElement} target - The .prog-bpm-val element
 * @param {number} dir - +1 or -1
 */
export function progAdjust(target, dir) {
    let val = parseInt(target.dataset.value) + dir;
    val = Math.max(BPM_MIN, Math.min(BPM_MAX, val));
    target.dataset.value = val;
    target.textContent = val;
}
