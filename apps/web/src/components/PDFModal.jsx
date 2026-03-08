import { useEffect, useRef } from 'react';

export default function PDFModal({ url, filename, onClose }) {
    const overlayRef = useRef(null);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    // Close on backdrop click
    const handleBackdrop = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdrop}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.95)',
                display: 'flex', flexDirection: 'column',
            }}
        >
            {/* Toolbar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.6rem 1rem', background: '#111',
                borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
            }}>
                <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', opacity: 0.85 }}>
                    📄 {filename || 'Document'}
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5', padding: '0.35rem 0.9rem', borderRadius: '8px',
                        cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                    }}
                >
                    ✕ Close
                </button>
            </div>
            {/* PDF Iframe */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <iframe
                    src={url}
                    title={filename || 'Document'}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
            </div>
        </div>
    );
}
