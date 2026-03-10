const API_BASE = import.meta.env.VITE_API_URL || 'https://players-on-api.volleyplusapp.workers.dev';

const ACCESS_TOKEN_KEY = 'playerson_access_token';
const REFRESH_TOKEN_KEY = 'playerson_refresh_token';

let refreshPromise = null;

function hasWindow() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredAccessToken() {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken() {
    if (!hasWindow()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function storeAuthTokens(auth) {
    if (!hasWindow() || !auth) return;

    if (auth.accessToken) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    }

    if (auth.refreshToken) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    }
}

export function clearStoredAuthTokens() {
    if (!hasWindow()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function shouldAttachAccessToken(endpoint) {
    return endpoint !== '/api/auth/login' && endpoint !== '/api/auth/register';
}

function shouldAttachRefreshToken(endpoint) {
    return endpoint === '/api/auth/refresh' || endpoint === '/api/auth/logout';
}

function buildHeaders(endpoint, headers = {}) {
    const nextHeaders = { ...headers };
    const accessToken = getStoredAccessToken();
    const refreshToken = getStoredRefreshToken();

    if (accessToken && shouldAttachAccessToken(endpoint) && !nextHeaders.Authorization) {
        nextHeaders.Authorization = `Bearer ${accessToken}`;
    }

    if (refreshToken && shouldAttachRefreshToken(endpoint) && !nextHeaders['X-Refresh-Token']) {
        nextHeaders['X-Refresh-Token'] = refreshToken;
    }

    return nextHeaders;
}

async function performTokenRefresh() {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
        clearStoredAuthTokens();
        return false;
    }

    if (!refreshPromise) {
        refreshPromise = (async () => {
            try {
                const response = await fetch(`${API_BASE}/api/auth/refresh`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Refresh-Token': refreshToken,
                    },
                });

                if (!response.ok) {
                    clearStoredAuthTokens();
                    return false;
                }

                const data = await response.json();
                if (data?.auth) {
                    storeAuthTokens(data.auth);
                }

                return true;
            } catch {
                clearStoredAuthTokens();
                return false;
            }
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
}

export async function request(endpoint, options = {}, retryOnAuthError = true) {
    const headers = buildHeaders(endpoint, options.headers);

    // Allow omitting Content-Type for FormData uploads (browser handles multipart boundary)
    if (!options.omitContentType && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const { responseType, ...configOptions } = options;

    const config = {
        ...configOptions,
        credentials: 'include',
        headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (
        response.status === 401 &&
        retryOnAuthError &&
        endpoint !== '/api/auth/login' &&
        endpoint !== '/api/auth/register' &&
        endpoint !== '/api/auth/refresh'
    ) {
        const refreshed = await performTokenRefresh();

        if (refreshed) {
            return request(endpoint, options, false);
        }
    }

    if (responseType === 'blob') {
        if (!response.ok) {
            let errorMsg = 'An error occurred while downloading the file';
            try {
                const data = await response.json();
                if (data && data.error) errorMsg = data.error;
            } catch (e) { }
            const error = new Error(errorMsg);
            error.status = response.status;
            throw error;
        }
        return await response.blob();
    }

    const data = await response.json();

    if (response.ok && data?.auth) {
        storeAuthTokens(data.auth);
    }

    if (!response.ok) {
        console.error(`[API ERROR] ${response.status} at ${endpoint}`, JSON.stringify(data, null, 2));
        const error = new Error(data.error || 'An error occurred');
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
}

export const api = {
    post: (endpoint, body) =>
        request(endpoint, { method: 'POST', body: JSON.stringify(body) }),

    get: (endpoint) =>
        request(endpoint, { method: 'GET' }),

    delete: (endpoint) =>
        request(endpoint, { method: 'DELETE' }),
};
