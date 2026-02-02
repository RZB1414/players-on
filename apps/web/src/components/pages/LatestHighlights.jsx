import React from 'react';
import './PageStyle.css';
import VideoCarousel from '../VideoCarousel';

const LatestHighlights = ({ onBack }) => {
    return (
        <div className="page-container">
            <h2 className="page-title">Latest Highlights</h2>
            <p className="subtitle">Watch the best moments from our players.</p>

            <VideoCarousel />

            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};

export default LatestHighlights;
