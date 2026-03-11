import { connectToDatabase } from './database/mongodb.js';
import { corsMiddleware, withCors } from './middlewares/cors.js';
import { rateLimit } from './middlewares/rateLimit.js';
import {
    handleRegister,
    handleLogin,
    handleLogout,
    handleRefresh,
    handleMe,
    handleGetSessions,
    handleRevokeSession,
    handleGetAuditLog,
} from './routes/auth.js';
import {
    handleGetProfile,
    handleUpdateProfile,
    handleUploadDocument,
    handleGetDocument,
    handleDeleteDocument,
    handleUploadProfilePicture,
    handleGetProfilePicture
} from './routes/player.js';
import {
    handleGetPublicProfile,
    handleGetPublicDocument,
    handleGetProfileAnalytics,
    handleGetPublicProfilePicture,
    handleTrackPublicProfileView
} from './routes/publicPlayer.js';
import { ensurePlayerIndexes } from './services/playerService.js';
import { ensureAnalyticsIndexes } from './services/analyticsService.js';
import { errorResponse } from './utils/response.js';

// Rate limiter instances
const authRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });
const uploadRateLimit = rateLimit({ maxRequests: 3, windowMs: 60000 });
// Note: public profile rate limit uses KV (env.RATE_LIMIT_KV) — handled inside handleGetPublicProfile

// Track whether indexes have been created this isolate lifetime
let indexesEnsured = false;

