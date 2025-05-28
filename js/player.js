document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const videoInput = document.getElementById('video-input');
    const videoContainer = document.getElementById('video-container');
    const resultsGrid = document.getElementById('results-grid');
    const settingsBtn = document.getElementById('nav-settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModal = document.getElementById('close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiKeyInput = document.getElementById('api-key');
    const resultsCountInput = document.getElementById('results-count');

    const API_BASE_URL = 'http://192.168.31.2:8000'; // Update with your API base URL
    const ACCESS_TOKEN_EXPIRE_MINUTES = 60; // Set this to match your backend config

    // Auth modal elements
    const authModal = document.getElementById('auth-modal');
    const authModalBtn = document.getElementById('auth-modal-btn');
    const closeAuthModal = document.getElementById('close-auth-modal');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const modalLoginBtn = document.getElementById('modal-login-btn');
    const modalBackBtn = document.getElementById('modal-back-btn');
    const modalRegisterBtn = document.getElementById('modal-register-btn');
    const modalUsername = document.getElementById('modal-username');
    const modalPassword = document.getElementById('modal-password');
    const regUsername = document.getElementById('reg-username');
    const regEmail = document.getElementById('reg-email');
    const regPassword = document.getElementById('reg-password');
    const userDropdown = document.getElementById('user-dropdown');
    const navUsername = document.getElementById('nav-username');
    const navLogoutBtn = document.getElementById('nav-logout-btn');
    const searchBtn = document.getElementById('search-btn');

    const playerContainer = document.querySelector('.player-container');
    const videoEmbedContainer = document.querySelector('.video-embed-container');
    const theaterBtn = document.querySelector('.theater-btn');
    const aspectRatioWrapper = document.querySelector('.aspect-ratio-wrapper');
    const videoDetailsContainer = document.querySelector('.video-details-container');

    // State variables
    let currentVideoId = '';
    let currentSearchResults = [];
    let apiKey = '';
    let resultsCount = 10;
    let authToken = '';
    let currentUser = null;

    // make searchBtn trigger videoInput textfield
    searchBtn.addEventListener('click', function() {
        videoInput.focus();
        const input = videoInput.value.trim();
        if (input) {
            saveToSearchHistory(input); // Add this line
            if (isVideoId(input)) {
                showVideo(input);
            } else {
                searchYouTube(input);
            }
        }
    });
    
    // Load saved settings
    async function loadSettings() {
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load settings');
            
            const settings = await response.json();
            apiKey = settings.youtube_api_key || '';
            resultsCount = settings.results_count || 10;
            
            // Update UI
            apiKeyInput.value = apiKey;
            resultsCountInput.value = resultsCount;
            
            // Load other settings
            if (settings.aspect_ratio) {
                videoContainer.style.aspectRatio = settings.aspect_ratio;
                document.querySelector(`.ratio-btn[data-ratio="${settings.aspect_ratio}"]`)?.classList.add('active');
            }
            
            if (settings.theater_mode) {
                videoEmbedContainer.classList.add('theater-mode');
                theaterBtn.classList.add('active');
            }
            
            if (settings.starfield_enabled !== undefined) {
                starfieldEnabled = settings.starfield_enabled;
                updateStarfieldVisibility();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fallback to localStorage if available
            const savedSettings = JSON.parse(localStorage.getItem('smalltubePlayerSettings')) || {};
            apiKey = savedSettings.apiKey || '';
            resultsCount = savedSettings.resultsCount || 10;
            apiKeyInput.value = apiKey;
            resultsCountInput.value = resultsCount;
        }
    }

    async function saveSettings() {
        apiKey = apiKeyInput.value.trim();
        resultsCount = Math.min(50, Math.max(1, parseInt(resultsCountInput.value) || 10));
        
        try {
            const response = await fetch(`${API_BASE_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    youtube_api_key: apiKey,
                    results_count: resultsCount,
                    aspect_ratio: videoContainer.style.aspectRatio,
                    theater_mode: videoEmbedContainer.classList.contains('theater-mode'),
                    starfield_enabled: starfieldEnabled
                })
            });
            
            if (!response.ok) throw new Error('Failed to save settings');
            
            showNotification('success', 'Settings saved successfully!');
            settingsModal.style.display = 'none';
        } catch (error) {
            console.error('Error saving settings:', error);
            // Fallback to localStorage
            const settings = {
                apiKey,
                resultsCount
            };
            localStorage.setItem('smalltubePlayerSettings', JSON.stringify(settings));
            showNotification('error', 'Failed to save to server. Using local storage.');
            settingsModal.style.display = 'none';
        }
    }

    // Authentication functions
    async function login(username, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('grant_type', 'password');
        
        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        if (!response.ok) {
            let errorMessage = 'Login failed';
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
            } else {
                errorMessage = await response.text() || errorMessage;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        authToken = data.access_token;
        currentUser = username;
        
        // Store tokens securely (consider using HttpOnly cookies in production)
        localStorage.setItem('smalltubeAuth', JSON.stringify({
            token: authToken,
            refresh_token: data.refresh_token,
            username: currentUser,
            expires_at: Date.now() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000)
        }));
        
        updateAuthUI();
        return true;
    } catch (error) {
        console.error('Login error:', error);
        showNotification('error', 'Login failed. Please check your credentials!');
        return false;
    }
}

    // Add token refresh logic
    async function refreshAuthToken() {
        const authData = JSON.parse(localStorage.getItem('smalltubeAuth'));
        if (!authData?.refresh_token) return false;
        
        try {
            const response = await fetch(`${API_BASE_URL}/token/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: authData.refresh_token
                })
            });
            
            if (!response.ok) throw new Error('Token refresh failed');
            
            const data = await response.json();
            authToken = data.access_token;
            currentUser = authData.username;
            
            // Update stored token
            localStorage.setItem('smalltubeAuth', JSON.stringify({
                ...authData,
                token: authToken,
                expires_at: Date.now() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000)
            }));
            
            return true;
        } catch (error) {
            console.error('Token refresh error:', error);
            return false;
        }
    }

    async function register(username, email, password) {
        try {
            const response = await fetch('http://192.168.31.2:8000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }

            showNotification('success', 'Registration successful! Please login!');
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('error', `Registration failed: ${error.message}`);
            return false;
        }
    }

    function logout() {
        if (!confirm('Are you sure you want to log out?')) {
            return;
        }
        authToken = '';
        currentUser = null;
        localStorage.removeItem('smalltubeAuth');
        userDropdown.style.display = 'none';
        updateAuthUI();
    }

    function updateAuthUI() {
        if (currentUser) {
            navUsername.textContent = currentUser;
            userDropdown.style.display = 'none';
            authModal.style.display = 'none';
            
            // Enable player functionality
            videoInput.disabled = false;
            settingsBtn.disabled = false;
        } else {
            // Reset forms
            modalUsername.value = '';
            modalPassword.value = '';
            regUsername.value = '';
            regEmail.value = '';
            regPassword.value = '';
            
            // Disable player functionality
            videoInput.disabled = true;
            settingsBtn.disabled = true;
            videoContainer.innerHTML = '';
            resultsGrid.innerHTML = '';
            videoContainer.classList.remove('visible');
            resultsGrid.classList.remove('visible');

            // show login modal
            authModal.style.display = 'flex';
        }
    }

    // Check authentication on page load
    async function checkAuth() {
        const savedAuth = localStorage.getItem('smalltubeAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                
                // Check if token is expired
                if (Date.now() > authData.expires_at) {
                    const refreshed = await refreshAuthToken();
                    if (!refreshed) {
                        throw new Error('Token expired and refresh failed');
                    }
                }
                
                authToken = authData.token;
                currentUser = authData.username;
                
                // Verify token is still valid
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (!response.ok) throw new Error('Token verification failed');
                
                updateAuthUI();
            } catch (e) {
                console.error('Auth check failed', e);
                logout();
            }
        }
        updateAuthUI();
    }


    // Check if input is a video ID (simple check)
    function isVideoId(input) {
        return input.length === 11 && !input.includes(' ');
    }

    // Show video player
    async function showVideo(videoId) {
        if (!currentUser) {
            authModal.style.display = 'flex';
            return;
        }

        currentVideoId = videoId;

        // Create or update iframe
        let iframe = videoContainer.querySelector('iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'custom-embed';
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            videoContainer.appendChild(iframe);
        }

        // Build CodePen proxy URL with YouTube parameters
        const params = new URLSearchParams({
            v: videoId,
            autoplay: '1',
            rel: '0'
        });
        iframe.src = `https://cdpn.io/pen/debug/oNPzxKo?${params.toString()}`;

        videoContainer.classList.add('visible');

        // Add or update video info section
        let infoContainer = document.querySelector('.video-info-container');
        if (!infoContainer) {
            infoContainer = document.createElement('div');
            infoContainer.className = 'video-info-container';
            videoContainer.parentNode.insertBefore(infoContainer, videoContainer.nextSibling);
        }

        // If we have the video data from search results, use it
        const videoData = currentSearchResults.find(v => v.id.videoId === videoId);
        if (videoData) {
            infoContainer.innerHTML = `
                <h2 class="video-title-large">${videoData.snippet.title}</h2>
                <div class="channel-info">
                    <img src="${videoData.snippet.thumbnails.default.url}" alt="${videoData.snippet.channelTitle}" class="channel-icon">
                    <span class="channel-name">${videoData.snippet.channelTitle}</span>
                </div>
            `;
        } else {
            // Fallback if we don't have the data
            infoContainer.innerHTML = `
                <h2 class="video-title-large"></h2>
                <div class="channel-info">
                    <div class="channel-icon"></div>
                    <span class="channel-name"></span>
                </div>
            `;
        }

        aspectRatioWrapper.style.display = 'block';
        resultsGrid.style.marginTop = '20px';

        // Show results grid if it's from search results
        if (currentSearchResults.length > 0) {
            resultsGrid.classList.add('visible');
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Show search results
    function showSearchResults(results) {
        currentSearchResults = results;
        resultsGrid.innerHTML = '';
        
        results.forEach(video => {
            const videoElement = document.createElement('div');
            videoElement.className = 'video-result';
            videoElement.innerHTML = `
                <div class="thumbnail-container">
                    <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}" class="thumbnail">
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.snippet.title}</h3>
                    <div class="video-channel">
                        <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.channelTitle}" class="video-channel-icon">
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
        videoContainer.classList.remove('visible');
    }

    // Search YouTube
    async function searchYouTube(query) {
        if (!currentUser) {
            authModal.style.display = 'flex';
            return;
        }

        if (!apiKey) {
            showNotification('warning', 'Please set your YouTube Data API key in settings first.');
            settingsModal.style.display = 'flex';
            return;
        }

        try {
            // 1. Search for videos
            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${resultsCount}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
            );
            if (!searchResponse.ok) throw new Error('YouTube API request failed');
            const searchData = await searchResponse.json();

            // 2. Get video IDs
            const videoIds = searchData.items.map(item => item.id.videoId).join(',');
            if (!videoIds) {
                showSearchResults([]);
                return;
            }

            // 3. Fetch video details (duration, dimensions)
            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&key=${apiKey}&id=${videoIds}`
            );
            if (!detailsResponse.ok) throw new Error('Failed to fetch video details');
            const detailsData = await detailsResponse.json();

            // 4. Filter out shorts/portrait videos under 1.5 minutes
            const filtered = detailsData.items.filter(video => {
                // Parse ISO 8601 duration to seconds
                const match = video.contentDetails.duration.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
                const minutes = match && match[1] ? parseInt(match[1]) : 0;
                const seconds = match && match[2] ? parseInt(match[2]) : 0;
                const totalSeconds = minutes * 60 + seconds;

                // Shorts are usually portrait (height > width) and < 90s
                // YouTube API does not provide width/height, but we can guess by title/description or skip if duration < 90s
                return totalSeconds >= 90;
            });

            // 5. Show filtered results
            showSearchResults(filtered.map(video => ({
                id: { videoId: video.id },
                snippet: video.snippet
            })));
        } catch (error) {
            console.error('Error searching YouTube:', error);
            showNotification('error', 'Error searching YouTube. Please check your API key and try again.');
        }

        // hide .welcome-message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // close history dropdown
        document.getElementById('search-history-dropdown').style.display = 'none';
        // resultsGrid.style.marginTop = '50px';
    }

    // Event listeners
    videoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const input = this.value.trim();
            if (input) {
                saveToSearchHistory(input); // Add this line
                if (isVideoId(input)) {
                    showVideo(input);
                } else {
                    searchYouTube(input);
                }
            }
        }
    });

    videoInput.addEventListener('focus', () => renderSearchHistory(''));
    videoInput.addEventListener('input', function() {
        renderSearchHistory(this.value.trim());
    });
    videoInput.addEventListener('blur', function() {
        // Small delay to allow click events to register
        setTimeout(() => {
            document.getElementById('search-history-dropdown').style.display = '';
        }, 200);
    });

    settingsBtn.addEventListener('click', function() {
        if (!currentUser) {
            authModal.style.display = 'flex';
            return;
        }
        loadSettings(); // <-- Only load settings when opening modal
        settingsModal.style.display = 'flex';
    });

    closeModal.addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', saveSettings);

    // Auth modal controls
    authModalBtn.addEventListener('click', () => {
        if (currentUser) {
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        } else {
            authModal.style.display = 'flex';
        }
    });

    closeAuthModal.addEventListener('click', () => {
        // authModal.style.display = 'none';
    });

    // Tab switching
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    // Auth form submissions
    modalLoginBtn.addEventListener('click', async () => {
        const username = modalUsername.value.trim();
        const password = modalPassword.value.trim();
        
        if (username && password) {
            const success = await login(username, password);
            if (success) {
                authModal.style.display = 'none';
            }
        }
    });

    // go to index.html
    modalBackBtn.addEventListener('click', () => {
        // go to index.html
        window.location.href = 'index.html';
    });

    modalRegisterBtn.addEventListener('click', async () => {
        const username = regUsername.value.trim();
        const email = regEmail.value.trim();
        const password = regPassword.value.trim();
        
        if (username && email && password) {
            const success = await register(username, email, password);
            if (success) {
                // Switch to login tab after successful registration
                loginTab.click();
                modalUsername.value = username;
                modalPassword.value = '';
            }
        }
    });

    navLogoutBtn.addEventListener('click', logout);

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        // if (e.target === authModal) {
        //     authModal.style.display = 'none';
        // }
        // dont dismiss it if the user click the auth-modal-btn
        if (e.target !== authModalBtn && e.target !== userDropdown && !userDropdown.contains(e.target)
            && e.target.className !== 'fas fa-user') {
            userDropdown.style.display = 'none';
        }
    });

    // / key focuses search input
    document.addEventListener('keydown', function(e) {
        if (e.key === '/' && currentUser) {
            e.preventDefault();
            videoInput.focus();
            videoInput.select();
        }
    });

    // Starfield toggle functionality
    const starfieldToggle = document.getElementById('starfield-toggle');
    const galaxy = document.querySelector('.galaxy');
    let starfieldEnabled = true;

    // Load starfield preference from localStorage
    function loadStarfieldPreference() {
        const savedPreference = localStorage.getItem('smalltubeStarfieldEnabled');
        if (savedPreference !== null) {
            starfieldEnabled = savedPreference === 'true';
            updateStarfieldVisibility();
        }
    }

    function updateStarfieldVisibility() {
        if (starfieldEnabled) {
            galaxy.style.display = 'block';
            starfieldToggle.classList.add('active');
        } else {
            galaxy.style.display = 'none';
            starfieldToggle.classList.remove('active');
        }
    }

    starfieldToggle.addEventListener('click', () => {
        starfieldEnabled = !starfieldEnabled;
        localStorage.setItem('smalltubeStarfieldEnabled', starfieldEnabled.toString());
        updateStarfieldVisibility();
    });

    // Add this to your existing JavaScript
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ratio = this.getAttribute('data-ratio');
            const [width, height] = ratio.split('/');
            const aspectRatio = `${width}/${height}`;
            
            // Update the video container
            videoContainer.style.aspectRatio = aspectRatio;
            
            // Update active state
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Save preference
            localStorage.setItem('smalltubeAspectRatio', aspectRatio);
        });
    });

    // Load saved aspect ratio on page load
    function loadAspectRatioPreference() {
        const savedRatio = localStorage.getItem('smalltubeAspectRatio') || '16/9';
        videoContainer.style.aspectRatio = savedRatio;
        
        // Set active button
        document.querySelector(`.ratio-btn[data-ratio="${savedRatio}"]`)?.classList.add('active');
    }

    // Call this in your initialization
    loadAspectRatioPreference();

    // Theater Mode Toggle
    theaterBtn.addEventListener('click', () => {
        videoEmbedContainer.classList.toggle('theater-mode');
        // Synchronize videoDetailsContainer with videoEmbedContainer
        if (videoEmbedContainer.classList.contains('theater-mode')) {
            videoDetailsContainer.classList.add('theater-mode');
        } else {
            videoDetailsContainer.classList.remove('theater-mode');
        }
        theaterBtn.classList.toggle('active');

        const isTheater = videoEmbedContainer.classList.contains('theater-mode');
        localStorage.setItem('smalltubeTheaterMode', isTheater ? 'true' : 'false');
    });

    // Load Theater Mode Preference
    const theaterPref = localStorage.getItem('smalltubeTheaterMode');
    if (theaterPref === 'true') {
        videoEmbedContainer.classList.add('theater-mode');
        theaterBtn.classList.add('active');
    }

    document.addEventListener('keydown', function(e) {
        // and video-input not in focus
        if (e.key.toLowerCase() === 't' && 
            document.activeElement !== videoInput) {
            e.preventDefault();
            theaterBtn.click();
        }
    });

    // Search history functions
    async function saveToSearchHistory(query) {
        if (!currentUser || !query.trim()) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/search-history/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) throw new Error('Failed to save search');
        } catch (error) {
            console.error('Error saving search:', error);
            // Fallback to localStorage if needed
            let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
            history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
            history.unshift(query);
            if (history.length > 10) history = history.slice(0, 10);
            localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
        }
    }

    async function loadSearchHistory() {
        if (!currentUser) {
            return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/search-history/`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load history');
            
            const data = await response.json();
            return data.map(item => item.query);
        } catch (error) {
            console.error('Error loading search history:', error);
            return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        }
    }

    async function loadSearchHistoryDetails() {
        if (!currentUser) {
            return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/search-history/`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to load history');
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error loading search history:', error);
            return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        }
    }

    async function clearSearchHistory() {
        if (!currentUser) {
            localStorage.removeItem('smalltubeSearchHistory');
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/search-history/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to clear history');
        } catch (error) {
            console.error('Error clearing search history:', error);
            localStorage.removeItem('smalltubeSearchHistory');
        }
    }

    async function deleteSearchHistoryItem(index) {
        if (!currentUser) {
            let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
            history.splice(index, 1);
            localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
            return;
        }
        
        try {
            // First get the full history to find the ID
            const history = await loadSearchHistoryDetails();
            if (
                index >= 0 &&
                index < history.length &&
                history[index].id !== undefined
            ) {
                const response = await fetch(`${API_BASE_URL}/search-history/${history[index].id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });
                
                if (!response.ok) throw new Error('Failed to delete item');
                renderSearchHistory('');
            } else {
                throw new Error('Invalid history index or missing ID');
            }
        } catch (error) {
            console.error('Error deleting search item:', error);
            // Fallback to localStorage
            let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
            history.splice(index, 1);
            localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
        }
    }

    async function renderSearchHistory(filter = '') {
        const history = await loadSearchHistory();
        const dropdown = document.getElementById('search-history-dropdown');
        dropdown.innerHTML = '';

        // Header
        const header = document.createElement('div');
        header.className = 'search-history-header';
        header.innerHTML = `
            <span>Recent searches</span>
            <span class="search-history-clear" id="clear-search-history">Clear all</span>
        `;
        dropdown.appendChild(header);

        // Filter history
        const filteredHistory = filter
            ? history.filter(q => q.toLowerCase().includes(filter.toLowerCase()))
            : history;

        // No history
        if (filteredHistory.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'search-history-item';
            empty.textContent = 'No search history';
            dropdown.appendChild(empty);
            // Clear all event
            header.querySelector('.search-history-clear').addEventListener('click', (e) => {
                e.stopPropagation();
                clearSearchHistory();
            });
            return;
        }

        // Items
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

            // Delete event
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteSearchHistoryItem(index);
            });

            // Fill input and search on click
            item.addEventListener('mousedown', (e) => {
                if (!e.target.closest('.search-history-delete')) {
                    videoInput.value = query;
                    e.preventDefault();
                    setTimeout(() => {
                        videoInput.focus();
                        videoInput.setSelectionRange(videoInput.value.length, videoInput.value.length);
                        document.getElementById('search-history-dropdown').style.display = 'none';
                        searchYouTube(query);
                    }, 0);
                }
            });

            item.appendChild(querySpan);
            item.appendChild(deleteBtn);
            dropdown.appendChild(item);
        });

        // Clear all event
        header.querySelector('.search-history-clear').addEventListener('click', (e) => {
            e.stopPropagation();
            clearSearchHistory();
        });
    }

    // Prevent dropdown from closing when clicking inside
    document.getElementById('search-history-dropdown').addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    const searchHistoryDropdown = document.createElement('div');
    searchHistoryDropdown.id = 'search-history-dropdown';
    searchHistoryDropdown.className = 'search-history-dropdown';
    document.querySelector('.input-section').appendChild(searchHistoryDropdown);

    // Call this in your initialization
    loadStarfieldPreference();

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

    // Initialize
    loadSettings();
    checkAuth();

    // Auto-load video from URL hash if present and valid
    function tryAutoLoadVideoFromHash() {
        const hash = window.location.hash.replace(/^#/, '').trim();
        // Accept only 11-char YouTube video IDs (no key=value, just #VIDEOID)
        if (hash.length === 11 && !hash.includes(' ')) {
            // If already authenticated, show video immediately
            if (currentUser) {
                showVideo(hash);
            } else {
                // Wait for login, then show video
                const authInterval = setInterval(() => {
                    if (currentUser) {
                        clearInterval(authInterval);
                        showVideo(hash);
                    }
                }, 200);
            }
        }
    }

    tryAutoLoadVideoFromHash();
});

// Bottom navbar auto-hide behavior
let lastScrollPosition = 0;
let navbarTimeout;

function handleNavbarVisibility() {
  const currentScrollPosition = window.scrollY;
  const navbar = document.querySelector('.bottom-navbar');
  
  // Clear any existing timeout
  clearTimeout(navbarTimeout);
  
  // Scrolling down - hide navbar
  if (currentScrollPosition > lastScrollPosition && currentScrollPosition > 100) {
    navbar.style.bottom = '-30px';
  } 
  // Scrolling up - show navbar
  else {
    navbar.style.bottom = '0';
    // Auto-hide after 3 seconds of inactivity
    navbarTimeout = setTimeout(() => {
      if (window.scrollY > 100) {
        navbar.style.bottom = '-30px';
      }
    }, 3000);
  }
  
  lastScrollPosition = currentScrollPosition;
}

// Initialize the navbar behavior
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.bottom-navbar');
  
  // Show navbar when mouse approaches bottom of screen
  document.addEventListener('mousemove', (e) => {
    const distanceFromBottom = window.innerHeight - e.clientY;
    if (distanceFromBottom < 50) { // 50px from bottom
      navbar.style.bottom = '0';
      clearTimeout(navbarTimeout);
    }
  });
  
  // Scroll behavior
  window.addEventListener('scroll', handleNavbarVisibility);
});