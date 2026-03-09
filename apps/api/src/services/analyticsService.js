// Bot detection regex — covers common crawlers & social preview bots
const BOT_REGEX = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|discordbot/i;

/**
 * Track a profile view with:
 * - Bot filtering
 * - 30-minute IP dedup per slug (prevents refresh inflation)
 */
export async function trackProfileView(slug, ip, city, country, userAgent, db) {
    try {
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

        await col.insertOne({
            profileSlug: slug,
            ip,
            city: city || null,
            country: country || null,
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
 * Returns: totalViews, uniqueVisitors, topCities, topCountries, last7DaysViews, last30DaysViews
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
    ]);

    return {
        totalViews,
        uniqueVisitors: uniqueVisitorsResult[0]?.uniqueVisitors ?? 0,
        topCities: topCitiesResult,
        topCountries: topCountriesResult,
        last7DaysViews,
        last30DaysViews,
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
