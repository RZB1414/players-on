// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './Home.css';
// import topLogo from '../assets/logo.png';
// import Options from './Options';
// import OurServices from './pages/OurServices';
// import PlayersCast from './pages/PlayersCast';
// import EternaCapital from './pages/EternaCapital';
// import VolleyballNews from './pages/VolleyballNews';
// import AboutUs from './pages/AboutUs';
// import ContactUs from './pages/ContactUs';
// import LatestHighlights from './pages/LatestHighlights';

// const Home = () => {
//     const [showOptions, setShowOptions] = useState(false);
//     const [activePage, setActivePage] = useState(null);
//     const navigate = useNavigate();

//     // Handle browser back button (popstate)
//     React.useEffect(() => {
//         const handlePopState = (event) => {
//             const state = event.state;
//             if (state?.view === 'page') {
//                 setActivePage(state.id);
//                 setShowOptions(true);
//             } else if (state?.view === 'options') {
//                 setActivePage(null);
//                 setShowOptions(true);
//             } else {
//                 // Initial state
//                 setActivePage(null);
//                 setShowOptions(false);
//             }
//         };

//         window.addEventListener('popstate', handlePopState);
//         return () => window.removeEventListener('popstate', handlePopState);
//     }, []);

//     const handleExplore = () => {
//         window.history.pushState({ view: 'options' }, '', '');
//         setShowOptions(true);
//     };

//     const handleOptionSelect = (id) => {
//         window.history.pushState({ view: 'page', id }, '', '');
//         setActivePage(id);
//     };

//     const handleBackToHome = () => {
//         // If we just want to go up one level (to options):
//         // We can just go back in history if we came from there
//         window.history.back();
//     };

//     const renderActivePage = () => {
//         switch (activePage) {
//             case 'OurServices': return <OurServices onBack={handleBackToHome} />;
//             case 'PlayersCast': return <PlayersCast onBack={handleBackToHome} />;
//             case 'EternaCapital': return <EternaCapital onBack={handleBackToHome} />;
//             case 'VolleyballNews': return <VolleyballNews onBack={handleBackToHome} />;
//             case 'AboutUs': return <AboutUs onBack={handleBackToHome} />;
//             case 'ContactUs': return <ContactUs onBack={handleBackToHome} />;
//             case 'LatestHighlights': return <LatestHighlights onBack={handleBackToHome} />;
//             default: return null;

//         }
//     };

//     return (
//         <div className={`home-container ${showOptions ? 'active-options' : ''}`}>
//             {!activePage && (
//                 <button
//                     className="login-btn-top-right"
//                     onClick={() => navigate('/login')}
//                 >
//                     Login
//                 </button>
//             )}
//             {!activePage && (
//                 <img
//                     src={topLogo}
//                     alt="Players On"
//                     className="top-logo"
//                     onClick={() => {
//                         // Reset to initial state
//                         window.history.pushState(null, '', '');
//                         setShowOptions(false);
//                         setActivePage(null);
//                     }}
//                     style={{ cursor: 'pointer' }}
//                 />
//             )}
//             <div className={`content-wrapper ${showOptions ? 'fade-out' : ''}`}>
//                 <div className="logo-container">
//                     <h1 className="title">Players On</h1>
//                     <p className="subtitle">Elevate Your Game</p>
//                 </div>
//                 <button className="cta-button" onClick={handleExplore}>Explore</button>
//             </div>

//             {showOptions && !activePage && (
//                 <Options onOptionSelect={handleOptionSelect} />
//             )}

//             {activePage && renderActivePage()}
//         </div>
//     );
// };

// export default Home;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import topLogo from '../assets/logo.png';
import Options from './Options';
import OurServices from './pages/OurServices';
import PlayersCast from './pages/PlayersCast';
import EternaCapital from './pages/EternaCapital';
import VolleyballNews from './pages/VolleyballNews';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import LatestHighlights from './pages/LatestHighlights';

const Home = () => {
    const [showOptions, setShowOptions] = useState(false);
    const [activePage, setActivePage] = useState(null);
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    // Efeito de montagem inicial para a animação de entrada
    useEffect(() => {
        const animationFrame = window.requestAnimationFrame(() => {
            setMounted(true);
        });

        return () => window.cancelAnimationFrame(animationFrame);
    }, []);

    // Handle browser back button (popstate)
    useEffect(() => {
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
        window.history.back();
    };

    const renderActivePage = () => {
        switch (activePage) {
            case 'OurServices': return <OurServices onBack={handleBackToHome} />;
            case 'PlayersCast': return <PlayersCast onBack={handleBackToHome} />;
            case 'EternaCapital': return <EternaCapital onBack={handleBackToHome} />;
            case 'VolleyballNews': return <VolleyballNews onBack={handleBackToHome} />;
            case 'AboutUs': return <AboutUs onBack={handleBackToHome} />;
            case 'ContactUs': return <ContactUs onBack={handleBackToHome} />;
            case 'LatestHighlights': return <LatestHighlights onBack={handleBackToHome} />;
            default: return null;
        }
    };

    return (
        <div className={`home-container ${showOptions ? 'active-options' : ''}`}>
            
            {/* Camada de Fundo Cósmico/Energia (Substitui a imagem estática) */}
            <div className="cosmic-background">
                <div className="cosmic-gradient"></div>
                <div className="nebula nebula-1"></div>
                <div className="nebula nebula-2"></div>
                <div className="nebula nebula-3"></div>
                <div className="particle particle-1"></div>
                <div className="particle particle-2"></div>
                <div className="particle particle-3"></div>
                <div className="particle particle-4"></div>
            </div>

            {/* Header: Botão Login */}
            {!activePage && (
                <button
                    className="login-btn-top-right"
                    onClick={() => navigate('/login')}
                >
                    Login
                </button>
            )}

            {/* Header: Logótipo Original */}
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
                />
            )}

            {/* Conteúdo Central Principal */}
            <div className={`content-wrapper ${showOptions ? 'fade-out' : ''} ${mounted ? 'mounted' : ''}`}>
                <div className="logo-container">
                    <h1 className="title-modern">PLAYERS ON</h1>
                    <p className="subtitle-modern">Elevate Your Game</p>
                </div>
                
                <button className="cta-button-modern" onClick={handleExplore}>
                    <span className="cta-hover-bg"></span>
                    <span className="cta-text">Explore</span>
                </button>
            </div>

            {/* Componentes Dinâmicos (Options & Pages) */}
            {showOptions && !activePage && (
                <div className="dynamic-layer">
                    <Options onOptionSelect={handleOptionSelect} />
                </div>
            )}

            {activePage && (
                <div className="dynamic-layer">
                    {renderActivePage()}
                </div>
            )}

            {/* Rodapé Subtil */}
            {!activePage && !showOptions && (
                <footer className="home-footer">
                    &copy; {new Date().getFullYear()} PLAYERS ON. ALL RIGHTS RESERVED.
                </footer>
            )}
        </div>
    );
};

export default Home;