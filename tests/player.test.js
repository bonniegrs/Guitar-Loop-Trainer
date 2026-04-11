import { describe, it, expect } from 'vitest';
import { extractVideoId } from '../js/player.js';

describe('extractVideoId', () => {
    it('extracts ID from standard watch URL', () => {
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from watch URL with extra params', () => {
        expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120')).toBe(
            'dQw4w9WgXcQ',
        );
        expect(
            extractVideoId(
                'https://www.youtube.com/watch?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf&v=dQw4w9WgXcQ',
            ),
        ).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from short youtu.be URL', () => {
        expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from embed URL', () => {
        expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from /v/ URL', () => {
        expect(extractVideoId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from shorts URL', () => {
        expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('accepts a bare 11-character video ID', () => {
        expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        expect(extractVideoId('  dQw4w9WgXcQ  ')).toBe('dQw4w9WgXcQ');
    });

    it('handles IDs with hyphens and underscores', () => {
        expect(extractVideoId('https://youtu.be/cJ3QAqFX5U8')).toBe('cJ3QAqFX5U8');
        expect(extractVideoId('vJJobv0FhIQ')).toBe('vJJobv0FhIQ');
    });

    it('returns null for invalid input', () => {
        expect(extractVideoId('')).toBeNull();
        expect(extractVideoId(null)).toBeNull();
        expect(extractVideoId(undefined)).toBeNull();
        expect(extractVideoId('not-a-url')).toBeNull();
        expect(extractVideoId('https://example.com')).toBeNull();
    });

    it('returns null for IDs that are too short or too long', () => {
        expect(extractVideoId('abc')).toBeNull();
        expect(extractVideoId('dQw4w9WgXcQx')).toBeNull();
    });
});
