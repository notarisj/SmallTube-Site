import { loadSettings, saveSettings } from './settings.js';
import { showNotification } from '../ui/notifications.js';
import { currentUser } from '../auth/auth.js';
import { apiKey as searchApiKey, resultsCount as searchResultsCount } from '../player/search.js';

const settingsBtn = document.getElementById('nav-settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const apiKeyInput = document.getElementById('api-key');
const resultsCountInput = document.getElementById('results-count');

function setupSettingsUI() {
    settingsBtn.addEventListener('click', async function() {
        if (!currentUser) return;
        
        const settings = await loadSettings();
        apiKeyInput.value = settings.apiKey;
        resultsCountInput.value = settings.resultsCount;
        settingsModal.style.display = 'flex';

        // Update search.js variables when settings are loaded
        searchApiKey = settings.apiKey;
        searchResultsCount = settings.resultsCount;
    });

    closeModal.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', async function() {
        const success = await saveSettings({
            apiKey: apiKeyInput.value,
            resultsCount: resultsCountInput.value
        });
        
        if (success) {
            settingsModal.style.display = 'none';

            // Update search.js variables when settings are saved
            searchApiKey = apiKeyInput.value;
            searchResultsCount = resultsCountInput.value;
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
}

export { setupSettingsUI };