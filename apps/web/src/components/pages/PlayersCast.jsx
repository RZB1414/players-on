import React from 'react';
import './PageStyle.css';
import VideoCarousel from '../VideoCarousel';

const PlayersCast = ({ onBack }) => {
    return (
        <div className="page-container">
            <h1 className="page-title">Players Cast</h1>
            <p className="subtitle">Tune in to the latest episodes and interviews with pros.</p>

            <VideoCarousel playlistQuery="Players Cast" />

            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};

export default PlayersCast;
