import React from 'react';
import './PageStyle.css';
import './ContactUs.css';

const WHATSAPP_URL = 'https://wa.me/5519999198436';

const ContactUs = ({ onBack }) => {
    const handleWhatsappClick = () => {
        window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="page-container contact-page">
            <section className="contact-card">
                <span className="contact-tag">Contact</span>
                <h1 className="page-title contact-title">Let&apos;s discuss your next service request</h1>
                <p className="contact-lead">
                    If you are looking for professional support, performance-focused services,
                    or a tailored solution for your project, we are available to help.
                </p>
                <p className="contact-copy">
                    Reach out to our team to request a service, discuss your goals, and receive
                    guidance on the best way to move forward. We are ready to respond with clarity,
                    professionalism, and attention to your specific needs.
                </p>

                <div className="contact-actions">
                    <button className="contact-primary-button" onClick={handleWhatsappClick}>
                        Start a WhatsApp Conversation
                    </button>
                    <button className="back-button contact-secondary-button" onClick={onBack}>
                        Back to Home
                    </button>
                </div>
            </section>
        </div>
    );
};

export default ContactUs;
