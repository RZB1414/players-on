const API_BASE = import.meta.env.VITE_API_URL || 'https://players-on-api.volleyplusapp.workers.dev';

export async function request(endpoint, options = {}) {
    const headers = { ...options.headers };

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
