import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';


// country: { name, flag (emoji), nationality }
export const COUNTRIES = [
    { flag: '🇦🇫', name: 'Afeganistão', nationality: 'Afegã' },
    { flag: '🇿🇦', name: 'África do Sul', nationality: 'Sul-africana' },
    { flag: '🇦🇱', name: 'Albânia', nationality: 'Albanesa' },
    { flag: '🇩🇪', name: 'Alemanha', nationality: 'Alemã' },
    { flag: '🇦🇩', name: 'Andorra', nationality: 'Andorrana' },
    { flag: '🇦🇴', name: 'Angola', nationality: 'Angolana' },
    { flag: '🇦🇬', name: 'Antígua e Barbuda', nationality: 'Antiguana' },
    { flag: '🇸🇦', name: 'Arábia Saudita', nationality: 'Saudita' },
    { flag: '🇩🇿', name: 'Argélia', nationality: 'Argelina' },
    { flag: '🇦🇷', name: 'Argentina', nationality: 'Argentina' },
    { flag: '🇦🇲', name: 'Armênia', nationality: 'Armênia' },
    { flag: '🇦🇺', name: 'Austrália', nationality: 'Australiana' },
    { flag: '🇦🇹', name: 'Áustria', nationality: 'Austríaca' },
    { flag: '🇦🇿', name: 'Azerbaijão', nationality: 'Azerbaijana' },
    { flag: '🇧🇸', name: 'Bahamas', nationality: 'Bahamense' },
    { flag: '🇧🇩', name: 'Bangladesh', nationality: 'Bangladeshiana' },
    { flag: '🇧🇧', name: 'Barbados', nationality: 'Barbadiana' },
    { flag: '🇧🇭', name: 'Bahrein', nationality: 'Bareinita' },
    { flag: '🇧🇾', name: 'Belarus', nationality: 'Bielorrussa' },
    { flag: '🇧🇪', name: 'Bélgica', nationality: 'Belga' },
    { flag: '🇧🇿', name: 'Belize', nationality: 'Belizenha' },
    { flag: '🇧🇯', name: 'Benim', nationality: 'Beninense' },
    { flag: '🇧🇴', name: 'Bolívia', nationality: 'Boliviana' },
    { flag: '🇧🇦', name: 'Bósnia e Herzegovina', nationality: 'Bósnia' },
    { flag: '🇧🇼', name: 'Botsuana', nationality: 'Botsuanesa' },
    { flag: '🇧🇷', name: 'Brasil', nationality: 'Brasileira', alias: 'Brasileiro' },
    { flag: '🇧🇳', name: 'Brunei', nationality: 'Bruneiana' },
    { flag: '🇧🇬', name: 'Bulgária', nationality: 'Búlgara' },
    { flag: '🇧🇫', name: 'Burkina Faso', nationality: 'Burkinense' },
    { flag: '🇧🇮', name: 'Burundi', nationality: 'Burundiana' },
    { flag: '🇧🇹', name: 'Butão', nationality: 'Butanesa' },
    { flag: '🇨🇻', name: 'Cabo Verde', nationality: 'Cabo-verdiana' },
    { flag: '🇨🇲', name: 'Camarões', nationality: 'Camaronesa' },
    { flag: '🇰🇭', name: 'Camboja', nationality: 'Cambojana' },
    { flag: '🇨🇦', name: 'Canadá', nationality: 'Canadense' },
    { flag: '🇶🇦', name: 'Catar', nationality: 'Catarense' },
    { flag: '🇰🇿', name: 'Cazaquistão', nationality: 'Cazaque' },
    { flag: '🇹🇩', name: 'Chade', nationality: 'Chadiana' },
    { flag: '🇨🇱', name: 'Chile', nationality: 'Chilena' },
    { flag: '🇨🇳', name: 'China', nationality: 'Chinesa' },
    { flag: '🇨🇾', name: 'Chipre', nationality: 'Cipriota' },
    { flag: '🇨🇴', name: 'Colômbia', nationality: 'Colombiana' },
    { flag: '🇰🇲', name: 'Comores', nationality: 'Comoriana' },
    { flag: '🇨🇬', name: 'Congo', nationality: 'Congolesa' },
    { flag: '🇰🇵', name: 'Coreia do Norte', nationality: 'Norte-coreana' },
    { flag: '🇰🇷', name: 'Coreia do Sul', nationality: 'Sul-coreana' },
    { flag: '🇨🇮', name: 'Costa do Marfim', nationality: 'Marfinense' },
    { flag: '🇨🇷', name: 'Costa Rica', nationality: 'Costarriquenha' },
    { flag: '🇭🇷', name: 'Croácia', nationality: 'Croata' },
    { flag: '🇨🇺', name: 'Cuba', nationality: 'Cubana' },
    { flag: '🇩🇰', name: 'Dinamarca', nationality: 'Dinamarquesa' },
    { flag: '🇩🇯', name: 'Djibouti', nationality: 'Djiboutiana' },
    { flag: '🇪🇨', name: 'Equador', nationality: 'Equatoriana' },
    { flag: '🇪🇬', name: 'Egito', nationality: 'Egípcia' },
    { flag: '🇸🇻', name: 'El Salvador', nationality: 'Salvadorenha' },
    { flag: '🇦🇪', name: 'Emirados Árabes Unidos', nationality: 'Emiratense' },
    { flag: '🇸🇰', name: 'Eslováquia', nationality: 'Eslovaca' },
    { flag: '🇸🇮', name: 'Eslovênia', nationality: 'Eslovena' },
    { flag: '🇪🇸', name: 'Espanha', nationality: 'Espanhola' },
    { flag: '🇪🇹', name: 'Etiópia', nationality: 'Etíope' },
    { flag: '🇫🇯', name: 'Fiji', nationality: 'Fijiana' },
    { flag: '🇵🇭', name: 'Filipinas', nationality: 'Filipina' },
    { flag: '🇫🇮', name: 'Finlândia', nationality: 'Finlandesa' },
    { flag: '🇫🇷', name: 'França', nationality: 'Francesa' },
    { flag: '🇬🇦', name: 'Gabão', nationality: 'Gabonesa' },
    { flag: '🇬🇲', name: 'Gâmbia', nationality: 'Gambiana' },
    { flag: '🇬🇭', name: 'Gana', nationality: 'Ganesa' },
    { flag: '🇬🇪', name: 'Geórgia', nationality: 'Georgiana' },
    { flag: '🇬🇷', name: 'Grécia', nationality: 'Grega' },
    { flag: '🇬🇩', name: 'Granada', nationality: 'Granadina' },
    { flag: '🇬🇹', name: 'Guatemala', nationality: 'Guatemalteca' },
    { flag: '🇬🇳', name: 'Guiné', nationality: 'Guineense' },
    { flag: '🇬🇼', name: 'Guiné-Bissau', nationality: 'Guinéria' },
    { flag: '🇬🇾', name: 'Guiana', nationality: 'Guianense' },
    { flag: '🇭🇹', name: 'Haiti', nationality: 'Haitiana' },
    { flag: '🇭🇳', name: 'Honduras', nationality: 'Hondurenha' },
    { flag: '🇭🇺', name: 'Hungria', nationality: 'Húngara' },
    { flag: '🇾🇪', name: 'Iêmen', nationality: 'Iemenita' },
    { flag: '🇮🇳', name: 'Índia', nationality: 'Indiana' },
    { flag: '🇮🇩', name: 'Indonésia', nationality: 'Indonésia' },
    { flag: '🇮🇶', name: 'Iraque', nationality: 'Iraquiana' },
    { flag: '🇮🇷', name: 'Irã', nationality: 'Iraniana' },
    { flag: '🇮🇪', name: 'Irlanda', nationality: 'Irlandesa' },
    { flag: '🇮🇸', name: 'Islândia', nationality: 'Islandesa' },
    { flag: '🇮🇱', name: 'Israel', nationality: 'Israelense' },
    { flag: '🇮🇹', name: 'Itália', nationality: 'Italiana' },
    { flag: '🇯🇲', name: 'Jamaica', nationality: 'Jamaicana' },
    { flag: '🇯🇵', name: 'Japão', nationality: 'Japonesa' },
    { flag: '🇯🇴', name: 'Jordânia', nationality: 'Jordaniana' },
    { flag: '🇰🇼', name: 'Kuwait', nationality: 'Kuwaitiana' },
    { flag: '🇱🇦', name: 'Laos', nationality: 'Laociana' },
    { flag: '🇱🇸', name: 'Lesoto', nationality: 'Lesotiana' },
    { flag: '🇱🇧', name: 'Líbano', nationality: 'Libanesa' },
    { flag: '🇱🇷', name: 'Libéria', nationality: 'Liberiana' },
    { flag: '🇱🇾', name: 'Líbia', nationality: 'Líbia' },
    { flag: '🇱🇮', name: 'Liechtenstein', nationality: 'Liechtensteinense' },
    { flag: '🇱🇹', name: 'Lituânia', nationality: 'Lituana' },
    { flag: '🇱🇺', name: 'Luxemburgo', nationality: 'Luxemburguesa' },
    { flag: '🇲🇰', name: 'Macedônia do Norte', nationality: 'Macedônia' },
    { flag: '🇲🇬', name: 'Madagascar', nationality: 'Malgaxe' },
    { flag: '🇲🇾', name: 'Malásia', nationality: 'Malaia' },
    { flag: '🇲🇼', name: 'Malawi', nationality: 'Malawiana' },
    { flag: '🇲🇻', name: 'Maldivas', nationality: 'Maldívia' },
    { flag: '🇲🇱', name: 'Mali', nationality: 'Maliana' },
    { flag: '🇲🇹', name: 'Malta', nationality: 'Maltesa' },
    { flag: '🇲🇦', name: 'Marrocos', nationality: 'Marroquina' },
    { flag: '🇲🇺', name: 'Maurício', nationality: 'Mauriciana' },
    { flag: '🇲🇷', name: 'Mauritânia', nationality: 'Mauritana' },
    { flag: '🇲🇽', name: 'México', nationality: 'Mexicana' },
    { flag: '🇫🇲', name: 'Micronésia', nationality: 'Micronésia' },
    { flag: '🇲🇿', name: 'Moçambique', nationality: 'Moçambicana' },
    { flag: '🇲🇩', name: 'Moldávia', nationality: 'Moldava' },
    { flag: '🇲🇨', name: 'Mônaco', nationality: 'Monegasca' },
    { flag: '🇲🇳', name: 'Mongólia', nationality: 'Mongol' },
    { flag: '🇲🇪', name: 'Montenegro', nationality: 'Montenegrina' },
    { flag: '🇲🇲', name: 'Myanmar', nationality: 'Birmanesa' },
    { flag: '🇳🇦', name: 'Namíbia', nationality: 'Namibiana' },
    { flag: '🇳🇷', name: 'Nauru', nationality: 'Nauruana' },
    { flag: '🇳🇵', name: 'Nepal', nationality: 'Nepalesa' },
    { flag: '🇳🇮', name: 'Nicarágua', nationality: 'Nicaraguense' },
    { flag: '🇳🇪', name: 'Níger', nationality: 'Nigerina' },
    { flag: '🇳🇬', name: 'Nigéria', nationality: 'Nigeriana' },
    { flag: '🇳🇴', name: 'Noruega', nationality: 'Norueguesa' },
    { flag: '🇳🇿', name: 'Nova Zelândia', nationality: 'Neozelandesa' },
    { flag: '🇴🇲', name: 'Omã', nationality: 'Omanense' },
    { flag: '🇳🇱', name: 'Países Baixos', nationality: 'Holandesa' },
    { flag: '🇵🇼', name: 'Palau', nationality: 'Palauense' },
    { flag: '🇵🇸', name: 'Palestina', nationality: 'Palestina' },
    { flag: '🇵🇦', name: 'Panamá', nationality: 'Panamenha' },
    { flag: '🇵🇬', name: 'Papua Nova Guiné', nationality: 'Papua' },
    { flag: '🇵🇾', name: 'Paraguai', nationality: 'Paraguaia' },
    { flag: '🇵🇪', name: 'Peru', nationality: 'Peruana' },
    { flag: '🇵🇱', name: 'Polônia', nationality: 'Polonesa' },
    { flag: '🇵🇹', name: 'Portugal', nationality: 'Portuguesa' },
    { flag: '🇰🇪', name: 'Quênia', nationality: 'Queniana' },
    { flag: '🇰🇬', name: 'Quirguistão', nationality: 'Quirguiz' },
    { flag: '🇨🇫', name: 'República Centro-Africana', nationality: 'Centro-africana' },
    { flag: '🇨🇿', name: 'República Tcheca', nationality: 'Tcheca' },
    { flag: '🇷🇴', name: 'Romênia', nationality: 'Romena' },
    { flag: '🇷🇼', name: 'Ruanda', nationality: 'Ruandesa' },
    { flag: '🇷🇺', name: 'Rússia', nationality: 'Russa' },
    { flag: '🇸🇧', name: 'Ilhas Salomão', nationality: 'Salomônica' },
    { flag: '🇼🇸', name: 'Samoa', nationality: 'Samoana' },
    { flag: '🇸🇹', name: 'São Tomé e Príncipe', nationality: 'São-tomense' },
    { flag: '🇸🇳', name: 'Senegal', nationality: 'Senegalesa' },
    { flag: '🇸🇱', name: 'Serra Leoa', nationality: 'Serra-leonesa' },
    { flag: '🇷🇸', name: 'Sérvia', nationality: 'Sérvia' },
    { flag: '🇸🇨', name: 'Seicheles', nationality: 'Seichelense' },
    { flag: '🇸🇬', name: 'Singapura', nationality: 'Singapuriana' },
    { flag: '🇸🇾', name: 'Síria', nationality: 'Síria' },
    { flag: '🇸🇴', name: 'Somália', nationality: 'Somali' },
    { flag: '🇱🇰', name: 'Sri Lanka', nationality: 'Cingalesa' },
    { flag: '🇸🇿', name: 'Suazilândia', nationality: 'Suaze' },
    { flag: '🇸🇩', name: 'Sudão', nationality: 'Sudanesa' },
    { flag: '🇸🇸', name: 'Sudão do Sul', nationality: 'Sul-sudanesa' },
    { flag: '🇸🇪', name: 'Suécia', nationality: 'Sueca' },
    { flag: '🇨🇭', name: 'Suíça', nationality: 'Suíça' },
    { flag: '🇸🇷', name: 'Suriname', nationality: 'Surinamesa' },
    { flag: '🇹🇯', name: 'Tadjiquistão', nationality: 'Tadjique' },
    { flag: '🇹🇭', name: 'Tailândia', nationality: 'Tailandesa' },
    { flag: '🇹🇹', name: 'Trinidad e Tobago', nationality: 'Trinitária' },
    { flag: '🇹🇳', name: 'Tunísia', nationality: 'Tunisiana' },
    { flag: '🇹🇲', name: 'Turquemenistão', nationality: 'Turcomana' },
    { flag: '🇹🇷', name: 'Turquia', nationality: 'Turca' },
    { flag: '🇺🇬', name: 'Uganda', nationality: 'Ugandense' },
    { flag: '🇺🇦', name: 'Ucrânia', nationality: 'Ucraniana' },
    { flag: '🇺🇾', name: 'Uruguai', nationality: 'Uruguaia' },
    { flag: '🇺🇿', name: 'Uzbequistão', nationality: 'Uzbeque' },
    { flag: '🇻🇺', name: 'Vanuatu', nationality: 'Vanuatuana' },
    { flag: '🇻🇪', name: 'Venezuela', nationality: 'Venezuelana' },
    { flag: '🇻🇳', name: 'Vietnã', nationality: 'Vietnamita' },
    { flag: '🇺🇸', name: 'Estados Unidos', nationality: 'Norte-americana' },
    { flag: '🇬🇧', name: 'Reino Unido', nationality: 'Britânica' },
    { flag: '🇿🇲', name: 'Zâmbia', nationality: 'Zambiana' },
    { flag: '🇿🇼', name: 'Zimbábue', nationality: 'Zimbabuana' },
];

