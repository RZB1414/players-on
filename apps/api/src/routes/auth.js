import { validateRegisterInput, validateLoginInput } from '../utils/validation.js';
import { sanitizeInput } from '../utils/sanitize.js';
import {
    successResponse,
    errorResponse,
    buildAuthCookies,
    buildClearAuthCookies,
    getRefreshTokenFromRequest,
} from '../utils/response.js';
import { getClientIP } from '../utils/deviceFingerprint.js';
import { authMiddleware } from '../middlewares/auth.js';
import { register, login, getMe, refreshTokens, createTokenPair } from '../services/authService.js';
import { getActiveSessions, revokeSession, revokeAllSessions } from '../services/sessionService.js';
import { getAuditLog, logEvent, AuditActions, Severity } from '../services/auditService.js';

export async function handleRegister(request, env, db) {
    const body = sanitizeInput(await request.json());
    const { name, email, password } = body;

    const validation = validateRegisterInput({ name, email, password });
    if (!validation.valid) {
        return errorResponse(validation.errors.join('. '), 400);
    }

    const { user, session } = await register(name, email, password, db, request);
    const { accessToken, refreshToken } = await createTokenPair(user, db, env);

    const isProduction = !request.url.includes('localhost');
    const cookies = buildAuthCookies(accessToken, refreshToken, isProduction);

    const response = successResponse(
        {
            user,
            auth: { accessToken, refreshToken },
            message: 'Conta criada com sucesso'
        },
        201
    );

    // Add Set-Cookie headers
    const headers = new Headers(response.headers);
    cookies.forEach(cookie => headers.append('Set-Cookie', cookie));

    return new Response(response.body, {
        status: response.status,
        headers,
    });
}

export async function handleLogin(request, env, db) {
    const body = sanitizeInput(await request.json());
    const { email, password } = body;

    const validation = validateLoginInput({ email, password });
    if (!validation.valid) {
        return errorResponse(validation.errors.join('. '), 400);
    }

    const { user, session, suspiciousLogin } = await login(email, password, db, request);
    const { accessToken, refreshToken } = await createTokenPair(user, db, env);

    const isProduction = !request.url.includes('localhost');
    const cookies = buildAuthCookies(accessToken, refreshToken, isProduction);

    const responseData = {
        user,
        auth: { accessToken, refreshToken },
        message: 'Login realizado com sucesso',
    };

    if (suspiciousLogin.isSuspicious) {
        responseData.suspiciousLogin = {
            isSuspicious: true,
            reasons: suspiciousLogin.reasons,
        };
    }

    const response = successResponse(responseData);

    const headers = new Headers(response.headers);
    cookies.forEach(cookie => headers.append('Set-Cookie', cookie));

    return new Response(response.body, {
        status: response.status,
        headers,
    });
}

export async function handleLogout(request, env, db) {
    const auth = await authMiddleware(request, env);
    const ip = getClientIP(request);

    if (auth.authenticated) {
        // Revoke all sessions for this user from this device
        await revokeAllSessions(auth.user.id, db);

        // Invalidate refresh tokens
        const refreshToken = getRefreshTokenFromRequest(request);
        if (refreshToken) {
            const refreshTokensCol = db.collection('refresh_tokens');
            // Hash and revoke
            const encoder = new TextEncoder();
            const data = encoder.encode(refreshToken);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            await refreshTokensCol.updateOne(
                { tokenHash },
                { $set: { revoked: true } }
            );
        }

        await logEvent({
            action: AuditActions.LOGOUT,
            userId: auth.user.id,
            ip,
            userAgent: request.headers.get('user-agent') || '',
            severity: Severity.INFO,
            db,
        });
    }

    const isProduction = !request.url.includes('localhost');
    const cookies = buildClearAuthCookies(isProduction);

    const response = successResponse({ message: 'Logout realizado com sucesso' });
    const headers = new Headers(response.headers);
    cookies.forEach(cookie => headers.append('Set-Cookie', cookie));

    return new Response(response.body, {
        status: response.status,
        headers,
    });
}

export async function handleRefresh(request, env, db) {
    const oldRefreshToken = getRefreshTokenFromRequest(request);

    if (!oldRefreshToken) {
        return errorResponse('Token de atualização não encontrado', 401);
    }

    const { accessToken, refreshToken } = await refreshTokens(oldRefreshToken, db, env, request);

    const isProduction = !request.url.includes('localhost');
    const newCookies = buildAuthCookies(accessToken, refreshToken, isProduction);

    const response = successResponse({
        auth: { accessToken, refreshToken },
        message: 'Token atualizado com sucesso'
    });
    const headers = new Headers(response.headers);
    newCookies.forEach(cookie => headers.append('Set-Cookie', cookie));

    return new Response(response.body, {
        status: response.status,
        headers,
    });
}

export async function handleMe(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const user = await getMe(auth.user.id, db);

    return successResponse({ user });
}

export async function handleGetSessions(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const sessions = await getActiveSessions(auth.user.id, db);

    return successResponse({ sessions });
}

export async function handleRevokeSession(request, env, db, sessionId) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const revoked = await revokeSession(sessionId, auth.user.id, db);

    if (!revoked) {
        return errorResponse('Sessão não encontrada', 404);
    }

    await logEvent({
        action: AuditActions.SESSION_REVOKED,
        userId: auth.user.id,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        metadata: { revokedSessionId: sessionId },
        severity: Severity.INFO,
        db,
    });

    return successResponse({ message: 'Sessão revogada com sucesso' });
}

export async function handleGetAuditLog(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);

    const logs = await getAuditLog(auth.user.id, db, { limit, skip });

    return successResponse({ logs });
}
