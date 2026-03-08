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

    // We use a cloud URL for sharing, since users expect to copy the live public link even when testing/saving.
    const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'https://players-on.pages.dev';
    const publicProfileUrl = profileSlug ? `${FRONTEND_URL}/p/${profileSlug}` : null;

    useEffect(() => {
        let mounted = true;
        const loadPic = async () => {
            if (profile?.hasProfilePicture) {
                const url = await getProfilePictureUrl();
                if (mounted && url) {
                    setProfilePicUrl(url);
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
                setAnalytics(data.data?.analytics || null);
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
            setError(result.error || 'Falha ao carregar o documento.');
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
            alert('Não foi possível forçar a rotação no seu dispositivo. Use o scroll horizontal nativo da visualização caso esteja no celular.');
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
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
                            <strong>Login suspeito detectado</strong>
                            <ul>
                                {suspiciousLogin.reasons.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                ))}
                            </ul>
                            <p className="suspicious-hint">
                                Se não foi você, altere sua senha imediatamente.
                            </p>
                        </div>
                        <button
                            className="suspicious-dismiss"
                            onClick={dismissSuspiciousLogin}
                            aria-label="Fechar alerta"
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
                            Sair
                        </button>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <nav className="dashboard-tabs">
                    <button
                        className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        Visão Geral
                    </button>
                    <button
                        className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        Perfil
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
                                            Membro desde {formatDate(user.createdAt)}
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
                                <h2>Meu Perfil Atlético</h2>
                                <button
                                    className="edit-profile-btn"
                                    onClick={() => navigate('/profile')}
                                    title="Editar Perfil"
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
                                    <p>Editar</p>
                                </button>
                            </div>

                            {(profileLoading && !profile) ? (
                                <div className="loading-state">
                                    <div className="auth-loading-spinner" />
                                    <p>Carregando perfil...</p>
                                </div>
                            ) : !profile || Object.keys(profile).length === 0 ? (
                                <div className="empty-state">
                                    <p>Você ainda não configurou seu perfil atlético.</p>
                                    <button className="btn-create-profile" onClick={() => navigate('/profile')}>
                                        Criar Perfil
                                    </button>
                                </div>
                            ) : (
                                <div className="profile-readonly-details">
                                    <div className="readonly-stats-grid">
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">Nome</span>
                                            <span className="readonly-stat-value">{profile.name || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Posição</span>
                                            <span className="readonly-stat-value">{profile.position || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Ano Nascimento</span>
                                            <span className="readonly-stat-value">{profile.birthYear || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Altura</span>
                                            <span className="readonly-stat-value">{profile.heightCm ? `${profile.heightCm} cm` : 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Peso</span>
                                            <span className="readonly-stat-value">{profile.weightKg ? `${profile.weightKg} kg` : 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Alcance Ataque</span>
                                            <span className="readonly-stat-value">{profile.attackReachCm ? `${profile.attackReachCm} cm` : 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Alcance Bloqueio</span>
                                            <span className="readonly-stat-value">{profile.blockReachCm ? `${profile.blockReachCm} cm` : 'N/A'}</span>
                                        </div>

                                        {(profile.currentTeamName || profile.currentTeamCountry || profile.currentTeam) && (
                                            <div className="readonly-stat readonly-stat-wide">
                                                <span className="readonly-stat-label">Time Atual</span>
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
                                            <span className="readonly-stat-label">Nacionalidade</span>
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
                                            <span className="readonly-stat-label">Segunda Nacionalidade</span>
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
                                            <span className="readonly-stat-label">Idioma Nativo</span>
                                            <span className="readonly-stat-value">{profile.nativeLanguage || 'N/A'}</span>
                                        </div>
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">WhatsApp</span>
                                            <span className="readonly-stat-value">{profile.whatsappNumber || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {(profile.nativeLanguage || (profile.otherLanguages && profile.otherLanguages.length > 0)) && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Idiomas</h3>
                                            <ul className="readonly-list">
                                                {profile.nativeLanguage && (() => {
                                                    const imgUrl = getLanguageFlagUrl(profile.nativeLanguage, '32x24');
                                                    return (
                                                        <li>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                {imgUrl && <img src={imgUrl} alt="" style={{ width: 22, height: 'auto', borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />}
                                                                <strong>{profile.nativeLanguage}</strong>
                                                            </span>
                                                            <span className="readonly-list-sub">Nativo</span>
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
                                            <h3 className="readonly-section-title">Documentos ({profile.documents.length})</h3>
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
                                                                    {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
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
                                                                            Abrir ↗
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
                                            <h3 className="readonly-section-title">Conquistas</h3>
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
                                            <h3 className="readonly-section-title">Premiações Individuais</h3>
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
                                <h2>Analytics do Perfil</h2>
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
                                        Seu Link Público
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
                                                {analyticsCopied ? '✅ Copiado' : '📋 Copiar'}
                                            </button>
                                            <button
                                                onClick={() => window.open(publicProfileUrl, '_blank')}
                                                style={{
                                                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                                    color: '#fff', padding: '0.35rem 0.8rem', borderRadius: '8px',
                                                    cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit',
                                                }}
                                            >
                                                Abrir ↗
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state" style={{ marginBottom: '1rem' }}>
                                    <p>Salve seu perfil primeiro para gerar seu link público.</p>
                                </div>
                            )}

                            {analyticsLoading ? (
                                <div className="loading-state">
                                    <div className="auth-loading-spinner" />
                                    <p>Carregando analytics...</p>
                                </div>
                            ) : !analytics ? (
                                <div className="empty-state">
                                    <p>Nenhum dado disponível ainda. Compartilhe seu perfil público para começar a rastrear visitas.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div className="readonly-stats-grid">
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Total Visitas</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.totalViews ?? 0}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Visitantes Únicos</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.uniqueVisitors ?? 0}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Últimos 7 dias</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.last7DaysViews ?? 0}</span>
                                        </div>
                                        <div className="readonly-stat">
                                            <span className="readonly-stat-label">Últimos 30 dias</span>
                                            <span className="readonly-stat-value" style={{ fontSize: '1.5rem' }}>{analytics.last30DaysViews ?? 0}</span>
                                        </div>
                                    </div>

                                    {analytics.topCities?.length > 0 && (
                                        <div className="readonly-section">
                                            <h3 className="readonly-section-title">Top Cidades</h3>
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
                                            <h3 className="readonly-section-title">Top Países</h3>
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
                                    🔄 Atualizar
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
                            Visualizando Documento
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
                                ⛶ Paisagem
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
                                ✕ Fechar
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
                            title="Documento PDF"
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
