import React, { useState, useRef } from 'react';
import { useProfile } from '../../context/ProfileContext';
import './DocumentUpload.css';

export default function DocumentUpload({ documents, readOnly = false }) {
    const { uploadDocument, deleteDocument, openDocument } = useProfile();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [viewerUrl, setViewerUrl] = useState(null);
    const fileInputRef = useRef(null);

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

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Front-end sanity checks
        setError('');

        if (file.type !== 'application/pdf') {
            setError('Por favor, selecione apenas arquivos PDF.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Arquivo muito grande. O limite máximo é de 5MB.');
            return;
        }

        if (documents.length >= 10) {
            setError('Você já atingiu o limite de 10 documentos.');
            return;
        }

        // Proceed to upload
        setUploading(true);
        const result = await uploadDocument(file);
        setUploading(false);

        if (!result.success) {
            setError(result.error || 'Falha ao enviar o documento.');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este documento?')) return;

        setError('');
        const result = await deleteDocument(id);
        if (!result.success) {
            setError(result.error || 'Falha ao excluir o documento.');
        }
    };

    return (
        <div className="document-upload-manager">
            {error && <div className="alert alert-error">{error}</div>}

            {!readOnly && (
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        disabled={uploading || documents.length >= 10}
                        style={{ display: 'none' }}
                        id="pdf-upload"
                    />

                    <label
                        htmlFor="pdf-upload"
                        style={{
                            width: '100%',
                            padding: '0.9rem',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                            border: '1px dashed rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            color: uploading || documents.length >= 10 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            cursor: uploading || documents.length >= 10 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            letterSpacing: '0.3px',
                            opacity: uploading || documents.length >= 10 ? 0.5 : 1,
                            boxSizing: 'border-box',
                        }}
                        onMouseOver={(e) => {
                            if (!(uploading || documents.length >= 10)) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                                e.currentTarget.style.color = '#fff';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.color = uploading || documents.length >= 10 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>＋</span>
                        {uploading ? 'Enviando...' : `Adicionar PDF (${documents.length}/10)`}
                    </label>
                </div>
            )}

            {documents.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {documents.map((doc) => (
                        <li
                            key={doc.id}
                            onClick={() => handleOpenViewer(doc.id)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '1.25rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease',
                                textAlign: 'center',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* PDF Icon Badge */}
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', letterSpacing: '-0.5px' }}>PDF</span>
                            </div>

                            {/* Title */}
                            <span style={{
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                color: '#fff',
                                wordBreak: 'break-word',
                                lineHeight: 1.4,
                            }}>
                                {doc.filename}
                            </span>

                            {/* Date */}
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                                Enviado em {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                            </span>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenViewer(doc.id);
                                    }}
                                    style={{
                                        padding: '0.4rem 1.25rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: '#fff',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    }}
                                >
                                    Abrir ↗
                                </button>
                                {!readOnly && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(doc.id);
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'rgba(239, 68, 68, 0.7)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 500,
                                            padding: '0.4rem 0.5rem',
                                            borderRadius: '6px',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.color = '#ef4444';
                                            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)';
                                            e.currentTarget.style.background = 'none';
                                        }}
                                        title="Excluir arquivo"
                                    >
                                        Excluir
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

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
