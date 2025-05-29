import { fetchWithAuthRetry } from './api.js';
import { currentUser } from '../auth/auth.js';
import { isVideoId, showVideo } from '../player/player.js';
import { searchYouTube } from '../player/search.js';

const API_BASE_URL = 'http://192.168.31.2:8000';
const videoInput = document.getElementById('video-input');

let cachedHistory = null;

export async function saveToSearchHistory(query) {
    if (!currentUser || !query.trim()) return;
    
    try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/search-history/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        if (!response.ok) throw new Error('Failed to save search');
    } catch (error) {
        console.error('Error saving search:', error);
        let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        history.unshift(query);
        if (history.length > 10) history = history.slice(0, 10);
        localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
    }
}

async function loadSearchHistory(forceReload = false) {
    if (cachedHistory && !forceReload) {
        return cachedHistory;
    }
    if (!currentUser) {
        cachedHistory = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        return cachedHistory;
    }
    try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/search-history/`);
        if (!response.ok) throw new Error('Failed to load history');
        const data = await response.json();
        cachedHistory = data.map(item => item.query);
        return cachedHistory;
    } catch (error) {
        console.error('Error loading search history:', error);
        cachedHistory = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        return cachedHistory;
    }
}

async function clearSearchHistory() {
    if (!currentUser) {
        localStorage.removeItem('smalltubeSearchHistory');
        return;
    }
    
    try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/search-history/`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to clear history');
    } catch (error) {
        console.error('Error clearing search history:', error);
        localStorage.removeItem('smalltubeSearchHistory');
    }
    cachedHistory = null;
}

async function deleteSearchHistoryItem(index) {
    if (!currentUser) {
        let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        history.splice(index, 1);
        localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
        return;
    }
    
    try {
        const history = await loadSearchHistoryDetails();
        if (index >= 0 && index < history.length && history[index].id !== undefined) {
            await fetchWithAuthRetry(`${API_BASE_URL}/search-history/${history[index].id}`, {
                method: 'DELETE'
            });
        } else {
            throw new Error('Invalid history index or missing ID');
        }
    } catch (error) {
        console.error('Error deleting search item:', error);
        let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        history.splice(index, 1);
        localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
    }
    cachedHistory = null;
}

async function loadSearchHistoryDetails() {
    if (!currentUser) {
        return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
    }
    
    try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/search-history/`);
        
        if (!response.ok) throw new Error('Failed to load history');
        
        return await response.json();
    } catch (error) {
        console.error('Error loading search history:', error);
        return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
    }
}

async function renderSearchHistory(filter = '', forceReload = false) {
    const history = await loadSearchHistory(forceReload);
    const dropdown = document.getElementById('search-history-dropdown');
    dropdown.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'search-history-header';
    header.innerHTML = `
        <span>Recent searches</span>
        <span class="search-history-clear" id="clear-search-history">Clear all</span>
    `;
    dropdown.appendChild(header);

    const filteredHistory = filter
        ? history.filter(q => q.toLowerCase().includes(filter.toLowerCase()))
        : history;

    if (filteredHistory.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'search-history-item';
        empty.textContent = 'No search history';
        dropdown.appendChild(empty);
        return;
    }

    filteredHistory.forEach((query, index) => {
        const item = document.createElement('div');
        item.className = 'search-history-item';

        const querySpan = document.createElement('span');
        querySpan.className = 'search-history-query';
        querySpan.textContent = query;

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'search-history-delete';
        deleteBtn.setAttribute('data-index', index);
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSearchHistoryItem(index).then(() => {
                renderSearchHistory(filter, true); // Force reload after delete
            });
        });

        item.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.search-history-delete')) {
                videoInput.value = query;
                e.preventDefault();
                setTimeout(() => {
                    videoInput.focus();
                    videoInput.setSelectionRange(videoInput.value.length, videoInput.value.length);
                    dropdown.style.display = 'none';
                    if (isVideoId(query)) {
                        showVideo(query);
                    } else {
                        searchYouTube(query);
                    }
                }, 0);
            }
        });

        item.appendChild(querySpan);
        item.appendChild(deleteBtn);
        dropdown.appendChild(item);
    });

    header.querySelector('.search-history-clear').addEventListener('click', (e) => {
        e.stopPropagation();
        clearSearchHistory();
        renderSearchHistory(filter);
    });
}

export function setupHistoryControls() {
    const searchHistoryDropdown = document.createElement('div');
    searchHistoryDropdown.id = 'search-history-dropdown';
    searchHistoryDropdown.className = 'search-history-dropdown';
    document.querySelector('.input-section').appendChild(searchHistoryDropdown);

    videoInput.addEventListener('focus', () => {
        cachedHistory = null; // Always reload on focus
        renderSearchHistory('');
    });
    videoInput.addEventListener('input', function() {
        renderSearchHistory(this.value.trim());
    });
    videoInput.addEventListener('blur', function() {
        setTimeout(() => {
            document.getElementById('search-history-dropdown').style.display = 'none';
        }, 200);
    });

    document.getElementById('search-history-dropdown').addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    // Setup welcome examples
    const welcomeExamplesList = document.getElementById('welcome-examples-list');
    if (welcomeExamplesList) {
        welcomeExamplesList.querySelectorAll('li').forEach(li => {
            li.style.cursor = 'pointer';
            li.addEventListener('click', function() {
                const query = this.getAttribute('data-query') || this.textContent;
                videoInput.value = query;
                saveToSearchHistory(query);
                searchYouTube(query);
            });
        });
    }
}