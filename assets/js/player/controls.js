/**
 * Video Player Controls Logic
 */
export function initControls(video, container) {
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
    const loadingOverlay = container.querySelector('#playerLoading');

    // Play/Pause
    const togglePlay = () => {
        if (video.paused) {
            video.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            video.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    };

    playPauseBtn.onclick = togglePlay;
    video.onclick = togglePlay;

    // Time Update
    video.ontimeupdate = () => {
        const percent = (video.currentTime / video.duration) * 100;
        progressBar.style.width = `${percent}%`;
        currentTimeEl.innerText = formatTime(video.currentTime);
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

    // Loading State
    video.onwaiting = () => loadingOverlay.style.display = 'flex';
    video.onplaying = () => loadingOverlay.style.display = 'none';

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
