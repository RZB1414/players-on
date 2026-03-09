import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { COUNTRIES, getNationalityFlagUrl, getLanguageFlagUrl } from '../components/profile/CountrySearch';
import '../styles/Dashboard.css';

export default function DashboardPage() {
    const {
        user,
        logout,
        suspiciousLogin,
        dismissSuspiciousLogin,
    } = useAuth();

    const navigate = useNavigate();
    const { profile, loading: profileLoading, openDocument, getProfilePictureUrl } = useProfile();
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedDocId, setExpandedDocId] = useState(null);
    const [viewerUrl, setViewerUrl] = useState(null);
    const [error, setError] = useState('');
    const [profilePicUrl, setProfilePicUrl] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsCopied, setAnalyticsCopied] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL || 'https://players-on-api.volleyplusapp.workers.dev';
    const profileSlug = profile?.slug;
    const analyticsSlug = analytics?.slug;
    const publicSlug = analyticsSlug || profileSlug;

    const DEFAULT_PUBLIC_FRONTEND_URL = 'https://players-on.pages.dev';
    const browserOrigin = window.location.origin?.trim();

    // Open/copy must target the active app environment where the athlete data exists.
    let FRONTEND_URL_RAW = browserOrigin || DEFAULT_PUBLIC_FRONTEND_URL;

    if (!FRONTEND_URL_RAW.startsWith('http')) {
        FRONTEND_URL_RAW = `https://${FRONTEND_URL_RAW}`;
    }
    const FRONTEND_URL = FRONTEND_URL_RAW.endsWith('/') ? FRONTEND_URL_RAW.slice(0, -1) : FRONTEND_URL_RAW;
    const publicProfileUrl = publicSlug ? `${FRONTEND_URL}/p/${publicSlug}` : null;

    useEffect(() => {
        let mounted = true;
        const loadPic = async () => {
            if (profile?.hasProfilePicture) {
                const url = await getProfilePictureUrl();
                if (mounted && url) {
                    setProfilePicUrl(url);
                }
            } else {
                if (mounted) {
                    setProfilePicUrl(null);
                }
            }
        };
        loadPic();
        return () => { mounted = false; };
    }, [profile?.hasProfilePicture, profile?.profilePictureUpdatedAt, getProfilePictureUrl]);

    // Fetch analytics when Analytics tab is opened
    useEffect(() => {
        if (activeTab !== 'analytics' || analytics !== null) return;
        setAnalyticsLoading(true);
        fetch(`${API_BASE}/api/player/profile-analytics`, {
            credentials: 'include',
        })
            .then(r => r.json())
            .then(data => {
                const analyticsData = data.data?.analytics || {};
                const slugFromAnalytics = data.data?.slug || null;
                setAnalytics({ ...analyticsData, slug: slugFromAnalytics });
                setAnalyticsLoading(false);
            })
            .catch(() => setAnalyticsLoading(false));
    }, [activeTab, analytics, API_BASE]);

    const handleLogout = async () => {
        await logout();
    };

    const handleOpenViewer = async (id) => {
        const result = await openDocument(id);
        if (result.success && result.url) {
            setViewerUrl(result.url);
            // Auto-enter fullscreen after React renders the overlay
            setTimeout(() => {
                const viewerRoot = document.getElementById('pdf-viewer-root');
                if (viewerRoot && viewerRoot.requestFullscreen && !document.fullscreenElement) {
                    viewerRoot.requestFullscreen().catch(() => { });
                }
            }, 100);
        } else {
            setError(result.error || 'Failed to load document.');
        }
    };

    const closeViewer = () => {
        if (viewerUrl) {
            window.URL.revokeObjectURL(viewerUrl);
            setViewerUrl(null);

            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            } catch (e) { }

            try {
                if (window.screen?.orientation?.unlock) {
                    window.screen.orientation.unlock();
                }
            } catch (e) { }
        }
    };

    const handleLandscape = async () => {
        try {
            const viewerRoot = document.getElementById('pdf-viewer-root');
            if (viewerRoot && viewerRoot.requestFullscreen && !document.fullscreenElement) {
                await viewerRoot.requestFullscreen();
            }
            if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
                await window.screen.orientation.lock('landscape');
            }
        } catch (err) {
            console.error(err);
            alert('Could not force rotation on your device. Use native horizontal scrolling if you are on mobile.');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    if (!user) return null;

    return (
        <div className="dashboard-page">
            {error && (
                <div style={{
                    background: '#ef4444',
                    color: 'white',
                    padding: '0.75rem',
                    textAlign: 'center',
                    fontSize: '0.9rem'
                }}>
                    {error}
                </div>
            )}
            {/* Suspicious Login Banner */}
            {suspiciousLogin?.isSuspicious && (
                <div className="suspicious-banner">
                    <div className="suspicious-banner-content">
                        <span className="suspicious-icon">🛡️</span>
                        <div>
                            <strong>Suspicious login detected</strong>
                            <ul>
                                {suspiciousLogin.reasons.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                ))}
                            </ul>
                            <p className="suspicious-hint">
                                If this wasn't you, change your password immediately.
                            </p>
                        </div>
                        <button
                            className="suspicious-dismiss"
                            onClick={dismissSuspiciousLogin}
                            aria-label="Close alert"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="dashboard-header-left">
                        <span className="dashboard-logo-icon">⚡</span>
                        <h1>Players On</h1>
                    </div>
                    <div className="dashboard-header-right">
                        <span className="dashboard-user-name">{user.name}</span>
                        <button onClick={handleLogout} className="dashboard-logout-btn">
                            Sign Out
                        </button>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="dashboard-tabs">
                    <button
                        className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Profile
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Analytics
                    </button>
                </nav>

                {/* Tab Content */}
                <main className="dashboard-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="dashboard-overview">
                            <div className="profile-card">
                                <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                                    {profilePicUrl ? (
                                        <img src={profilePicUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="profile-info">
                                    <h2>{user.name}</h2>
                                    <p className="profile-email">{user.email}</p>
                                    <div className="profile-meta">
                                        <span className="profile-badge">{user.role}</span>
                                        <span className="profile-date">
                                            Member since {formatDate(user.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="dashboard-profile">
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h2>My Athletic Profile</h2>
                                <button
                                    className="edit-profile-btn"
                                    onClick={() => navigate('/profile')}
                                    title="Edit Profile"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                                        e.currentTarget.style.borderColor = '#fff';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                                    }}
                                >
                                    <p>Edit</p>
                                </button>
                            </div>

                            {(profileLoading && !profile) ? (
                                <div className="loading-state">
                                    <div className="auth-loading-spinner" />
                                    <p>Loading profile...</p>
                                </div>
                            ) : !profile || Object.keys(profile).length === 0 ? (
                                <div className="empty-state">
                                    <p>You haven't set up your athletic profile yet.</p>
                                    <button className="btn-create-profile" onClick={() => navigate('/profile')}>
                                        Create Profile
                                    </button>
                                </div>
                            ) : (
                                <div className="profile-readonly-details">
                                    <div className="readonly-stats-grid">
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Name</span>
                                            <span className="readonly-stat-value">{profile.name || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Position</span>
                                            <span className="readonly-stat-value">{profile.position || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Birth Year</span>
                                            <span className="readonly-stat-value">{profile.birthYear || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Height</span>
                                            <span className="readonly-stat-value">{profile.heightCm ? `${profile.heightCm} cm` : 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Weight</span>
                                            <span className="readonly-stat-value">{profile.weightKg ? `${profile.weightKg} kg` : 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Spike Reach</span>
                                            <span className="readonly-stat-value">{profile.attackReachCm ? `${profile.attackReachCm} cm` : 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Block Reach</span>
                                            <span className="readonly-stat-value">{profile.blockReachCm ? `${profile.blockReachCm} cm` : 'N/A'}</span>
                                        </div>

                                        {(profile.currentTeamName || profile.currentTeamCountry || profile.currentTeam) && (
                                            <div className="readonly-stat readonly-stat-wide">
                                                <span className="readonly-stat-label">Current Team</span>
                                                <span className="readonly-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {(() => {
                                                        const country = profile.currentTeamCountry;
                                                        const imgUrl = country ? getNationalityFlagUrl(country, '32x24') : null;
                                                        return (
                                                            <>
                                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 24, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                                {profile.currentTeamName || profile.currentTeam || 'N/A'}
                                                            </>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                        )}

                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Nationality</span>
                                            <span className="readonly-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {(() => {
                                                    const imgUrl = getNationalityFlagUrl(profile.nationality, '32x24');
                                                    return imgUrl
                                                        ? <><img src={imgUrl} alt="" style={{ width: 24, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} /> {profile.nationality}</>
                                                        : profile.nationality || 'N/A';
                                                })()}
                                            </span>
                                        </div>
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Second Nationality</span>
                                            <span className="readonly-stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {(() => {
                                                    if (!profile.secondNationality) return 'N/A';
                                                    const imgUrl = getNationalityFlagUrl(profile.secondNationality, '32x24');
                                                    return imgUrl
                                                        ? <><img src={imgUrl} alt="" style={{ width: 24, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} /> {profile.secondNationality}</>
                                                        : profile.secondNationality;
                                                })()}
                                            </span>
                                        </div>
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Native Language</span>
                                            <span className="readonly-stat-value">{profile.nativeLanguage || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">WhatsApp</span>
                                            <span className="readonly-stat-value">{profile.whatsappNumber || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Agency</span>
                                            <span className="readonly-stat-value">{profile.agency || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Agency Contact WhatsApp</span>
                                            <span className="readonly-stat-value">{profile.agencyWhatsapp || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {(profile.nativeLanguage || (profile.otherLanguages && profile.otherLanguages.length > 0)) && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Languages</h3>
                                            <ul className="readonly-list">
                                                {profile.nativeLanguage && (() => {
                                                    const imgUrl = getLanguageFlagUrl(profile.nativeLanguage, '32x24');
                                                    return (
                                                        <li>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 22, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                                <strong>{profile.nativeLanguage}</strong>
                                                            </span>
                                                            <span className="readonly-list-sub">Native</span>
                                                        </li>
                                                    );
                                                })()}
                                                {(profile.otherLanguages || []).map((item, index) => {
                                                    const imgUrl = getLanguageFlagUrl(item.name, '32x24');
                                                    return (
                                                        <li key={index}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 22, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                                <strong>{item.name}</strong>
                                                            </span>
                                                            <span className="readonly-list-sub">{item.level}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {profile.documents && profile.documents.length > 0 && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Documents ({profile.documents.length})</h3>
                                            <ul className="readonly-doc-list">
                                                {profile.documents.map((doc) => {
                                                    const isExpanded = expandedDocId === doc.id;
                                                    return (
                                                        <li key={doc.id} className={`readonly-doc-item ${isExpanded ? 'expanded' : ''}`}>
                                                            <div
                                                                className="readonly-doc-row"
                                                                onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                                                            >
                                                                <span className="readonly-doc-icon">PDF</span>
                                                                <span className="readonly-doc-name">{doc.filename}</span>
                                                                <span className="readonly-doc-date">
                                                                    {new Date(doc.uploadedAt).toLocaleDateString('en-US')}
                                                                </span>
                                                            </div>
                                                            {isExpanded && (
                                                                <div className="readonly-doc-expanded">
                                                                    <span className="readonly-doc-fullname">{doc.filename}</span>
                                                                    <div className="readonly-doc-actions">
                                                                        <button
                                                                            className="readonly-doc-open-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleOpenViewer(doc.id);
                                                                            }}
                                                                        >
                                                                            Open ↗
                                                                        </button>
                                                                        <button
                                                                            className="readonly-doc-close-btn"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setExpandedDocId(null);
                                                                            }}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {profile.achievements && profile.achievements.length > 0 && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Achievements</h3>
                                            <ul className="readonly-list">
                                                {profile.achievements.map((item, index) => (
                                                    <li key={index}>
                                                        <span>
                                                            {item.year ? `${item.year} – ` : ''}
                                                            <strong>{item.title}</strong>
                                                        </span>
                                                        {item.championship && (
                                                            <span className="readonly-list-sub">{item.championship}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {profile.individualAwards && profile.individualAwards.length > 0 && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Individual Awards</h3>
                                            <ul className="readonly-list">
                                                {profile.individualAwards.map((item, index) => (
                                                    <li key={index}>
                                                        <span>
                                                            {item.year ? `${item.year} – ` : ''}
                                                            <strong>{item.title}</strong>
                                                        </span>
                                                        {item.championship && (
                                                            <span className="readonly-list-sub">{item.championship}</span>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="dashboard-profile">
                            <div className="section-header" style={{ marginBottom: '1.5rem' }}>
                                <h2>Profile Analytics</h2>
                            </div>

                            {/* Public Profile URL Card */}
                            {publicProfileUrl ? (
                                <div style={{
                                    background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                                    borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
                                    display: 'flex', flexDirection: 'column', gap: '0.6rem',
                                }}>
                                    <span style={{
                                        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                                        letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)'
                                    }}>
                                        Your Public Link
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={{
                                            flex: 1, fontSize: '0.88rem', color: '#a5b4fc',
                                            wordBreak: 'break-all', fontFamily: 'monospace'
                                        }}>
                                            {publicProfileUrl}
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                                            <button
                                                onClick={async () => {
                                                    try { await navigator.clipboard.writeText(publicProfileUrl); } catch { }
                                                    setAnalyticsCopied(true);
                                                    setTimeout(() => setAnalyticsCopied(false), 2500);
                                                }}
                                                style={{
                                                    background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.25)',
                                                    color: '#a5b4fc', padding: '0.35rem 0.8rem', borderRadius: '8px',
                                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                                                }}
                                            >
                                                {analyticsCopied ? '✅ Copied' : '📋 Copy'}
                                            </button>
                                            <button
                                                onClick={() => window.open(publicProfileUrl, '_blank')}
                                                style={{
                                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                                    color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '8px',
                                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                                                }}
                                            >
                                                Open ↗
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ marginBottom: '1rem' }}>
                                    <p>Save your profile first to generate your public link.</p>
                                </div>
                            )}

                            {analyticsLoading ? (
                                <div className="loading-state">
                                    <div className="auth-loading-spinner" />
                                    <p>Loading analytics...</p>
                                </div>
                            ) : !analytics || !analyticsSlug ? (
                                <div className="empty-state">
                                    <p>No data available yet. Share your public profile to start tracking visits.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="readonly-stats-grid">
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Total Views</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.totalViews ?? 0}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Unique Visitors</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.uniqueVisitors ?? 0}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Last 7 days</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.last7DaysViews ?? 0}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Last 30 days</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.last30DaysViews ?? 0}</span>
                                        </div>
                                    </div>

                                    {analytics.topCities?.length > 0 && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Top Cities</h3>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {analytics.topCities.map((c, i) => (
                                                    <li key={i} style={{
                                                        display: 'flex', justifyContent: 'space-between',
                                                        padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)'
                                                    }}>
                                                        <span>{c.city || 'Unknown'}{c.country ? ` · ${c.country}` : ''}</span>
                                                        <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{c.views}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {analytics.topCountries?.length > 0 && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Top Countries</h3>
                                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                {analytics.topCountries.map((c, i) => (
                                                    <li key={i} style={{
                                                        display: 'flex', justifyContent: 'space-between',
                                                        padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                        fontSize: '0.88rem', color: 'rgba(255,255,255,0.8)'
                                                    }}>
                                                        <span>{c.country || 'Unknown'}</span>
                                                        <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{c.views}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {analytics && (
                                <button
                                    className="refresh-btn"
                                    style={{ marginTop: '1.5rem' }}
                                    onClick={() => setAnalytics(null)}
                                >
                                    🔄 Refresh
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Viewer Overlay */}
            {viewerUrl && (
                <div
                    id="pdf-viewer-root"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        background: '#000',
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 1rem',
                            background: '#111',
                            borderBottom: '1px solid rgba(255,255,255,0.15)',
                            flexShrink: 0,
                        }}
                    >
                        <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                            Viewing Document
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={handleLandscape}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: '#fff',
                                    background: 'rgba(255,255,255,0.1)',
                                }}
                            >
                                ⛶ Landscape
                            </button>
                            <button
                                type="button"
                                onClick={closeViewer}
                                style={{
                                    padding: '0.4rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    border: '1px solid rgba(255,80,80,0.5)',
                                    color: '#ff6b6b',
                                    background: 'rgba(255,80,80,0.1)',
                                }}
                            >
                                ✕ Close
                            </button>
                        </div>
                    </div>
                    <div
                        style={{
                            flex: 1,
                            minHeight: 0,
                            overflow: 'auto',
                            WebkitOverflowScrolling: 'touch',
                        }}
                    >
                        <iframe
                            src={viewerUrl}
                            title="PDF Document"
                            style={{
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                border: 'none',
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}