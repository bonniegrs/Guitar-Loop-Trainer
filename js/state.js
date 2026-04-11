/**
 * Shared mutable application state.
 * All modules read/write from this single object to avoid hidden coupling.
 * @module state
 */

export const state = {
    player: null,
    playerReady: false,
    currentVideoId: null,
    videoDuration: 0,
    loopEnabled: true,
    loopStartPercent: 0,
    loopEndPercent: 100,
    currentSpeed: 1.0,
    monitorInterval: null,
    dragging: null,
    usingNocookie: false,

    // Metronome
    metroAudioCtx: null,
    metroMasterGain: null,
    metroBpm: 120,
    metroVolume: 50,
    metroPlaying: false,
    metroTimerId: null,
    metroNextNoteTime: 0,
    metroBeatCount: 0,

    // Progressive tempo
    progEnabled: false,
    progCurrentBpm: 0,
    progBeatsInStep: 0,
    progTotalBeats: 0,

    // Metronome mute
    metroMuted: false,
    metroVolBeforeMute: 50,

    // Playlist drag-and-drop
    dragSrcEl: null,

    // Tap tempo history
    tapTimes: [],

    // Debounced-save timer handle
    saveTimer: null,
};
