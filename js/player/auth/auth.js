import { showNotification } from '../ui/notifications.js';
import { loadSettings } from '../settings/settings.js';

const API_BASE_URL = 'http://192.168.31.2:8000';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60;

let authToken = '';
let currentUser = null;

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

        await loadSettings();
        
        localStorage.setItem('smalltubeAuth', JSON.stringify({
            token: authToken,
            refresh_token: data.refresh_token,
            username: currentUser,
            expires_at: Date.now() + (ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000)
        }));
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        if (error.message.includes('Failed to fetch')) {
            showNotification('error', 'Network error: Unable to connect to the server.');
        } else {
            showNotification('error', 'Login error: ' + error.message);
        }
        return false;
    }
}

async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
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

        return true;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

async function refreshAuthToken() {
    const authData = JSON.parse(localStorage.getItem('smalltubeAuth'));
    if (!authData?.token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/token/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: authData.token
            })
        });
        
        if (!response.ok) throw new Error('Token refresh failed');
        
        const data = await response.json();
        authToken = data.access_token;
        currentUser = authData.username;
        
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

function logout() {
    authToken = '';
    currentUser = null;
    localStorage.removeItem('smalltubeAuth');
}

async function checkAuth() {
    const savedAuth = localStorage.getItem('smalltubeAuth');
    if (savedAuth) {
        try {
            const authData = JSON.parse(savedAuth);
            
            if (Date.now() > authData.expires_at) {
                const refreshed = await refreshAuthToken();
                if (!refreshed) {
                    throw new Error('Token expired and refresh failed');
                }
            }
            
            authToken = authData.token;
            currentUser = authData.username;
            
            const response = await fetch(`${API_BASE_URL}/users/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
            
            if (!response.ok) throw new Error('Token verification failed');
            
            return true;
        } catch (e) {
            console.error('Auth check failed', e);
            logout();
            return false;
        }
    }
    return false;
}

export { login, register, logout, checkAuth, authToken, currentUser, refreshAuthToken };
