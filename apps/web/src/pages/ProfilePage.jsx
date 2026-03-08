import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import DynamicList from '../components/profile/DynamicList';
import LanguageList from '../components/profile/LanguageList';
import DocumentUpload from '../components/profile/DocumentUpload';
import ProfilePictureUpload from '../components/profile/ProfilePictureUpload';
import '../styles/Dashboard.css';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { profile, loading, saveProfile, refreshProfile, error } = useProfile();
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        position: '',
        heightCm: '',
        weightKg: '',
        attackReachCm: '',
        blockReachCm: '',
        birthYear: '',
        whatsappNumber: '',
        nationality: '',
        secondNationality: '',
        nativeLanguage: '',
        otherLanguages: [],
        currentTeam: '',
        currentTeamCountry: '',
        achievements: [],
        individualAwards: []
    });

    // Sync formData when profile loads or updates
    useEffect(() => {
        if (profile && Object.keys(profile).length > 0) {
            setFormData({
                name: profile.name || '',
                position: profile.position || '',
                heightCm: profile.heightCm || '',
                weightKg: profile.weightKg || '',
                attackReachCm: profile.attackReachCm || '',
                blockReachCm: profile.blockReachCm || '',
                birthYear: profile.birthYear || '',
                whatsappNumber: profile.whatsappNumber || '',
                nationality: profile.nationality || '',
                secondNationality: profile.secondNationality || '',
                nativeLanguage: profile.nativeLanguage || '',
                otherLanguages: profile.otherLanguages || [],
                currentTeam: profile.currentTeam || '',
                currentTeamCountry: profile.currentTeamCountry || '',
                achievements: profile.achievements || [],
                individualAwards: profile.individualAwards || [],
            });
        }
    }, [profile]);

    const handleSave = async () => {
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');
        const result = await saveProfile(formData);
        setSubmitting(false);

        if (result.success) {
            await refreshProfile();
            navigate('/dashboard');
        } else {
            setSubmitError(result.error);
        }
    };

    if (loading && !profile) {
        return <div className="profile-loading">Carregando perfil...</div>;
    }

    return (
        <div className="profile-page">
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="dashboard-header-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                        <span className="dashboard-logo-icon">⚡</span>
                        <h1>Players On</h1>
                    </div>
                    <div className="dashboard-header-right">
                        <span className="dashboard-user-name">{user?.name}</span>
                        <button onClick={logout} className="dashboard-logout-btn">
                            Sair
                        </button>
                    </div>
                </header>

                <main className="profile-content" style={{ marginTop: '20px' }}>
                    <div
                        onClick={() => navigate('/dashboard')}
                        style={{
                            cursor: 'pointer',
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '0.9rem',
                            marginBottom: '1rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'color 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                    >
                        ← Voltar ao Dashboard
                    </div>
                    <header className="profile-header">
                        <h1>Meu Perfil Atlético</h1>
                        <p>Complete suas informações para se destacar.</p>
                    </header>

                    {error && (
                        <div className="alert alert-error">
                            <div className="alert-icon">⚠️</div>
                            <div className="alert-content">
                                <strong>Foram encontrados os seguintes erros:</strong>
                                <ul>
                                    {Array.from(new Set(error.split('..').map(err => err.trim().replace(/^\./, '').replace(/\.$/, '')).filter(Boolean))).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    {submitError && (
                        <div className="alert alert-error">
                            <div className="alert-icon">⚠️</div>
                            <div className="alert-content">
                                <strong>Erro ao salvar:</strong>
                                <ul>
                                    {Array.from(new Set(submitError.split('..').map(err => err.trim().replace(/^\./, '').replace(/\.$/, '')).filter(Boolean))).map((err, i) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    {submitSuccess && <div className="alert alert-success">{submitSuccess}</div>}

                    <section className="profile-section">
                        <h2>Foto de Perfil</h2>
                        <ProfilePictureUpload />
                    </section>

                    <section className="profile-section">
                        <h2>Informações Pessoais</h2>
                        <PersonalInfoForm formData={formData} setFormData={setFormData} />
                    </section>

                    <section className="profile-section">
                        <h2>Idiomas</h2>
                        <LanguageList
                            nativeLanguage={formData.nativeLanguage}
                            setNativeLanguage={(val) => setFormData({ ...formData, nativeLanguage: val })}
                            items={formData.otherLanguages}
                            setItems={(newItems) => setFormData({ ...formData, otherLanguages: newItems })}
                        />
                    </section>

                    <section className="profile-section">
                        <h2>Conquistas</h2>
                        <DynamicList
                            items={formData.achievements}
                            setItems={(newItems) => setFormData({ ...formData, achievements: newItems })}
                            type="achievement"
                        />
                    </section>

                    <section className="profile-section">
                        <h2>Premiações Individuais</h2>
                        <DynamicList
                            items={formData.individualAwards}
                            setItems={(newItems) => setFormData({ ...formData, individualAwards: newItems })}
                            type="award"
                        />
                    </section>

                    <hr className="section-divider" />

                    <section className="profile-section documents-section">
                        <h2>Documentos (Scout)</h2>
                        <p className="section-description">Faça upload de até 10 PDFs (máx 5MB cada) para comprovar suas estatísticas.</p>
                        <DocumentUpload documents={profile?.documents || []} />
                    </section>

                    <div style={{ marginTop: '2rem' }}>
                        <button
                            onClick={handleSave}
                            disabled={submitting}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                                border: '1px dashed rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                letterSpacing: '0.3px',
                                opacity: submitting ? 0.5 : 1,
                            }}
                            onMouseOver={(e) => {
                                if (!submitting) {
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
                                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {submitting ? 'Salvando...' : '💾 Salvar Perfil'}
                        </button>
                    </div>

                </main>
            </div>
        </div>
    );
}
