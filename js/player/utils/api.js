import { authToken, refreshAuthToken } from '../auth/auth.js';

export async function fetchWithAuthRetry(url, options = {}, retry = true) {
    if (!options.headers) options.headers = {};
    if (authToken) options.headers['Authorization'] = `Bearer ${authToken}`;

    let response = await fetch(url, options);

    if (response.status === 401 && retry) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
            options.headers['Authorization'] = `Bearer ${authToken}`;
            response = await fetch(url, options);
        } else {
            throw new Error('Unauthorized and token refresh failed');
        }
    }

    return response;
}