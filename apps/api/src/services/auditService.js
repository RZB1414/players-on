/**
 * Audit log service — records all auth events.
 * Never logs passwords, tokens, or hashes.
 */

export const AuditActions = {
    REGISTER: 'REGISTER',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    TOKEN_REFRESH: 'TOKEN_REFRESH',
    TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
    SESSION_REVOKED: 'SESSION_REVOKED',
    ALL_SESSIONS_REVOKED: 'ALL_SESSIONS_REVOKED',
    SUSPICIOUS_LOGIN: 'SUSPICIOUS_LOGIN',
    DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
    DOCUMENT_DELETED: 'DOCUMENT_DELETED',
};

export const Severity = {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical',
};

export async function logEvent({
    action,
    userId = null,
    ip = '0.0.0.0',
    userAgent = '',
    deviceFingerprint = null,
    metadata = {},
    severity = Severity.INFO,
    db,
}) {
    try {
        const auditLogs = db.collection('audit_logs');

        await auditLogs.insertOne({
            action,
            userId,
            ip,
            userAgent: userAgent.substring(0, 256), // Truncate to prevent abuse
            deviceFingerprint,
            metadata,
            severity,
            createdAt: new Date(),
        });
    } catch (error) {
        // Audit logging should never crash the main request
        console.error('[AUDIT] Failed to write audit log:', error.message);
    }
}

export async function getAuditLog(userId, db, { limit = 20, skip = 0 } = {}) {
    const auditLogs = db.collection('audit_logs');

    const logs = await auditLogs
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Math.min(limit, 100))
        .project({
            action: 1,
            ip: 1,
            severity: 1,
            metadata: 1,
            createdAt: 1,
        })
        .toArray();

    return logs;
}
