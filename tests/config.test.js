import { describe, it, expect } from 'vitest';
import {
    STORAGE_KEY,
    MAX_PLAYLIST,
    SPEED_MIN,
    SPEED_MAX,
    SPEED_STEP,
    BPM_MIN,
    BPM_MAX,
    METRO_SCHEDULE_AHEAD,
    METRO_LOOKAHEAD_MS,
} from '../js/config.js';
import { clampSpeed } from '../js/speed.js';
import { clampBpm } from '../js/metronome.js';

describe('config constants', () => {
    it('defines a localStorage key', () => {
        expect(typeof STORAGE_KEY).toBe('string');
        expect(STORAGE_KEY.length).toBeGreaterThan(0);
    });

    it('limits the playlist size', () => {
        expect(MAX_PLAYLIST).toBe(50);
    });

    it('defines valid speed bounds', () => {
        expect(SPEED_MIN).toBeLessThan(SPEED_MAX);
        expect(SPEED_MIN).toBe(0.25);
        expect(SPEED_MAX).toBe(2.0);
        expect(SPEED_STEP).toBeGreaterThan(0);
        expect(SPEED_STEP).toBeLessThan(SPEED_MAX - SPEED_MIN);
    });

    it('defines valid BPM bounds', () => {
        expect(BPM_MIN).toBe(30);
        expect(BPM_MAX).toBe(300);
        expect(BPM_MIN).toBeLessThan(BPM_MAX);
    });

    it('defines metronome scheduling parameters', () => {
        expect(METRO_SCHEDULE_AHEAD).toBeGreaterThan(0);
        expect(METRO_LOOKAHEAD_MS).toBeGreaterThan(0);
    });
});

describe('clampSpeed (from speed.js)', () => {
    it('clamps below minimum to SPEED_MIN', () => {
        expect(clampSpeed(0)).toBe(SPEED_MIN);
        expect(clampSpeed(-1)).toBe(SPEED_MIN);
        expect(clampSpeed(0.1)).toBe(SPEED_MIN);
    });

    it('clamps above maximum to SPEED_MAX', () => {
        expect(clampSpeed(3)).toBe(SPEED_MAX);
        expect(clampSpeed(100)).toBe(SPEED_MAX);
    });

    it('preserves values within range', () => {
        expect(clampSpeed(1.0)).toBe(1.0);
        expect(clampSpeed(0.5)).toBe(0.5);
        expect(clampSpeed(1.75)).toBe(1.75);
    });

    it('rounds to two decimal places', () => {
        expect(clampSpeed(0.333)).toBe(0.33);
        expect(clampSpeed(1.006)).toBe(1.01);
        expect(clampSpeed(0.754)).toBe(0.75);
    });
});

describe('clampBpm (from metronome.js)', () => {
    it('clamps below minimum to BPM_MIN', () => {
        expect(clampBpm(0)).toBe(BPM_MIN);
        expect(clampBpm(-10)).toBe(BPM_MIN);
        expect(clampBpm(29)).toBe(BPM_MIN);
    });

    it('clamps above maximum to BPM_MAX', () => {
        expect(clampBpm(301)).toBe(BPM_MAX);
        expect(clampBpm(999)).toBe(BPM_MAX);
    });

    it('preserves values within range', () => {
        expect(clampBpm(120)).toBe(120);
        expect(clampBpm(30)).toBe(30);
        expect(clampBpm(300)).toBe(300);
    });

    it('rounds fractional BPM to nearest integer', () => {
        expect(clampBpm(120.4)).toBe(120);
        expect(clampBpm(120.6)).toBe(121);
    });
});
