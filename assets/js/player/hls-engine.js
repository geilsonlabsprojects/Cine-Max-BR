/**
 * HLS.js Engine Integration
 */
export class HLSEngine {
    constructor(videoElement) {
        this.video = videoElement;
        this.hls = null;
    }

    loadSource(url) {
        const loadingOverlay = document.getElementById('playerLoading');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Optimized for Archive.org and Google Drive (Direct MP4)
        const isArchiveOrg = url.includes('archive.org');
        const isGoogleDrive = url.includes('drive.google.com') || url.includes('googleusercontent.com');
        const isDirectVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');

        // Force native playback for these sources to avoid CORS/HLS.js overhead
        if (isArchiveOrg || isGoogleDrive || isDirectVideo || !Hls.isSupported()) {
            console.log("Playing via Native HTML5 (Archive/Drive/Direct)");
            this.video.src = url;
            this.video.load();
            this.video.play().catch(e => {
                if (e.name !== 'AbortError') console.error("Native playback failed", e);
            });
            return;
        }

        // Use HLS.js ONLY for actual HLS streams (.m3u8)
        if (Hls.isSupported()) {
            console.log("Playing via HLS.js Engine");
            if (this.hls) this.hls.destroy();
            // ... (rest of hls logic remains as safety for future m3u8 links)

            this.hls = new Hls({
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                startLevel: -1,
                xhrSetup: (xhr) => {
                    xhr.withCredentials = false; // Important for CORS
                }
            });

            this.hls.loadSource(url);
            this.hls.attachMedia(this.video);

            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.video.play().catch(e => {
                    if (e.name !== 'AbortError') console.error("Auto-play blocked", e);
                });
            });
        }
    }

    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }
    }
}
