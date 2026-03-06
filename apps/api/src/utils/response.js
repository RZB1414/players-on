export function jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    });
}

export function errorResponse(message, status = 400) {
    return jsonResponse({ success: false, error: message }, status);
}

export function successResponse(data, status = 200) {
    return jsonResponse({ success: true, ...data }, status);
}

/**
 * Build Set-Cookie headers for access and refresh tokens.
 * Uses HttpOnly, Secure, SameSite=None (production) or SameSite=Lax (dev).
 */
export function buildAuthCookies(accessToken, refreshToken, isProduction = true) {
    const secure = isProduction ? '; Secure' : '';
    const sameSite = isProduction ? '; SameSite=None' : '; SameSite=Lax';
    const httpOnly = '; HttpOnly';
    const path = '; Path=/';

    const accessMaxAge = '; Max-Age=900'; // 15 minutes
    const refreshMaxAge = '; Max-Age=604800'; // 7 days

    return [
        `access_token=${accessToken}${httpOnly}${secure}${sameSite}${path}${accessMaxAge}`,
        `refresh_token=${refreshToken}${httpOnly}${secure}${sameSite}; Path=/api/auth${refreshMaxAge}`,
    ];
}

/**
 * Build Set-Cookie headers to clear auth cookies.
 */
export function buildClearAuthCookies(isProduction = true) {
    const secure = isProduction ? '; Secure' : '';
    const sameSite = isProduction ? '; SameSite=None' : '; SameSite=Lax';
    const httpOnly = '; HttpOnly';
    const expired = '; Max-Age=0';

    return [
        `access_token=${httpOnly}${secure}${sameSite}; Path=/${expired}`,
        `refresh_token=${httpOnly}${secure}${sameSite}; Path=/api/auth${expired}`,
    ];
}

/**
 * Parse cookies from request headers.
 */
export function parseCookies(request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = {};

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            cookies[name.trim()] = rest.join('=').trim();
        }
    });

    return cookies;
}
