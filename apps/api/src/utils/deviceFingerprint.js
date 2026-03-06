export async function generateFingerprint(request) {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const acceptLanguage = request.headers.get('accept-language') || 'unknown';
    const ip = getClientIP(request);

    // Use /24 prefix of IP for fingerprinting (groups similar IPs)
    const ipPrefix = ip.split('.').slice(0, 3).join('.');

    const raw = `${userAgent}|${acceptLanguage}|${ipPrefix}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function parseDeviceInfo(request) {
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const osPatterns = [
        { regex: /Windows NT 10/i, name: 'Windows 10/11' },
        { regex: /Windows NT/i, name: 'Windows' },
        { regex: /Mac OS X/i, name: 'macOS' },
        { regex: /Android/i, name: 'Android' },
        { regex: /iPhone|iPad/i, name: 'iOS' },
        { regex: /Linux/i, name: 'Linux' },
        { regex: /CrOS/i, name: 'Chrome OS' },
    ];

    const browserPatterns = [
        { regex: /Edg\//i, name: 'Edge' },
        { regex: /OPR\//i, name: 'Opera' },
        { regex: /Chrome\//i, name: 'Chrome' },
        { regex: /Firefox\//i, name: 'Firefox' },
        { regex: /Safari\//i, name: 'Safari' },
    ];

    let os = 'Unknown OS';
    for (const pattern of osPatterns) {
        if (pattern.regex.test(userAgent)) {
            os = pattern.name;
            break;
        }
    }

    let browser = 'Unknown Browser';
    for (const pattern of browserPatterns) {
        if (pattern.regex.test(userAgent)) {
            browser = pattern.name;
            break;
        }
    }

    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';

    return { os, browser, deviceType, userAgent };
}

export function getClientIP(request) {
    return (
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        '0.0.0.0'
    );
}
