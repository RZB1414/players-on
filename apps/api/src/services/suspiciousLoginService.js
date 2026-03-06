import { generateFingerprint, getClientIP } from '../utils/deviceFingerprint.js';

/**
 * Analyze a login attempt for suspicious activity.
 * Returns { isSuspicious: boolean, reasons: string[] }
 */
export async function analyzeLogin(userId, request, db) {
    const reasons = [];
    const ip = getClientIP(request);
    const fingerprint = await generateFingerprint(request);

    // 1. Check for new device (fingerprint not seen before)
    const sessions = db.collection('sessions');
    const knownDevice = await sessions.findOne({
        userId,
        deviceFingerprint: fingerprint,
    });

    if (!knownDevice) {
        reasons.push('Novo dispositivo detectado');
    }

    // 2. Check for new IP address
    const knownIP = await sessions.findOne({
        userId,
        ip,
    });

    if (!knownIP) {
        reasons.push('Novo endereço IP detectado');
    }

    // 3. Check failed login attempts in the last 15 minutes
    const auditLogs = db.collection('audit_logs');
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const failedAttempts = await auditLogs.countDocuments({
        action: 'LOGIN_FAILED',
        ip,
        createdAt: { $gte: fifteenMinutesAgo },
    });

    if (failedAttempts >= 3) {
        reasons.push(`${failedAttempts} tentativas falhas recentes deste IP`);
    }

    // 4. Check for impossible travel (login from different IP location in short time)
    const lastLogin = await auditLogs.findOne(
        {
            userId,
            action: 'LOGIN_SUCCESS',
            createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
        },
        { sort: { createdAt: -1 } }
    );

    if (lastLogin && lastLogin.ip !== ip) {
        // Different IP within the last hour — potential impossible travel
        const lastIpPrefix = lastLogin.ip.split('.').slice(0, 2).join('.');
        const currentIpPrefix = ip.split('.').slice(0, 2).join('.');

        if (lastIpPrefix !== currentIpPrefix) {
            reasons.push('Login de localização significativamente diferente em curto período');
        }
    }

    return {
        isSuspicious: reasons.length > 0,
        reasons,
    };
}

/**
 * Record a failed login attempt for brute-force detection.
 */
export async function recordFailedAttempt(email, ip, db) {
    const auditLogs = db.collection('audit_logs');

    await auditLogs.insertOne({
        action: 'LOGIN_FAILED',
        userId: null,
        ip,
        metadata: { emailAttempted: email.substring(0, 3) + '***' }, // Partially masked
        severity: 'info',
        createdAt: new Date(),
    });
}
