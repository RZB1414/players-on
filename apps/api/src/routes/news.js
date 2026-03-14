import { errorResponse, successResponse } from '../utils/response.js';

const WEBVOLEI_FEED_URL = 'https://webvolei.com.br/feed/';
const MAX_NEWS_ITEMS = 6;
const CACHE_CONTROL = 'public, max-age=300, s-maxage=300';
const FALLBACK_NEWS_IMAGE = 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png';

const XML_ENTITY_MAP = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#8211;': '-',
    '&#8212;': '-',
    '&#8220;': '"',
    '&#8221;': '"',
    '&#8216;': "'",
    '&#8217;': "'",
    '&#8230;': '...',
    '&#160;': ' ',
    '&nbsp;': ' ',
    '&aacute;': 'á',
    '&eacute;': 'é',
    '&iacute;': 'í',
    '&oacute;': 'ó',
    '&uacute;': 'ú',
    '&atilde;': 'ã',
    '&otilde;': 'õ',
    '&acirc;': 'â',
    '&ecirc;': 'ê',
    '&ocirc;': 'ô',
    '&ccedil;': 'ç',
    '&Aacute;': 'Á',
    '&Eacute;': 'É',
    '&Iacute;': 'Í',
    '&Oacute;': 'Ó',
    '&Uacute;': 'Ú',
    '&Atilde;': 'Ã',
    '&Otilde;': 'Õ',
    '&Acirc;': 'Â',
    '&Ecirc;': 'Ê',
    '&Ocirc;': 'Ô',
    '&Ccedil;': 'Ç',
};

function decodeXmlEntities(value = '') {
    return value
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/&[a-zA-Z#0-9]+;/g, (entity) => XML_ENTITY_MAP[entity] || entity);
}

function stripHtml(value = '') {
    return decodeXmlEntities(value)
        .replace(/<!\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractTagContent(xml, tagName) {
    const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
    return match ? match[1].trim() : '';
}

function extractCategory(xml) {
    const match = xml.match(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/i);
    if (match) return stripHtml(match[1]);

    const fallback = xml.match(/<category>([\s\S]*?)<\/category>/i);
    return fallback ? stripHtml(fallback[1]) : 'Web Vôlei';
}

function formatNewsDate(pubDate) {
    const date = new Date(pubDate);

    if (Number.isNaN(date.getTime())) {
        return pubDate;
    }

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

function buildExcerpt(description) {
    const cleaned = stripHtml(description)
        .replace(/^O post .*? apareceu primeiro em Web Vôlei\.?/i, '')
        .trim();

    if (cleaned.length <= 180) {
        return cleaned;
    }

    return `${cleaned.slice(0, 177).trimEnd()}...`;
}

function extractImageFromHtml(html = '') {
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    if (ogImageMatch) {
        return ogImageMatch[1].trim();
    }

    const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (twitterImageMatch) {
        return twitterImageMatch[1].trim();
    }

    const imageTagMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imageTagMatch) {
        return imageTagMatch[1].trim();
    }

    return FALLBACK_NEWS_IMAGE;
}

async function enrichNewsImage(item) {
    try {
        const response = await fetch(item.link, {
            headers: {
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'PlayersOnNewsBot/1.0',
            },
        });

        if (!response.ok) {
            return { ...item, image: FALLBACK_NEWS_IMAGE };
        }

        const html = await response.text();
        return {
            ...item,
            image: extractImageFromHtml(html),
        };
    } catch {
        return { ...item, image: FALLBACK_NEWS_IMAGE };
    }
}

function parseFeed(xml) {
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

    return items.slice(0, MAX_NEWS_ITEMS).map(([, itemXml]) => ({
        title: stripHtml(extractTagContent(itemXml, 'title')),
        category: extractCategory(itemXml),
        date: formatNewsDate(stripHtml(extractTagContent(itemXml, 'pubDate'))),
        excerpt: buildExcerpt(extractTagContent(itemXml, 'description')),
        link: stripHtml(extractTagContent(itemXml, 'link')),
        image: FALLBACK_NEWS_IMAGE,
    })).filter((item) => item.title && item.link);
}

export async function handleGetWebVoleiNews() {
    try {
        const response = await fetch(WEBVOLEI_FEED_URL, {
            headers: {
                Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
                'User-Agent': 'PlayersOnNewsBot/1.0',
            },
        });

        if (!response.ok) {
            return errorResponse('Unable to fetch Web Vôlei feed', 502);
        }

        const xml = await response.text();
        const parsedNews = parseFeed(xml);
        const news = await Promise.all(parsedNews.map(enrichNewsImage));

        if (!news.length) {
            return errorResponse('No news found in Web Vôlei feed', 502);
        }

        return successResponse(
            {
                source: {
                    name: 'Web Vôlei',
                    url: 'https://webvolei.com.br/',
                    feed: WEBVOLEI_FEED_URL,
                },
                news,
                fetchedAt: new Date().toISOString(),
            },
            200,
            { 'Cache-Control': CACHE_CONTROL }
        );
    } catch (error) {
        console.error('[WEBVOLEI_FEED_ERROR]', error.message);
        return errorResponse('Unable to fetch Web Vôlei feed', 502);
    }
}