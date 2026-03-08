import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';

export default function ProfilePictureUpload({ readOnly = false }) {
    const { profile, uploadProfilePicture, getProfilePictureUrl } = useProfile();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const loadPicture = async () => {
            if (profile?.hasProfilePicture) {
                const url = await getProfilePictureUrl();
                if (mounted && url) {
                    setPreviewUrl(url);
                }
            }
        };
        loadPicture();
        return () => {
            mounted = false;
        };
    }, [profile?.hasProfilePicture, profile?.profilePictureUpdatedAt, getProfilePictureUrl]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Formato inválido. Use JPEG, PNG ou WEBP.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Arquivo muito grande. Limite de 5MB.');
            return;
        }

        setUploading(true);
        const result = await uploadProfilePicture(file);
        setUploading(false);

        if (!result.success) {
            setError(result.error || 'Falha ao enviar a foto.');
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="profile-picture-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            {error && <div className="alert alert-error" style={{ width: '100%' }}>{error}</div>}

            <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    <span style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)' }}>👤</span>
                )}
                {uploading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '0.8rem'
                    }}>
                        Enviando...
                    </div>
                )}
            </div>

            {!readOnly && (
                <div>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="profile-pic-upload"
                    />
                    <label
                        htmlFor="profile-pic-upload"
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '20px',
                            color: uploading ? 'rgba(255,255,255,0.5)' : '#fff',
                            fontSize: '0.85rem',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-block'
                        }}
                        onMouseOver={(e) => {
                            if (!uploading) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!uploading) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                            }
                        }}
                    >
                        {previewUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                    </label>
                </div>
            )}
        </div>
    );
}
