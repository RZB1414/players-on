import { generateFingerprint, parseDeviceInfo, getClientIP } from '../utils/deviceFingerprint.js';

export async function createSession(userId, request, db) {
    const sessions = db.collection('sessions');
    const ip = getClientIP(request);
    const fingerprint = await generateFingerprint(request);
    const deviceInfo = parseDeviceInfo(request);

    const session = {
        userId,
        deviceFingerprint: fingerprint,
        ip,
        userAgent: deviceInfo.userAgent.substring(0, 256),
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        deviceType: deviceInfo.deviceType,
        lastActiveAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isActive: true,
    };

    const result = await sessions.insertOne(session);
    return { ...session, _id: result.insertedId };
}

export async function getActiveSessions(userId, db) {
    const sessions = db.collection('sessions');

    return sessions
        .find({
            userId,
            isActive: true,
            expiresAt: { $gt: new Date() },
        })
        .sort({ lastActiveAt: -1 })
        .project({
            _id: 1,
            ip: 1,
            os: 1,
            browser: 1,
            deviceType: 1,
            lastActiveAt: 1,
            createdAt: 1,
        })
        .toArray();
}

export async function revokeSession(sessionId, userId, db) {
    const sessions = db.collection('sessions');
    const { ObjectId } = await import('mongodb');

    const result = await sessions.updateOne(
        { _id: new ObjectId(sessionId), userId },
        { $set: { isActive: false } }
    );

    return result.modifiedCount > 0;
}

export async function revokeAllSessions(userId, db, excludeSessionId = null) {
    const sessions = db.collection('sessions');

    const filter = { userId, isActive: true };
    if (excludeSessionId) {
        const { ObjectId } = await import('mongodb');
        filter._id = { $ne: new ObjectId(excludeSessionId) };
    }

    const result = await sessions.updateMany(filter, { $set: { isActive: false } });
    return result.modifiedCount;
}

export async function updateSessionActivity(sessionId, db) {
    const sessions = db.collection('sessions');
    const { ObjectId } = await import('mongodb');

    await sessions.updateOne(
        { _id: new ObjectId(sessionId) },
        { $set: { lastActiveAt: new Date() } }
    );
}

export async function findSessionByFingerprint(userId, fingerprint, db) {
    const sessions = db.collection('sessions');

    return sessions.findOne({
        userId,
        deviceFingerprint: fingerprint,
        isActive: true,
        expiresAt: { $gt: new Date() },
    });
}
