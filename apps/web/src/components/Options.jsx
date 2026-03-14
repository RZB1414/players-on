import React from 'react';
import './Options.css';
import webVoleiLogo from '../assets/web-volei-logo.png';

const eternaCapitalLogo = 'https://www.eternacapital.com.br/logo.png';

const Options = ({ onOptionSelect }) => {
    const mainOptions = [
        { label: 'Latest Highlights', id: 'LatestHighlights' },
        { label: 'Our Services', id: 'OurServices' },
        { label: 'Players Cast', id: 'PlayersCast' },
        { label: 'Eterna Capital', id: 'EternaCapital' },
        { label: 'Web Vôlei', id: 'WebVolley' },
    ];

    const secondaryOptions = [
        { label: 'About Us', id: 'AboutUs' },
        { label: 'Contact Us', id: 'ContactUs' },
    ];

    return (
        <div className="options-container fade-in">
            <div className="options-main">
                {mainOptions.map((item, index) => (
                    <div
                        key={item.id}
                        className="option-card"
                        style={{ '--i': index }}
                        onClick={() => onOptionSelect(item.id)}
                    >
                        <div className="card-content">
                            {item.id === 'EternaCapital' || item.id === 'WebVolley' ? (
                                <div className="option-title option-title-partner" aria-label={item.label}>
                                    <img
                                        className={`option-partner-logo ${item.id === 'WebVolley' ? 'option-partner-logo-webvolei' : ''}`}
                                        src={item.id === 'EternaCapital' ? eternaCapitalLogo : webVoleiLogo}
                                        alt={item.label}
                                    />
                                </div>
                            ) : (
                                <h3 className="option-title">{item.label}</h3>
                            )}
                            <div className="shine"></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="options-secondary">
                {secondaryOptions.map((item, index) => (
                    <button
                        key={item.id}
                        className="secondary-btn"
                        style={{ '--i': index + 4 }}
                        onClick={() => onOptionSelect(item.id)}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Options;
