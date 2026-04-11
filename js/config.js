/**
 * Application-wide constants.
 * @module config
 */

export const STORAGE_KEY = 'guitar-practice-playlist';
export const MAX_PLAYLIST = 50;

export const SPEED_MIN = 0.25;
export const SPEED_MAX = 2.0;
export const SPEED_STEP = 0.05;
export const SPEED_MATCH_EPSILON = 0.01;

export const BPM_MIN = 30;
export const BPM_MAX = 300;
export const METRO_SCHEDULE_AHEAD = 0.1;
export const METRO_LOOKAHEAD_MS = 25;
export const METRO_ACCENT_FREQ = 1200;
export const METRO_NORMAL_FREQ = 800;
export const METRO_ACCENT_GAIN = 0.6;
export const METRO_NORMAL_GAIN = 0.3;
export const METRO_NOTE_DURATION = 0.04;

export const TOAST_DISPLAY_MS = 2200;
export const TOAST_EXIT_MS = 300;

export const HOLD_DELAY_MS = 400;
export const HOLD_REPEAT_MS = 80;

export const VOLUME_STEP = 5;
export const MONITOR_INTERVAL_MS = 100;
export const DEBOUNCE_SAVE_MS = 500;
export const MIN_LOOP_WIDTH_PCT = 0.5;

export const PROG_DEFAULT_START = 85;
export const PROG_DEFAULT_END = 110;
export const PROG_DEFAULT_STEP = 5;
export const PROG_DEFAULT_BARS = 4;
export const BEATS_PER_BAR = 4;
