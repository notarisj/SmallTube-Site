import { currentUser } from '../auth/auth.js';

let currentVideoId = '';
let currentSearchResults = [];

function isVideoId(input) {
    return input.length === 11 && !input.includes(' ');
}

function showVideo(videoId) {
    if (!currentUser) return false;

    currentVideoId = videoId;

    const videoContainer = document.getElementById('video-container');
    let iframe = videoContainer.querySelector('iframe');
    
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'custom-embed';
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        videoContainer.appendChild(iframe);
    }

    const params = new URLSearchParams({
        v: videoId,
        autoplay: '1',
        rel: '0'
    });
    iframe.src = `https://cdpn.io/pen/debug/oNPzxKo?${params.toString()}`;

    videoContainer.classList.add('visible');

    let infoContainer = document.querySelector('.video-info-container');
    if (!infoContainer) {
        infoContainer = document.createElement('div');
        infoContainer.className = 'video-info-container';
        videoContainer.parentNode.insertBefore(infoContainer, videoContainer.nextSibling);
    }

    const videoData = currentSearchResults.find(v => v.id.videoId === videoId);
    if (videoData) {
        infoContainer.innerHTML = `
            <h2 class="video-title-large">${videoData.snippet.title}</h2>
            <div class="channel-info">
                <span class="channel-name">${videoData.snippet.channelTitle}</span>
            </div>
        `;
    } else {
        infoContainer.innerHTML = `
            <h2 class="video-title-large"></h2>
            <div class="channel-info">
                <div class="channel-icon"></div>
                <span class="channel-name"></span>
            </div>
        `;
    }

    document.querySelector('.aspect-ratio-wrapper').style.display = 'block';
    document.getElementById('results-grid').style.marginTop = '20px';

    if (currentSearchResults.length > 0) {
        document.getElementById('results-grid').classList.add('visible');
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    return true;
}

function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const hours = parseInt(match[1] || 0, 10);
    const minutes = parseInt(match[2] || 0, 10);
    const seconds = parseInt(match[3] || 0, 10);
    if (hours) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function showSearchResults(results) {
    currentSearchResults = results;
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';
    
    results.forEach(video => {
        const videoElement = document.createElement('div');
        videoElement.className = 'video-result';
        videoElement.innerHTML = `
            <div class="thumbnail-container" style="position:relative;">
                <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" class="thumbnail">
                <span class="video-duration">${formatDuration(video.duration || '')}</span>
            </div>
            <div class="video-info">
                <h3 class="video-title">${video.snippet.title}</h3>
                <div class="video-channel">
                    ${video.snippet.channelTitle}
                </div>
            </div>
        `;
        
        videoElement.addEventListener('click', () => {
            showVideo(video.id.videoId);
        });
        
        resultsGrid.appendChild(videoElement);
    });
    
    resultsGrid.classList.add('visible');
    document.getElementById('video-container').classList.remove('visible');
}

export { isVideoId, showVideo, showSearchResults, currentSearchResults };