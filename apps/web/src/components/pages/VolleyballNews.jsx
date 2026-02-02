import React from 'react';
import './PageStyle.css';

const VolleyballNews = ({ onBack }) => {
    return (
        <div className="page-container">
            <h1 className="page-title">Volleyball News</h1>
            <p>Stay updated with the latest in the volleyball world.</p>
            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};

export default VolleyballNews;
