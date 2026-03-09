import { sanitizeInput } from '../utils/sanitize.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { authMiddleware } from '../middlewares/auth.js';
import { getPublicProfileBySlug } from '../services/playerService.js';
import { trackProfileView, getProfileAnalytics } from '../services/analyticsService.js';

const SLUG_REGEX = /^[a-zA-Z0-9-]{1,100}$/;
const DOC_ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;

function getClientInfo(request) {
    return {
        ip: request.headers.get('CF-Connecting-IP') || '0.0.0.0',
        city: request.headers.get('CF-IPCity') || null,
        country: request.headers.get('CF-IPCountry') || null,
        userAgent: request.headers.get('User-Agent') || '',
    };
}

async function applyPublicRateLimit(ip, env) {
    if (!env.RATE_LIMIT_KV) return null; // Skip if KV not configured (local dev)

    const key = `rate_limit:${ip}:${Math.floor(Date.now() / 60000)}`;
    const current = await env.RATE_LIMIT_KV.get(key);
    const count = Number(current) || 0;

    if (count >= 50) {
        return new Response(
            JSON.stringify({ success: false, error: 'Too many requests. Please try again later.' }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60',
                },
            }
        );
    }

    // Increment with TTL — key auto-expires after 60s
    await env.RATE_LIMIT_KV.put(key, String(count + 1), { expirationTtl: 60 });
    return null; // Allowed
}

/**
 * GET /api/public/player/:slug
 * Public — no auth required. Rate limited, view tracked, cached.
 */
export async function handleGetPublicProfile(request, env, ctx, db, rawSlug) {
    console.log(`[PUBLIC_PROFILE_REQUEST] Fetching public profile with rawSlug: "${rawSlug}"`);
    // 1. Validate slug
    if (!rawSlug || !SLUG_REGEX.test(rawSlug)) {
        console.warn(`[PUBLIC_PROFILE_REJECTED] Invalid profile slug format: "${rawSlug}"`);
        return errorResponse('Invalid profile slug', 400);
    }

    const slug = rawSlug.toLowerCase();
    console.log(`[PUBLIC_PROFILE_NORMALIZED] Querying database for slug: "${slug}"`);

    // 2. KV rate limit (50/min per IP)
    const { ip, city, country, userAgent } = getClientInfo(request);
    const rateLimitError = await applyPublicRateLimit(ip, env);
    if (rateLimitError) {
        console.warn(`[PUBLIC_PROFILE_RATELIMIT] IP ${ip} rate limited.`);
        return rateLimitError;
    }

    // 3. Fetch public profile
    const profile = await getPublicProfileBySlug(slug, db);
    if (!profile) {
        console.warn(`[PUBLIC_PROFILE_NOT_FOUND] No player found in DB matching slug: "${slug}"`);
        return errorResponse('Player not found', 404);
    }

    console.log(`[PUBLIC_PROFILE_SUCCESS] Successfully retrieved profile for: "${profile.name}" (${slug})`);

    // 4. Track view non-blocking (never delays response)
    ctx.waitUntil(trackProfileView(slug, ip, city, country, userAgent, db));

    // 5. Build safe public response (no private fields)
    const publicData = {
        name: profile.name,
        position: profile.position,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        attackReachCm: profile.attackReachCm,
        blockReachCm: profile.blockReachCm,
        birthYear: profile.birthYear,
        nationality: profile.nationality || null,
        secondNationality: profile.secondNationality || null,
        nativeLanguage: profile.nativeLanguage || null,
        otherLanguages: profile.otherLanguages || [],
        currentTeam: profile.currentTeam || null,
        achievements: profile.achievements || [],
        individualAwards: profile.individualAwards || [],
        youtubeVideos: profile.youtubeVideos || [],
        // Only expose safe document fields — never objectKey
        documents: (profile.documents || []).map(d => ({ id: d.id, filename: d.filename })),
        whatsappNumber: profile.whatsappNumber || null,
        agency: profile.agency || null,
        agencyWhatsapp: profile.agencyWhatsapp || null,
        hasProfilePicture: profile.hasProfilePicture || false,
        updatedAt: profile.updatedAt || null,
        slug: profile.slug,
    };

    const response = successResponse({ player: publicData });

    // 6. Cloudflare edge caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    response.headers.set('CDN-Cache-Control', 'max-age=60');

    return response;
}

/**
 * GET /api/public/player/:slug/documents/:docId
 * Streams a PDF from R2 — ownership validated, objectKey never exposed.
 */
export async function handleGetPublicDocument(request, env, db, rawSlug, docId) {
    // 1. Validate inputs
    if (!rawSlug || !SLUG_REGEX.test(rawSlug)) {
        return errorResponse('Invalid profile slug', 400);
    }
    const slug = rawSlug.toLowerCase();

    if (!DOC_ID_REGEX.test(docId)) {
        return errorResponse('Invalid document ID', 400);
    }

    // 2. Fetch profile, verify ownership
    const profile = await getPublicProfileBySlug(slug, db);
    if (!profile) {
        return errorResponse('Player not found', 404);
    }

    const doc = (profile.documents || []).find(d => d.id === docId);
    if (!doc) {
        return errorResponse('Document not found', 404);
    }

    // 3. Fetch from R2 using internal objectKey (never exposed to client)
    const obj = await env.PLAYERS_DOCUMENTS_BUCKET.get(doc.objectKey);
    if (!obj) {
        // DB ↔ storage inconsistency — guard against missing files
        return errorResponse('Document file not found in storage', 404);
    }

    // 4. Stream PDF with security headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.filename)}"`);

    return new Response(obj.body, { headers });
}

/**
 * GET /api/public/player/:slug/profile-picture
 * Streams profile picture from R2 by unique player slug
 */
export async function handleGetPublicProfilePicture(request, env, db, rawSlug) {
    if (!rawSlug || !SLUG_REGEX.test(rawSlug)) {
        return errorResponse('Invalid profile slug', 400);
    }
    const slug = rawSlug.toLowerCase();

    const playersCol = db.collection('players');
    const profile = await playersCol.findOne({ slug }, { projection: { userId: 1, hasProfilePicture: 1 } });

    if (!profile || !profile.hasProfilePicture) {
        return errorResponse('Profile picture not found', 404);
    }

    const objectKey = `${profile.userId}/profile-picture.jpg`;
    const r2Object = await env.PLAYERS_DOCUMENTS_BUCKET.get(objectKey);

    if (!r2Object) {
        return errorResponse('Profile picture file not found', 404);
    }

    const headers = new Headers();
    r2Object.writeHttpMetadata(headers);
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(r2Object.body, { headers });
}

/**
 * GET /api/player/profile-analytics
 * Authenticated — returns analytics for the logged-in player's profile.
 */
export async function handleGetProfileAnalytics(request, env, db) {
    const auth = await authMiddleware(request, env);
    if (!auth.authenticated) return auth.response;

    // Get the player's slug from their profile
    const playersCol = db.collection('players');
    const player = await playersCol.findOne(
        { userId: auth.user.id },
        { projection: { slug: 1 } }
    );

    if (!player || !player.slug) {
        return errorResponse('Profile not found or slug not generated yet. Please save your profile first.', 404);
    }

    const analytics = await getProfileAnalytics(player.slug, db);

    return successResponse({ analytics, slug: player.slug });
}
