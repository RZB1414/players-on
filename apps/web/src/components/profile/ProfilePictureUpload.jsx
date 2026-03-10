import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useProfile } from '../../context/ProfileContext';
import './ProfilePictureUpload.css';

export default function ProfilePictureUpload({ readOnly = false }) {
    const { profile, uploadProfilePicture, getProfilePictureUrl } = useProfile();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [editorImageSrc, setEditorImageSrc] = useState(null);
    const [editorImageType, setEditorImageType] = useState('image/jpeg');
    const [editorFileName, setEditorFileName] = useState('profile-picture.jpg');
    const [imageSize, setImageSize] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [viewportSize, setViewportSize] = useState(320);
    const fileInputRef = useRef(null);
    const previewObjectUrlRef = useRef(null);
    const editorViewportRef = useRef(null);
    const dragStateRef = useRef(null);

    const cleanupPreviewObjectUrl = useCallback(() => {
        if (previewObjectUrlRef.current) {
            window.URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }
    }, []);

    const clampPosition = useCallback((nextPosition, nextZoom = zoom, nextImageSize = imageSize, nextViewportSize = viewportSize) => {
        if (!nextImageSize || !nextViewportSize) {
            return { x: 0, y: 0 };
        }

        const baseScale = Math.max(
            nextViewportSize / nextImageSize.width,
            nextViewportSize / nextImageSize.height
        );

        const renderedWidth = nextImageSize.width * baseScale * nextZoom;
        const renderedHeight = nextImageSize.height * baseScale * nextZoom;

        const maxOffsetX = Math.max(0, (renderedWidth - nextViewportSize) / 2);
        const maxOffsetY = Math.max(0, (renderedHeight - nextViewportSize) / 2);

        return {
            x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextPosition.x)),
            y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextPosition.y)),
        };
    }, [imageSize, viewportSize, zoom]);

    const baseScale = useMemo(() => {
        if (!imageSize || !viewportSize) return 1;
        return Math.max(viewportSize / imageSize.width, viewportSize / imageSize.height);
    }, [imageSize, viewportSize]);

    const renderedImageStyle = useMemo(() => {
        if (!imageSize) return null;

        return {
            width: `${imageSize.width * baseScale * zoom}px`,
            height: `${imageSize.height * baseScale * zoom}px`,
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
        };
    }, [baseScale, imageSize, position.x, position.y, zoom]);

    useEffect(() => {
        let mounted = true;
        const loadPicture = async () => {
            if (profile?.hasProfilePicture) {
                const url = await getProfilePictureUrl();
                if (mounted && url) {
                    cleanupPreviewObjectUrl();
                    setPreviewUrl(url);
                }
            }
        };
        loadPicture();
        return () => {
            mounted = false;
            cleanupPreviewObjectUrl();
        };
    }, [cleanupPreviewObjectUrl, profile?.hasProfilePicture, profile?.profilePictureUpdatedAt, getProfilePictureUrl]);

    useEffect(() => {
        const node = editorViewportRef.current;
        if (!node) return;

        const updateViewportSize = () => {
            setViewportSize(Math.max(1, Math.round(node.getBoundingClientRect().width)));
        };

        updateViewportSize();

        const resizeObserver = new ResizeObserver(() => updateViewportSize());
        resizeObserver.observe(node);

        return () => resizeObserver.disconnect();
    }, [editorImageSrc]);

    useEffect(() => {
        setPosition((current) => clampPosition(current));
    }, [zoom, imageSize, viewportSize, clampPosition]);

    const resetEditor = useCallback(() => {
        setEditorImageSrc(null);
        setImageSize(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        dragStateRef.current = null;
    }, []);

    const openEditorForFile = async (file) => {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read image file.'));
            reader.readAsDataURL(file);
        });

        const dimensions = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
            image.onerror = () => reject(new Error('Failed to load image preview.'));
            image.src = dataUrl;
        });

        setEditorImageSrc(dataUrl);
        setEditorImageType(file.type || 'image/jpeg');
        setEditorFileName(file.name || 'profile-picture.jpg');
        setImageSize(dimensions);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError('');

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid format. Use JPEG, PNG or WEBP.');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File too large. Maximum size is 5MB.');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        try {
            await openEditorForFile(file);
        } catch (err) {
            setError(err.message || 'Failed to open image editor.');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePointerDown = (event) => {
        if (!editorImageSrc) return;

        dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startPosition: position,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        setPosition(clampPosition({
            x: dragState.startPosition.x + deltaX,
            y: dragState.startPosition.y + deltaY,
        }));
    };

    const handlePointerUp = (event) => {
        const dragState = dragStateRef.current;
        if (!dragState || dragState.pointerId !== event.pointerId) return;

        dragStateRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const canvasToBlob = (canvas, type) => new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
                return;
            }
            reject(new Error('Failed to generate edited image.'));
        }, type, 0.92);
    });

    const handleSaveEditedImage = async () => {
        if (!editorImageSrc || !imageSize) return;

        try {
            setError('');
            setUploading(true);

            const image = await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to prepare image for upload.'));
                img.src = editorImageSrc;
            });

            const totalScale = baseScale * zoom;
            const renderedWidth = imageSize.width * totalScale;
            const renderedHeight = imageSize.height * totalScale;
            const imageLeft = viewportSize / 2 - renderedWidth / 2 + position.x;
            const imageTop = viewportSize / 2 - renderedHeight / 2 + position.y;

            const sourceX = Math.max(0, (0 - imageLeft) / totalScale);
            const sourceY = Math.max(0, (0 - imageTop) / totalScale);
            const sourceWidth = Math.min(imageSize.width - sourceX, viewportSize / totalScale);
            const sourceHeight = Math.min(imageSize.height - sourceY, viewportSize / totalScale);

            const outputSize = 1080;
            const canvas = document.createElement('canvas');
            canvas.width = outputSize;
            canvas.height = outputSize;

            const context = canvas.getContext('2d');
            context.drawImage(
                image,
                sourceX,
                sourceY,
                sourceWidth,
                sourceHeight,
                0,
                0,
                outputSize,
                outputSize
            );

            const outputType = editorImageType === 'image/png' ? 'image/png' : 'image/jpeg';
            const blob = await canvasToBlob(canvas, outputType);
            const extension = outputType === 'image/png' ? 'png' : 'jpg';
            const sanitizedName = editorFileName.replace(/\.[^.]+$/, '') || 'profile-picture';
            const editedFile = new File([blob], `${sanitizedName}.${extension}`, { type: outputType });

            const result = await uploadProfilePicture(editedFile);

            if (!result.success) {
                setError(result.error || 'Failed to upload photo.');
                return;
            }

            cleanupPreviewObjectUrl();
            const localPreviewUrl = window.URL.createObjectURL(blob);
            previewObjectUrlRef.current = localPreviewUrl;
            setPreviewUrl(localPreviewUrl);
            resetEditor();
        } catch (err) {
            setError(err.message || 'Failed to save edited photo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="profile-picture-upload">
            {error && <div className="alert alert-error profile-picture-upload__alert">{error}</div>}

            {editorImageSrc ? (
                <div className="profile-picture-upload__editor">
                    <div
                        ref={editorViewportRef}
                        className="profile-picture-upload__viewport"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {renderedImageStyle && (
                            <img
                                src={editorImageSrc}
                                alt="Profile preview"
                                className="profile-picture-upload__editor-image"
                                style={renderedImageStyle}
                                draggable={false}
                            />
                        )}
                        <div className="profile-picture-upload__viewport-overlay" />
                        {uploading && (
                            <div className="profile-picture-upload__loading-overlay">
                                Uploading...
                            </div>
                        )}
                    </div>

                    <div className="profile-picture-upload__controls">
                        <div className="profile-picture-upload__slider-group">
                            <div className="profile-picture-upload__slider-labels">
                                <span>Zoom</span>
                                <span>{zoom.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.01"
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                disabled={uploading}
                            />
                        </div>

                        <p className="profile-picture-upload__hint">
                            Drag to move the image and adjust the framing before saving.
                        </p>

                        <div className="profile-picture-upload__actions">
                            <button
                                type="button"
                                className="profile-picture-upload__button profile-picture-upload__button--ghost"
                                onClick={() => {
                                    setZoom(1);
                                    setPosition({ x: 0, y: 0 });
                                }}
                                disabled={uploading}
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                className="profile-picture-upload__button profile-picture-upload__button--ghost"
                                onClick={resetEditor}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="profile-picture-upload__button profile-picture-upload__button--primary"
                                onClick={handleSaveEditedImage}
                                disabled={uploading}
                            >
                                {uploading ? 'Saving...' : 'Save Picture'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="profile-picture-upload__display">
                    <div className="profile-picture-upload__preview-shell">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Profile"
                                className="profile-picture-upload__preview-image"
                            />
                        ) : (
                            <span className="profile-picture-upload__placeholder">👤</span>
                        )}
                        {uploading && (
                            <div className="profile-picture-upload__loading-overlay">
                                Uploading...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!readOnly && (
                <div className="profile-picture-upload__picker">
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
                        className={`profile-picture-upload__button profile-picture-upload__button--picker ${uploading ? 'is-disabled' : ''}`}
                    >
                        {previewUrl ? 'Change Picture' : 'Add Picture'}
                    </label>
                </div>
            )}
        </div>
    );
}
