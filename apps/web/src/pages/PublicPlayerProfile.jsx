import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import PDFModal from '../components/PDFModal';
import VideoModal from '../components/VideoModal';
import { getNationalityFlagUrl, getLanguageFlagUrl } from '../components/profile/CountrySearch';
import './PublicPlayerProfile.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://players-on-api.volleyplusapp.workers.dev';

// Extract YouTube video ID
function extractVideoId(url) {
    const match = (url || '').match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
}

// Get YouTube thumbnail
function getYtThumbnail(url) {
    const id = extractVideoId(url);
    return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

export default function PublicPlayerProfile() {
    const { slug } = useParams();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pdfModal, setPdfModal] = useState(null); // { url, filename }
    const [videoModal, setVideoModal] = useState(null); // { url, title }
    const [profilePicUrl, setProfilePicUrl] = useState(null);
    const [shareCopied, setShareCopied] = useState(false);

    const DEFAULT_PUBLIC_FRONTEND_URL = 'https://players-on.pages.dev';
    const frontendEnvUrl = (import.meta.env.VITE_FRONTEND_URL || '').trim();
    const browserOrigin = window.location.origin?.trim();

    let FRONTEND_URL_RAW = browserOrigin || DEFAULT_PUBLIC_FRONTEND_URL;

    if (frontendEnvUrl && frontendEnvUrl !== 'undefined' && frontendEnvUrl !== 'null') {
        FRONTEND_URL_RAW = frontendEnvUrl;
    }
    if (!FRONTEND_URL_RAW.startsWith('http')) {
        FRONTEND_URL_RAW = `https://${FRONTEND_URL_RAW}`;
    }
    const FRONTEND_URL = FRONTEND_URL_RAW.endsWith('/') ? FRONTEND_URL_RAW.slice(0, -1) : FRONTEND_URL_RAW;
    const profileUrl = `${FRONTEND_URL}/p/${slug}`;

    useEffect(() => {
        setLoading(true);
        const urlToFetch = `${API_BASE}/api/public/player/${encodeURIComponent(slug)}`;
        console.log(`[PUBLIC_PROFILE_FRONTEND] Fetching from URL: ${urlToFetch}`);

        fetch(urlToFetch)
            .then(res => {
                console.log(`[PUBLIC_PROFILE_FRONTEND] Response received. Status: ${res.status}`);
                if (res.status === 404 || res.status === 400) {
                    throw new Error(`Player not found (HTTP ${res.status})`);
                }
                if (!res.ok) {
                    throw new Error(`Failed to load profile (HTTP ${res.status}). Please check your connection.`);
                }
                return res.json();
            })
            .then(data => {
                console.log(`[PUBLIC_PROFILE_FRONTEND] Data successfully parsed:`, data);
                setPlayer(data.data?.player || data.player || null);
                setLoading(false);
            })
            .catch(err => {
                console.error(`[PUBLIC_PROFILE_FRONTEND] Caught error during fetch/parse:`, err);
                // Ignore TypeError when testing to not confuse with player missing, TypeError typically means fetch failed (CORS/network)
                if (err.name === 'TypeError') {
                    setError('Failed to connect to the server. Please check your network or try again later.');
                } else {
                    setError(err.message);
                }
                setLoading(false);
            });
    }, [slug]);

    // Load profile picture
    useEffect(() => {
        if (!player) return;
        if (player.hasProfilePicture) {
            // Include timestamp to bust browser cache
            const timestamp = player.updatedAt ? new Date(player.updatedAt).getTime() : Date.now();
            setProfilePicUrl(`${API_BASE}/api/public/player/${encodeURIComponent(slug)}/profile-picture?t=${timestamp}`);
        } else {
            setProfilePicUrl(null);
        }
    }, [player?.hasProfilePicture, player?.updatedAt, slug]);

    const openDocument = useCallback(async (doc) => {
        const url = `${API_BASE}/api/public/player/${encodeURIComponent(slug)}/documents/${encodeURIComponent(doc.id)}`;
        setPdfModal({ url, filename: doc.filename });
    }, [slug]);

    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: player?.name, url: profileUrl });
                return;
            } catch { /* user cancelled */ }
        }
        // Fallback: clipboard
        try {
            await navigator.clipboard.writeText(profileUrl);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 3000);
        } catch {
            alert(`Copy this link: ${profileUrl}`);
        }
    }, [player?.name, profileUrl]);

    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="public-profile-page">
                <div className="public-loading">
                    <div className="public-spinner" />
                    <p>Loading profile…</p>
                </div>
            </div>
        );
    }

    if (error || !player) {
        if (error && error !== 'Player not found') {
            return (
                <div className="public-profile-page">
                    <div className="public-not-found">
                        <span className="public-not-found-icon" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>⚠️</span>
                        <h1>Connection Error</h1>
                        <p>{error || 'Unable to connect to the server. Please try again later.'}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="public-profile-page">
                <div className="public-not-found">
                    <span className="public-not-found-icon">🏐</span>
                    <h1>Player not found</h1>
                    <p>This profile doesn't exist or may have been removed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="public-profile-page">
            {/* ── HEADER ────────────────────────────────── */}
            <div
                className="public-hero"
                style={{
                    backgroundImage: profilePicUrl ? `url(${profilePicUrl})` : 'none'
                }}
            >
                <div className="public-hero-overlay"></div>
                <div className="public-hero-inner">
                    <div className="public-hero-info">
                        <h1 className="public-name">{player.name}</h1>
                        <p className="public-position">{player.position}</p>
                        {player.nationality && (
                            <p className="public-nationality">{player.nationality}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="public-container">
                {/* ── PROFILE DETAILS (Matched to Dashboard) ──────── */}
                <div className="public-readonly-details">
                    <div className="public-readonly-stats-grid">
                        <div className="public-readonly-stat public-readonly-stat-wide">
                            <span className="public-readonly-stat-label">Name</span>
                            <span className="public-readonly-stat-value">{player.name || 'N/A'}</span>
                        </div>
                        <div className="public-readonly-stat">
                            <span className="public-readonly-stat-label">Position</span>
                            <span className="public-readonly-stat-value">{player.position || 'N/A'}</span>
                        </div>
                        <div className="public-readonly-stat">
                            <span className="public-readonly-stat-label">Birth Year</span>
                            <span className="public-readonly-stat-value">{player.birthYear || 'N/A'}</span>
                        </div>
                        <div className="public-readonly-stat">
                            <span className="public-readonly-stat-label">Height</span>
                            <span className="public-readonly-stat-value">{player.heightCm ? `${player.heightCm} cm` : 'N/A'}</span>
                        </div>
                        <div className="public-readonly-stat">
                            <span className="public-readonly-stat-label">Weight</span>
                            <span className="public-readonly-stat-value">{player.weightKg ? `${player.weightKg} kg` : 'N/A'}</span>
                        </div>
                        <div className="public-readonly-stat">
                            <span className="public-readonly-stat-label">Spike Reach</span>
                            <span className="public-readonly-stat-value">{player.attackReachCm ? `${player.attackReachCm} cm` : 'N/A'}</span>
                        </div>
                        <div className="public-readonly-stat">
                            <span className="public-readonly-stat-label">Block Reach</span>
                            <span className="public-readonly-stat-value">{player.blockReachCm ? `${player.blockReachCm} cm` : 'N/A'}</span>
                        </div>

                        {(player.currentTeamName || player.currentTeamCountry || player.currentTeam) && (
                            <div className="public-readonly-stat public-readonly-stat-wide">
                                <span className="public-readonly-stat-label">Current Team</span>
                                <span className="public-readonly-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {(() => {
                                        const country = player.currentTeamCountry;
                                        const imgUrl = country ? getNationalityFlagUrl(country, '32x24') : null;
                                        return (
                                            <>
                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 24, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                {player.currentTeamName || player.currentTeam || 'N/A'}
                                            </>
                                        );
                                    })()}
                                </span>
                            </div>
                        )}

                        {player.agency && (
                            <div className="public-readonly-stat public-readonly-stat-wide">
                                <span className="public-readonly-stat-label">Agency</span>
                                <span className="public-readonly-stat-value">{player.agency}</span>
                            </div>
                        )}

                        <div className="public-readonly-stat public-readonly-stat-wide">
                            <span className="public-readonly-stat-label">Nationality</span>
                            <span className="public-readonly-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {(() => {
                                    const imgUrl = getNationalityFlagUrl(player.nationality, '32x24');
                                    return imgUrl
                                        ? <><img src={imgUrl} alt="" style={{ width: 24, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} /> {player.nationality}</>
                                        : player.nationality || 'N/A';
                                })()}
                            </span>
                        </div>
                        <div className="public-readonly-stat public-readonly-stat-wide">
                            <span className="public-readonly-stat-label">Second Nationality</span>
                            <span className="public-readonly-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {(() => {
                                    if (!player.secondNationality) return 'N/A';
                                    const imgUrl = getNationalityFlagUrl(player.secondNationality, '32x24');
                                    return imgUrl
                                        ? <><img src={imgUrl} alt="" style={{ width: 24, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} /> {player.secondNationality}</>
                                        : player.secondNationality;
                                })()}
                            </span>
                        </div>
                    </div>

                    {(player.nativeLanguage || (player.otherLanguages && player.otherLanguages.length > 0)) && (
                        <div className="public-readonly-section">
                            <h3 className="public-readonly-section-title">Languages</h3>
                            <ul className="public-readonly-list">
                                {player.nativeLanguage && (() => {
                                    const imgUrl = getLanguageFlagUrl(player.nativeLanguage, '32x24');
                                    return (
                                        <li>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 22, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                <strong>{player.nativeLanguage}</strong>
                                            </span>
                                            <span className="public-readonly-list-sub">Native</span>
                                        </li>
                                    );
                                })()}
                                {(player.otherLanguages || []).map((item, index) => {
                                    const imgUrl = getLanguageFlagUrl(item.name, '32x24');
                                    return (
                                        <li key={index}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 22, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                <strong>{item.name}</strong>
                                            </span>
                                            <span className="public-readonly-list-sub">{item.level}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* ── CAREER HIGHLIGHTS ────────────────────── */}
                {player.achievements?.length > 0 && (
                    <section className="public-section">
                        <h2 className="public-section-title">🏆 Career Highlights</h2>
                        <ul className="public-list">
                            {[...player.achievements]
                                .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
                                .map((a, i) => (
                                    <li key={i} className="public-list-item">
                                        <span className="public-list-main">
                                            {a.year ? `${a.year} – ` : ''}<strong>{a.title}</strong>
                                        </span>
                                        {a.championship && <span className="public-list-sub">{a.championship}</span>}
                                    </li>
                                ))}
                        </ul>
                    </section>
                )}

                {/* ── INDIVIDUAL AWARDS ────────────────────── */}
                {player.individualAwards?.length > 0 && (
                    <section className="public-section">
                        <h2 className="public-section-title">🥇 Individual Awards</h2>
                        <ul className="public-list">
                            {[...player.individualAwards]
                                .sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0))
                                .map((a, i) => (
                                    <li key={i} className="public-list-item">
                                        <span className="public-list-main">
                                            {a.year ? `${a.year} – ` : ''}<strong>{a.title}</strong>
                                        </span>
                                        {a.championship && <span className="public-list-sub">{a.championship}</span>}
                                    </li>
                                ))}
                        </ul>
                    </section>
                )}

                {/* ── HIGHLIGHT VIDEOS ─────────────────────── */}
                {player.youtubeVideos?.length > 0 && (
                    <section className="public-section">
                        <h2 className="public-section-title">🎬 Highlight Videos</h2>
                        <div className="public-videos-grid">
                            {player.youtubeVideos.map((v, i) => {
                                const thumb = getYtThumbnail(v.url);
                                return (
                                    <button
                                        key={i}
                                        className="public-video-card"
                                        onClick={() => setVideoModal(v)}
                                        aria-label={v.title || `Video ${i + 1}`}
                                    >
                                        {thumb && <img src={thumb} alt={v.title || 'Video'} />}
                                        <div className="public-video-play">▶</div>
                                        {v.title && <p className="public-video-title">{v.title}</p>}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── DOCUMENTS ────────────────────────────── */}
                {player.documents?.length > 0 && (
                    <section className="public-section">
                        <h2 className="public-section-title">📄 Documents</h2>
                        <ul className="public-doc-list">
                            {player.documents.map((doc) => (
                                <li key={doc.id} className="public-doc-item">
                                    <span className="public-doc-icon">PDF</span>
                                    <span className="public-doc-name">{doc.filename}</span>
                                    <button
                                        className="public-doc-open-btn"
                                        onClick={() => openDocument(doc)}
                                    >
                                        Open ↗
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* ── WHATSAPP CONTACT ─────────────────────── */}
                {(player.whatsappNumber || player.agencyWhatsapp) && (
                    <section className="public-section">
                        {player.whatsappNumber && (
                            <a
                                href={`https://wa.me/${player.whatsappNumber.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="public-whatsapp-btn"
                                style={{ marginBottom: player.agencyWhatsapp ? '1rem' : '0' }}
                            >
                                <span>📱</span> Contact Player via WhatsApp
                            </a>
                        )}
                        {player.agencyWhatsapp && (
                            <a
                                href={`https://wa.me/${player.agencyWhatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="public-whatsapp-btn"
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <span>📞</span> Contact Agent via WhatsApp
                            </a>
                        )}
                    </section>
                )}

                {/* ── SHARE + QR ───────────────────────────── */}
                <section className="public-section public-share-section">
                    <button onClick={handleShare} className="public-share-btn">
                        {shareCopied ? '✅ Link Copied!' : '🔗 Share Profile'}
                    </button>

                    <div className="public-qr-block">
                        <p className="public-qr-label">Scan to open this profile</p>
                        <div className="public-qr-wrapper">
                            <QRCodeSVG
                                value={profileUrl}
                                size={140}
                                bgColor="transparent"
                                fgColor="#e0e7ff"
                                level="M"
                            />
                        </div>
                        <p className="public-qr-url">{profileUrl}</p>
                    </div>
                </section>

                {/* ── FOOTER INFO ──────────────────────────── */}
                {player.updatedAt && (
                    <div className="public-footer-info">
                        <p className="public-updated-bottom">Profile last updated on {formatDate(player.updatedAt)}</p>
                    </div>
                )}
            </div>

            {/* ── MODALS ───────────────────────────────── */}
            {pdfModal && (
                <PDFModal
                    url={pdfModal.url}
                    filename={pdfModal.filename}
                    onClose={() => setPdfModal(null)}
                />
            )}
            {videoModal && (
                <VideoModal
                    video={videoModal}
                    onClose={() => setVideoModal(null)}
                />
            )}
        </div>
    );
}
