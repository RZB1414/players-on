/**
 * In-memory rate limiter per isolate.
 * Uses a sliding window counter per IP address.
 */
const rateLimitStore = new Map();

const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    for (const [key, entry] of rateLimitStore) {
        // Remove entries older than the window
        if (now - entry.windowStart > entry.windowMs) {
            rateLimitStore.delete(key);
        }
    }
}

export function rateLimit({ maxRequests = 5, windowMs = 60000 } = {}) {
    return function checkRateLimit(request) {
        cleanup();

        const ip =
            request.headers.get('cf-connecting-ip') ||
            request.headers.get('x-real-ip') ||
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            '0.0.0.0';

        const now = Date.now();
        const key = `${ip}`;
        const entry = rateLimitStore.get(key);

        if (!entry || now - entry.windowStart > windowMs) {
            // New window
            rateLimitStore.set(key, {
                count: 1,
                windowStart: now,
                windowMs,
            });
            return null; // Allowed
        }

        entry.count++;

        if (entry.count > maxRequests) {
            const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000);
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Muitas tentativas. Tente novamente mais tarde.',
                }),
                {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': String(retryAfter),
                    },
                }
            );
        }

        return null; // Allowed
    };
}
