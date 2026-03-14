import React from 'react';
import './PageStyle.css';

const OurServices = ({ onBack }) => {
    const services = [
        {
            title: "Highlight The Best of Special Edition",
            description: "We prepare material focused on the athlete's season.",
            icon: "🌟"
        },
        {
            title: "Graphic Design",
            description: "Ideal for social media posts.",
            icon: "🎨"
        },
        {
            title: "Motion Design",
            description: "Ideal for social media posts and dynamic videos.",
            icon: "🎬"
        },
        {
            title: "Statistical Reports",
            description: "All statistical material from the athlete's season.",
            icon: "📊"
        },
        {
            title: "Social Media Management",
            description: "Boost your network with our social media management for athletes and entrepreneurs.",
            icon: "📱"
        }
    ];

    return (
        <div className="page-container">
            <h2 className="page-title">Our Services</h2>
            <p className="subtitle" style={{ marginBottom: '3rem' }}>Elevate your game with our premium services.</p>

            <div className="services-grid">
                {services.map((service, index) => (
                    <div key={index} className="service-card" style={{ '--delay': `${index * 0.1}s` }}>
                        <div className="service-icon">{service.icon}</div>
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                    </div>
                ))}
            </div>

            <style>{`
                .services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 2rem;
                    width: 100%;
                    max-width: 1100px;
                    padding: 0 0 2rem;
                    align-items: stretch;
                }

                .service-card {
                    background:
                        radial-gradient(circle at top right, rgba(255, 255, 255, 0.08), transparent 26%),
                        linear-gradient(180deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.025));
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    padding: 2rem;
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    gap: 0.85rem;
                    transition:
                        transform 0.4s cubic-bezier(0.19, 1, 0.22, 1),
                        box-shadow 0.4s cubic-bezier(0.19, 1, 0.22, 1),
                        border-color 0.4s ease,
                        background 0.4s ease;
                    opacity: 0;
                    animation: slideUpFade 0.6s ease-out forwards;
                    animation-delay: var(--delay);
                    position: relative;
                    overflow: hidden;
                    min-height: 260px;
                }

                .service-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent 38%, transparent 72%, rgba(120, 169, 255, 0.08));
                    pointer-events: none;
                    opacity: 0.9;
                }

                .service-card > * {
                    position: relative;
                    z-index: 1;
                }

                .service-card:hover {
                    transform: translateY(-8px);
                    background:
                        radial-gradient(circle at top right, rgba(120, 169, 255, 0.14), transparent 24%),
                        linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.035));
                    border-color: rgba(120, 169, 255, 0.42);
                    box-shadow: 0 20px 45px -16px rgba(0,0,0,0.55);
                }

                .service-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
                }

                .service-card h3 {
                    font-family: var(--font-display);
                    font-size: 1.4rem;
                    margin: 0;
                    color: white;
                    line-height: 1.25;
                }

                .service-card p {
                    margin: 0;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.95rem;
                    line-height: 1.7;
                }

                @media (max-width: 720px) {
                    .services-grid {
                        grid-template-columns: 1fr;
                        gap: 1.25rem;
                    }

                    .service-card {
                        min-height: auto;
                        padding: 1.4rem;
                        border-radius: 20px;
                    }
                }

                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};


export default OurServices;
