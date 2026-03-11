// Bot detection regex — covers common crawlers & social preview bots
const BOT_REGEX = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|discordbot/i;

function sanitizeText(value, maxLength = 256) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.substring(0, maxLength) : null;
}

function normalizePlatformHint(platformHint) {
    const value = sanitizeText(platformHint, 64);
    return value ? value.replace(/"/g, '') : null;
}

function detectIsMobile(userAgent = '', mobileHint = null) {
    if (mobileHint === '?1') return true;
    if (mobileHint === '?0') return false;
    return /android|iphone|ipod|iemobile|blackberry|opera mini|mobile/i.test(userAgent);
}

function detectDeviceType(userAgent = '', isMobile = false) {
    if (/ipad|tablet|playbook|silk/i.test(userAgent)) return 'tablet';
    if (isMobile) return 'mobile';
    if (/tv|smart-tv|smarttv|hbbtv|appletv/i.test(userAgent)) return 'tv';
    return 'desktop';
}

function detectBrowser(userAgent = '') {
    if (!userAgent) return 'Unknown';
    if (/edg\//i.test(userAgent)) return 'Edge';
    if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) return 'Opera';
    if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) return 'Chrome';
    if (/firefox\//i.test(userAgent)) return 'Firefox';
    if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) return 'Safari';
    if (/msie|trident/i.test(userAgent)) return 'Internet Explorer';
    return 'Other';
}

function detectOperatingSystem(userAgent = '', platformHint = null) {
    const normalizedPlatform = (platformHint || '').toLowerCase();

    if (/windows/i.test(userAgent) || normalizedPlatform === 'windows') return 'Windows';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad|ipod/i.test(userAgent)) return 'iOS';
    if (/mac os x|macintosh/i.test(userAgent) || normalizedPlatform === 'macos') return 'macOS';
    if (/linux/i.test(userAgent) || normalizedPlatform === 'linux') return 'Linux';
    return 'Unknown';
}

function getPrimaryLanguage(acceptLanguage) {
    const first = sanitizeText(acceptLanguage, 128)?.split(',')[0]?.trim();
    return first || null;
}

function getRefererHost(referer) {
    const value = sanitizeText(referer, 512);
    if (!value) return null;

    try {
        return new URL(value).hostname || value;
    } catch {
        return value;
    }
}

function serializeCreatedAt(value) {
    if (!value) return null;

    try {
        return new Date(value).toISOString();
    } catch {
        return null;
    }
}

/**
 * Track a profile view with:
 * - Bot filtering
 * - 30-minute IP dedup per slug (prevents refresh inflation)
 */
export async function trackProfileView(slug, clientInfo, db) {
    try {
        const ip = sanitizeText(clientInfo?.ip, 128) || '0.0.0.0';
        const city = sanitizeText(clientInfo?.city, 128);
        const country = sanitizeText(clientInfo?.country, 32);
        const continent = sanitizeText(clientInfo?.continent, 32);
        const region = sanitizeText(clientInfo?.region, 128);
        const regionCode = sanitizeText(clientInfo?.regionCode, 16);
        const timezone = sanitizeText(clientInfo?.timezone, 128);
        const postalCode = sanitizeText(clientInfo?.postalCode, 32);
        const referer = sanitizeText(clientInfo?.referer, 512);
        const acceptLanguage = sanitizeText(clientInfo?.acceptLanguage, 128);
        const platformHint = normalizePlatformHint(clientInfo?.platformHint);
        const mobileHint = sanitizeText(clientInfo?.mobileHint, 16);
        const userAgent = sanitizeText(clientInfo?.userAgent, 512) || '';

        // Skip bots entirely
        if (BOT_REGEX.test(userAgent || '')) {
            console.log(`[ANALYTICS_TRACK_SKIPPED] Bot detected for slug: "${slug}", userAgent: "${userAgent}"`);
            return;
        }

        const col = db.collection('profile_views');
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

        // Check for a recent view from the same IP for this slug
        const existing = await col.findOne({
            profileSlug: slug,
            ip,
            createdAt: { $gte: thirtyMinsAgo },
        });

        if (existing) {
            console.log(`[ANALYTICS_TRACK_SKIPPED] IP ${ip} recently viewed slug: "${slug}"`);
            return;
        }

        const isMobile = detectIsMobile(userAgent, mobileHint);
        const deviceType = detectDeviceType(userAgent, isMobile);
        const browser = detectBrowser(userAgent);
        const operatingSystem = detectOperatingSystem(userAgent, platformHint);
        const primaryLanguage = getPrimaryLanguage(acceptLanguage);
        const refererHost = getRefererHost(referer);

        await col.insertOne({
            profileSlug: slug,
            ip,
            city: city || null,
            country: country || null,
            continent: continent || null,
            region: region || null,
            regionCode: regionCode || null,
            timezone: timezone || null,
            postalCode: postalCode || null,
            referer: referer || null,
            refererHost: refererHost || null,
            acceptLanguage: acceptLanguage || null,
            primaryLanguage: primaryLanguage || null,
            platformHint: platformHint || null,
            mobileHint: mobileHint || null,
            isMobile,
            deviceType,
            browser,
            operatingSystem,
            userAgent: (userAgent || '').substring(0, 256), // Limit length
            createdAt: new Date(),
        });
        console.log(`[ANALYTICS_TRACK_SUCCESS] Logged view for slug: "${slug}" from IP: ${ip}`);
    } catch (err) {
        // Non-critical — never let tracking failures affect the response
        console.error('[ANALYTICS_TRACK_ERROR]', err.message);
    }
}

