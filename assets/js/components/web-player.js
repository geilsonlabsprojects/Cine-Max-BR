/**
 * Premium Web Player Component
 * Handles HTML5 Video, YouTube Iframes, and Custom Controls
 */

export class WebPlayer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.video = null;
        this.hls = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.duration = 0;
        this.currentTime = 0;
    }

    render(item, url) {
        this.container.innerHTML = `
            <div class="custom-player-container">
                <div class="player-info-top">
                    <div class="player-title">${item.title}</div>
                    <div class="player-subtitle">${item.type === 'series' ? 'Série' : 'Filme'} • ${item.year}</div>
                </div>

                <div class="center-play-btn" id="centerPlay">
                    <i class="fas fa-play"></i>
                </div>

                <div class="player-loader" id="playerLoader"></div>

                <div class="video-wrapper" id="videoWrapper">
                    ${this.createVideoElement(url)}
                </div>

                <div class="player-controls visible" id="playerControls">
                    <div class="player-progress-container" id="progressContainer">
                        <div class="player-seek-preview" id="seekPreview">00:00</div>
                        <div class="player-progress-bar" id="progressBar">
                            <div class="player-progress-knob"></div>
                        </div>
                    </div>

                    <div class="player-buttons">
                        <div class="player-group">
                            <button class="player-btn" id="playPauseBtn"><i class="fas fa-play"></i></button>
                            <button class="player-btn" id="rewindBtn"><i class="fas fa-undo"></i></button>
                            <button class="player-btn" id="forwardBtn"><i class="fas fa-redo"></i></button>

                            <div class="volume-container">
                                <button class="player-btn" id="muteBtn"><i class="fas fa-volume-up"></i></button>
                                <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.1" value="1">
                            </div>

                            <div class="player-time">
                                <span id="currentTime">00:00</span> / <span id="totalDuration">00:00</span>
                            </div>
                        </div>

                        <div class="player-group">
                            <div class="quality-selector-wrapper">
                                <button class="player-btn" id="qualityBtn"><i class="fas fa-hd"></i></button>
                                <div class="quality-menu" id="qualityMenu"></div>
                            </div>
                            <button class="player-btn" id="fullscreenBtn"><i class="fas fa-expand"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initControls(url);
    }

    createVideoElement(url) {
        if (!url) {
            console.error("ERRO: URL de vídeo não fornecida.");
            return `<div class="player-error d-flex flex-column align-items-center justify-content-center h-100 text-white">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
                <p>O link do vídeo não está disponível para este conteúdo.</p>
            </div>`;
        }

        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        if (isYouTube) {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
            return `<video id="mainVideo" playsinline></video>`;
        }
    }

    initControls(url) {
        this.video = this.container.querySelector('#mainVideo');
        const playPauseBtn = this.container.querySelector('#playPauseBtn');
        const centerPlay = this.container.querySelector('#centerPlay');
        const progressBar = this.container.querySelector('#progressBar');
        const progressContainer = this.container.querySelector('#progressContainer');
        const seekPreview = this.container.querySelector('#seekPreview');
        const currentTimeEl = this.container.querySelector('#currentTime');
        const totalDurationEl = this.container.querySelector('#totalDuration');
        const volumeSlider = this.container.querySelector('#volumeSlider');
        const muteBtn = this.container.querySelector('#muteBtn');
        const fullscreenBtn = this.container.querySelector('#fullscreenBtn');
        const qualityBtn = this.container.querySelector('#qualityBtn');
        const qualityMenu = this.container.querySelector('#qualityMenu');

        if (!this.video) return;

        // Initialize HLS
        if (Hls.isSupported() && (url.includes('.m3u8') || url.includes('master'))) {
            this.hls = new Hls();
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.renderQualityMenu(this.hls.levels);
                this.video.play();
            });
        } else {
            this.video.src = url;
            this.video.play();
        }

        // Shortcuts
        const handleShortcuts = (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            switch(e.key.toLowerCase()) {
                case ' ': e.preventDefault(); togglePlay(); break;
                case 'k': e.preventDefault(); togglePlay(); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); toggleMute(); break;
                case 'arrowright': this.video.currentTime += 10; break;
                case 'arrowleft': this.video.currentTime -= 10; break;
                case 'arrowup': this.video.volume = Math.min(1, this.video.volume + 0.1); break;
                case 'arrowdown': this.video.volume = Math.max(0, this.video.volume - 0.1); break;
            }
        };
        window.addEventListener('keydown', handleShortcuts);
        this.shortcutListener = handleShortcuts;

        const togglePlay = () => {
            if (this.video.paused) {
                this.video.play();
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                centerPlay.classList.remove('visible');
            } else {
                this.video.pause();
                playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                centerPlay.innerHTML = '<i class="fas fa-play"></i>';
                centerPlay.classList.add('visible');
            }
        };

        const toggleFullscreen = () => {
            const el = this.container.querySelector('.custom-player-container');
            if (!document.fullscreenElement) {
                el.requestFullscreen();
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                document.exitFullscreen();
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        };

        const toggleMute = () => {
            this.video.muted = !this.video.muted;
            this.updateVolumeIcon(this.video.muted ? 0 : this.video.volume);
        };

        playPauseBtn.onclick = togglePlay;
        centerPlay.onclick = togglePlay;
        fullscreenBtn.onclick = toggleFullscreen;
        muteBtn.onclick = toggleMute;

        // Progress & Seek Preview
        this.video.ontimeupdate = () => {
            const percent = (this.video.currentTime / this.video.duration) * 100;
            progressBar.style.width = `${percent}%`;
            currentTimeEl.innerText = this.formatTime(this.video.currentTime);
        };

        progressContainer.onmousemove = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.pageX - rect.left) / rect.width;
            const time = pos * this.video.duration;
            seekPreview.innerText = this.formatTime(time);
            seekPreview.style.left = `${pos * 100}%`;
            seekPreview.style.display = 'block';
        };

        progressContainer.onmouseleave = () => seekPreview.style.display = 'none';

        progressContainer.onclick = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.pageX - rect.left) / rect.width;
            this.video.currentTime = pos * this.video.duration;
        };

        // Quality Menu
        qualityBtn.onclick = (e) => {
            e.stopPropagation();
            qualityMenu.classList.toggle('visible');
        };
        document.addEventListener('click', () => qualityMenu.classList.remove('visible'));

        this.video.onloadedmetadata = () => {
            totalDurationEl.innerText = this.formatTime(this.video.duration);
        };
    }

    renderQualityMenu(levels) {
        const menu = this.container.querySelector('#qualityMenu');
        let html = `<div class="quality-item active" data-level="-1">Automático</div>`;
        levels.forEach((level, index) => {
            html += `<div class="quality-item" data-level="${index}">${level.height}p</div>`;
        });
        menu.innerHTML = html;

        menu.querySelectorAll('.quality-item').forEach(item => {
            item.onclick = () => {
                const level = parseInt(item.dataset.level);
                this.hls.currentLevel = level;
                menu.querySelectorAll('.quality-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            };
        });
    }

    stop() {
        if (this.shortcutListener) {
            window.removeEventListener('keydown', this.shortcutListener);
        }
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.src = "";
            this.video.load();
        }
        this.container.innerHTML = "";
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [
            h > 0 ? h : null,
            (h > 0 && m < 10 ? '0' : '') + m,
            (s < 10 ? '0' : '') + s
        ].filter(v => v !== null).join(':');
    }

    updateVolumeIcon(val) {
        const icon = this.container.querySelector('#muteBtn i');
        if (val == 0) icon.className = 'fas fa-volume-mute';
        else if (val < 0.5) icon.className = 'fas fa-volume-down';
        else icon.className = 'fas fa-volume-up';
    }
}
