import { validatePlayerProfile } from '../utils/playerValidation.js';
import { sanitizeInput } from '../utils/sanitize.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
import { getClientIP } from '../utils/deviceFingerprint.js';
import {
    createOrUpdateProfile,
    getProfile,
    addDocument,
    deleteDocument,
    getDocumentStream
} from '../services/playerService.js';
import { parsePdfUpload } from '../services/uploadService.js';

export async function handleGetProfile(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const profile = await getProfile(auth.user.id, db);

    // Empty profile is fine, just means they haven't set it up
    return successResponse({ profile: profile || {} });
}

export async function handleUpdateProfile(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const body = sanitizeInput(await request.json());

    const validation = validatePlayerProfile(body);
    if (!validation.valid) {
        return errorResponse(validation.errors.join('. '), 400);
    }

    const updatedProfile = await createOrUpdateProfile(auth.user.id, body, db);

    return successResponse({
        profile: updatedProfile.value,
        message: 'Perfil atualizado com sucesso'
    });
}

export async function handleUploadDocument(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const requestContext = {
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || ''
    };

    try {
        const fileData = await parsePdfUpload(request);
        const newDoc = await addDocument(auth.user.id, fileData, env, db, requestContext);

        return successResponse({
            document: newDoc,
            message: 'Documento enviado com sucesso'
        }, 201);
    } catch (error) {
        // Specifically catch known logic errors and surface them with 400
        return errorResponse(error.message, 400);
    }
}

export async function handleGetDocument(request, env, db, documentId) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const result = await getDocumentStream(auth.user.id, documentId, env, db);

    if (!result.success) {
        return errorResponse(result.message, result.status);
    }

    // Direct proxy of the R2 stream
    return new Response(result.stream, {
        headers: result.headers
    });
}

export async function handleDeleteDocument(request, env, db, documentId) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    const requestContext = {
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || ''
    };

    try {
        await deleteDocument(auth.user.id, documentId, env, db, requestContext);
        return successResponse({ message: 'Documento excluído com sucesso' });
    } catch (error) {
        return errorResponse(error.message, 400);
    }
}