/**
 * Get analytics for a profile slug.
 * Returns aggregate stats plus the recent captured visit details.
 */
export async function getProfileAnalytics(profileSlug, db) {
    const col = db.collection('profile_views');

    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
        totalViews,
        uniqueVisitorsResult,
        topCitiesResult,
        topCountriesResult,
        last7DaysViews,
        last30DaysViews,
        topBrowsersResult,
        topDevicesResult,
        topReferrersResult,
        topLanguagesResult,
        viewsByDayResult,
        recentViews,
    ] = await Promise.all([
        // 1. Total views
        col.countDocuments({ profileSlug }),

        // 2. Unique visitors (aggregation scales better than distinct())
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: '$ip' } },
            { $count: 'uniqueVisitors' },
        ]).toArray(),

        // 3. Top 3 cities
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: { city: '$city', country: '$country' }, views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 3 },
            { $project: { _id: 0, city: '$_id.city', country: '$_id.country', views: 1 } },
        ]).toArray(),

        // 4. Top 3 countries
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: '$country', views: { $sum: 1 } } },
            { $sort: { views: -1 } },
            { $limit: 3 },
            { $project: { _id: 0, country: '$_id', views: 1 } },
        ]).toArray(),

        // 5. Last 7 days
        col.countDocuments({ profileSlug, createdAt: { $gte: sevenDaysAgo } }),

        // 6. Last 30 days
        col.countDocuments({ profileSlug, createdAt: { $gte: thirtyDaysAgo } }),

        // 7. Top browsers
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: '$browser', views: { $sum: 1 } } },
            { $sort: { views: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, browser: { $ifNull: ['$_id', 'Unknown'] }, views: 1 } },
        ]).toArray(),

        // 8. Top device types
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: '$deviceType', views: { $sum: 1 } } },
            { $sort: { views: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, deviceType: { $ifNull: ['$_id', 'Unknown'] }, views: 1 } },
        ]).toArray(),

        // 9. Top referrers
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: '$refererHost', views: { $sum: 1 } } },
            { $sort: { views: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, refererHost: { $ifNull: ['$_id', 'Direct / Unknown'] }, views: 1 } },
        ]).toArray(),

        // 10. Top languages
        col.aggregate([
            { $match: { profileSlug } },
            { $group: { _id: '$primaryLanguage', views: { $sum: 1 } } },
            { $sort: { views: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, language: { $ifNull: ['$_id', 'Unknown'] }, views: 1 } },
        ]).toArray(),

        // 11. Daily views over the last 30 days
        col.aggregate([
            { $match: { profileSlug, createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    views: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, date: '$_id', views: 1 } },
        ]).toArray(),

        // 12. Latest captured visits with all stored fields
        col.find(
            { profileSlug },
            {
                sort: { createdAt: -1 },
                limit: 25,
                projection: {
                    _id: 0,
                    ip: 1,
                    city: 1,
                    country: 1,
                    continent: 1,
                    region: 1,
                    regionCode: 1,
                    timezone: 1,
                    postalCode: 1,
                    referer: 1,
                    refererHost: 1,
                    acceptLanguage: 1,
                    primaryLanguage: 1,
                    platformHint: 1,
                    mobileHint: 1,
                    isMobile: 1,
                    deviceType: 1,
                    browser: 1,
                    operatingSystem: 1,
                    userAgent: 1,
                    createdAt: 1,
                },
            }
        ).toArray(),
    ]);

    const serializedRecentViews = recentViews.map(view => ({
        ...view,
        createdAt: serializeCreatedAt(view.createdAt),
    }));

    return {
        totalViews,
        uniqueVisitors: uniqueVisitorsResult[0]?.uniqueVisitors ?? 0,
        topCities: topCitiesResult,
        topCountries: topCountriesResult,
        last7DaysViews,
        last30DaysViews,
        topBrowsers: topBrowsersResult,
        topDevices: topDevicesResult,
        topReferrers: topReferrersResult,
        topLanguages: topLanguagesResult,
        viewsByDay: viewsByDayResult,
        lastViewedAt: serializedRecentViews[0]?.createdAt ?? null,
        recentViews: serializedRecentViews,
        captureFields: [
            'ip',
            'city',
            'country',
            'continent',
            'region',
            'regionCode',
            'timezone',
            'postalCode',
            'referer',
            'refererHost',
            'acceptLanguage',
            'primaryLanguage',
            'platformHint',
            'mobileHint',
            'isMobile',
            'deviceType',
            'browser',
            'operatingSystem',
            'userAgent',
            'createdAt',
        ],
    };
}

/**
 * Create indexes for the profile_views collection.
 * Safe to call on every startup — MongoDB ignores existing indexes.
 */
export async function ensureAnalyticsIndexes(db) {
    const col = db.collection('profile_views');
    await Promise.all([
        col.createIndex({ profileSlug: 1 }),
        col.createIndex({ profileSlug: 1, createdAt: -1 }),
        // Compound for dedup query: profileSlug + ip + createdAt
        col.createIndex({ profileSlug: 1, ip: 1, createdAt: -1 }),
    ]);
}
