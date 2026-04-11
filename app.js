(function () {
    'use strict';

    const STORAGE_KEY = 'guitar-practice-playlist';
    const MAX_PLAYLIST = 50;
    const SPEED_MIN = 0.25;
    const SPEED_MAX = 2.0;
    const SPEED_STEP = 0.05;

    let player = null;
    let playerReady = false;
    let currentVideoId = null;
    let videoDuration = 0;
    let loopEnabled = true;
    let loopStartPercent = 0;
    let loopEndPercent = 100;
    let currentSpeed = 1.0;
    let monitorInterval = null;
    let dragging = null;
    let usingNocookie = false;

    // ─── DOM REFERENCES ──────────────────────────────
    const urlInput = document.getElementById('urlInput');
    const loadBtn = document.getElementById('loadBtn');
    const loopToggle = document.getElementById('loopToggle');
    const setStartBtn = document.getElementById('setStartBtn');
    const setEndBtn = document.getElementById('setEndBtn');
    const resetLoopBtn = document.getElementById('resetLoopBtn');
    const loopTrack = document.getElementById('loopTrack');
    const loopRegion = document.getElementById('loopRegion');
    const playheadEl = document.getElementById('playhead');
    const thumbStart = document.getElementById('thumbStart');
    const thumbEnd = document.getElementById('thumbEnd');
    const startTimeLabel = document.getElementById('startTimeLabel');
    const endTimeLabel = document.getElementById('endTimeLabel');
    const currentTimeDisplay = document.getElementById('currentTimeDisplay');
    const durationDisplay = document.getElementById('durationDisplay');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    const speedLabels = document.querySelectorAll('.speed-labels span');
    const playlistContainer = document.getElementById('playlistContainer');
    const headerEq = document.getElementById('headerEq');
    const toastContainer = document.getElementById('toastContainer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const goToStartBtn = document.getElementById('goToStartBtn');
    const muteBtn = document.getElementById('muteBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeLabel = document.getElementById('volumeLabel');
    const iconPlay = document.getElementById('iconPlay');
    const iconPause = document.getElementById('iconPause');
    const iconVol = document.getElementById('iconVol');
    const iconMuted = document.getElementById('iconMuted');

    // ─── YOUTUBE API ─────────────────────────────────
    function loadYouTubeAPI() {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = function () {
        playerReady = false;
    };

    function prepareWrapper() {
        const wrapper = document.querySelector('.player-wrapper');
        const placeholder = wrapper.querySelector('.player-placeholder');
        if (placeholder) placeholder.remove();
        const blocked = wrapper.querySelector('.embed-blocked');
        if (blocked) blocked.remove();

        if (player && player.destroy) {
            try { player.destroy(); } catch (_) {}
            player = null;
            playerReady = false;
        }

        const oldContainer = document.getElementById('ytplayer');
        if (oldContainer) oldContainer.remove();

        const container = document.createElement('div');
        container.id = 'ytplayer';
        wrapper.appendChild(container);
        return wrapper;
    }

    function buildPlayerVars() {
        const vars = {
            autoplay: 1,
            controls: 1,
            enablejsapi: 1,
            fs: 1,
            rel: 0,
        };
        const origin = window.location.protocol === 'file:' ? undefined : window.location.origin;
        if (origin) vars.origin = origin;
        return vars;
    }

    function createPlayer(videoId) {
        if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') {
            showToast('YouTube API still loading, please try again...', 'danger');
            return;
        }
        usingNocookie = false;
        prepareWrapper();
        player = new YT.Player('ytplayer', {
            videoId: videoId,
            playerVars: buildPlayerVars(),
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerError,
            },
        });
        updateTransportControls();
    }

    function createPlayerNocookie(videoId) {
        usingNocookie = true;
        prepareWrapper();
        player = new YT.Player('ytplayer', {
            videoId: videoId,
            host: 'https://www.youtube-nocookie.com',
            playerVars: buildPlayerVars(),
            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
                onError: onPlayerErrorFinal,
            },
        });
        showToast('Using privacy-enhanced player — use controls below', 'accent');
        updateTransportControls();
    }

    const YT_ERRORS = {
        2: 'Invalid video ID or parameter.',
        5: 'This video cannot be played in an HTML5 player.',
        100: 'Video not found — it may have been removed or set to private.',
        101: 'The video owner does not allow embedded playback.',
        150: 'The video owner does not allow embedded playback.',
    };

    function onPlayerError(event) {
        const code = event.data;
        console.error('[Guitar Looper Trainer] YT error', code);
        if ((code === 101 || code === 150) && !usingNocookie) {
            showToast('Embedding blocked — retrying with alternate player...', 'accent');
            createPlayerNocookie(currentVideoId);
        } else {
            const msg = YT_ERRORS[code] || 'YouTube player error (code ' + code + ').';
            showToast(msg, 'danger');
        }
    }

    function onPlayerErrorFinal(event) {
        const code = event.data;
        console.error('[Guitar Looper Trainer] YT nocookie error', code);
        showEmbedBlockedFallback();
    }

    function showEmbedBlockedFallback() {
        const wrapper = document.querySelector('.player-wrapper');
        const startSec = Math.floor((loopStartPercent / 100) * videoDuration) || 0;
        const ytUrl = 'https://www.youtube.com/watch?v=' + currentVideoId + (startSec > 0 ? '&t=' + startSec : '');

        let fallback = wrapper.querySelector('.embed-blocked');
        if (fallback) fallback.remove();

        fallback = document.createElement('div');
        fallback.className = 'embed-blocked';
        fallback.innerHTML =
            '<div class="embed-blocked-inner">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">' +
                    '<circle cx="12" cy="12" r="10"/>' +
                    '<line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>' +
                '</svg>' +
                '<h3>Video cannot be embedded</h3>' +
                '<p>Both standard and privacy-enhanced players were blocked by the video owner.</p>' +
                '<a href="' + ytUrl + '" target="_blank" rel="noopener" class="btn-open-yt">' +
                    '▶ Open on YouTube' +
                '</a>' +
                '<span class="embed-blocked-hint">Loop and speed settings cannot be carried over to YouTube — try a different video</span>' +
            '</div>';
        wrapper.appendChild(fallback);
    }

    function reclaimFocus() {
        if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
            document.activeElement.blur();
        }
        document.body.focus();
    }

    function onPlayerReady(event) {
        playerReady = true;
        videoDuration = player.getDuration();
        durationDisplay.textContent = formatTime(videoDuration);

        const item = getPlaylistItem(currentVideoId);

        const vol = (item && item.volume !== undefined) ? item.volume : parseInt(volumeSlider.value);
        player.setVolume(vol);
        volumeSlider.value = vol;
        volumeLabel.textContent = vol;

        if (item && item.loopEnabled !== undefined) {
            loopEnabled = item.loopEnabled;
        } else {
            loopEnabled = true;
        }
        loopToggle.checked = loopEnabled;

        player.setPlaybackRate(currentSpeed);

        updateLoopVisuals();
        startMonitor();

        if (item && item.loopEnd > 0 && videoDuration > 0) {
            loopStartPercent = (item.loopStart / videoDuration) * 100;
            loopEndPercent = (item.loopEnd / videoDuration) * 100;
            currentSpeed = item.speed || 1.0;
            speedSlider.value = currentSpeed;
            updateSpeedDisplay();
            player.setPlaybackRate(currentSpeed);
            restoreMetroSettings(item);
            updateLoopVisuals();
            if (loopEnabled && item.loopStart > 0) {
                player.seekTo(item.loopStart, true);
            }
        } else if (item) {
            currentSpeed = item.speed || 1.0;
            speedSlider.value = currentSpeed;
            updateSpeedDisplay();
            player.setPlaybackRate(currentSpeed);
            restoreMetroSettings(item);
        }
    }

    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            headerEq.classList.add('active');
            startMonitor();

            if (videoDuration <= 0) {
                videoDuration = player.getDuration();
                durationDisplay.textContent = formatTime(videoDuration);
                updateLoopVisuals();
            }
        } else {
            headerEq.classList.remove('active');
        }

        updateTransportControls();

        if (event.data === YT.PlayerState.ENDED && loopEnabled) {
            const startTime = (loopStartPercent / 100) * videoDuration;
            player.seekTo(startTime, true);
            player.playVideo();
        }
    }

    // ─── MONITORING LOOP ─────────────────────────────
    function startMonitor() {
        if (monitorInterval) return;
        monitorInterval = setInterval(monitorPlayback, 100);
    }

    function stopMonitor() {
        if (monitorInterval) {
            clearInterval(monitorInterval);
            monitorInterval = null;
        }
    }

    function monitorPlayback() {
        if (!playerReady || !player || typeof player.getCurrentTime !== 'function') return;

        const currentTime = player.getCurrentTime();
        const percent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

        playheadEl.style.left = percent + '%';
        currentTimeDisplay.textContent = formatTime(currentTime);

        if (loopEnabled && videoDuration > 0) {
            const endTime = (loopEndPercent / 100) * videoDuration;
            const startTime = (loopStartPercent / 100) * videoDuration;

            if (currentTime >= endTime) {
                player.seekTo(startTime, true);
            }
        }
    }

    // ─── TRANSPORT CONTROLS ─────────────────────────
    function updateTransportControls() {
        if (!playerReady || !player) {
            iconPlay.style.display = '';
            iconPause.style.display = 'none';
            return;
        }
        const state = player.getPlayerState();
        const playing = state === YT.PlayerState.PLAYING;
        iconPlay.style.display = playing ? 'none' : '';
        iconPause.style.display = playing ? '' : 'none';

        const muted = player.isMuted();
        iconVol.style.display = muted ? 'none' : '';
        iconMuted.style.display = muted ? '' : 'none';
    }

    function togglePlayPause() {
        if (!playerReady || !player) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) player.pauseVideo();
        else player.playVideo();
    }

    function stopVideo() {
        if (!playerReady || !player) return;
        player.pauseVideo();
        const startTime = (loopStartPercent / 100) * videoDuration;
        player.seekTo(startTime, true);
        updateTransportControls();
    }

    function goToBeginning() {
        if (!playerReady || !player) return;
        player.seekTo(0, true);
        updateTransportControls();
    }

    function toggleMute() {
        if (!playerReady || !player) return;
        if (player.isMuted()) player.unMute();
        else player.mute();
        updateTransportControls();
    }

    function setVolume(val) {
        if (!playerReady || !player) return;
        player.setVolume(val);
        volumeLabel.textContent = val;
        if (player.isMuted() && val > 0) {
            player.unMute();
            updateTransportControls();
        }
    }

    // ─── LOOP CONTROLS ───────────────────────────────
    function updateLoopVisuals() {
        const start = Math.min(loopStartPercent, loopEndPercent);
        const end = Math.max(loopStartPercent, loopEndPercent);

        loopRegion.style.left = start + '%';
        loopRegion.style.width = (end - start) + '%';

        thumbStart.style.left = start + '%';
        thumbEnd.style.left = end + '%';

        if (loopEnabled) {
            loopRegion.classList.remove('disabled');
        } else {
            loopRegion.classList.add('disabled');
        }

        const startSec = (start / 100) * videoDuration;
        const endSec = (end / 100) * videoDuration;

        startTimeLabel.textContent = formatTime(startSec);
        endTimeLabel.textContent = formatTime(endSec);
    }

    function setLoopStartToCurrent() {
        if (!playerReady || !player) return;
        const t = player.getCurrentTime();
        loopStartPercent = (t / videoDuration) * 100;
        if (loopStartPercent >= loopEndPercent) {
            loopStartPercent = loopEndPercent - 0.5;
        }
        updateLoopVisuals();
        saveCurrentVideoSettings();
        renderPlaylist();
        showToast('Loop start set to ' + formatTime(t), 'accent');
    }

    function setLoopEndToCurrent() {
        if (!playerReady || !player) return;
        const t = player.getCurrentTime();
        loopEndPercent = (t / videoDuration) * 100;
        if (loopEndPercent <= loopStartPercent) {
            loopEndPercent = loopStartPercent + 0.5;
        }
        updateLoopVisuals();
        saveCurrentVideoSettings();
        renderPlaylist();
        showToast('Loop end set to ' + formatTime(t), 'accent');
    }

    function resetLoop() {
        loopStartPercent = 0;
        loopEndPercent = 100;
        updateLoopVisuals();
        saveCurrentVideoSettings();
        renderPlaylist();
        showToast('Loop reset', 'accent');
    }

    function restartLoop() {
        if (!playerReady || !player || videoDuration <= 0) return;
        const startTime = (loopStartPercent / 100) * videoDuration;
        player.seekTo(startTime, true);
        player.playVideo();
    }

    // ─── LOOP THUMB DRAGGING ─────────────────────────
    function onThumbMouseDown(which, e) {
        e.preventDefault();
        dragging = which;
        document.body.style.cursor = 'ew-resize';
        if (which === 'start') thumbStart.classList.add('dragging');
        else thumbEnd.classList.add('dragging');
    }

    function onDocumentMouseMove(e) {
        if (!dragging) return;
        const rect = loopTrack.getBoundingClientRect();
        let pct = ((e.clientX - rect.left) / rect.width) * 100;
        pct = Math.max(0, Math.min(100, pct));

        if (dragging === 'start') {
            loopStartPercent = Math.min(pct, loopEndPercent - 0.5);
        } else {
            loopEndPercent = Math.max(pct, loopStartPercent + 0.5);
        }
        updateLoopVisuals();
    }

    function onDocumentMouseUp() {
        if (!dragging) return;
        thumbStart.classList.remove('dragging');
        thumbEnd.classList.remove('dragging');
        document.body.style.cursor = '';
        dragging = null;
        saveCurrentVideoSettings();
        renderPlaylist();
    }

    function onTrackClick(e) {
        if (dragging) return;
        if (!playerReady || !player || videoDuration <= 0) return;
        const rect = loopTrack.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        const seekTime = (pct / 100) * videoDuration;
        player.seekTo(seekTime, true);
    }

    // ─── SPEED CONTROL ───────────────────────────────
    function updateSpeedDisplay() {
        speedValue.textContent = currentSpeed.toFixed(2) + 'x';
        speedLabels.forEach(label => {
            const val = parseFloat(label.dataset.value);
            label.classList.toggle('active', Math.abs(val - currentSpeed) < 0.01);
        });
    }

    function setSpeed(rate) {
        currentSpeed = Math.round(Math.max(SPEED_MIN, Math.min(SPEED_MAX, rate)) * 100) / 100;
        speedSlider.value = currentSpeed;
        updateSpeedDisplay();
        if (playerReady && player) {
            player.setPlaybackRate(currentSpeed);
        }
        saveCurrentVideoSettings();
        renderPlaylist();
    }

    // ─── VIDEO LOADING ───────────────────────────────
    function extractVideoId(url) {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        ];
        for (const p of patterns) {
            const m = url.match(p);
            if (m) return m[1];
        }
        if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
        return null;
    }

    async function fetchVideoTitle(videoId) {
        try {
            const res = await fetch('https://noembed.com/embed?url=https://www.youtube.com/watch?v=' + videoId);
            const data = await res.json();
            return data.title || 'Untitled Video';
        } catch {
            return 'Untitled Video';
        }
    }

    async function loadVideo(url) {
        const videoId = extractVideoId(url);
        if (!videoId) {
            showToast('Invalid YouTube URL', 'danger');
            return;
        }

        currentVideoId = videoId;
        loopStartPercent = 0;
        loopEndPercent = 100;
        videoDuration = 0;

        stopMonitor();
        createPlayer(videoId);

        const title = await fetchVideoTitle(videoId);
        addToPlaylist(videoId, title);
        renderPlaylist();
        urlInput.value = '';
    }

    // ─── PLAYLIST / LOCAL STORAGE ────────────────────
    function loadPlaylist() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    }

    function savePlaylist(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    function addToPlaylist(videoId, title) {
        const list = loadPlaylist();

        const existingIdx = list.findIndex(v => v.videoId === videoId);
        if (existingIdx !== -1) {
            const [item] = list.splice(existingIdx, 1);
            item.title = title || item.title;
            item.lastPlayed = Date.now();
            list.unshift(item);
        } else {
            list.unshift({
                videoId,
                title,
                url: 'https://www.youtube.com/watch?v=' + videoId,
                loopStart: 0,
                loopEnd: 0,
                speed: 1.0,
                lastPlayed: Date.now(),
            });
        }

        while (list.length > MAX_PLAYLIST) list.pop();
        savePlaylist(list);
    }

    function removeFromPlaylist(videoId) {
        const list = loadPlaylist().filter(v => v.videoId !== videoId);
        savePlaylist(list);
        renderPlaylist();
        showToast('Video removed', 'accent');
    }

    function clearPlaylist() {
        savePlaylist([]);
        renderPlaylist();
        showToast('Playlist cleared', 'accent');
    }

    function getPlaylistItem(videoId) {
        return loadPlaylist().find(v => v.videoId === videoId) || null;
    }

    function restoreCurrentVideoSettings() {
        if (!currentVideoId) return;
        const item = getPlaylistItem(currentVideoId);
        if (!item) return;

        currentSpeed = item.speed || 1.0;
        speedSlider.value = currentSpeed;
        updateSpeedDisplay();
        if (playerReady && player) player.setPlaybackRate(currentSpeed);

        const vol = (item.volume !== undefined) ? item.volume : parseInt(volumeSlider.value);
        if (playerReady && player) player.setVolume(vol);
        volumeSlider.value = vol;
        volumeLabel.textContent = vol;

        if (item.loopEnabled !== undefined) {
            loopEnabled = item.loopEnabled;
        } else {
            loopEnabled = true;
        }
        loopToggle.checked = loopEnabled;

        if (item.loopEnd > 0 && videoDuration > 0) {
            loopStartPercent = (item.loopStart / videoDuration) * 100;
            loopEndPercent = (item.loopEnd / videoDuration) * 100;
            updateLoopVisuals();
        }
        restoreMetroSettings(item);
    }

    function saveCurrentVideoSettings() {
        if (!currentVideoId) return;
        const list = loadPlaylist();
        const item = list.find(v => v.videoId === currentVideoId);
        if (!item) return;

        if (videoDuration > 0) {
            item.loopStart = (loopStartPercent / 100) * videoDuration;
            item.loopEnd = (loopEndPercent / 100) * videoDuration;
        }
        item.loopEnabled = loopEnabled;
        item.speed = currentSpeed;
        item.volume = parseInt(volumeSlider.value);
        item.bpm = metroBpm;
        item.metroVolume = metroVolume;
        item.progEnabled = progEnabled;
        item.progStart = parseInt(progStartBpm.dataset.value) || 85;
        item.progEnd = parseInt(progEndBpm.dataset.value) || 110;
        item.progStep = parseInt(progStep.value) || 5;
        item.progBars = parseInt(progBars.value) || 4;
        savePlaylist(list);
    }

    // ─── EXPORT / IMPORT ──────────────────────────────
    async function exportPlaylist() {
        clearTimeout(saveTimer);
        saveCurrentVideoSettings();
        const list = loadPlaylist();
        if (list.length === 0) {
            showToast('Nothing to save — playlist is empty', 'danger');
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

    function importPlaylist(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) throw new Error('Invalid format');
                savePlaylist(data);
                renderPlaylist();
                restoreCurrentVideoSettings();
                showToast('Loaded ' + data.length + ' videos from file', 'success');
            } catch {
                showToast('Invalid playlist file', 'danger');
            }
        };
        reader.readAsText(file);
    }

    async function autoLoadFromFile() {
        const existing = loadPlaylist();
        if (existing.length > 0) return;

        try {
            const res = await fetch('playlist.json');
            if (!res.ok) return;
            const data = await res.json();
            if (!Array.isArray(data) || data.length === 0) return;

            savePlaylist(data);
            renderPlaylist();
            restoreCurrentVideoSettings();
            console.log('[Guitar Looper Trainer] Restored', data.length, 'videos from playlist.json');
        } catch {
            // no file found or invalid — that's fine
        }
    }

    // ─── RENDER PLAYLIST ─────────────────────────────
    function renderPlaylist() {
        const list = loadPlaylist();

        if (list.length === 0) {
            playlistContainer.innerHTML = `
                <div class="playlist-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                        <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                    <p>No videos yet</p>
                    <span>Load a YouTube video to get started</span>
                </div>`;
            return;
        }

        playlistContainer.innerHTML = list.map(item => {
            const isActive = item.videoId === currentVideoId;
            const thumbUrl = 'https://img.youtube.com/vi/' + item.videoId + '/mqdefault.jpg';
            const speedText = (item.speed || 1).toFixed(2) + 'x';
            const loopText = item.loopEnd > 0
                ? formatTime(item.loopStart) + ' → ' + formatTime(item.loopEnd)
                : 'Full';

            return `
                <div class="playlist-item ${isActive ? 'active' : ''}" data-id="${item.videoId}" draggable="true">
                    <div class="playlist-item-grip" title="Drag to reorder">⠿</div>
                    <img class="playlist-item-thumb" src="${thumbUrl}" alt="" loading="lazy">
                    <div class="playlist-item-info">
                        <div class="playlist-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
                        <div class="playlist-item-meta">
                            <span>⚡ ${speedText}</span>
                            <span>🔁 ${loopText}</span>
                            ${item.bpm ? '<span>♩ ' + item.bpm + '</span>' : ''}
                        </div>
                    </div>
                    <button class="playlist-item-remove" data-remove="${item.videoId}" title="Remove">✕</button>
                </div>`;
        }).join('');

        initDragAndDrop();
    }

    // ─── DRAG & DROP REORDER ─────────────────────────
    let dragSrcEl = null;

    function initDragAndDrop() {
        const items = playlistContainer.querySelectorAll('.playlist-item');
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
        dragSrcEl = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.id);
    }

    function onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const dragging = playlistContainer.querySelector('.dragging');
        if (!dragging || dragging === this) return;

        const rect = this.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
            playlistContainer.insertBefore(dragging, this);
        } else {
            playlistContainer.insertBefore(dragging, this.nextSibling);
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
        playlistContainer.querySelectorAll('.playlist-item').forEach(el => {
            el.classList.remove('drag-over');
        });
        saveDragOrder();
    }

    function saveDragOrder() {
        const ids = Array.from(playlistContainer.querySelectorAll('.playlist-item'))
            .map(el => el.dataset.id);
        const list = loadPlaylist();
        const reordered = ids.map(id => list.find(v => v.videoId === id)).filter(Boolean);
        const remaining = list.filter(v => !ids.includes(v.videoId));
        savePlaylist([...reordered, ...remaining]);
    }

    // ─── METRONOME ────────────────────────────────────
    let metroAudioCtx = null;
    let metroMasterGain = null;
    let metroBpm = 120;
    let metroVolume = 50;
    let metroPlaying = false;
    let metroTimerId = null;
    let metroNextNoteTime = 0;
    let metroBeatCount = 0;
    const METRO_SCHEDULE_AHEAD = 0.1;
    const METRO_LOOKAHEAD_MS = 25;

    const metroBpmValue = document.getElementById('metroBpmValue');
    const metroToggleBtn = document.getElementById('metroToggleBtn');
    const metroIconPlay = document.getElementById('metroIconPlay');
    const metroIconStop = document.getElementById('metroIconStop');
    const bpmSlider = document.getElementById('bpmSlider');
    const bpmMinusBtn = document.getElementById('bpmMinusBtn');
    const bpmPlusBtn = document.getElementById('bpmPlusBtn');
    const tapTempoBtn = document.getElementById('tapTempoBtn');
    const metroBeatDots = document.getElementById('metroBeatDots');
    const metroDots = metroBeatDots.querySelectorAll('.metro-dot');

    function metroClick(time, accent) {
        if (!metroAudioCtx || !metroMasterGain) return;
        const osc = metroAudioCtx.createOscillator();
        const gain = metroAudioCtx.createGain();
        osc.connect(gain);
        gain.connect(metroMasterGain);
        osc.frequency.value = accent ? 1200 : 800;
        gain.gain.setValueAtTime(accent ? 0.6 : 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        osc.start(time);
        osc.stop(time + 0.04);
    }

    function metroScheduler() {
        while (metroNextNoteTime < metroAudioCtx.currentTime + METRO_SCHEDULE_AHEAD) {
            const accent = metroBeatCount % 4 === 0;
            metroClick(metroNextNoteTime, accent);

            const beatIdx = metroBeatCount % 4;
            const delay = Math.max(0, (metroNextNoteTime - metroAudioCtx.currentTime) * 1000);
            setTimeout(() => {
                flashDot(beatIdx);
                progOnBeat();
            }, delay);

            metroNextNoteTime += 60.0 / metroBpm;
            metroBeatCount++;
        }
        metroTimerId = setTimeout(metroScheduler, METRO_LOOKAHEAD_MS);
    }

    function flashDot(idx) {
        metroDots.forEach(d => { d.classList.remove('flash', 'flash-down'); });
        if (metroDots[idx]) {
            metroDots[idx].classList.add(idx === 0 ? 'flash' : 'flash-down');
        }
    }

    function startMetronome() {
        if (!metroAudioCtx) {
            metroAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            metroMasterGain = metroAudioCtx.createGain();
            metroMasterGain.connect(metroAudioCtx.destination);
        }
        metroMasterGain.gain.value = metroVolume / 100;
        if (metroAudioCtx.state === 'suspended') metroAudioCtx.resume();
        metroPlaying = true;
        metroBeatCount = 0;
        metroNextNoteTime = metroAudioCtx.currentTime;
        if (progEnabled) progReset();
        metroScheduler();
        metroToggleBtn.classList.add('active');
        metroIconPlay.style.display = 'none';
        metroIconStop.style.display = '';
    }

    function stopMetronome() {
        metroPlaying = false;
        clearTimeout(metroTimerId);
        metroTimerId = null;
        metroToggleBtn.classList.remove('active');
        metroIconPlay.style.display = '';
        metroIconStop.style.display = 'none';
        metroDots.forEach(d => { d.classList.remove('flash', 'flash-down'); });
        progProgressRow.style.display = 'none';
    }

    function toggleMetronome() {
        if (metroPlaying) stopMetronome();
        else startMetronome();
    }

    function setMetroBpm(val, skipSave) {
        metroBpm = Math.max(30, Math.min(300, Math.round(val)));
        metroBpmValue.textContent = metroBpm;
        bpmSlider.value = metroBpm;
        if (!skipSave) debouncedSave();
    }

    let saveTimer = null;
    function debouncedSave() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveCurrentVideoSettings();
        }, 500);
    }

    function restoreMetroSettings(item) {
        if (!item) return;
        if (item.progStart !== undefined) {
            progStartBpm.dataset.value = item.progStart;
            progStartBpm.textContent = item.progStart;
        }
        if (item.progEnd !== undefined) {
            progEndBpm.dataset.value = item.progEnd;
            progEndBpm.textContent = item.progEnd;
        }
        if (item.progStep !== undefined) {
            progStep.value = item.progStep;
        }
        if (item.progBars !== undefined) {
            progBars.value = item.progBars;
        }
        progEnabled = !!item.progEnabled;
        progToggle.checked = progEnabled;
        progBody.classList.toggle('open', progEnabled);
        if (item.metroVolume !== undefined) {
            metroVolume = item.metroVolume;
            document.getElementById('metroVolSlider').value = metroVolume;
            document.getElementById('metroVolLabel').textContent = metroVolume;
            if (metroMasterGain) metroMasterGain.gain.value = metroVolume / 100;
        }
        if (item.bpm) setMetroBpm(item.bpm, true);
    }

    // Tap Tempo
    let tapTimes = [];
    function tapTempo() {
        const now = Date.now();
        if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2500) {
            tapTimes = [];
        }
        tapTimes.push(now);
        if (tapTimes.length > 8) tapTimes.shift();
        if (tapTimes.length >= 2) {
            let total = 0;
            for (let i = 1; i < tapTimes.length; i++) {
                total += tapTimes[i] - tapTimes[i - 1];
            }
            const avgMs = total / (tapTimes.length - 1);
            const detected = Math.round(60000 / avgMs);
            setMetroBpm(detected);
            showToast('BPM: ' + metroBpm + ' (' + tapTimes.length + ' taps)', 'accent');
        }
    }

    metroToggleBtn.addEventListener('click', toggleMetronome);
    bpmSlider.addEventListener('input', () => setMetroBpm(parseInt(bpmSlider.value)));
    bpmMinusBtn.addEventListener('click', () => setMetroBpm(metroBpm - 1));
    bpmPlusBtn.addEventListener('click', () => setMetroBpm(metroBpm + 1));
    tapTempoBtn.addEventListener('click', tapTempo);

    // ─── PROGRESSIVE TEMPO ───────────────────────────
    const progToggle = document.getElementById('progToggle');
    const progBody = document.getElementById('progBody');
    const progStartBpm = document.getElementById('progStartBpm');
    const progEndBpm = document.getElementById('progEndBpm');
    const progStep = document.getElementById('progStep');
    const progBars = document.getElementById('progBars');
    const progProgressRow = document.getElementById('progProgressRow');
    const progFill = document.getElementById('progFill');
    const progText = document.getElementById('progText');

    let progEnabled = false;
    let progCurrentBpm = 0;
    let progBeatsInStep = 0;
    let progTotalBeats = 0;

    progToggle.addEventListener('change', () => {
        progEnabled = progToggle.checked;
        progBody.classList.toggle('open', progEnabled);
        debouncedSave();
    });

    progStep.addEventListener('change', () => debouncedSave());
    progBars.addEventListener('change', () => debouncedSave());

    function progAdjust(target, dir) {
        let val = parseInt(target.dataset.value) + dir;
        val = Math.max(30, Math.min(300, val));
        target.dataset.value = val;
        target.textContent = val;
    }

    document.querySelectorAll('.prog-adj').forEach(btn => {
        let holdTimer = null;
        let holdInterval = null;

        function startHold() {
            const target = document.getElementById(btn.dataset.target);
            const dir = parseInt(btn.dataset.dir);
            progAdjust(target, dir);
            holdTimer = setTimeout(() => {
                holdInterval = setInterval(() => progAdjust(target, dir), 80);
            }, 400);
        }

        function stopHold() {
            clearTimeout(holdTimer);
            clearInterval(holdInterval);
            holdTimer = null;
            holdInterval = null;
            debouncedSave();
        }

        btn.addEventListener('mousedown', (e) => { e.preventDefault(); startHold(); });
        btn.addEventListener('mouseup', stopHold);
        btn.addEventListener('mouseleave', stopHold);
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); startHold(); });
        btn.addEventListener('touchend', stopHold);
    });

    function progCalcTotalBeats() {
        const startVal = parseInt(progStartBpm.dataset.value) || 85;
        const endVal = parseInt(progEndBpm.dataset.value) || 110;
        const stepVal = parseInt(progStep.value) || 5;
        const barsVal = parseInt(progBars.value) || 4;
        const beatsPerStep = barsVal * 4;
        const steps = Math.ceil((endVal - startVal) / stepVal);
        return steps * beatsPerStep;
    }

    function progReset() {
        progCurrentBpm = parseInt(progStartBpm.dataset.value) || 85;
        progBeatsInStep = 0;
        progTotalBeats = 0;
        setMetroBpm(progCurrentBpm, true);
        progUpdateProgress();
        progProgressRow.style.display = progEnabled ? 'flex' : 'none';
    }

    function progOnBeat() {
        if (!progEnabled) return;

        const startVal = parseInt(progStartBpm.dataset.value) || 85;
        const endVal = parseInt(progEndBpm.dataset.value) || 110;
        const stepVal = parseInt(progStep.value) || 5;
        const barsVal = parseInt(progBars.value) || 4;
        const beatsPerStep = barsVal * 4;

        progBeatsInStep++;
        if (progCurrentBpm < endVal) progTotalBeats++;

        if (progBeatsInStep >= beatsPerStep && progCurrentBpm < endVal) {
            progCurrentBpm = Math.min(progCurrentBpm + stepVal, endVal);
            progBeatsInStep = 0;
            setMetroBpm(progCurrentBpm, true);
            showToast('Tempo → ' + progCurrentBpm + ' BPM', 'accent');
        }

        progUpdateProgress();
    }

    function progUpdateProgress() {
        const total = progCalcTotalBeats();
        const pct = total > 0 ? (progTotalBeats / total) * 100 : 0;
        const endVal = parseInt(progEndBpm.dataset.value) || 110;
        progFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
        progText.textContent = progCurrentBpm + ' / ' + endVal + ' BPM';
    }

    const metroVolSlider = document.getElementById('metroVolSlider');
    const metroVolLabel = document.getElementById('metroVolLabel');
    const metroMuteBtn = document.getElementById('metroMuteBtn');
    const metroVolIcon = document.getElementById('metroVolIcon');
    const metroMutedIcon = document.getElementById('metroMutedIcon');
    let metroMuted = false;
    let metroVolBeforeMute = 50;

    metroVolSlider.addEventListener('input', () => {
        metroVolume = parseInt(metroVolSlider.value);
        metroVolLabel.textContent = metroVolume;
        if (metroMasterGain) metroMasterGain.gain.value = metroVolume / 100;
        if (metroMuted && metroVolume > 0) {
            metroMuted = false;
            metroVolIcon.style.display = '';
            metroMutedIcon.style.display = 'none';
        }
        debouncedSave();
    });

    metroMuteBtn.addEventListener('click', () => {
        metroMuted = !metroMuted;
        if (metroMuted) {
            metroVolBeforeMute = metroVolume;
            metroVolume = 0;
            metroVolSlider.value = 0;
            metroVolLabel.textContent = '0';
        } else {
            metroVolume = metroVolBeforeMute || 50;
            metroVolSlider.value = metroVolume;
            metroVolLabel.textContent = metroVolume;
        }
        if (metroMasterGain) metroMasterGain.gain.value = metroVolume / 100;
        metroVolIcon.style.display = metroMuted ? 'none' : '';
        metroMutedIcon.style.display = metroMuted ? '' : 'none';
        debouncedSave();
    });

    // ─── TOAST NOTIFICATIONS ─────────────────────────
    function showToast(message, type) {
        type = type || 'accent';
        const el = document.createElement('div');
        el.className = 'toast toast-' + type;
        el.textContent = message;
        toastContainer.appendChild(el);
        setTimeout(() => {
            el.classList.add('toast-out');
            setTimeout(() => el.remove(), 300);
        }, 2200);
    }

    // ─── HELPERS ─────────────────────────────────────
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ─── EVENT LISTENERS ─────────────────────────────
    loadBtn.addEventListener('click', () => loadVideo(urlInput.value.trim()));

    urlInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') loadVideo(urlInput.value.trim());
    });

    playPauseBtn.addEventListener('click', togglePlayPause);
    stopBtn.addEventListener('click', stopVideo);
    goToStartBtn.addEventListener('click', goToBeginning);
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', () => setVolume(parseInt(volumeSlider.value)));
    volumeSlider.addEventListener('change', () => debouncedSave());

    loopToggle.addEventListener('change', () => {
        loopEnabled = loopToggle.checked;
        updateLoopVisuals();
        debouncedSave();
    });

    setStartBtn.addEventListener('click', setLoopStartToCurrent);
    setEndBtn.addEventListener('click', setLoopEndToCurrent);
    document.getElementById('restartLoopBtn').addEventListener('click', restartLoop);
    resetLoopBtn.addEventListener('click', resetLoop);

    thumbStart.addEventListener('mousedown', e => onThumbMouseDown('start', e));
    thumbEnd.addEventListener('mousedown', e => onThumbMouseDown('end', e));
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('mouseup', onDocumentMouseUp);

    loopTrack.addEventListener('click', onTrackClick);

    speedSlider.addEventListener('input', () => setSpeed(parseFloat(speedSlider.value)));

    speedLabels.forEach(label => {
        label.addEventListener('click', () => setSpeed(parseFloat(label.dataset.value)));
    });

    playlistContainer.addEventListener('click', e => {
        const removeBtn = e.target.closest('[data-remove]');
        if (removeBtn) {
            e.stopPropagation();
            removeFromPlaylist(removeBtn.dataset.remove);
            return;
        }

        const item = e.target.closest('.playlist-item');
        if (item) {
            const videoId = item.dataset.id;
            const entry = getPlaylistItem(videoId);
            if (entry) {
                currentVideoId = videoId;
                loopStartPercent = 0;
                loopEndPercent = 100;
                videoDuration = 0;
                currentSpeed = entry.speed || 1.0;
                speedSlider.value = currentSpeed;
                updateSpeedDisplay();
                restoreMetroSettings(entry);

                stopMonitor();
                createPlayer(videoId);
                renderPlaylist();
            }
        }
    });

    document.getElementById('exportBtn').addEventListener('click', exportPlaylist);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => {
        if (e.target.files[0]) {
            importPlaylist(e.target.files[0]);
            e.target.value = '';
        }
    });


    function handleShortcut(e) {
        const tag = e.target.tagName;
        const type = (e.target.type || '').toLowerCase();
        if (tag === 'TEXTAREA' || (tag === 'INPUT' && type !== 'range')) return;

        const code = e.code;
        const key = e.key;

        if (code === 'Space') {
            e.preventDefault();
            togglePlayPause();
        } else if (code === 'BracketLeft') {
            setLoopStartToCurrent();
        } else if (code === 'BracketRight') {
            setLoopEndToCurrent();
        } else if (code === 'KeyR') {
            restartLoop();
        } else if (code === 'KeyL') {
            loopToggle.checked = !loopToggle.checked;
            loopEnabled = loopToggle.checked;
            updateLoopVisuals();
            showToast('Loop ' + (loopEnabled ? 'enabled' : 'disabled'), 'accent');
        } else if (code === 'Minus' || key === '-' || key === '_') {
            setSpeed(currentSpeed - SPEED_STEP);
            showToast('Speed: ' + currentSpeed.toFixed(2) + 'x', 'accent');
        } else if (code === 'Equal' || key === '=' || key === '+') {
            setSpeed(currentSpeed + SPEED_STEP);
            showToast('Speed: ' + currentSpeed.toFixed(2) + 'x', 'accent');
        } else if (code === 'ArrowUp') {
            e.preventDefault();
            const vUp = Math.min(100, parseInt(volumeSlider.value) + 5);
            volumeSlider.value = vUp;
            setVolume(vUp);
            showToast('Volume: ' + vUp + '%', 'accent');
        } else if (code === 'ArrowDown') {
            e.preventDefault();
            const vDn = Math.max(0, parseInt(volumeSlider.value) - 5);
            volumeSlider.value = vDn;
            setVolume(vDn);
            showToast('Volume: ' + vDn + '%', 'accent');
        } else if (code === 'KeyM') {
            toggleMute();
            showToast(player && player.isMuted() ? 'Muted' : 'Unmuted', 'accent');
        } else if (code === 'KeyT') {
            toggleMetronome();
            showToast('Metronome ' + (metroPlaying ? 'ON' : 'OFF'), 'accent');
        } else if (code === 'Home') {
            e.preventDefault();
            goToBeginning();
            showToast('Jump to beginning', 'accent');
        }
    }

    document.addEventListener('keydown', handleShortcut);

    document.getElementById('playerOverlay').addEventListener('click', togglePlayPause);

    document.addEventListener('change', e => {
        if (e.target.type === 'range') e.target.blur();
    });

    // ─── INIT ────────────────────────────────────────
    async function init() {
        loadYouTubeAPI();
        await autoLoadFromFile();
        renderPlaylist();
        updateSpeedDisplay();
        updateLoopVisuals();
        loopToggle.checked = true;
    }

    init();
})();