export default {
    async fetch(request, env, ctx) {
        // CORS — always first, always applied
        const corsResult = corsMiddleware(request, env);
        if (corsResult instanceof Response) {
            return corsResult; // Preflight OPTIONS response
        }
        const { corsHeaders } = corsResult;

        let dbClient = null;
        try {
            const url = new URL(request.url);
            const path = url.pathname;
            const method = request.method;

            // Short-circuit OPTIONS requests since corsMiddleware already handled them
            if (method === 'OPTIONS') {
                return new Response(null, { status: 204, headers: corsHeaders });
            }

            // Health check — no DB required
            if (path === '/api/health' && method === 'GET') {
                const response = new Response(JSON.stringify({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                }), {
                    headers: { 'Content-Type': 'application/json' },
                });
                return withCors(response, corsHeaders);
            }



            // Connect to database
            let db;
            try {
                const conn = await connectToDatabase(env);
                dbClient = conn.client;
                db = conn.db;

                // Ensure indexes once per isolate lifetime (no-op if already exist)
                if (!indexesEnsured) {
                    indexesEnsured = true;
                    ctx.waitUntil(
                        Promise.all([
                            ensurePlayerIndexes(db),
                            ensureAnalyticsIndexes(db),
                        ]).catch(e => console.error('[INDEX_SETUP_ERROR]', e.message))
                    );
                }
            } catch (dbError) {
                console.error('[DB_CONNECTION_ERROR]', dbError.message);
                return withCors(errorResponse('Database connection error', 503), corsHeaders);
            }

            let response;

            // Auth routes
            if (path === '/api/auth/register' && method === 'POST') {
                const rateLimitResponse = authRateLimit(request);
                if (rateLimitResponse) return withCors(rateLimitResponse, corsHeaders);
                response = await handleRegister(request, env, db);
            } else if (path === '/api/auth/login' && method === 'POST') {
                const rateLimitResponse = authRateLimit(request);
                if (rateLimitResponse) return withCors(rateLimitResponse, corsHeaders);
                response = await handleLogin(request, env, db);
            } else if (path === '/api/auth/logout' && method === 'POST') {
                response = await handleLogout(request, env, db);
            } else if (path === '/api/auth/refresh' && method === 'POST') {
                const rateLimitResponse = authRateLimit(request);
                if (rateLimitResponse) return withCors(rateLimitResponse, corsHeaders);
                response = await handleRefresh(request, env, db);
            } else if (path === '/api/auth/me' && method === 'GET') {
                response = await handleMe(request, env, db);
            } else if (path === '/api/auth/sessions' && method === 'GET') {
                response = await handleGetSessions(request, env, db);
            } else if (path.startsWith('/api/auth/sessions/') && method === 'DELETE') {
                const sessionId = path.split('/api/auth/sessions/')[1];
                if (!sessionId) {
                    response = errorResponse('Session ID is required', 400);
                } else {
                    response = await handleRevokeSession(request, env, db, sessionId);
                }
            } else if (path === '/api/auth/audit' && method === 'GET') {
                response = await handleGetAuditLog(request, env, db);
            }

            // Player Profile routes
            else if (path === '/api/player/profile' && method === 'GET') {
                response = await handleGetProfile(request, env, db);
            } else if (path === '/api/player/profile' && method === 'POST') {
                response = await handleUpdateProfile(request, env, db);
            } else if (path === '/api/player/documents' && method === 'POST') {
                const rateLimitResponse = uploadRateLimit(request);
                if (rateLimitResponse) return withCors(rateLimitResponse, corsHeaders);
                response = await handleUploadDocument(request, env, db);
            } else if (path.startsWith('/api/player/documents/') && method === 'GET') {
                const documentId = path.split('/api/player/documents/')[1];
                if (!documentId) {
                    response = errorResponse('Document ID is required', 400);
                } else {
                    response = await handleGetDocument(request, env, db, documentId);
                }
            } else if (path.startsWith('/api/player/documents/') && method === 'DELETE') {
                const documentId = path.split('/api/player/documents/')[1];
                if (!documentId) {
                    response = errorResponse('Document ID is required', 400);
                } else {
                    response = await handleDeleteDocument(request, env, db, documentId);
                }
            } else if (path === '/api/player/profile-picture' && method === 'POST') {
                const rateLimitResponse = uploadRateLimit(request);
                if (rateLimitResponse) return withCors(rateLimitResponse, corsHeaders);
                response = await handleUploadProfilePicture(request, env, db);
            } else if (path === '/api/player/profile-picture' && method === 'GET') {
                response = await handleGetProfilePicture(request, env, db);
            } else if (path === '/api/player/profile-analytics' && method === 'GET') {
                response = await handleGetProfileAnalytics(request, env, db);
            }

            // Public Profile routes (no auth)
            else if (path.startsWith('/api/public/player/') && (method === 'GET' || method === 'POST')) {
                const rest = path.slice('/api/public/player/'.length); // e.g. "slug" or "slug/documents/docId" or "slug/profile-picture"
                const parts = rest.split('/');
                const slug = parts[0];
                if (method === 'GET' && parts.length === 1) {
                    // GET /api/public/player/:slug
                    response = await handleGetPublicProfile(request, env, ctx, db, slug);
                } else if (method === 'POST' && parts.length === 2 && parts[1] === 'view') {
                    // POST /api/public/player/:slug/view
                    response = await handleTrackPublicProfileView(request, env, db, slug);
                } else if (method === 'GET' && parts.length === 2 && parts[1] === 'profile-picture') {
                    // GET /api/public/player/:slug/profile-picture
                    response = await handleGetPublicProfilePicture(request, env, db, slug);
                } else if (method === 'GET' && parts.length === 3 && parts[1] === 'documents') {
                    // GET /api/public/player/:slug/documents/:docId
                    const docId = parts[2];
                    response = await handleGetPublicDocument(request, env, db, slug, docId);
                } else {
                    response = errorResponse('Route not found', 404);
                }
            }

            else {
                response = errorResponse('Route not found', 404);
            }

            return withCors(response, corsHeaders);
        } catch (error) {
            // Centralized error handler — ALWAYS includes CORS headers
            console.error('[ERROR]', {
                message: error.message,
                url: request.url,
                method: request.method,
            });

            const status = error.statusCode || 500;
            const clientMessage = status >= 500
                ? `Internal server error: ${error.message}`
                : error.message || 'An error occurred';

            return withCors(errorResponse(clientMessage, status), corsHeaders);
        } finally {
            if (dbClient) {
                ctx.waitUntil(dbClient.close());
            }
        }
    },
};
