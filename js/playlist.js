/**
 * Playlist UI: rendering, drag-and-drop reorder, import / export.
 * @module playlist
 */

import { state } from './state.js';
import { dom } from './dom.js';
import { loadPlaylist, savePlaylist, saveCurrentVideoSettings } from './storage.js';
import { formatTime, escapeHtml } from './utils.js';
import { showToast } from './toast.js';

// ─── Rendering ─────────────────────────────────

/** Re-render the sidebar playlist from localStorage. */
export function renderPlaylist() {
    const list = loadPlaylist();

    if (list.length === 0) {
        dom.playlistContainer.innerHTML = `
            <div class="playlist-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                </svg>
                <p>No videos yet</p>
                <span>Load a video to get started</span>
            </div>`;
        return;
    }

    dom.playlistContainer.innerHTML = list.map(item => {
        const isActive = item.videoId === state.currentVideoId;
        const thumbUrl = 'https://img.youtube.com/vi/' + item.videoId + '/mqdefault.jpg';
        const speedText = (item.speed || 1).toFixed(2) + 'x';
        const loopText = item.loopEnd > 0
            ? formatTime(item.loopStart) + ' \u2192 ' + formatTime(item.loopEnd)
            : 'Full';

        return `
            <div class="playlist-item ${isActive ? 'active' : ''}" data-id="${item.videoId}" draggable="true">
                <div class="playlist-item-grip" title="Drag to reorder">\u2807</div>
                <img class="playlist-item-thumb" src="${thumbUrl}" alt="" loading="lazy">
                <div class="playlist-item-info">
                    <div class="playlist-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
                    <div class="playlist-item-meta">
                        <span>\u26A1 ${speedText}</span>
                        <span>\uD83D\uDD01 ${loopText}</span>
                        ${item.bpm ? '<span>\u2669 ' + item.bpm + '</span>' : ''}
                    </div>
                </div>
                <button class="playlist-item-remove" data-remove="${item.videoId}" title="Remove">\u2715</button>
            </div>`;
    }).join('');

    initDragAndDrop();
}

/**
 * Remove a video from the playlist by ID.
 * @param {string} videoId
 */
export function removeFromPlaylist(videoId) {
    const list = loadPlaylist().filter(v => v.videoId !== videoId);
    savePlaylist(list);
    renderPlaylist();
    showToast('Video removed', 'accent');
}

// ─── Drag & Drop Reorder ───────────────────────

function initDragAndDrop() {
    const items = dom.playlistContainer.querySelectorAll('.playlist-item');
    items.forEach(item => {
        item.addEventListener('dragstart', onDragStart);
        item.addEventListener('dragover', onDragOver);
        item.addEventListener('dragenter', onDragEnter);
        item.addEventListener('dragleave', onDragLeave);
        item.addEventListener('drop', onDrop);
        item.addEventListener('dragend', onDragEnd);
    });
}

function onDragStart(e) {
    state.dragSrcEl = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.id);
}

function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const dragging = dom.playlistContainer.querySelector('.dragging');
    if (!dragging || dragging === this) return;

    const rect = this.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
        dom.playlistContainer.insertBefore(dragging, this);
    } else {
        dom.playlistContainer.insertBefore(dragging, this.nextSibling);
    }
}

function onDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function onDragLeave() {
    this.classList.remove('drag-over');
}

function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
    saveDragOrder();
}

function onDragEnd() {
    this.classList.remove('dragging');
    dom.playlistContainer.querySelectorAll('.playlist-item').forEach(el => {
        el.classList.remove('drag-over');
    });
    saveDragOrder();
}

function saveDragOrder() {
    const ids = Array.from(dom.playlistContainer.querySelectorAll('.playlist-item'))
        .map(el => el.dataset.id);
    const list = loadPlaylist();
    const reordered = ids.map(id => list.find(v => v.videoId === id)).filter(Boolean);
    const remaining = list.filter(v => !ids.includes(v.videoId));
    savePlaylist([...reordered, ...remaining]);
}

// ─── Export / Import ───────────────────────────

/** Save the playlist to a JSON file via File System Access API or fallback download. */
export async function exportPlaylist() {
    clearTimeout(state.saveTimer);
    saveCurrentVideoSettings();
    const list = loadPlaylist();
    if (list.length === 0) {
        showToast('Nothing to save \u2014 playlist is empty', 'danger');
        return;
    }
    const json = JSON.stringify(list, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'playlist.json',
                types: [{
                    description: 'JSON File',
                    accept: { 'application/json': ['.json'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            showToast('Playlist saved successfully', 'success');
        } catch (e) {
            if (e.name !== 'AbortError') {
                showToast('Save failed: ' + e.message, 'danger');
            }
        }
    } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'playlist.json';
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('Playlist saved to Downloads', 'success');
    }
}

/**
 * Read a JSON file and replace the current playlist.
 * @param {File} file
 * @param {Function} [onComplete] - Called after successful import
 */
export function importPlaylist(file, onComplete) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error('Invalid format');
            savePlaylist(data);
            renderPlaylist();
            if (onComplete) onComplete();
            showToast('Loaded ' + data.length + ' videos from file', 'success');
        } catch {
            showToast('Invalid playlist file', 'danger');
        }
    };
    reader.readAsText(file);
}

/**
 * On first visit (empty localStorage), try to seed the playlist from playlist.json.
 * @param {Function} [onComplete] - Called after successful auto-load
 */
export async function autoLoadFromFile(onComplete) {
    const existing = loadPlaylist();
    if (existing.length > 0) return;

    try {
        const res = await fetch('playlist.json');
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;

        savePlaylist(data);
        renderPlaylist();
        if (onComplete) onComplete();
        console.log('[Guitar Loop Trainer] Restored', data.length, 'videos from playlist.json');
    } catch {
        // playlist.json not found or invalid — that is fine
    }
}
