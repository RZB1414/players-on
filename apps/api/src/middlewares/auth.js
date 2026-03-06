import { verifyToken } from '../utils/jwt.js';
import { parseCookies } from '../utils/response.js';
import { errorResponse } from '../utils/response.js';

export async function authMiddleware(request, env) {
    const cookies = parseCookies(request);
    const accessToken = cookies.access_token;

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
