import React from 'react';
import './PageStyle.css';
import './EternaCapital.css';

const investmentPillars = [
    {
        title: 'Carteiras sob medida',
        description: 'Estratégias alinhadas ao perfil do investidor, com foco em objetivos de curto, médio e longo prazo.',
    },
    {
        title: 'Acesso a soluções amplas',
        description: 'Renda fixa, renda variável, fundos, crédito, câmbio e seguros reunidos em uma assessoria exclusiva.',
    },
    {
        title: 'Conteúdo e networking',
        description: 'Insights semanais de mercado, EternaCast e um ambiente pensado para relacionamento e imersão.',
    },
];

const trustHighlights = [
    'Mais de 10 anos de experiência em assessoria de investimentos',
    'Assessoria credenciada à XP Investimentos',
    'Atendimento exclusivo com foco em transparência e perfil do cliente',
];

const EternaCapital = ({ onBack }) => {
    return (
        <div className="page-container partner-page">
            <div className="partner-shell">
                <section className="partner-hero">
                    <div className="partner-copy">
                        <span className="partner-badge">Parceiro em destaque</span>
                        <div className="partner-brand-lockup">
                            <img
                                className="partner-logo"
                                src="https://www.eternacapital.com.br/logo.png"
                                alt="Eterna Capital"
                            />
                            <h1 className="page-title partner-title">Eterna Capital</h1>
                        </div>
                        <p className="partner-lead">
                            Uma assessoria de investimentos exclusiva, com atendimento personalizado
                            e soluções para quem busca construir patrimônio com estratégia,
                            segurança e visão de longo prazo.
                        </p>

                        <div className="partner-actions">
                            <a
                                className="partner-primary-cta"
                                href="https://www.eternacapital.com.br/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Conhecer a Eterna Capital
                            </a>
                        </div>
                    </div>

                    <aside className="partner-spotlight">
                        <div className="spotlight-panel spotlight-panel-main">
                            <span className="spotlight-label">Destaque</span>
                            <strong>Assessoria de investimentos XP exclusiva</strong>
                            <p>
                                Soluções para perfis conservadores, estratégias mais rentáveis e
                                até exposição internacional, sempre com acompanhamento consultivo.
                            </p>
                        </div>

                        <div className="spotlight-grid">
                            <div className="spotlight-panel">
                                <span className="spotlight-kicker">Experiência</span>
                                <strong>+10 anos</strong>
                                <p>Histórico sólido em relacionamento e construção de carteira.</p>
                            </div>
                            <div className="spotlight-panel">
                                <span className="spotlight-kicker">Satisfação</span>
                                <strong>NPS 91</strong>
                                <p>Nosso net promoter score reflete nosso cuidado com você!</p>
                            </div>
                        </div>
                    </aside>
                </section>

                <section className="partner-section">
                    <div className="section-heading">
                        <span className="section-tag">Por que conhecer</span>
                        <h2>Uma parceria que combina performance, cuidado e credibilidade</h2>
                    </div>

                    <div className="pillar-grid">
                        {investmentPillars.map((pillar) => (
                            <article key={pillar.title} className="pillar-card">
                                <h3>{pillar.title}</h3>
                                <p>{pillar.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="partner-section partner-quote-section">
                    <blockquote className="partner-quote">
                        <p>
                            “É como um banco personalizado e com um gerente exclusivo.”
                        </p>
                        <cite>Tenha acesso aos melhores contratos de diferentes instituições financeiras com um atendimento único e personalizado ao perfil.</cite>
                    </blockquote>

                    <div className="trust-card">
                        <span className="section-tag">Confiança</span>
                        <ul className="trust-list">
                            {trustHighlights.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="partner-footer-card">
                    <div>
                        <span className="section-tag">Próximo passo</span>
                        <h2>Explore os serviços, conteúdos e canais oficiais da Eterna Capital</h2>
                        <p>
                            Veja detalhes sobre assessoria, investimentos, soluções PJ, seguros,
                            equipe e conteúdo de mercado diretamente no site do parceiro.
                        </p>
                    </div>

                    <div className="partner-actions footer-actions">
                        <a
                            className="partner-primary-cta"
                            href="https://www.eternacapital.com.br/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Acessar site oficial
                        </a>
                        <a
                            className="partner-link"
                            href="https://www.eternacapital.com.br/contato/"
                            target="_blank"
                            rel="noreferrer"
                        >
                            Falar com a Eterna
                        </a>
                        <button className="back-button partner-secondary-cta" onClick={onBack}>
                            Voltar ao início
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EternaCapital;