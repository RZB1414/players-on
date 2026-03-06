import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import '../styles/Dashboard.css';

export default function DashboardPage() {
    const {
        user,
        logout,
        suspiciousLogin,
        dismissSuspiciousLogin,
    } = useAuth();

    const navigate = useNavigate();
    const { profile, loading: profileLoading, openDocument } = useProfile();
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedDocId, setExpandedDocId] = useState(null);
    const [viewerUrl, setViewerUrl] = useState(null);
    const [error, setError] = useState('');

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
                </nav>

                {/* Tab Content */}
                <main className="dashboard-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="dashboard-overview">
                            <div className="profile-card">
                                <div className="profile-avatar">
                                    {user.name.charAt(0).toUpperCase()}
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
                                    <button className="btn-primary" onClick={() => navigate('/profile')} style={{ marginTop: '1rem' }}>
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
                                        <div className="readonly-stat readonly-stat-wide">
                                            <span className="readonly-stat-label">WhatsApp</span>
                                            <span className="readonly-stat-value">{profile.whatsappNumber || 'N/A'}</span>
                                        </div>
                                    </div>

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
