import { login, register, logout, currentUser } from './auth.js';

const videoInput = document.getElementById('video-input');
const videoContainer = document.getElementById('video-container');
const resultsGrid = document.getElementById('results-grid');
const settingsBtn = document.getElementById('nav-settings-btn');
const authModal = document.getElementById('auth-modal');
const authModalBtn = document.getElementById('auth-modal-btn');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const modalLoginBtn = document.getElementById('modal-login-btn');
const modalRegisterBtn = document.getElementById('modal-register-btn');
const modalUsername = document.getElementById('modal-username');
const modalPassword = document.getElementById('modal-password');
const regUsername = document.getElementById('reg-username');
const regEmail = document.getElementById('reg-email');
const regPassword = document.getElementById('reg-password');
const userDropdown = document.getElementById('user-dropdown');
const navUsername = document.getElementById('nav-username');
const navLogoutBtn = document.getElementById('nav-logout-btn');

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

function setupAuthEventListeners() {
    authModalBtn.addEventListener('click', () => {
        if (currentUser) {
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        } else {
            authModal.style.display = 'flex';
        }
    });

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

    modalLoginBtn.addEventListener('click', async () => {
        const username = modalUsername.value.trim();
        const password = modalPassword.value.trim();
        
        if (username && password) {
            const success = await login(username, password);
            if (success) {
                authModal.style.display = 'none';
                updateAuthUI();
            }
        }
    });

    [modalUsername, modalPassword].forEach(input => {
        input.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                const username = modalUsername.value.trim();
                const password = modalPassword.value.trim();
                if (username && password) {
                    const success = await login(username, password);
                    if (success) {
                        authModal.style.display = 'none';
                        updateAuthUI();
                    }
                }
            }
        });
    });

    modalRegisterBtn.addEventListener('click', async () => {
        const username = regUsername.value.trim();
        const email = regEmail.value.trim();
        const password = regPassword.value.trim();
        
        if (username && email && password) {
            try {
                const success = await register(username, email, password);
                if (success) {
                    loginTab.click();
                    modalUsername.value = username;
                    modalPassword.value = '';
                }
            } catch (error) {
                console.error('Registration error:', error);
            }
        }
    });

    navLogoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            logout();
            updateAuthUI();
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target !== authModalBtn && e.target !== userDropdown && !userDropdown.contains(e.target)
            && e.target.className !== 'fas fa-user') {
            userDropdown.style.display = 'none';
        }
    });
}

export { updateAuthUI, setupAuthEventListeners };