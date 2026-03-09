import { logEvent, AuditActions, Severity } from './auditService.js';

// Deep string sanitization utility for arrays
function sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .normalize('NFKC') // Normalize unicode
        .replace(/\s+/g, ' ') // Replace multiple spaces
        .trim();
}

/**
 * Generate a URL-safe slug from name + birthYear + position.
 * Example: "Renan Zanatta" + 2000 + "Opposite" → "renan-zanatta-2000-opposite"
 */
function generateSlug(name, birthYear, position) {
    const part = (str) =>
        (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-{2,}/g, '-')
            .replace(/^-|-$/g, '');

    const base = part(name);
    const pos = part(position);
    const year = Number(birthYear) || '';
    return `${base}-${year}-${pos}`;
}

export async function createOrUpdateProfile(userId, data, db) {
    const playersCol = db.collection('players');

    // Auto-generate slug: name-birthYear-position (unique per athlete)
    const slug = generateSlug(data.name, data.birthYear, data.position);

    // Meticulous Field Mapping (No spread operators)
    const profileDoc = {
        userId,
        slug,
        name: data.name.trim(),
        position: data.position,
        heightCm: Number(data.heightCm),
        weightKg: Number(data.weightKg),
        attackReachCm: Number(data.attackReachCm),
        blockReachCm: Number(data.blockReachCm),
        birthYear: Number(data.birthYear),
        whatsappNumber: data.whatsappNumber.trim(),
        nationality: sanitizeString(data.nationality),
        secondNationality: data.secondNationality ? sanitizeString(data.secondNationality) : null,
        nativeLanguage: sanitizeString(data.nativeLanguage),
        currentTeam: data.currentTeam ? sanitizeString(data.currentTeam).substring(0, 100) : null,
        currentTeamCountry: data.currentTeamCountry ? sanitizeString(data.currentTeamCountry).substring(0, 50) : null,
        agency: data.agency ? sanitizeString(data.agency).substring(0, 100) : null,
        agencyWhatsapp: data.agencyWhatsapp ? sanitizeString(data.agencyWhatsapp).trim() : null,
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

    if (data.otherLanguages && Array.isArray(data.otherLanguages)) {
        profileDoc.otherLanguages = data.otherLanguages.map((l) => ({
            name: sanitizeString(l.name).substring(0, 50),
            level: sanitizeString(l.level).substring(0, 50),
        }));
    } else {
        profileDoc.otherLanguages = [];
    }

    // Sanitize YouTube videos
    if (data.youtubeVideos && Array.isArray(data.youtubeVideos)) {
        profileDoc.youtubeVideos = data.youtubeVideos.map((v) => ({
            url: sanitizeString(v.url).substring(0, 200),
            title: v.title ? sanitizeString(v.title).substring(0, 100) : '',
        }));
    } else {
        profileDoc.youtubeVideos = [];
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

/**
 * Fetch a player profile by public slug.
 * Returns only public-safe fields — userId, email, objectKey never projected.
 */
export async function getPublicProfileBySlug(slug, db) {
    const playersCol = db.collection('players');
    return await playersCol.findOne(
        { slug },
        {
            projection: {
                // Include public fields
                _id: 0,
                slug: 1,
                name: 1,
                position: 1,
                heightCm: 1,
                weightKg: 1,
                attackReachCm: 1,
                blockReachCm: 1,
                birthYear: 1,
                nationality: 1,
                secondNationality: 1,
                nativeLanguage: 1,
                otherLanguages: 1,
                currentTeam: 1,
                achievements: 1,
                individualAwards: 1,
                youtubeVideos: 1,
                whatsappNumber: 1,
                agency: 1,
                agencyWhatsapp: 1,
                hasProfilePicture: 1,
                updatedAt: 1,
                // Documents: include id+filename+objectKey (objectKey used internally, stripped before sending)
                documents: 1,
            },
        }
    );
}

/**
 * Ensure the players collection has the required indexes.
 * Safe to call on every startup — MongoDB ignores already-existing indexes.
 */
export async function ensurePlayerIndexes(db) {
    const playersCol = db.collection('players');
    await playersCol.createIndex({ slug: 1 }, { unique: true, sparse: true });
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

export async function addProfilePicture(userId, fileData, env, db, requestContext) {
    const playersCol = db.collection('players');

    const objectKey = `${userId}/profile-picture.jpg`; // Force standard extension or dynamic based on type

    // 1. Upload to R2 Bucket
    await env.PLAYERS_DOCUMENTS_BUCKET.put(objectKey, fileData.buffer, {
        httpMetadata: { contentType: fileData.type },
    });

    // 2. Map to Database
    await playersCol.updateOne(
        { userId },
        {
            $set: {
                hasProfilePicture: true,
                profilePictureUpdatedAt: new Date()
            },
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
    );

    // 3. Audit Log
    if (requestContext) {
        await logEvent({
            action: AuditActions.PROFILE_PICTURE_UPLOADED || 'PROFILE_PICTURE_UPLOADED',
            userId: userId,
            ip: requestContext.ip,
            userAgent: requestContext.userAgent,
            metadata: {},
            severity: Severity.INFO,
            db,
        });
    }

    return { hasProfilePicture: true };
}

export async function getProfilePictureStream(userId, env, db) {
    const playersCol = db.collection('players');
    const profile = await playersCol.findOne({ userId });

    if (!profile || !profile.hasProfilePicture) {
        return { success: false, status: 404, message: 'Foto de perfil não encontrada' };
    }

    const objectKey = `${userId}/profile-picture.jpg`;

    // Check alternatives if type changed (webp/png etc if we stored original extension, but here we reuse .jpg or rely on R2 finding it by same path)
    const r2Object = await env.PLAYERS_DOCUMENTS_BUCKET.get(objectKey);
    // Try without extension if we originally didn't force one? The implementation forces .jpg objectKey above.

    if (!r2Object) {
        return { success: false, status: 404, message: 'Arquivo não encontrado no armazenamento' };
    }

    const headers = new Headers();
    r2Object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'private, max-age=3600');

    return {
        success: true,
        stream: r2Object.body,
        headers: headers
    };
}
