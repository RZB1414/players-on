import React from 'react';
import './PageStyle.css';

const PlayersOnStore = ({ onBack }) => {
    return (
        <div className="page-container">
            <h1 className="page-title">Players On Store</h1>
            <p>Get the best gear for your game.</p>
            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};

export default PlayersOnStore;
