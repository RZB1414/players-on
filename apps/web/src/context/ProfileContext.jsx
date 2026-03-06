import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { request as fetchApi } from '../utils/api';

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAuthenticated) {
            loadProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchApi('/api/player/profile');
            setProfile(data.profile || {});
        } catch (err) {
            setError(err.message || 'Falha ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async (profileData) => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchApi('/api/player/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });
            setProfile(data.profile);
            return { success: true, message: data.message };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const uploadDocument = async (file) => {
        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            // Note: Do not set Content-Type header manually when using FormData
            // fetchApi will omit it, so fetch generates the proper multipart boundary
            const data = await fetchApi('/api/player/documents', {
                method: 'POST',
                body: formData,
                omitContentType: true // Requires update to fetchApi utility
            });

            // Optimistic update
            setProfile(prev => ({
                ...prev,
                documents: [...(prev.documents || []), data.document]
            }));

            return { success: true, document: data.document };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteDocument = async (documentId) => {
        try {
            setLoading(true);
            setError(null);
            await fetchApi(`/api/player/documents/${documentId}`, {
                method: 'DELETE',
            });

            // Optimistic update
            setProfile(prev => ({
                ...prev,
                documents: (prev.documents || []).filter(d => d.id !== documentId)
            }));

            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const openDocument = async (documentId) => {
        try {
            setLoading(true);
            setError(null);
            const blob = await fetchApi(`/api/player/documents/${documentId}`, {
                method: 'GET',
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(blob);
            return { success: true, url };
        } catch (err) {
            setError(err.message || 'Falha ao abrir o documento');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProfileContext.Provider
            value={{
                profile,
                loading,
                error,
                saveProfile,
                uploadDocument,
                deleteDocument,
                openDocument,
                refreshProfile: loadProfile
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (!context) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
