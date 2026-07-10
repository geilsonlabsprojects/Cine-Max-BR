/**
 * Premium Web Player Component - CineMaxBR Ultra Evolution
 * Fixed Stability & Improved Playback Logic
 */

export class WebPlayer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.video = null;
        this.hls = null;
        this.isPlaying = false;
        this.playPromise = null;
    }

    render(item, url) {
        if (!this.container) return;

        // Clean up previous state
        this.stop();

        this.container.innerHTML = `
            <div class="custom-player-container">
                <div class="player-info-top">
                    <div class="player-title">${item?.title || 'Conteúdo'}</div>
                    <div class="player-subtitle">${item?.type === 'series' ? 'Série' : 'Filme'} • ${item?.year || ''}</div>
                </div>

                <div class="center-play-btn" id="centerPlay">
                    <i class="fas fa-play"></i>
                </div>

                <div class="player-loader" id="playerLoader" style="display: block;"></div>

                <div class="video-wrapper" id="videoWrapper">
                    ${this.createVideoElement(url)}
                </div>

                <div class="player-controls" id="playerControls">
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
                                <button class="player-btn" id="qualityBtn" style="display:none;"><i class="fas fa-hd"></i></button>
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
        if (!url || typeof url !== 'string') {
            console.error("ERRO: URL de vídeo inválida ou não fornecida.");
            return `<div class="player-error d-flex flex-column align-items-center justify-content-center h-100 text-white p-4 text-center">
                <i class="fas fa-exclamation-triangle fa-3x mb-3 text-danger"></i>
                <h4 class="fw-bold">Erro de Mídia</h4>
                <p class="text-white-50">O link do vídeo não está disponível ou está em formato incompatível.</p>
            </div>`;
        }

        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        if (isYouTube) {
            const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
            return `<iframe id="playerIframe" src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else {
            return `<video id="mainVideo" playsinline crossorigin="anonymous"></video>`;
        }
    }

    initControls(url) {
        this.video = this.container.querySelector('#mainVideo');
        if (!this.video) {
            const iframe = this.container.querySelector('#playerIframe');
            if (iframe) {
                 iframe.onload = () => this.container.querySelector('#playerLoader').style.display = 'none';
            }
            return;
        }

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
        const loader = this.container.querySelector('#playerLoader');
        const controls = this.container.querySelector('#playerControls');

        // Safe Play Function to avoid AbortError
        const safePlay = () => {
            if (this.video && this.video.paused) {
                this.playPromise = this.video.play();
                if (this.playPromise !== undefined) {
                    this.playPromise.then(() => {
                        this.isPlaying = true;
                        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        centerPlay.classList.remove('visible');
                    }).catch(error => {
                        console.warn("Playback prevented or interrupted:", error);
                        this.isPlaying = false;
                    });
                }
            }
        };

        const safePause = () => {
            if (this.video && !this.video.paused) {
                if (this.playPromise !== undefined) {
                    this.playPromise.then(() => {
                        this.video.pause();
                        this.isPlaying = false;
                        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                        centerPlay.classList.add('visible');
                    });
                } else {
                    this.video.pause();
                    this.isPlaying = false;
                    playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
                    centerPlay.classList.add('visible');
                }
            }
        };

        // Initialize HLS if needed
        const isHls = url && (url.includes('.m3u8') || url.includes('master'));
        if (window.Hls && Hls.isSupported() && isHls) {
            this.hls = new Hls({
                maxBufferLength: 30,
                capLevelToPlayerSize: true
            });
            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                qualityBtn.style.display = 'block';
                this.renderQualityMenu(this.hls.levels);
                safePlay();
            });
            this.hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error("Fatal HLS Error:", data.type);
                    loader.innerHTML = '<p class="small text-danger">Erro de carregamento</p>';
                }
            });
        } else if (url) {
            this.video.src = url;
            this.video.oncanplay = () => {
                loader.style.display = 'none';
                safePlay();
            };
        }

        // Event Listeners
        this.video.onwaiting = () => loader.style.display = 'block';
        this.video.onplaying = () => loader.style.display = 'none';

        // Auto-hide controls
        let hideTimeout;
        const resetHideTimeout = () => {
            const el = this.container.querySelector('.custom-player-container');
            el.classList.add('user-active');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (this.isPlaying) el.classList.remove('user-active');
            }, 3000);
        };
        this.container.addEventListener('mousemove', resetHideTimeout);
        this.container.addEventListener('touchstart', resetHideTimeout);
        resetHideTimeout();

        const togglePlay = () => this.video.paused ? safePlay() : safePause();

        const toggleFullscreen = () => {
            const el = this.container.querySelector('.custom-player-container');
            if (!document.fullscreenElement) {
                el.requestFullscreen().catch(err => console.error(err));
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            } else {
                document.exitFullscreen();
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            }
        };

        playPauseBtn.onclick = (e) => { e.stopPropagation(); togglePlay(); };
        centerPlay.onclick = (e) => { e.stopPropagation(); togglePlay(); };
        fullscreenBtn.onclick = (e) => { e.stopPropagation(); toggleFullscreen(); };

        // Progress Logic
        this.video.ontimeupdate = () => {
            if (isNaN(this.video.duration)) return;
            const percent = (this.video.currentTime / this.video.duration) * 100;
            progressBar.style.width = `${percent}%`;
            currentTimeEl.innerText = this.formatTime(this.video.currentTime);
        };

        progressContainer.onclick = (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.pageX - rect.left) / rect.width;
            this.video.currentTime = pos * this.video.duration;
        };

        // Volume
        volumeSlider.oninput = (e) => {
            this.video.volume = e.target.value;
            this.updateVolumeIcon(e.target.value);
            this.video.muted = (e.target.value == 0);
        };

        muteBtn.onclick = () => {
            this.video.muted = !this.video.muted;
            this.updateVolumeIcon(this.video.muted ? 0 : this.video.volume);
            volumeSlider.value = this.video.muted ? 0 : this.video.volume;
        };

        this.video.onloadedmetadata = () => {
            totalDurationEl.innerText = this.formatTime(this.video.duration);
            loader.style.display = 'none';
            controls.classList.add('visible');
        };

        // Keyboard Shortcuts
        const handleKeys = (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            switch(e.key.toLowerCase()) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); muteBtn.click(); break;
                case 'arrowright': this.video.currentTime += 10; break;
                case 'arrowleft': this.video.currentTime -= 10; break;
            }
        };
        window.addEventListener('keydown', handleKeys);
        this.shortcutListener = handleKeys;
    }

    renderQualityMenu(levels) {
        const menu = this.container.querySelector('#qualityMenu');
        const btn = this.container.querySelector('#qualityBtn');

        let html = `<div class="quality-item active" data-level="-1">Automático</div>`;
        levels.forEach((level, index) => {
            html += `<div class="quality-item" data-level="${index}">${level.height}p</div>`;
        });
        menu.innerHTML = html;

        btn.onclick = (e) => {
            e.stopPropagation();
            menu.classList.toggle('visible');
        };

        menu.querySelectorAll('.quality-item').forEach(item => {
            item.onclick = () => {
                const level = parseInt(item.dataset.level);
                if (this.hls) this.hls.currentLevel = level;
                menu.querySelectorAll('.quality-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                menu.classList.remove('visible');
            };
        });

        document.addEventListener('click', () => menu.classList.remove('visible'));
    }

    stop() {
        if (this.shortcutListener) {
            window.removeEventListener('keydown', this.shortcutListener);
            this.shortcutListener = null;
        }
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
        if (this.video) {
            this.video.pause();
            this.video.src = "";
            this.video.load();
            this.video = null;
        }
        if (this.container) this.container.innerHTML = "";
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
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
        if (!icon) return;
        if (val == 0) icon.className = 'fas fa-volume-mute';
        else if (val < 0.5) icon.className = 'fas fa-volume-down';
        else icon.className = 'fas fa-volume-up';
    }
}
