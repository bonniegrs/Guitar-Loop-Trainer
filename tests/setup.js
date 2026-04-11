/**
 * Vitest setup: inject minimal DOM elements that js/dom.js expects.
 * This runs before every test file so module-level getElementById calls resolve.
 */

const ids = [
    'urlInput',
    'loadBtn',
    'loopToggle',
    'setStartBtn',
    'setEndBtn',
    'restartLoopBtn',
    'resetLoopBtn',
    'loopTrack',
    'loopRegion',
    'playhead',
    'thumbStart',
    'thumbEnd',
    'startTimeLabel',
    'endTimeLabel',
    'currentTimeDisplay',
    'durationDisplay',
    'speedSlider',
    'speedValue',
    'playlistContainer',
    'headerEq',
    'toastContainer',
    'playPauseBtn',
    'stopBtn',
    'goToStartBtn',
    'muteBtn',
    'volumeSlider',
    'volumeLabel',
    'iconPlay',
    'iconPause',
    'iconVol',
    'iconMuted',
    'playerOverlay',
    'metroBpmValue',
    'metroToggleBtn',
    'metroIconPlay',
    'metroIconStop',
    'bpmSlider',
    'bpmMinusBtn',
    'bpmPlusBtn',
    'tapTempoBtn',
    'metroVolSlider',
    'metroVolLabel',
    'metroMuteBtn',
    'metroVolIcon',
    'metroMutedIcon',
    'progToggle',
    'progBody',
    'progStartBpm',
    'progEndBpm',
    'progStep',
    'progBars',
    'progProgressRow',
    'progFill',
    'progText',
    'exportBtn',
    'importBtn',
    'importFile',
];

const beatDotsContainer = document.createElement('div');
beatDotsContainer.id = 'metroBeatDots';
for (let i = 0; i < 4; i++) {
    const dot = document.createElement('span');
    dot.className = 'metro-dot';
    beatDotsContainer.appendChild(dot);
}
document.body.appendChild(beatDotsContainer);

for (const id of ids) {
    if (!document.getElementById(id)) {
        const el = document.createElement('div');
        el.id = id;
        document.body.appendChild(el);
    }
}

const speedLabelsContainer = document.createElement('div');
speedLabelsContainer.className = 'speed-labels';
for (const val of ['0.25', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2']) {
    const span = document.createElement('span');
    span.dataset.value = val;
    speedLabelsContainer.appendChild(span);
}
document.body.appendChild(speedLabelsContainer);
