import { useEffect, useRef } from 'react';

// Extract YouTube video ID from various URL formats
function extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
}

export default function VideoModal({ video, onClose }) {
    const overlayRef = useRef(null);
    const videoId = video?.url ? extractVideoId(video.url) : null;

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleBackdrop = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleBackdrop}
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(0,0,0,0.96)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5', padding: '0.4rem 1rem', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', zIndex: 1,
                }}
            >
                ✕ Close
            </button>

            {/* Title */}
            {video?.title && (
                <p style={{
                    color: 'rgba(255,255,255,0.7)', marginBottom: '1rem',
                    fontSize: '0.95rem', textAlign: 'center', padding: '0 2rem',
                    position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: 'calc(100% - 8rem)',
                }}>
                    {video.title}
                </p>
            )}

            {/* Embedded player */}
            {videoId ? (
                <div style={{
                    width: '100%', maxWidth: '900px', padding: '0 1rem',
                    aspectRatio: '16/9',
                }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title={video?.title || 'Video'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '100%', border: 'none', borderRadius: '12px' }}
                    />
                </div>
            ) : (
                <p style={{ color: '#fca5a5' }}>Invalid YouTube URL</p>
            )}
        </div>
    );
}
