import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
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
            setError(err.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async (profileData) => {
        try {
            console.log("[SAVE PROFILE] Data sent to backend:", JSON.stringify(profileData, null, 2));
            setLoading(true);
            setError(null);
            const data = await fetchApi('/api/player/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData),
            });
            console.log("[SAVE PROFILE] Success response:", data);
            setProfile(data.profile);
            return { success: true, message: data.message };
        } catch (err) {
            console.error("[SAVE PROFILE] Failed with error:", err);
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
            setError(err.message || 'Failed to open document');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const uploadProfilePicture = async (file) => {
        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            const data = await fetchApi('/api/player/profile-picture', {
                method: 'POST',
                body: formData,
                omitContentType: true
            });

            // Optimistic update
            setProfile(prev => ({
                ...prev,
                hasProfilePicture: data.hasProfilePicture,
                profilePictureUpdatedAt: new Date().toISOString()
            }));

            return { success: true, hasProfilePicture: data.hasProfilePicture };
        } catch (err) {
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const getProfilePictureUrl = useCallback(async () => {
        if (!profile || !profile.hasProfilePicture) return null;
        try {
            // Append timestamp to prevent browser from serving previous user's cached blob
            const timestamp = profile.profilePictureUpdatedAt ? new Date(profile.profilePictureUpdatedAt).getTime() : Date.now();
            const blob = await fetchApi(`/api/player/profile-picture?t=${timestamp}`, {
                method: 'GET',
                responseType: 'blob'
            });
            return window.URL.createObjectURL(blob);
        } catch (err) {
            console.error("Failed to load profile picture", err);
            return null;
        }
    }, [profile]);

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
                uploadProfilePicture,
                getProfilePictureUrl,
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
