/**
 * Recursively sanitize input to prevent NoSQL injection.
 * Strips keys starting with '$' and '__proto__'.
 */
export function sanitizeInput(input) {
    if (input === null || input === undefined) {
        return input;
    }

    if (typeof input === 'string') {
        return input;
    }

    if (typeof input === 'number' || typeof input === 'boolean') {
        return input;
    }

    if (Array.isArray(input)) {
        return input.map(item => sanitizeInput(item));
    }

    if (typeof input === 'object') {
        const sanitized = {};
        for (const key of Object.keys(input)) {
            // Block MongoDB operators and prototype pollution
            if (key.startsWith('$') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            sanitized[key] = sanitizeInput(input[key]);
        }
        return sanitized;
    }

    return input;
}

/**
 * Sanitize a string for safe display (basic XSS prevention for logs).
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}
