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
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    width: 100%;
                    max-width: 1000px;
                    padding-bottom: 2rem;
                }

                .service-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 2rem;
                    text-align: left;
                    transition: all 0.4s ease;
                    opacity: 0;
                    animation: slideUpFade 0.6s ease-out forwards;
                    animation-delay: var(--delay);
                    position: relative;
                    overflow: hidden;
                }

                .service-card:hover {
                    transform: translateY(-5px);
                    background: rgba(255, 255, 255, 0.06);
                    border-color: var(--color-primary);
                    box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
                }

                .service-icon {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
                }

                .service-card h3 {
                    font-family: var(--font-display);
                    font-size: 1.4rem;
                    margin-bottom: 0.5rem;
                    color: white;
                }

                .service-card p {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 0.95rem;
                    line-height: 1.6;
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
