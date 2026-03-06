import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { getClientIP } from '../utils/deviceFingerprint.js';
import { createSession } from './sessionService.js';
import { analyzeLogin, recordFailedAttempt } from './suspiciousLoginService.js';
import { logEvent, AuditActions, Severity } from './auditService.js';

/**
 * Register a new user.
 * Returns { user, session } or throws on duplicate email (generic message).
 */
export async function register(name, email, password, db, request) {
    const users = db.collection('users');
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIP(request);

    // Check if email already exists
    const existing = await users.findOne({ email: normalizedEmail });
    if (existing) {
        // Generic message to prevent user enumeration
        const err = new Error('Não foi possível criar a conta. Verifique os dados e tente novamente.');
        err.statusCode = 409;
        throw err;
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    const now = new Date();
    const userDoc = {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'user',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        isVerified: false,
    };

    const result = await users.insertOne(userDoc);
    const userId = result.insertedId.toString();

    // Create session for the new user
    const session = await createSession(userId, request, db);

    // Audit log
    await logEvent({
        action: AuditActions.REGISTER,
        userId,
        ip,
        userAgent: request.headers.get('user-agent') || '',
        deviceFingerprint: session.deviceFingerprint,
        severity: Severity.INFO,
        db,
    });

    return {
        user: {
            id: userId,
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            createdAt: userDoc.createdAt,
        },
        session,
    };
}

/**
 * Login an existing user.
 * Returns { user, session, suspiciousLogin } or throws with generic message.
 */
export async function login(email, password, db, request) {
    const users = db.collection('users');
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIP(request);

    // Find user
    const user = await users.findOne({ email: normalizedEmail });

    if (!user) {
        // Record failed attempt then throw generic error
        await recordFailedAttempt(normalizedEmail, ip, db);
        await logEvent({
            action: AuditActions.LOGIN_FAILED,
            ip,
            userAgent: request.headers.get('user-agent') || '',
            metadata: { reason: 'user_not_found' },
            severity: Severity.INFO,
            db,
        });
        throw createAuthError();
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        await recordFailedAttempt(normalizedEmail, ip, db);
        await logEvent({
            action: AuditActions.LOGIN_FAILED,
            userId: user._id.toString(),
            ip,
            userAgent: request.headers.get('user-agent') || '',
            metadata: { reason: 'invalid_password' },
            severity: Severity.INFO,
            db,
        });
        throw createAuthError();
    }

    const userId = user._id.toString();

    // Analyze for suspicious activity
    const suspiciousLogin = await analyzeLogin(userId, request, db);

    if (suspiciousLogin.isSuspicious) {
        await logEvent({
            action: AuditActions.SUSPICIOUS_LOGIN,
            userId,
            ip,
            userAgent: request.headers.get('user-agent') || '',
            metadata: { reasons: suspiciousLogin.reasons },
            severity: Severity.WARNING,
            db,
        });
    }

    // Create session
    const session = await createSession(userId, request, db);

    // Update lastLoginAt
    await users.updateOne(
        { _id: user._id },
        { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    );

    // Audit log
    await logEvent({
        action: AuditActions.LOGIN_SUCCESS,
        userId,
        ip,
        userAgent: request.headers.get('user-agent') || '',
        deviceFingerprint: session.deviceFingerprint,
        severity: Severity.INFO,
        db,
    });

    return {
        user: {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
        },
        session,
        suspiciousLogin,
    };
}

/**
 * Get current user profile.
 */
export async function getMe(userId, db) {
    const users = db.collection('users');
    const { ObjectId } = await import('mongodb');

    const user = await users.findOne(
        { _id: new ObjectId(userId) },
        {
            projection: {
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                createdAt: 1,
                lastLoginAt: 1,
                isVerified: 1,
            },
        }
    );

    if (!user) {
        const err = new Error('Usuário não encontrado');
        err.statusCode = 404;
        throw err;
    }

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        isVerified: user.isVerified,
    };
}

/**
 * Rotate refresh tokens (token rotation with family-based reuse detection).
 */
export async function refreshTokens(oldRefreshToken, db, env, request) {
    const ip = getClientIP(request);
    const refreshTokensCol = db.collection('refresh_tokens');

    // Verify the old refresh token
    const { valid, payload } = await verifyToken(oldRefreshToken, env.JWT_REFRESH_SECRET);

    if (!valid) {
        throw createAuthError();
    }

    const { sub: userId, family, generation } = payload;
    const oldTokenHash = await hashTokenForStorage(oldRefreshToken);

    // Find the token in the database
    const storedToken = await refreshTokensCol.findOne({ tokenHash: oldTokenHash });

    if (!storedToken) {
        // Token not found — possible reuse attack!
        // Invalidate the entire token family
        await refreshTokensCol.updateMany(
            { family, userId },
            { $set: { revoked: true } }
        );

        await logEvent({
            action: AuditActions.TOKEN_REUSE_DETECTED,
            userId,
            ip,
            userAgent: request.headers.get('user-agent') || '',
            metadata: { family },
            severity: Severity.CRITICAL,
            db,
        });

        throw createAuthError();
    }

    if (storedToken.revoked) {
        // This token was already used — attack detected
        await refreshTokensCol.updateMany(
            { family, userId },
            { $set: { revoked: true } }
        );

        await logEvent({
            action: AuditActions.TOKEN_REUSE_DETECTED,
            userId,
            ip,
            metadata: { family },
            severity: Severity.CRITICAL,
            db,
        });

        throw createAuthError();
    }

    // Mark old token as revoked
    await refreshTokensCol.updateOne(
        { tokenHash: oldTokenHash },
        { $set: { revoked: true } }
    );

    // Generate new token pair
    const newGeneration = generation + 1;
    const tokenPayload = { sub: userId, email: payload.email, role: payload.role };

    const newAccessToken = await generateAccessToken(tokenPayload, env.JWT_SECRET);
    const newRefreshToken = await generateRefreshToken(
        tokenPayload,
        env.JWT_REFRESH_SECRET,
        family,
        newGeneration
    );

    // Store new refresh token
    const newTokenHash = await hashTokenForStorage(newRefreshToken);
    await refreshTokensCol.insertOne({
        tokenHash: newTokenHash,
        userId,
        family,
        generation: newGeneration,
        revoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await logEvent({
        action: AuditActions.TOKEN_REFRESH,
        userId,
        ip,
        userAgent: request.headers.get('user-agent') || '',
        severity: Severity.INFO,
        db,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Create and store initial token pair for a user.
 */
export async function createTokenPair(user, db, env) {
    const family = crypto.randomUUID();
    const tokenPayload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await generateAccessToken(tokenPayload, env.JWT_SECRET);
    const refreshToken = await generateRefreshToken(
        tokenPayload,
        env.JWT_REFRESH_SECRET,
        family,
        0
    );

    // Store refresh token hash
    const tokenHash = await hashTokenForStorage(refreshToken);
    const refreshTokensCol = db.collection('refresh_tokens');

    await refreshTokensCol.insertOne({
        tokenHash,
        userId: user.id,
        family,
        generation: 0,
        revoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
}

/**
 * Hash a token for storage (SHA-256). Never store raw tokens.
 */
async function hashTokenForStorage(token) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function createAuthError() {
    const err = new Error('Credenciais inválidas');
    err.statusCode = 401;
    return err;
}
