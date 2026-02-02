import React from 'react';
import './PageStyle.css';

const ContactUs = ({ onBack }) => {
    return (
        <div className="page-container">
            <h1 className="page-title">Contact Us</h1>
            <p>Get in touch with us.</p>
            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};

export default ContactUs;