/**
 * Derives the 2-letter ISO 3166-1 alpha-2 country code from a flag emoji.
 * Flag emojis are composed of Regional Indicator Symbols: 🇧🇷 = BR → 'br'
 */
export function flagEmojiToCode(flagEmoji) {
    return [...flagEmoji]
        .map(c => String.fromCharCode(c.codePointAt(0) - 0x1F1E6 + 65))
        .join('')
        .toLowerCase();
}

/**
 * Returns a flagcdn.com image URL for a given country from COUNTRIES list.
 * @param {string} nationality - the stored nationality string
 * @param {'24x18'|'32x24'|'48x36'|'64x48'} size
 */
export function getNationalityFlagUrl(nationality, size = '24x18') {
    const country = COUNTRIES.find(c => c.nationality === nationality || c.name === nationality);
    if (!country) return null;
    const code = flagEmojiToCode(country.flag);
    return `https://flagcdn.com/${size}/${code}.png`;
}

/** Maps Portuguese language names to their representative country ISO code */
export const LANGUAGE_FLAGS = {
    'Português': 'br',
    'Inglês': 'gb',
    'Espanhol': 'es',
    'Francês': 'fr',
    'Alemão': 'de',
    'Italiano': 'it',
    'Japonês': 'jp',
    'Chinês (Mandarim)': 'cn',
    'Chinês (Cantonês)': 'cn',
    'Árabe': 'sa',
    'Russo': 'ru',
    'Coreano': 'kr',
    'Holandês': 'nl',
    'Sueco': 'se',
    'Norueguês': 'no',
    'Dinamarquês': 'dk',
    'Finlandês': 'fi',
    'Polonês': 'pl',
    'Tcheco': 'cz',
    'Eslovaco': 'sk',
    'Húngaro': 'hu',
    'Romeno': 'ro',
    'Búlgaro': 'bg',
    'Croata': 'hr',
    'Sérvio': 'rs',
    'Esloveno': 'si',
    'Albanês': 'al',
    'Grego': 'gr',
    'Turco': 'tr',
    'Hebraico': 'il',
    'Hindi': 'in',
    'Bengali': 'bd',
    'Urdu': 'pk',
    'Persa': 'ir',
    'Panjabi': 'in',
    'Tailandês': 'th',
    'Vietnamita': 'vn',
    'Indonésio': 'id',
    'Malaio': 'my',
    'Filipino': 'ph',
    'Birmanês': 'mm',
    'Khmer': 'kh',
    'Ucraniano': 'ua',
    'Bielorrusso': 'by',
    'Georgiano': 'ge',
    'Armênio': 'am',
    'Azerbaijano': 'az',
    'Cazaque': 'kz',
    'Uzbeque': 'uz',
    'Mongol': 'mn',
    'Suaíle': 'tz',
    'Hauçá': 'ng',
    'Iorubá': 'ng',
    'Igbo': 'ng',
    'Somali': 'so',
    'Amárico': 'et',
    'Malgaxe': 'mg',
    'Latim': 'va',
    'Esperanto': 'eu',
    'Catalão': 'es',
    'Basco': 'es',
    'Galego': 'es',
    'Irlandês': 'ie',
    'Galês': 'gb',
    'Maltês': 'mt',
};

