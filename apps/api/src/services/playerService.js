import { logEvent, AuditActions, Severity } from './auditService.js';

// Deep string sanitization utility for arrays
function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize('NFKC') // Normalize unicode
        .replace(/\s+/g, ' ') // Replace multiple spaces
        .trim();
}

export async function createOrUpdateProfile(userId, data, db) {
    const playersCol = db.collection('players');

    // Meticulous Field Mapping (No spread operators)
    const profileDoc = {
        userId,
        name: data.name.trim(),
        position: data.position,
        heightCm: Number(data.heightCm),
        weightKg: Number(data.weightKg),
        attackReachCm: Number(data.attackReachCm),
        blockReachCm: Number(data.blockReachCm),
        birthYear: Number(data.birthYear),
        whatsappNumber: data.whatsappNumber.trim(),
        updatedAt: new Date(),
    };

    // Deep sanitize achievements
    if (data.achievements && Array.isArray(data.achievements)) {
        profileDoc.achievements = data.achievements.map((a) => ({
            title: sanitizeString(a.title).substring(0, 100),
            championship: sanitizeString(a.championship).substring(0, 150),
            year: Number(a.year),
        }));
    } else {
        profileDoc.achievements = [];
    }

    // Deep sanitize individual awards
    if (data.individualAwards && Array.isArray(data.individualAwards)) {
        profileDoc.individualAwards = data.individualAwards.map((a) => ({
            title: sanitizeString(a.title).substring(0, 100),
            championship: sanitizeString(a.championship).substring(0, 150),
            year: Number(a.year),
        }));
    } else {
        profileDoc.individualAwards = [];
    }

    const result = await playersCol.findOneAndUpdate(
        { userId },
        {
            $set: profileDoc,
            $setOnInsert: { createdAt: new Date() }
        },
        { returnDocument: 'after', upsert: true }
    );

    return result;
}

export async function getProfile(userId, db) {
    const playersCol = db.collection('players');
    return await playersCol.findOne({ userId });
}

export async function addDocument(userId, fileData, env, db, requestContext) {
    const playersCol = db.collection('players');
    const profile = await playersCol.findOne({ userId });

    // Strict Limit: Max 10 Documents
    const currentDocs = profile?.documents || [];
    if (currentDocs.length >= 10) {
        throw new Error('Limite máximo de 10 documentos atingido.');
    }

    // Secure naming format: userId/uuid.pdf
    const objectKey = `${userId}/${fileData.id}.pdf`;

    // 1. Upload to R2 Bucket
    await env.PLAYERS_DOCUMENTS_BUCKET.put(objectKey, fileData.buffer, {
        httpMetadata: { contentType: 'application/pdf' },
    });

    // 2. Map to Database
    const newDoc = {
        id: fileData.id, // UUID
        filename: sanitizeString(fileData.originalName),
        objectKey: objectKey,
        uploadedAt: new Date()
    };

    await playersCol.updateOne(
        { userId },
        {
            $push: { documents: newDoc },
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true } // In case they upload before saving profile
    );

    // 3. Audit Log
    if (requestContext) {
        await logEvent({
            action: AuditActions.DOCUMENT_UPLOADED,
            userId: userId,
            ip: requestContext.ip,
            userAgent: requestContext.userAgent,
            metadata: { documentId: fileData.id, filename: newDoc.filename },
            severity: Severity.INFO,
            db,
        });
    }

    return newDoc;
}

export async function getDocumentStream(userId, documentId, env, db) {
    const playersCol = db.collection('players');
    const profile = await playersCol.findOne({ userId });

    if (!profile || !profile.documents) {
        return { success: false, status: 404, message: 'Documento não encontrado' };
    }

    const docMeta = profile.documents.find(d => d.id === documentId);
    if (!docMeta) {
        return { success: false, status: 404, message: 'Documento não encontrado' };
    }

    const r2Object = await env.PLAYERS_DOCUMENTS_BUCKET.get(docMeta.objectKey);
    if (!r2Object) {
        return { success: false, status: 404, message: 'Arquivo não encontrado no armazenamento' };
    }

    // Secure Streaming 
    const headers = new Headers();
    r2Object.writeHttpMetadata(headers);

    // Enterprise Headers
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(docMeta.filename)}"`);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cache-Control', 'private, no-store');

    return {
        success: true,
        stream: r2Object.body,
        headers: headers
    };
}

export async function deleteDocument(userId, documentId, env, db, requestContext) {
    const playersCol = db.collection('players');
    const profile = await playersCol.findOne({ userId });

    if (!profile || !profile.documents) {
        throw new Error('Perfil não encontrado.');
    }

    const docMeta = profile.documents.find(d => d.id === documentId);
    if (!docMeta) {
        throw new Error('Documento não encontrado.');
    }

    // 1. Remove from R2
    await env.PLAYERS_DOCUMENTS_BUCKET.delete(docMeta.objectKey);

    // 2. Remove from Database
    await playersCol.updateOne(
        { userId },
        { $pull: { documents: { id: documentId } } }
    );

    // 3. Audit Log
    if (requestContext) {
        await logEvent({
            action: AuditActions.DOCUMENT_DELETED,
            userId: userId,
            ip: requestContext.ip,
            userAgent: requestContext.userAgent,
            metadata: { documentId: documentId, filename: docMeta.filename },
            severity: Severity.INFO,
            db,
        });
    }

    return { success: true };
}
