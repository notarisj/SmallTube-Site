import { authToken } from '../auth/auth.js';
import { fetchWithAuthRetry } from '../utils/api.js';
import { showNotification } from '../ui/notifications.js';
import { setApiKey, setResultsCount } from '../player/search.js';

const API_BASE_URL = 'http://192.168.31.2:8000';

let apiKey = '';
let resultsCount = 10;

async function loadSettings() {
    try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/settings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load settings');
        
        const settings = await response.json();
        apiKey = settings.youtube_api_key || '';
        resultsCount = settings.results_count || 10;

        setApiKey(apiKey);
        setResultsCount(resultsCount);
        
        return { apiKey, resultsCount };
    } catch (error) {
        console.error('Error loading settings:', error);
        const savedSettings = JSON.parse(localStorage.getItem('smalltubePlayerSettings')) || {};
        apiKey = savedSettings.apiKey || '';
        resultsCount = savedSettings.resultsCount || 10;
        return { apiKey, resultsCount };
    }
}

async function saveSettings(newSettings) {
    apiKey = newSettings.apiKey.trim();
    resultsCount = Math.min(50, Math.max(1, parseInt(newSettings.resultsCount) || 10));
    
    try {
        const response = await fetchWithAuthRetry(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                youtube_api_key: apiKey,
                results_count: resultsCount
            })
        });
        
        if (!response.ok) throw new Error('Failed to save settings');

        setApiKey(apiKey);
        setResultsCount(resultsCount);
        
        showNotification('success', 'Settings saved successfully!');
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        const settings = { apiKey, resultsCount };
        localStorage.setItem('smalltubePlayerSettings', JSON.stringify(settings));
        showNotification('error', 'Failed to save to server. Using local storage.');
        return false;
    }
}

export { loadSettings, saveSettings, apiKey, resultsCount };