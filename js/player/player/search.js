import { showSearchResults } from './player.js';
import { showNotification } from '../ui/notifications.js';
import { saveToSearchHistory } from '../utils/history.js';
import { currentUser } from '../auth/auth.js';
import { isVideoId, showVideo } from './player.js';

const welcomeMsg = document.querySelector('.welcome-message');


let apiKey = '';
let resultsCount = 10;

function setApiKey(key) {
    apiKey = key;
}

function setResultsCount(count) {
    resultsCount = count;
}

async function searchYouTube(query) {
    if (!currentUser) return false;

    if (!apiKey) {
        showNotification('warning', 'Please set your YouTube Data API key in settings first.');
        return false;
    }

    try {
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${resultsCount}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
        );
        if (!searchResponse.ok) throw new Error('YouTube API request failed');
        const searchData = await searchResponse.json();

        const videoIds = searchData.items.map(item => item.id.videoId).join(',');
        if (!videoIds) {
            showSearchResults([]);
            return true;
        }

        const detailsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&key=${apiKey}&id=${videoIds}`
        );
        if (!detailsResponse.ok) throw new Error('Failed to fetch video details');
        const detailsData = await detailsResponse.json();

        const filtered = detailsData.items.filter(video => {
            const match = video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
            const minutes = match && match[1] ? parseInt(match[1]) : 0;
            const seconds = match && match[2] ? parseInt(match[2]) : 0;
            const totalSeconds = minutes * 60 + seconds;
            return totalSeconds >= 90;
        });

        showSearchResults(filtered.map(video => ({
            id: { videoId: video.id },
            snippet: video.snippet,
            duration: video.contentDetails.duration
        })));

        if (welcomeMsg) welcomeMsg.style.display = 'none';
        document.getElementById('search-history-dropdown').style.display = 'none';
        
        return true;
    } catch (error) {
        console.error('Error searching YouTube:', error);
        showNotification('error', 'Error searching YouTube. Please check your API key and try again.');
        return false;
    }
}

function setupSearchEventListeners() {
    const videoInput = document.getElementById('video-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchBtn.addEventListener('click', function() {
        videoInput.focus();
        const input = videoInput.value.trim();
        if (input) {
            saveToSearchHistory(input);
            if (isVideoId(input)) {
                showVideo(input);
            } else {
                searchYouTube(input);
            }
        }
    });

    videoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const input = this.value.trim();
            if (input) {
                saveToSearchHistory(input);
                if (isVideoId(input)) {
                    showVideo(input);
                    if (welcomeMsg) welcomeMsg.style.display = 'none';
                } else {
                    searchYouTube(input);
                }
            }
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === '/' && currentUser) {
            e.preventDefault();
            videoInput.focus();
            videoInput.select();
        }
    });
}

export { 
    searchYouTube, 
    setupSearchEventListeners, 
    apiKey, 
    resultsCount,
    setApiKey,
    setResultsCount
};