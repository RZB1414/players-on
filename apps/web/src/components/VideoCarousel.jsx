import React, { useState, useRef, useEffect } from 'react';
import './VideoCarousel.css';

const VideoCarousel = ({ playlistQuery }) => {
    // Configured with user's video IDs
    const fallbackVideos = [
        { id: 'm9xnYqI7xrU', title: 'Players On Highlight 1' },
        { id: 'Caks6Z-QRx8', title: 'Players On Highlight 2' },
        { id: 'iLRZ_OuT9T0', title: 'Players On Highlight 3' },
    ];

    const [videos, setVideos] = useState(fallbackVideos);
    const [allPlaylistVideos, setAllPlaylistVideos] = useState([]); // Store all videos for client-side filtering
    const [currentIndex, setCurrentIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [activePlaylistId, setActivePlaylistId] = useState(null);
    const [showGrid, setShowGrid] = useState(false);

    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
    const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // 1. Resolve Playlist ID if query is provided
    useEffect(() => {
        const resolvePlaylist = async () => {
            if (!playlistQuery || !API_KEY || !CHANNEL_ID) return;

            try {
                const playlistsUrl = `https://www.googleapis.com/youtube/v3/playlists?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&maxResults=50`;
                const response = await fetch(playlistsUrl);
                const data = await response.json();
                console.log("📺 All Channel Playlists:", data.items); // LOG REQUESTED BY USER


                const targetPlaylist = data.items?.find(
                    p => p.snippet.title.toLowerCase() === playlistQuery.toLowerCase()
                );

                if (targetPlaylist) {
                    console.log("✅ Loaded Playlist:", targetPlaylist); // LOG REQUESTED BY USER
                    setActivePlaylistId(targetPlaylist.id);
                } else {
                    console.warn(`Playlist "${playlistQuery}" not found.`);
                    setActivePlaylistId(null);
                }
            } catch (error) {
                console.error("Error resolving playlist:", error);
            }
        };

        resolvePlaylist();
    }, [playlistQuery]);

    // 2. Fetch Videos (Playlist Mode vs Global Mode)
    useEffect(() => {
        const fetchVideos = async () => {
            if (!API_KEY || !CHANNEL_ID || API_KEY.includes('PLACEHOLDER')) {
                return;
            }

            try {
                // MODE A: Specific Playlist (Client-side filtering)
                if (activePlaylistId) {
                    // Only fetch from API if we haven't already loaded this playlist's videos
                    // OR if we strictly want to ensure fresh data. 
                    // For simplicity, let's fetch if allPlaylistVideos is empty or activePlaylistId changed.
                    // But we are in a useEffect dep on [debouncedTerm, activePlaylistId].
                    // We should fetch ONCE when ID sets, then filter locally.

                    if (allPlaylistVideos.length === 0) {
                        const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${API_KEY}&playlistId=${activePlaylistId}&part=snippet,id&maxResults=50`;
                        const response = await fetch(videosUrl);
                        const data = await response.json();

                        if (data.items) {
                            const formatted = data.items.map(item => ({
                                id: item.snippet.resourceId.videoId,
                                title: item.snippet.title,
                            }));
                            setAllPlaylistVideos(formatted);
                            setVideos(formatted); // Initial display
                        }
                    } else {
                        // Just filter what we have
                        if (debouncedTerm) {
                            const filtered = allPlaylistVideos.filter(v =>
                                v.title.toLowerCase().includes(debouncedTerm.toLowerCase())
                            );
                            setVideos(filtered);
                            setCurrentIndex(0);
                        } else {
                            setVideos(allPlaylistVideos);
                        }
                    }
                    return;
                }

                // MODE B: Global Channel Search (Server-side filtering)
                // If playlistQuery is provided, we SHOULD NOT fallback to global search
                // while waiting for resolution. We only search globally if NO playlist was requested.
                if (playlistQuery) return;

                let url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=10&type=video`;

                if (debouncedTerm) {
                    url += `&q=${encodeURIComponent(debouncedTerm)}`;
                }

                const response = await fetch(url);
                const data = await response.json();

                if (data.items) {
                    const fetchedVideos = data.items.map(item => ({
                        id: item.id.videoId,
                        title: item.snippet.title,
                    }));
                    setVideos(fetchedVideos);
                    setCurrentIndex(0);
                } else {
                    console.error('No video items found in API response', data);
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
            }
        };

        // Reset playlist cache if ID changes
        if (activePlaylistId && allPlaylistVideos.length > 0 && String(allPlaylistVideos[0]?.playlistId) !== String(activePlaylistId)) {
            // Logic to clear cache if needed, but handled by dependency array mostly.
            // Actually, simplest is to clear cache when activePlaylistId changes:
        }

        fetchVideos();
    }, [debouncedTerm, activePlaylistId]);

    // Clear cache when switching playlists
    useEffect(() => {
        setAllPlaylistVideos([]);
    }, [activePlaylistId]);

    // ... touch handlers ...
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsDragging(true);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        // Reset dragging state regardless of swipe result so click works
        setIsDragging(false);

        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextVideo();
        } else if (isRightSwipe) {
            prevVideo();
        }

        // Reset touch coordinates
        setTouchStart(null);
        setTouchEnd(null);
    };

    const nextVideo = () => {
        setCurrentIndex((prev) => (prev === videos.length - 1 ? 0 : prev + 1));
    };

    const prevVideo = () => {
        setCurrentIndex((prev) => (prev === 0 ? videos.length - 1 : prev - 1));
    };

    // Calculate generic card styles based on index
    const getCardStyle = (index) => {
        if (index === currentIndex) return 'card-active';

        const nextIndex = (currentIndex + 1) % videos.length;
        if (index === nextIndex) return 'card-next';

        const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
        if (index === prevIndex) return 'card-prev';

        return 'card-hidden';
    };

    const handleVideoClick = (id) => {
        // Open in YouTube App / New Tab
        // Check if it was a drag or a click. `onTouchEnd` handles drag.
        // If we are here via onClick, it usually means it wasn't a significant drag on desktop?
        // Mobile 'onClick' might fire after touchEnd.
        if (!isDragging) {
            window.open(`https://www.youtube.com/watch?v=${id}`, '_blank');
        }
    };

    const toggleGrid = () => {
        setShowGrid(!showGrid);
    };

    return (
        <div className="video-carousel-container">
            <div className="search-container">
                <input
                    type="text"
                    placeholder={activePlaylistId ? "Search in this playlist..." : "Search by athlete name..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="video-search-input"
                />
            </div>
            <div
                className="deck-wrapper"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {videos.map((video, index) => {
                    const cardClass = getCardStyle(index);
                    const isClickable = index === currentIndex; // Only the active card is clickable

                    return (
                        <div
                            key={video.id}
                            className={`deck-card ${cardClass}`}
                            onClick={() => isClickable && handleVideoClick(video.id)}
                        >
                            <div className="video-frame">
                                {/* Thumbnail Image */}
                                <img
                                    src={`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`}
                                    alt={video.title}
                                    className="video-thumbnail"
                                    onError={(e) => { e.target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg` }}
                                />

                                {/* Play Button Icon Overlay */}
                                <div className="play-button-overlay">
                                    <div className="play-icon">▶</div>
                                </div>
                            </div>
                            <div className="card-info">
                                <h3>{video.title}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="carousel-hint">Swipe to browse • Tap to watch on YouTube</p>

            <div className="carousel-controls">
                <button className="nav-btn prev" onClick={prevVideo}>&#8249;</button>
                <button className="nav-btn next" onClick={nextVideo}>&#8250;</button>
            </div>

            {/* View All Button - Only if in Playlist Mode */}
            {activePlaylistId && (
                <div className="view-all-wrapper">
                    <button className="view-all-btn" onClick={toggleGrid}>
                        Show All Interviews
                    </button>
                </div>
            )}

            {/* Grid Overlay */}
            {showGrid && (
                <div className="videos-grid-overlay">
                    <div className="grid-header">
                        <h2>All Episodes</h2>
                        <button className="close-grid-btn" onClick={toggleGrid}>&times;</button>
                    </div>
                    <div className="videos-grid">
                        {allPlaylistVideos.map((video) => (
                            <div
                                key={video.id}
                                className="grid-card"
                                onClick={() => handleVideoClick(video.id)}
                            >
                                <div className="grid-thumbnail-wrapper">
                                    <img
                                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="grid-thumbnail"
                                    />
                                </div>
                                <h3>{video.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoCarousel;
