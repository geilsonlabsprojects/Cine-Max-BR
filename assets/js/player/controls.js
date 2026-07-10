/**
 * Video Player Controls Logic
 */
export function initControls(video, container, mediaItem) {
    const playPauseBtn = container.querySelector('#playPauseBtn');
    const progressBar = container.querySelector('#progressBar');
    const progressArea = container.querySelector('.progress-area');
    const currentTimeEl = container.querySelector('#currentTime');
    const durationTimeEl = container.querySelector('#durationTime');
    const volumeBtn = container.querySelector('#volumeBtn');
    const volumeSlider = container.querySelector('#volumeSlider');
    const fullscreenBtn = container.querySelector('#fullscreenBtn');
    const skipBackBtn = container.querySelector('#skipBackBtn');
    const skipForwardBtn = container.querySelector('#skipForwardBtn');
    const pipBtn = container.querySelector('#pipBtn');
    const loadingOverlay = container.querySelector('#playerLoading');
    const centerPlayBtn = container.querySelector('#centerPlayBtn');

    let lastSaveTime = 0;

    // Play/Pause
    const togglePlay = () => {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            if (centerPlayBtn) {
                centerPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                centerPlayBtn.classList.remove('visible');
            }
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            if (centerPlayBtn) {
                centerPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
                centerPlayBtn.classList.add('visible');
            }
        }
    };

    if (centerPlayBtn) centerPlayBtn.onclick = togglePlay;
    playPauseBtn.onclick = togglePlay;
    video.onclick = togglePlay;

    // Time Update
    video.ontimeupdate = () => {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
        currentTimeEl.innerText = formatTime(video.currentTime);

        // Throttle progress saving to every 5 seconds
        const now = Date.now();
        if (now - lastSaveTime > 5000) {
            if (window.saveProgress) {
                window.saveProgress(mediaItem, video.currentTime, video.duration);
            }
            lastSaveTime = now;
        }
    };

    video.onloadedmetadata = () => {
        durationTimeEl.innerText = formatTime(video.duration);
    };

    // Progress Bar Click
    progressArea.onclick = (e) => {
        const rect = progressArea.getBoundingClientRect();
        const pos = (e.pageX - rect.left) / rect.width;
        video.currentTime = pos * video.duration;
    };

    // Skip
    skipBackBtn.onclick = () => video.currentTime -= 10;
    skipForwardBtn.onclick = () => video.currentTime += 10;

    // Volume
    volumeSlider.oninput = (e) => {
        video.volume = e.target.value;
        volumeBtn.innerHTML = video.volume == 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    };

    // Fullscreen
    fullscreenBtn.onclick = () => {
        if (!document.fullscreenElement) {
            container.requestFullscreen();
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        }
    };

    // Mini Player (PiP)
    if (pipBtn) {
        pipBtn.onclick = () => {
            if (window.toggleMiniPlayer) {
                window.toggleMiniPlayer();
            }
        };
    }

    const qualityBtn = container.querySelector('#qualityBtn');
    const qualityMenu = container.querySelector('#qualityMenu');
    const qualityLevels = container.querySelector('#qualityLevels');

    // Quality Toggle
    qualityBtn.onclick = (e) => {
        e.stopPropagation();
        qualityMenu.style.display = qualityMenu.style.display === 'none' ? 'block' : 'none';
    };

    document.addEventListener('click', () => {
        if (qualityMenu) qualityMenu.style.display = 'none';
    });

    // HLS Events for Quality
    window.addEventListener('hlsLevels', (e) => {
        const levels = e.detail;
        if (!qualityLevels) return;

        const currentSaved = localStorage.getItem('cinemax_player_quality') || -1;

        let html = `<div class="quality-item ${currentSaved == -1 ? 'active' : ''}" data-level="-1">
                        <span>Automático</span>
                    </div>`;

        levels.forEach((level, index) => {
            const label = level.height ? `${level.height}p` : `Nível ${index}`;
            const isActive = currentSaved == index;
            html += `<div class="quality-item ${isActive ? 'active' : ''}" data-level="${index}">
                        <span>${label}</span>
                        ${level.bitrate ? `<small class="opacity-50 ms-2">${(level.bitrate/1000000).toFixed(1)} Mbps</small>` : ''}
                    </div>`;
        });
        qualityLevels.innerHTML = html;

        qualityLevels.querySelectorAll('.quality-item').forEach(item => {
            item.onclick = () => {
                const level = parseInt(item.dataset.level);
                // Dispatch event to HLS engine
                window.dispatchEvent(new CustomEvent('hlsSwitchLevel', { detail: level }));

                qualityLevels.querySelectorAll('.quality-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            };
        });
    });

    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
        // Only run shortcuts if player is visible and not typing in an input
        if (container.offsetParent === null || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
            case 'KeyK':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
            case 'KeyJ':
                e.preventDefault();
                video.currentTime -= 10;
                break;
            case 'ArrowRight':
            case 'KeyL':
                e.preventDefault();
                video.currentTime += 10;
                break;
            case 'ArrowUp':
                e.preventDefault();
                video.volume = Math.min(1, video.volume + 0.1);
                volumeSlider.value = video.volume;
                break;
            case 'ArrowDown':
                e.preventDefault();
                video.volume = Math.max(0, video.volume - 0.1);
                volumeSlider.value = video.volume;
                break;
            case 'KeyF':
                e.preventDefault();
                fullscreenBtn.click();
                break;
            case 'KeyM':
                e.preventDefault();
                video.muted = !video.muted;
                volumeBtn.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listeners when player is destroyed
    const cleanup = () => {
        window.removeEventListener('keydown', handleKeyDown);
    };

    // Store cleanup on video element to be called later if needed
    video._playerCleanup = cleanup;

    // Loading State
    video.onwaiting = () => { if (loadingOverlay) loadingOverlay.style.display = 'flex'; };
    video.oncanplay = () => { if (loadingOverlay) loadingOverlay.style.display = 'none'; };
    video.onplaying = () => { if (loadingOverlay) loadingOverlay.style.display = 'none'; };

    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }
}