/**
 * Returns a flagcdn.com image URL for a language name.
 */
export function getLanguageFlagUrl(languageName, size = '24x18') {
    const code = LANGUAGE_FLAGS[languageName];
    if (!code) return null;
    return `https://flagcdn.com/${size}/${code}.png`;
}


export default function CountrySearch({ value, onChange, placeholder = 'Ex: Brasil', required = false }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Sync query when value changes externally
    useEffect(() => {
        if (value) {
            const found = COUNTRIES.find(c => c.nationality === value || c.name === value);
            setQuery(found ? found.nationality : value);
        } else {
            setQuery('');
        }
    }, [value]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reposition dropdown on scroll/resize when open
    useEffect(() => {
        if (!open) return;
        const reposition = () => {
            if (!inputRef.current) return;
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownStyle({
                position: 'fixed',
                top: rect.bottom + 4,
                left: rect.left,
                width: rect.width,
                zIndex: 99999,
            });
        };
        reposition();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [open, suggestions]);

    const openDropdown = (filtered) => {
        if (!inputRef.current) return;
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
        });
        setOpen(true);
    };

    const handleInput = (e) => {
        const val = e.target.value;
        setQuery(val);
        onChange(val);

        if (val.trim().length === 0) {
            setSuggestions([]);
            setOpen(false);
        } else {
            const valLower = val.toLowerCase();
            const filtered = COUNTRIES.filter(c =>
                c.name.toLowerCase().includes(valLower) ||
                c.nationality.toLowerCase().includes(valLower) ||
                (c.alias && c.alias.toLowerCase().includes(valLower))
            );
            setSuggestions(filtered);
            if (filtered.length > 0) openDropdown(filtered);
            else setOpen(false);
        }
    };

    const handleSelect = (country) => {
        setQuery(country.nationality);
        onChange(country.nationality);
        setSuggestions([]);
        setOpen(false);
    };

    // find flag for the current value
    const selectedCountry = COUNTRIES.find(c => c.nationality === value || c.name === value);

    const dropdown = open && (
        <ul style={{
            ...dropdownStyle,
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            listStyle: 'none',
            padding: '0.4rem 0',
            margin: 0,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            overflowY: 'auto',
            maxHeight: '250px',
        }}>
            {suggestions.map((country) => (
                <li
                    key={country.name}
                    onMouseDown={() => handleSelect(country)}
                    style={{
                        padding: '0.55rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{country.flag}</span>
                    <span>
                        <span style={{ opacity: 0.55, fontSize: '0.8rem', marginRight: '0.4rem' }}>
                            {country.name}
                        </span>
                        {country.nationality}
                    </span>
                </li>
            ))}
        </ul>
    );

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {selectedCountry && (
                    <span style={{
                        position: 'absolute',
                        left: '0.75rem',
                        fontSize: '1.3rem',
                        pointerEvents: 'none',
                        lineHeight: 1,
                    }}>
                        {selectedCountry.flag}
                    </span>
                )}
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInput}
                    onFocus={() => {
                        if (suggestions.length > 0) openDropdown(suggestions);
                    }}
                    placeholder={placeholder}
                    required={required}
                    autoComplete="off"
                    style={selectedCountry ? { paddingLeft: '2.5rem' } : {}}
                />
            </div>
            {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
        </div>
    );
}
