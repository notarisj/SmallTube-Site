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
    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('smalltubePlayerSettings')) || {};
        apiKey = savedSettings.apiKey || '';
        resultsCount = savedSettings.resultsCount || 10;
        
        apiKeyInput.value = apiKey;
        resultsCountInput.value = resultsCount;
    }

    // Save settings
    function saveSettings() {
        apiKey = apiKeyInput.value.trim();
        resultsCount = Math.min(50, Math.max(1, parseInt(resultsCountInput.value) || 10));
        
        const settings = {
            apiKey,
            resultsCount
        };
        
        localStorage.setItem('smalltubePlayerSettings', JSON.stringify(settings));
        settingsModal.style.display = 'none';
        
        // Show confirmation
        showNotification('success', 'Settings saved successfully!');
    }

    // Authentication functions
    async function login(username, password) {
        try {
            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            authToken = data.access_token;
            currentUser = username;
            
            // Save token to localStorage
            localStorage.setItem('smalltubeAuth', JSON.stringify({
                token: authToken,
                username: currentUser
            }));
            
            updateAuthUI();
            return true;
        } catch (error) {
            console.error('Login error:', error);
            showNotification('error', 'Login failed. Please check your credentials!');
            return false;
        }
    }

    async function register(username, email, password) {
        try {
            const response = await fetch('http://localhost:8000/register', {
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
    function checkAuth() {
        const savedAuth = localStorage.getItem('smalltubeAuth');
        if (savedAuth) {
            try {
                const authData = JSON.parse(savedAuth);
                authToken = authData.token;
                currentUser = authData.username;
            } catch (e) {
                console.error('Failed to parse auth data', e);
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
        
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
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
                <h2 class="video-title-large">Loading...</h2>
                <div class="channel-info">
                    <div class="channel-icon"></div>
                    <span class="channel-name">Loading...</span>
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

    videoInput.addEventListener('focus', renderSearchHistory);
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
    function saveToSearchHistory(query) {
        if (!query.trim()) return;
        
        let history = JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
        
        // Remove if already exists
        history = history.filter(item => item.toLowerCase() !== query.toLowerCase());
        
        // Add to beginning
        history.unshift(query);
        
        // Keep only last 10 items
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        
        localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
    }

    function loadSearchHistory() {
        return JSON.parse(localStorage.getItem('smalltubeSearchHistory')) || [];
    }

    function clearSearchHistory() {
        localStorage.removeItem('smalltubeSearchHistory');
        renderSearchHistory();
    }

    function deleteSearchHistoryItem(index) {
        let history = loadSearchHistory();
        history.splice(index, 1);
        localStorage.setItem('smalltubeSearchHistory', JSON.stringify(history));
        renderSearchHistory();
    }

    function renderSearchHistory() {
        const history = loadSearchHistory();
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

        // No history
        if (history.length === 0) {
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
        history.forEach((query, index) => {
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
                // Only if not clicking delete
                if (!e.target.closest('.search-history-delete')) {
                    videoInput.value = query;
                    // Prevent blur so dropdown stays open
                    e.preventDefault();
                    setTimeout(() => {
                        videoInput.focus();
                        videoInput.setSelectionRange(videoInput.value.length, videoInput.value.length);
                        document.getElementById('search-history-dropdown').style.display = 'none'; // Close dropdown
                        searchYouTube(query); // Trigger search
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

    // Initialize
    checkAuth();
    loadSettings();
});