import React from 'react';
import './PageStyle.css';
import './AboutUs.css';

// Images
import amandaImg from '../../assets/team/amanda-barsi.png';
import thiagoImg from '../../assets/team/thiago-silva.png';
import tobiasImg from '../../assets/team/tobias-fares.png';
import gustavoImg from '../../assets/team/gustavo-henrique.png';
import plautoImg from '../../assets/team/plauto-machado.png';
import rafaelImg from '../../assets/team/rafael-menezes.png';
import felipeImg from '../../assets/team/felipe-campagnaro.png';
import alexImg from '../../assets/team/alex-schemberger.png';

const AboutUs = ({ onBack }) => {
    const teamMembers = [
        {
            name: "Thiago Silva",
            role: "Performance Analyst",
            img: thiagoImg,
            bio: "As a performance analyst, currently at Minas TC (women's), he is one of the most experienced professionals in the market. He has worked as a youth category coach at Mackenzie E.C. (women's) and Sada Cruzeiro (men's). With a full degree in Physical Education emphasizing Sports from UFSC, active for 18 years."
        },
        {
            name: "Tobias Fares",
            role: "Performance Analyst",
            img: tobiasImg,
            bio: "Bachelor in Physical Education from UERJ and academic extension at FADEUP - PT, he is a Level III coach by CBV and Sports Performance Analyst since 2013 with experience in high-performance teams such as Voleisul RS, SESC RJ, and Fluminense."
        },
        {
            name: "Gustavo Henrique",
            role: "Performance Analyst",
            img: gustavoImg,
            bio: "Bachelor in Physical Education, performance analyst who worked in adult volleyball in Guarulhos and now joins Osasco Voleibol. Currently part of the Brazilian U17 team."
        },
        {
            name: "Plauto Machado",
            role: "Performance Analyst",
            img: plautoImg,
            bio: "Plauto Machado has a degree in Physical Education, worked as Assistant Coach and Performance Analyst at clubs such as Shabab Al Ahli, SESI Vôlei Bauru, Minas Tênis Clube, Peruvian Women's U20 National Team, Cruzeiro Esporte Clube, and Joinville Vôlei."
        },
        {
            name: "Rafael Menezes",
            role: "Assistant Coach",
            img: rafaelImg,
            bio: "Bachelor in Administration from IBMR, currently studying Physical Education. Former volleyball athlete, member of the Fluminense adult women's technical commission since 2018. With experience in the Brazilian U19 national team."
        },
        {
            name: "Felipe Campagnaro",
            role: "Social Media Manager",
            img: felipeImg,
            bio: "Graduated in Advertising from UNIFAE, possesses solid experience in social media management, covering volleyball tournaments around the world. At Players On, he contributes to content planning and digital strategy."
        },
        {
            name: "Alex Schemberger",
            role: "Video Editor",
            img: alexImg,
            bio: "Graduated in Computer Engineering and professional video editor. Alex has vast experience in editing and a notable career as a volleyball athlete, being part of the Brazilian Youth National Team and playing for teams in Brazil and abroad."
        }
    ];

    return (
        <div className="page-container">
            <h1 className="page-title">About Us</h1>

            <div className="about-intro">
                <p>The sports world is naturally competitive. Every detail is valuable.</p>
                <p>With this in mind, Players On was founded to assist the athlete's career and offer a competitive advantage during recruitment.</p>
            </div>

            <div className="founder-section">
                <div className="founder-card">
                    <div className="founder-img-wrapper">
                        <img src={amandaImg} alt="Amanda Barsi" className="founder-img" />
                    </div>
                    <div className="founder-info">
                        <h2>Amanda Barsi Krauchuk</h2>
                        <span className="founder-role">CEO & Founder</span>
                        <p className="founder-bio">
                            Founder and Director of the Players On ® brand.
                            Former volleyball player and holder of a degree in Sports Science from Unicamp, Amanda is also a professional video editor specialized in sports performance analysis. Active in this field since 2010, she has worked with elite volleyball teams in Brazil, including the Brazilian National Team. Driven by the desire to be part of the process through which athletes achieve their dreams on the court, she founded the company now known as Players On in 2013.
                        </p>
                    </div>
                </div>
            </div>

            <h2 className="team-section-title">Our Team</h2>

            <div className="team-grid">
                {teamMembers.map((member, index) => (
                    <div key={index} className="team-card">
                        <div className="team-img-wrapper">
                            <img src={member.img} alt={member.name} className="team-img" />
                        </div>
                        <h3>{member.name}</h3>
                        {member.role && <span className="role">{member.role}</span>}
                        <p>{member.bio}</p>
                    </div>
                ))}
            </div>

            <div style={{ height: '4rem' }}></div>

            <button className="back-button" onClick={onBack}>Back to Home</button>
        </div>
    );
};

export default AboutUs;
