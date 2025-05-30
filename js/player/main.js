import { setupAuthEventListeners, updateAuthUI } from './auth/auth-ui.js';
import { checkAuth } from './auth/auth.js';
import { setupSearchEventListeners } from './player/search.js';
import { setupSettingsUI } from './settings/settings-ui.js';
import { setupNavbarBehavior } from './ui/navbar.js';
import { setupStarfield } from './ui/starfield.js';
import { setupTheaterMode } from './player/player-ui.js';
import { setupAspectRatioControls } from './player/player-ui.js';
import { setupHistoryControls } from './utils/history.js';
import { showVideo } from './player/player.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize all components
    await checkAuth();
    updateAuthUI();
    setupAuthEventListeners();
    setupSearchEventListeners();
    setupNavbarBehavior();
    setupStarfield();
    setupTheaterMode();
    setupAspectRatioControls();
    setupHistoryControls();
    setupSettingsUI();

    // Auto-load video from URL hash if present
    const hash = window.location.hash.replace(/^#/, '').trim();
    if (hash.length === 11 && !hash.includes(' ')) {
        if (currentUser) {
            showVideo(hash);
        }
    }
});