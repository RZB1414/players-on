import { verifyToken } from '../utils/jwt.js';
import { errorResponse, getAccessTokenFromRequest } from '../utils/response.js';

export async function authMiddleware(request, env) {
    const accessToken = getAccessTokenFromRequest(request);

    if (!accessToken) {
        return { authenticated: false, response: errorResponse('Não autenticado', 401) };
    }

    const { valid, payload } = await verifyToken(accessToken, env.JWT_SECRET);

    if (!valid) {
        return { authenticated: false, response: errorResponse('Token inválido ou expirado', 401) };
    }

    return {
        authenticated: true,
        user: {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        },
    };
}
