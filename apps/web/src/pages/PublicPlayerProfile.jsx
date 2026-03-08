import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import PDFModal from '../components/PDFModal';
import VideoModal from '../components/VideoModal';
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

    const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://players-on.pages.dev';
    const profileUrl = `${FRONTEND_URL}/p/${slug}`;

    useEffect(() => {
        setLoading(true);
        fetch(`${API_BASE}/api/public/player/${encodeURIComponent(slug)}`)
            .then(res => {
                if (res.status === 404 || res.status === 400) {
                    throw new Error('Player not found');
                }
                if (!res.ok) {
                    throw new Error('Failed to load profile. Please check your connection.');
                }
                return res.json();
            })
            .then(data => {
                setPlayer(data.data?.player || null);
                setLoading(false);
            })
            .catch(err => {
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
        if (!player?.hasProfilePicture) return;
        // Profile picture proxied by slug
        setProfilePicUrl(`${API_BASE}/api/public/player/${encodeURIComponent(slug)}/profile-picture`);
    }, [player?.hasProfilePicture, slug]);

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
            <div className="public-hero">
                <div className="public-hero-inner">
                    {/* Avatar */}
                    <div className="public-avatar">
                        {profilePicUrl ? (
                            <img src={profilePicUrl} alt={player.name} />
                        ) : (
                            <span>{player.name?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>

                    <div className="public-hero-info">
                        <h1 className="public-name">{player.name}</h1>
                        <p className="public-position">{player.position}</p>
                        {player.nationality && (
                            <p className="public-nationality">{player.nationality}</p>
                        )}
                        {player.currentTeam && (
                            <p className="public-team">🏟️ {player.currentTeam}</p>
                        )}
                        {player.updatedAt && (
                            <p className="public-updated">Updated {formatDate(player.updatedAt)}</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="public-container">
                {/* ── STATS GRID ───────────────────────────── */}
                <section className="public-section">
                    <div className="public-stats-grid">
                        {player.heightCm && (
                            <div className="public-stat-card">
                                <span className="public-stat-label">Height</span>
                                <span className="public-stat-value">{player.heightCm} <small>cm</small></span>
                            </div>
                        )}
                        {player.weightKg && (
                            <div className="public-stat-card">
                                <span className="public-stat-label">Weight</span>
                                <span className="public-stat-value">{player.weightKg} <small>kg</small></span>
                            </div>
                        )}
                        {player.attackReachCm && (
                            <div className="public-stat-card">
                                <span className="public-stat-label">Attack Reach</span>
                                <span className="public-stat-value">{player.attackReachCm} <small>cm</small></span>
                            </div>
                        )}
                        {player.blockReachCm && (
                            <div className="public-stat-card">
                                <span className="public-stat-label">Block Reach</span>
                                <span className="public-stat-value">{player.blockReachCm} <small>cm</small></span>
                            </div>
                        )}
                        {player.birthYear && (
                            <div className="public-stat-card">
                                <span className="public-stat-label">Birth Year</span>
                                <span className="public-stat-value">{player.birthYear}</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── CAREER HIGHLIGHTS ────────────────────── */}
                {player.achievements?.length > 0 && (
                    <section className="public-section">
                        <h2 className="public-section-title">🏆 Career Highlights</h2>
                        <ul className="public-list">
                            {player.achievements.map((a, i) => (
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
                            {player.individualAwards.map((a, i) => (
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
                {player.whatsappNumber && (
                    <section className="public-section">
                        <a
                            href={`https://wa.me/${player.whatsappNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="public-whatsapp-btn"
                        >
                            <span>📱</span> Contact Player via WhatsApp
                        </a>
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
