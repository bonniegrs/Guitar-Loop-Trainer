/**
 * Cached DOM element references.
 * Evaluated once at module load (safe because type="module" is deferred).
 * @module dom
 */

export const dom = {
    // URL bar
    urlInput: document.getElementById('urlInput'),
    loadBtn: document.getElementById('loadBtn'),

    // Transport
    playPauseBtn: document.getElementById('playPauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    goToStartBtn: document.getElementById('goToStartBtn'),
    muteBtn: document.getElementById('muteBtn'),
    volumeSlider: document.getElementById('volumeSlider'),
    volumeLabel: document.getElementById('volumeLabel'),
    iconPlay: document.getElementById('iconPlay'),
    iconPause: document.getElementById('iconPause'),
    iconVol: document.getElementById('iconVol'),
    iconMuted: document.getElementById('iconMuted'),
    playerOverlay: document.getElementById('playerOverlay'),

    // Header
    headerEq: document.getElementById('headerEq'),

    // Loop region
    loopToggle: document.getElementById('loopToggle'),
    setStartBtn: document.getElementById('setStartBtn'),
    setEndBtn: document.getElementById('setEndBtn'),
    restartLoopBtn: document.getElementById('restartLoopBtn'),
    resetLoopBtn: document.getElementById('resetLoopBtn'),
    loopTrack: document.getElementById('loopTrack'),
    loopRegion: document.getElementById('loopRegion'),
    playheadEl: document.getElementById('playhead'),
    thumbStart: document.getElementById('thumbStart'),
    thumbEnd: document.getElementById('thumbEnd'),
    startTimeLabel: document.getElementById('startTimeLabel'),
    endTimeLabel: document.getElementById('endTimeLabel'),
    currentTimeDisplay: document.getElementById('currentTimeDisplay'),
    durationDisplay: document.getElementById('durationDisplay'),

    // Speed
    speedSlider: document.getElementById('speedSlider'),
    speedValue: document.getElementById('speedValue'),
    speedLabels: document.querySelectorAll('.speed-labels span'),

    // Metronome
    metroBpmValue: document.getElementById('metroBpmValue'),
    metroToggleBtn: document.getElementById('metroToggleBtn'),
    metroIconPlay: document.getElementById('metroIconPlay'),
    metroIconStop: document.getElementById('metroIconStop'),
    bpmSlider: document.getElementById('bpmSlider'),
    bpmMinusBtn: document.getElementById('bpmMinusBtn'),
    bpmPlusBtn: document.getElementById('bpmPlusBtn'),
    tapTempoBtn: document.getElementById('tapTempoBtn'),
    metroBeatDots: document.getElementById('metroBeatDots'),
    metroDots: document.getElementById('metroBeatDots').querySelectorAll('.metro-dot'),
    metroVolSlider: document.getElementById('metroVolSlider'),
    metroVolLabel: document.getElementById('metroVolLabel'),
    metroMuteBtn: document.getElementById('metroMuteBtn'),
    metroVolIcon: document.getElementById('metroVolIcon'),
    metroMutedIcon: document.getElementById('metroMutedIcon'),

    // Progressive tempo
    progToggle: document.getElementById('progToggle'),
    progBody: document.getElementById('progBody'),
    progStartBpm: document.getElementById('progStartBpm'),
    progEndBpm: document.getElementById('progEndBpm'),
    progStep: document.getElementById('progStep'),
    progBars: document.getElementById('progBars'),
    progProgressRow: document.getElementById('progProgressRow'),
    progFill: document.getElementById('progFill'),
    progText: document.getElementById('progText'),

    // Playlist
    playlistContainer: document.getElementById('playlistContainer'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),

    // Toast
    toastContainer: document.getElementById('toastContainer'),
};
