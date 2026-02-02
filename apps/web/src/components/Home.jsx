import React, { useState } from 'react';
import './Home.css';
import topLogo from '../assets/logo.png';
import Options from './Options';
import OurServices from './pages/OurServices';
import PlayersCast from './pages/PlayersCast';
import PlayersOnStore from './pages/PlayersOnStore';
import VolleyballNews from './pages/VolleyballNews';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import LatestHighlights from './pages/LatestHighlights';

const Home = () => {
    const [showOptions, setShowOptions] = useState(false);
    const [activePage, setActivePage] = useState(null);

    // Handle browser back button (popstate)
    React.useEffect(() => {
        const handlePopState = (event) => {
            const state = event.state;
            if (state?.view === 'page') {
                setActivePage(state.id);
                setShowOptions(true);
            } else if (state?.view === 'options') {
                setActivePage(null);
                setShowOptions(true);
            } else {
                // Initial state
                setActivePage(null);
                setShowOptions(false);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleExplore = () => {
        window.history.pushState({ view: 'options' }, '', '');
        setShowOptions(true);
    };

    const handleOptionSelect = (id) => {
        window.history.pushState({ view: 'page', id }, '', '');
        setActivePage(id);
    };

    const handleBackToHome = () => {
        // If we just want to go up one level (to options):
        // We can just go back in history if we came from there
        window.history.back();
    };

    const renderActivePage = () => {
        switch (activePage) {
            case 'OurServices': return <OurServices onBack={handleBackToHome} />;
            case 'PlayersCast': return <PlayersCast onBack={handleBackToHome} />;
            case 'PlayersOnStore': return <PlayersOnStore onBack={handleBackToHome} />;
            case 'VolleyballNews': return <VolleyballNews onBack={handleBackToHome} />;
            case 'AboutUs': return <AboutUs onBack={handleBackToHome} />;
            case 'ContactUs': return <ContactUs onBack={handleBackToHome} />;
            case 'LatestHighlights': return <LatestHighlights onBack={handleBackToHome} />;
            default: return null;

        }
    };

    return (
        <div className={`home-container ${showOptions ? 'active-options' : ''}`}>
            {!activePage && (
                <img
                    src={topLogo}
                    alt="Players On"
                    className="top-logo"
                    onClick={() => {
                        // Reset to initial state
                        window.history.pushState(null, '', '');
                        setShowOptions(false);
                        setActivePage(null);
                    }}
                    style={{ cursor: 'pointer' }}
                />
            )}
            <div className={`content-wrapper ${showOptions ? 'fade-out' : ''}`}>
                <div className="logo-container">
                    <h1 className="title">Players On</h1>
                    <p className="subtitle">Elevate Your Game</p>
                </div>
                <button className="cta-button" onClick={handleExplore}>Explore</button>
            </div>

            {showOptions && !activePage && (
                <Options onOptionSelect={handleOptionSelect} />
            )}

            {activePage && renderActivePage()}
        </div>
    );
};

export default Home;
