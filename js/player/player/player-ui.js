import { showVideo } from './player.js';

const theaterBtn = document.querySelector('.theater-btn');
const videoEmbedContainer = document.querySelector('.video-embed-container');
const videoDetailsContainer = document.querySelector('.video-details-container');

function setupTheaterMode() {
    theaterBtn.addEventListener('click', () => {
        videoEmbedContainer.classList.toggle('theater-mode');
        videoDetailsContainer.classList.toggle('theater-mode');
        theaterBtn.classList.toggle('active');

        const isTheater = videoEmbedContainer.classList.contains('theater-mode');
        localStorage.setItem('smalltubeTheaterMode', isTheater ? 'true' : 'false');
    });

    // Load Theater Mode Preference
    const theaterPref = localStorage.getItem('smalltubeTheaterMode');
    if (theaterPref === 'true') {
        videoEmbedContainer.classList.add('theater-mode');
        videoDetailsContainer.classList.add('theater-mode');
        theaterBtn.classList.add('active');
    }

    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 't' && document.activeElement !== document.getElementById('video-input')) {
            e.preventDefault();
            theaterBtn.click();
        }
    });
}

function setupAspectRatioControls() {
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ratio = this.getAttribute('data-ratio');
            const videoContainer = document.getElementById('video-container');
            videoContainer.style.aspectRatio = ratio;
            
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            localStorage.setItem('smalltubeAspectRatio', ratio);
        });
    });

    // Load saved aspect ratio on page load
    const savedRatio = localStorage.getItem('smalltubeAspectRatio') || '16/9';
    document.getElementById('video-container').style.aspectRatio = savedRatio;
    document.querySelector(`.ratio-btn[data-ratio="${savedRatio}"]`)?.classList.add('active');
}

function tryAutoLoadVideoFromHash() {
    const hash = window.location.hash.replace(/^#/, '').trim();
    if (hash.length === 11 && !hash.includes(' ')) {
        showVideo(hash);
    }
}

export { setupTheaterMode, setupAspectRatioControls, tryAutoLoadVideoFromHash };