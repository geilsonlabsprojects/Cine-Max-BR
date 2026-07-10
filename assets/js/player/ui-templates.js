/**
 * UI Templates for the Modular Video Player
 */
export const playerTemplate = `
    <div class="video-player-container glass" id="playerContainer">
        <video id="mainVideo" class="main-video" crossorigin="anonymous"></video>

        <!-- Loading Overlay -->
        <div id="playerLoading" class="player-overlay" style="display: flex;">
            <div class="spinner-border text-accent" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>

        <!-- Custom Controls -->
        <div class="video-controls" id="videoControls">
            <div class="progress-area">
                <div class="progress-bar">
                    <div class="inner-bar" id="progressBar"></div>
                </div>
            </div>

            <div class="controls-main">
                <div class="controls-left">
                    <button id="playPauseBtn" class="control-btn"><i class="fas fa-play"></i></button>
                    <button id="skipBackBtn" class="control-btn"><i class="fas fa-undo"></i></button>
                    <button id="skipForwardBtn" class="control-btn"><i class="fas fa-redo"></i></button>
                    <div class="time-display">
                        <span id="currentTime">0:00</span> / <span id="durationTime">0:00</span>
                    </div>
                </div>

                <div class="controls-right">
                    <button id="pipBtn" class="control-btn" title="Mini Player"><i class="fas fa-external-link-alt"></i></button>
                    <div class="volume-container">
                        <button id="volumeBtn" class="control-btn"><i class="fas fa-volume-up"></i></button>
                        <input type="range" id="volumeSlider" min="0" max="1" step="0.1" value="1">
                    </div>
                    <div class="quality-wrapper">
                        <button id="qualityBtn" class="control-btn"><i class="fas fa-cog"></i></button>
                        <div id="qualityMenu" class="quality-menu" style="display: none;">
                            <div class="quality-menu-header">Qualidade</div>
                            <div id="qualityLevels">
                                <!-- Qualidades dinâmicas aqui -->
                            </div>
                        </div>
                    </div>
                    <button id="fullscreenBtn" class="control-btn"><i class="fas fa-expand"></i></button>
                </div>
            </div>
        </div>
    </div>
`;
