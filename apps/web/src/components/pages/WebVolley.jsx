import React, { useEffect, useState } from 'react';
import './PageStyle.css';
import './WebVolley.css';
import { api } from '../../utils/api';

const fallbackLatestNews = [
    {
        title: 'Sesc RJ Flamengo vence o Sesi Bauru e cola no líder Minas. Veja a classificação',
        category: 'Superliga Feminina',
        date: '14 mar 2026',
        excerpt: 'O time de Bernardinho voltou a vencer no Maracanãzinho, encostou no topo da tabela e reacendeu a disputa pela liderança da Superliga.',
        link: 'https://webvolei.com.br/sesc-rj-flamengo-vence-o-sesi-bauru-e-cola-no-lider-minas-veja-a-classificacao/',
        image: 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png',
    },
    {
        title: 'Douglas Souza sobre a Seleção: "Hoje estou disposto a voltar"',
        category: 'Seleção Brasileira',
        date: '14 mar 2026',
        excerpt: 'O campeão olímpico abriu o jogo sobre a possibilidade de retornar à Seleção e detalhou o novo momento da carreira no ciclo atual.',
        link: 'https://webvolei.com.br/douglas-souza-sobre-a-selecao-hoje-estou-disposto-a-voltar/',
        image: 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png',
    },
    {
        title: 'Praia, com Macris no banco, vence o Flu e volta ao 3º lugar',
        category: 'Superliga Feminina',
        date: '13 mar 2026',
        excerpt: 'O Dentil/Praia Clube retomou a terceira posição com uma atuação consistente e destaque coletivo na reta final da fase classificatória.',
        link: 'https://webvolei.com.br/praia-com-macris-no-banco-vence-o-flu-e-volta-ao-3o-lugar/',
        image: 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png',
    },
    {
        title: 'Maringá vence, encosta no Fluminense e sonha com a sexta posição nos playoffs',
        category: 'Superliga Feminina',
        date: '13 mar 2026',
        excerpt: 'A equipe paranaense manteve a boa fase, reduziu a distância para o G6 e segue viva na briga por uma chave melhor no mata-mata.',
        link: 'https://webvolei.com.br/maringa-vence-encosta-no-fluminense-e-sonha-com-a-sexta-posicao-nos-playoffs/',
        image: 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png',
    },
    {
        title: 'Oppenkoski quer Sada alegre na retomada da Superliga',
        category: 'Superliga Masculina',
        date: '13 mar 2026',
        excerpt: 'O oposto projetou a reta final da temporada e reforçou a importância de recuperar o ritmo competitivo diante da torcida celeste.',
        link: 'https://webvolei.com.br/oppenkoski-quer-sada-alegre-na-retomada-da-superliga/',
        image: 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png',
    },
    {
        title: 'Itália confirma amistosos de peso antes da VNL',
        category: 'Internacional',
        date: '13 mar 2026',
        excerpt: 'A seleção italiana definiu um calendário forte de amistosos para chegar afiada à Liga das Nações com testes de alto nível.',
        link: 'https://webvolei.com.br/italia-confirma-amistosos-de-peso-antes-da-vnl/',
        image: 'https://webvolei.com.br/wp-content/uploads/2021/07/cropped-logo-redondo-512x512.png',
    },
];

const WebVolley = ({ onBack }) => {
    const [newsItems, setNewsItems] = useState(fallbackLatestNews);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoadingNews, setIsLoadingNews] = useState(true);
    const [newsError, setNewsError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadLatestNews = async () => {
            try {
                setIsLoadingNews(true);
                setNewsError('');

                const data = await api.get('/api/public/news/webvolei');

                if (!isMounted) {
                    return;
                }

                if (Array.isArray(data?.news) && data.news.length > 0) {
                    setNewsItems(data.news);
                    setCurrentIndex(0);
                } else {
                    setNewsError('Nao foi possivel carregar as noticias ao vivo agora.');
                }
            } catch (error) {
                if (isMounted) {
                    console.error('[WEBVOLEI_NEWS_FETCH_ERROR]', error);
                    setNewsError('Nao foi possivel carregar as noticias ao vivo agora.');
                }
            } finally {
                if (isMounted) {
                    setIsLoadingNews(false);
                }
            }
        };

        loadLatestNews();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCurrentIndex((previousIndex) => (previousIndex + 1) % newsItems.length);
        }, 6000);

        return () => window.clearInterval(timer);
    }, [newsItems]);

    useEffect(() => {
        if (currentIndex >= newsItems.length) {
            setCurrentIndex(0);
        }
    }, [currentIndex, newsItems.length]);

    const handlePrevious = () => {
        setCurrentIndex((previousIndex) =>
            previousIndex === 0 ? newsItems.length - 1 : previousIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((previousIndex) => (previousIndex + 1) % newsItems.length);
    };

    return (
        <div className="page-container volleyball-news-page">
            <div className="volleyball-news-shell">
                <section className="webvolei-hero">
                    <div className="webvolei-copy">
                        <h1 className="page-title webvolei-title">Web Vôlei</h1>
                        <p className="webvolei-lead">
                            Se a ideia é acompanhar o voleibol além do placar, o Web Vôlei é uma
                            referência. O site reúne cobertura constante da Superliga, clubes,
                            seleções e cenário internacional com ritmo de redação esportiva e foco
                            total na modalidade.
                        </p>

                        <div className="webvolei-cta-row">
                            <a
                                className="webvolei-primary-cta"
                                href="https://webvolei.com.br/"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Acessar o Web Vôlei
                            </a>
                        </div>
                    </div>
                </section>

                <section className="webvolei-section webvolei-news-section">
                    <div className="section-heading webvolei-heading">
                        <span className="section-tag">Últimas notícias</span>
                        {isLoadingNews && (
                            <p className="webvolei-status-message">Sincronizando as últimas atualizações do site...</p>
                        )}
                        {newsError && !isLoadingNews && (
                            <p className="webvolei-status-message is-error">
                                {newsError} Exibindo os destaques de fallback da página.
                            </p>
                        )}
                    </div>

                    <div className="webvolei-carousel">
                        <div className="webvolei-carousel-frame">
                            <a
                                className="webvolei-news-card"
                                href={newsItems[currentIndex].link}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <div className="webvolei-news-image-wrap">
                                    <img
                                        className="webvolei-news-image"
                                        src={newsItems[currentIndex].image}
                                        alt={newsItems[currentIndex].title}
                                        loading="lazy"
                                    />
                                </div>

                                <div className="webvolei-news-content">
                                    <div className="webvolei-news-meta">
                                        <span>{newsItems[currentIndex].category}</span>
                                        <span>{newsItems[currentIndex].date}</span>
                                    </div>

                                    <h3>{newsItems[currentIndex].title}</h3>
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="webvolei-carousel-controls">
                        <button
                            type="button"
                            className="webvolei-nav-button"
                            onClick={handlePrevious}
                            aria-label="Notícia anterior"
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            className="webvolei-nav-button"
                            onClick={handleNext}
                            aria-label="Próxima notícia"
                        >
                            ›
                        </button>
                    </div>

                    <div className="webvolei-indicators" aria-label="Selecionar notícia">
                        {newsItems.map((item, index) => (
                            <button
                                key={item.link}
                                type="button"
                                className={`webvolei-indicator ${index === currentIndex ? 'is-active' : ''}`}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`Ir para a notícia ${index + 1}`}
                            />
                        ))}
                    </div>
                </section>

                <div className="webvolei-footer-actions webvolei-footer-standalone">
                    <button className="back-button webvolei-back-button" onClick={onBack}>
                        Voltar ao início
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WebVolley;