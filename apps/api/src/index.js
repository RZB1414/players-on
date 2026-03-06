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
    handleDeleteDocument
} from './routes/player.js';
import { errorResponse } from './utils/response.js';

// Rate limiter instances
const authRateLimit = rateLimit({ maxRequests: 5, windowMs: 60000 });
const uploadRateLimit = rateLimit({ maxRequests: 3, windowMs: 60000 });

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
            } catch (dbError) {
                console.error('[DB_CONNECTION_ERROR]', dbError.message);
                return withCors(errorResponse('Erro de conexão com o banco de dados', 503), corsHeaders);
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
                    response = errorResponse('ID da sessão é obrigatório', 400);
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
                    response = errorResponse('ID do documento é obrigatório', 400);
                } else {
                    response = await handleGetDocument(request, env, db, documentId);
                }
            } else if (path.startsWith('/api/player/documents/') && method === 'DELETE') {
                const documentId = path.split('/api/player/documents/')[1];
                if (!documentId) {
                    response = errorResponse('ID do documento é obrigatório', 400);
                } else {
                    response = await handleDeleteDocument(request, env, db, documentId);
                }
            }

            else {
                response = errorResponse('Rota não encontrada', 404);
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
                ? `Erro interno do servidor: ${error.message} \n ${error.stack}`
                : error.message || 'Ocorreu um erro';

            return withCors(errorResponse(clientMessage, status), corsHeaders);
        } finally {
            if (dbClient) {
                ctx.waitUntil(dbClient.close());
            }
        }
    },
};
