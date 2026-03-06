import { errorResponse } from '../utils/response.js';

/**
 * Wraps a request handler with centralized error handling.
 * Logs safe info only (never passwords, tokens, or hashes).
 */
export function withErrorHandler(handler) {
    return async function (request, env, ctx) {
        try {
            return await handler(request, env, ctx);
        } catch (error) {
            // Log safely — no sensitive data
            console.error('[ERROR]', {
                message: error.message,
                stack: error.stack?.split('\n').slice(0, 3).join('\n'),
                url: request.url,
                method: request.method,
                timestamp: new Date().toISOString(),
            });

            // Never expose internal error details to client
            const status = error.statusCode || 500;
            const clientMessage =
                status >= 500
                    ? 'Erro interno do servidor'
                    : error.message || 'Ocorreu um erro';

            return errorResponse(clientMessage, status);
        }
    };
}

/**
 * Custom error class with status code support.
 */
export class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
