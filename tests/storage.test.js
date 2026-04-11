import { describe, it, expect, beforeEach } from 'vitest';
import { loadPlaylist, savePlaylist, addToPlaylist, getPlaylistItem } from '../js/storage.js';
import { STORAGE_KEY, MAX_PLAYLIST } from '../js/config.js';

beforeEach(() => {
    localStorage.clear();
});

describe('loadPlaylist / savePlaylist', () => {
    it('returns an empty array when storage is empty', () => {
        expect(loadPlaylist()).toEqual([]);
    });

    it('round-trips a playlist through localStorage', () => {
        const list = [{ videoId: 'abc', title: 'Test' }];
        savePlaylist(list);
        expect(loadPlaylist()).toEqual(list);
    });

    it('returns empty array for corrupted JSON', () => {
        localStorage.setItem(STORAGE_KEY, '{bad json');
        expect(loadPlaylist()).toEqual([]);
    });
});

describe('addToPlaylist', () => {
    it('adds a new video to the front', () => {
        addToPlaylist('vid1', 'Video One');
        addToPlaylist('vid2', 'Video Two');

        const list = loadPlaylist();
        expect(list.length).toBe(2);
        expect(list[0].videoId).toBe('vid2');
        expect(list[1].videoId).toBe('vid1');
    });

    it('promotes an existing video to the front', () => {
        addToPlaylist('vid1', 'Video One');
        addToPlaylist('vid2', 'Video Two');
        addToPlaylist('vid1', 'Video One Updated');

        const list = loadPlaylist();
        expect(list.length).toBe(2);
        expect(list[0].videoId).toBe('vid1');
        expect(list[0].title).toBe('Video One Updated');
    });

    it('enforces MAX_PLAYLIST limit', () => {
        for (let i = 0; i < MAX_PLAYLIST + 10; i++) {
            addToPlaylist('v' + String(i).padStart(3, '0'), 'Video ' + i);
        }
        expect(loadPlaylist().length).toBe(MAX_PLAYLIST);
    });

    it('sets default fields on new entries', () => {
        addToPlaylist('test123test', 'Test Title');
        const item = loadPlaylist()[0];
        expect(item.videoId).toBe('test123test');
        expect(item.title).toBe('Test Title');
        expect(item.loopStart).toBe(0);
        expect(item.loopEnd).toBe(0);
        expect(item.speed).toBe(1.0);
        expect(item.lastPlayed).toBeGreaterThan(0);
    });
});

describe('getPlaylistItem', () => {
    it('returns the item if it exists', () => {
        addToPlaylist('vid1', 'Video One');
        const item = getPlaylistItem('vid1');
        expect(item).not.toBeNull();
        expect(item.videoId).toBe('vid1');
    });

    it('returns null for a nonexistent ID', () => {
        expect(getPlaylistItem('doesnotexist')).toBeNull();
    });
});
