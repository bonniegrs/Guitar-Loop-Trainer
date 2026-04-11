import { describe, it, expect } from 'vitest';
import { formatTime, escapeHtml } from '../js/utils.js';

describe('formatTime', () => {
    it('formats zero seconds', () => {
        expect(formatTime(0)).toBe('0:00');
    });

    it('formats seconds under a minute', () => {
        expect(formatTime(5)).toBe('0:05');
        expect(formatTime(30)).toBe('0:30');
        expect(formatTime(59)).toBe('0:59');
    });

    it('formats exact minutes', () => {
        expect(formatTime(60)).toBe('1:00');
        expect(formatTime(120)).toBe('2:00');
        expect(formatTime(600)).toBe('10:00');
    });

    it('formats minutes and seconds', () => {
        expect(formatTime(65)).toBe('1:05');
        expect(formatTime(90)).toBe('1:30');
        expect(formatTime(3661)).toBe('61:01');
    });

    it('pads single-digit seconds with a leading zero', () => {
        expect(formatTime(61)).toBe('1:01');
        expect(formatTime(9)).toBe('0:09');
    });

    it('floors fractional seconds', () => {
        expect(formatTime(65.7)).toBe('1:05');
        expect(formatTime(0.9)).toBe('0:00');
    });

    it('returns 0:00 for negative values', () => {
        expect(formatTime(-1)).toBe('0:00');
        expect(formatTime(-100)).toBe('0:00');
    });

    it('returns 0:00 for NaN / undefined / null', () => {
        expect(formatTime(NaN)).toBe('0:00');
        expect(formatTime(undefined)).toBe('0:00');
        expect(formatTime(null)).toBe('0:00');
    });
});

describe('escapeHtml', () => {
    it('escapes ampersands', () => {
        expect(escapeHtml('a&b')).toBe('a&amp;b');
    });

    it('escapes angle brackets', () => {
        expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes double quotes', () => {
        expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('escapes a mix of special characters', () => {
        expect(escapeHtml('<a href="x&y">')).toBe('&lt;a href=&quot;x&amp;y&quot;&gt;');
    });

    it('returns empty string for falsy input', () => {
        expect(escapeHtml('')).toBe('');
        expect(escapeHtml(null)).toBe('');
        expect(escapeHtml(undefined)).toBe('');
    });

    it('leaves safe strings untouched', () => {
        expect(escapeHtml('Hello World')).toBe('Hello World');
    });
});
