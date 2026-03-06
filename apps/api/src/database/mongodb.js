import { MongoClient } from 'mongodb';

let cachedClient = null;
let cachedDb = null;
let indexesCreated = false;

export async function connectToDatabase(env) {
    const uri = env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI secret is not configured');
    }

    const client = new MongoClient(uri, {
        maxPoolSize: 1,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
    });

    await client.connect();
    const db = client.db('playerson');

    // Only create indexes once per Worker lifecycle
    if (!indexesCreated) {
        try {
            await ensureIndexes(db);
            indexesCreated = true;
        } catch (indexErr) {
            console.error('[INDEX_ERROR]', indexErr.message);
        }
    }

    return { client, db };
}

async function ensureIndexes(db) {
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });

    const refreshTokens = db.collection('refresh_tokens');
    await refreshTokens.createIndex({ tokenHash: 1 }, { unique: true });
    await refreshTokens.createIndex({ userId: 1 });
    await refreshTokens.createIndex({ family: 1 });
    await refreshTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    const sessions = db.collection('sessions');
    await sessions.createIndex({ userId: 1 });
    await sessions.createIndex({ deviceFingerprint: 1 });
    await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    const auditLogs = db.collection('audit_logs');
    await auditLogs.createIndex({ userId: 1 });
    await auditLogs.createIndex({ action: 1 });
    await auditLogs.createIndex({ createdAt: 1 });
    await auditLogs.createIndex(
        { createdAt: 1 },
        { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'ttl_90_days' }
    );
}

export function getCollection(db, name) {
    return db.collection(name);
}
