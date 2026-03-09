import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';


// country: { name, flag (emoji), nationality }
export const COUNTRIES = [
    { flag: '🇦🇫', name: 'Afghanistan', nationality: 'Afghan' },
    { flag: '🇿🇦', name: 'South Africa', nationality: 'South African' },
    { flag: '🇦🇱', name: 'Albania', nationality: 'Albanian' },
    { flag: '🇩🇪', name: 'Germany', nationality: 'German' },
    { flag: '🇦🇩', name: 'Andorra', nationality: 'Andorran' },
    { flag: '🇦🇴', name: 'Angola', nationality: 'Angolan' },
    { flag: '🇦🇬', name: 'Antigua and Barbuda', nationality: 'Antiguan' },
    { flag: '🇸🇦', name: 'Saudi Arabia', nationality: 'Saudi' },
    { flag: '🇩🇿', name: 'Algeria', nationality: 'Algerian' },
    { flag: '🇦🇷', name: 'Argentina', nationality: 'Argentine' },
    { flag: '🇦🇲', name: 'Armenia', nationality: 'Armenian' },
    { flag: '🇦🇺', name: 'Australia', nationality: 'Australian' },
    { flag: '🇦🇹', name: 'Austria', nationality: 'Austrian' },
    { flag: '🇦🇿', name: 'Azerbaijan', nationality: 'Azerbaijani' },
    { flag: '🇧🇸', name: 'Bahamas', nationality: 'Bahamian' },
    { flag: '🇧🇩', name: 'Bangladesh', nationality: 'Bangladeshi' },
    { flag: '🇧🇧', name: 'Barbados', nationality: 'Barbadian' },
    { flag: '🇧🇭', name: 'Bahrain', nationality: 'Bahraini' },
    { flag: '🇧🇾', name: 'Belarus', nationality: 'Belarusian' },
    { flag: '🇧🇪', name: 'Belgium', nationality: 'Belgian' },
    { flag: '🇧🇿', name: 'Belize', nationality: 'Belizean' },
    { flag: '🇧🇯', name: 'Benin', nationality: 'Beninese' },
    { flag: '🇧🇴', name: 'Bolivia', nationality: 'Bolivian' },
    { flag: '🇧🇦', name: 'Bosnia and Herzegovina', nationality: 'Bosnian' },
    { flag: '🇧🇼', name: 'Botswana', nationality: 'Botswanan' },
    { flag: '🇧🇷', name: 'Brazil', nationality: 'Brazilian', alias: 'Brazilian' },
    { flag: '🇧🇳', name: 'Brunei', nationality: 'Bruneian' },
    { flag: '🇧🇬', name: 'Bulgaria', nationality: 'Bulgarian' },
    { flag: '🇧🇫', name: 'Burkina Faso', nationality: 'Burkinabe' },
    { flag: '🇧🇮', name: 'Burundi', nationality: 'Burundian' },
    { flag: '🇧🇹', name: 'Bhutan', nationality: 'Bhutanese' },
    { flag: '🇨🇻', name: 'Cape Verde', nationality: 'Cape Verdean' },
    { flag: '🇨🇲', name: 'Cameroon', nationality: 'Cameroonian' },
    { flag: '🇰🇭', name: 'Cambodia', nationality: 'Cambodian' },
    { flag: '🇨🇦', name: 'Canada', nationality: 'Canadian' },
    { flag: '🇶🇦', name: 'Qatar', nationality: 'Qatari' },
    { flag: '🇰🇿', name: 'Kazakhstan', nationality: 'Kazakhstani' },
    { flag: '🇹🇩', name: 'Chad', nationality: 'Chadian' },
    { flag: '🇨🇱', name: 'Chile', nationality: 'Chilean' },
    { flag: '🇨🇳', name: 'China', nationality: 'Chinese' },
    { flag: '🇨🇾', name: 'Cyprus', nationality: 'Cypriot' },
    { flag: '🇨🇴', name: 'Colombia', nationality: 'Colombian' },
    { flag: '🇰🇲', name: 'Comoros', nationality: 'Comorian' },
    { flag: '🇨🇬', name: 'Congo', nationality: 'Congolese' },
    { flag: '🇰🇵', name: 'North Korea', nationality: 'North Korean' },
    { flag: '🇰🇷', name: 'South Korea', nationality: 'South Korean' },
    { flag: '🇨🇮', name: 'Ivory Coast', nationality: 'Ivorian' },
    { flag: '🇨🇷', name: 'Costa Rica', nationality: 'Costa Rican' },
    { flag: '🇭🇷', name: 'Croatia', nationality: 'Croatian' },
    { flag: '🇨🇺', name: 'Cuba', nationality: 'Cuban' },
    { flag: '🇩🇰', name: 'Denmark', nationality: 'Danish' },
    { flag: '🇩🇯', name: 'Djibouti', nationality: 'Djiboutian' },
    { flag: '🇪🇨', name: 'Ecuador', nationality: 'Ecuadorian' },
    { flag: '🇪🇬', name: 'Egypt', nationality: 'Egyptian' },
    { flag: '🇸🇻', name: 'El Salvador', nationality: 'Salvadoran' },
    { flag: '🇦🇪', name: 'United Arab Emirates', nationality: 'Emirati' },
    { flag: '🇸🇰', name: 'Slovakia', nationality: 'Slovak' },
    { flag: '🇸🇮', name: 'Slovenia', nationality: 'Slovenian' },
    { flag: '🇪🇸', name: 'Spain', nationality: 'Spanish' },
    { flag: '🇪🇹', name: 'Ethiopia', nationality: 'Ethiopian' },
    { flag: '🇫🇯', name: 'Fiji', nationality: 'Fijian' },
    { flag: '🇵🇭', name: 'Philippines', nationality: 'Filipino' },
    { flag: '🇫🇮', name: 'Finland', nationality: 'Finnish' },
    { flag: '🇫🇷', name: 'France', nationality: 'French' },
    { flag: '🇬🇦', name: 'Gabon', nationality: 'Gabonese' },
    { flag: '🇬🇲', name: 'Gambia', nationality: 'Gambian' },
    { flag: '🇬🇭', name: 'Ghana', nationality: 'Ghanaian' },
    { flag: '🇬🇪', name: 'Georgia', nationality: 'Georgian' },
    { flag: '🇬🇷', name: 'Greece', nationality: 'Greek' },
    { flag: '🇬🇩', name: 'Grenada', nationality: 'Grenadian' },
    { flag: '🇬🇹', name: 'Guatemala', nationality: 'Guatemalan' },
    { flag: '🇬🇳', name: 'Guinea', nationality: 'Guinean' },
    { flag: '🇬🇼', name: 'Guinea-Bissau', nationality: 'Bissau-Guinean' },
    { flag: '🇬🇾', name: 'Guyana', nationality: 'Guyanese' },
    { flag: '🇭🇹', name: 'Haiti', nationality: 'Haitian' },
    { flag: '🇭🇳', name: 'Honduras', nationality: 'Honduran' },
    { flag: '🇭🇺', name: 'Hungary', nationality: 'Hungarian' },
    { flag: '🇾🇪', name: 'Yemen', nationality: 'Yemeni' },
    { flag: '🇮🇳', name: 'India', nationality: 'Indian' },
    { flag: '🇮🇩', name: 'Indonesia', nationality: 'Indonesian' },
    { flag: '🇮🇶', name: 'Iraq', nationality: 'Iraqi' },
    { flag: '🇮🇷', name: 'Iran', nationality: 'Iranian' },
    { flag: '🇮🇪', name: 'Ireland', nationality: 'Irish' },
    { flag: '🇮🇸', name: 'Iceland', nationality: 'Icelandic' },
    { flag: '🇮🇱', name: 'Israel', nationality: 'Israeli' },
    { flag: '🇮🇹', name: 'Italy', nationality: 'Italian' },
    { flag: '🇯🇲', name: 'Jamaica', nationality: 'Jamaican' },
    { flag: '🇯🇵', name: 'Japan', nationality: 'Japanese' },
    { flag: '🇯🇴', name: 'Jordan', nationality: 'Jordanian' },
    { flag: '🇰🇼', name: 'Kuwait', nationality: 'Kuwaiti' },
    { flag: '🇱🇦', name: 'Laos', nationality: 'Lao' },
    { flag: '🇱🇸', name: 'Lesotho', nationality: 'Basotho' },
    { flag: '🇱🇧', name: 'Lebanon', nationality: 'Lebanese' },
    { flag: '🇱🇷', name: 'Liberia', nationality: 'Liberian' },
    { flag: '🇱🇾', name: 'Libya', nationality: 'Libyan' },
    { flag: '🇱🇮', name: 'Liechtenstein', nationality: 'Liechtensteiner' },
    { flag: '🇱🇹', name: 'Lithuania', nationality: 'Lithuanian' },
    { flag: '🇱🇺', name: 'Luxembourg', nationality: 'Luxembourgish' },
    { flag: '🇲🇰', name: 'North Macedonia', nationality: 'Macedonian' },
    { flag: '🇲🇬', name: 'Madagascar', nationality: 'Malagasy' },
    { flag: '🇲🇾', name: 'Malaysia', nationality: 'Malaysian' },
    { flag: '🇲🇼', name: 'Malawi', nationality: 'Malawian' },
    { flag: '🇲🇻', name: 'Maldives', nationality: 'Maldivian' },
    { flag: '🇲🇱', name: 'Mali', nationality: 'Malian' },
    { flag: '🇲🇹', name: 'Malta', nationality: 'Maltese' },
    { flag: '🇲🇦', name: 'Morocco', nationality: 'Moroccan' },
    { flag: '🇲🇺', name: 'Mauritius', nationality: 'Mauritian' },
    { flag: '🇲🇷', name: 'Mauritania', nationality: 'Mauritanian' },
    { flag: '🇲🇽', name: 'Mexico', nationality: 'Mexican' },
    { flag: '🇫🇲', name: 'Micronesia', nationality: 'Micronesian' },
    { flag: '🇲🇿', name: 'Mozambique', nationality: 'Mozambican' },
    { flag: '🇲🇩', name: 'Moldova', nationality: 'Moldovan' },
    { flag: '🇲🇨', name: 'Monaco', nationality: 'Monegasque' },
    { flag: '🇲🇳', name: 'Mongolia', nationality: 'Mongolian' },
    { flag: '🇲🇪', name: 'Montenegro', nationality: 'Montenegrin' },
    { flag: '🇲🇲', name: 'Myanmar', nationality: 'Burmese' },
    { flag: '🇳🇦', name: 'Namibia', nationality: 'Namibian' },
    { flag: '🇳🇷', name: 'Nauru', nationality: 'Nauruan' },
    { flag: '🇳🇵', name: 'Nepal', nationality: 'Nepalese' },
    { flag: '🇳🇮', name: 'Nicaragua', nationality: 'Nicaraguan' },
    { flag: '🇳🇪', name: 'Niger', nationality: 'Nigerien' },
    { flag: '🇳🇬', name: 'Nigeria', nationality: 'Nigerian' },
    { flag: '🇳🇴', name: 'Norway', nationality: 'Norwegian' },
    { flag: '🇳🇿', name: 'New Zealand', nationality: 'New Zealander' },
    { flag: '🇴🇲', name: 'Oman', nationality: 'Omani' },
    { flag: '🇳🇱', name: 'Netherlands', nationality: 'Dutch' },
    { flag: '🇵🇼', name: 'Palau', nationality: 'Palauan' },
    { flag: '🇵🇸', name: 'Palestine', nationality: 'Palestinian' },
    { flag: '🇵🇦', name: 'Panama', nationality: 'Panamanian' },
    { flag: '🇵🇬', name: 'Papua New Guinea', nationality: 'Papua New Guinean' },
    { flag: '🇵🇾', name: 'Paraguay', nationality: 'Paraguayan' },
    { flag: '🇵🇪', name: 'Peru', nationality: 'Peruvian' },
    { flag: '🇵🇱', name: 'Poland', nationality: 'Polish' },
    { flag: '🇵🇹', name: 'Portugal', nationality: 'Portuguese' },
    { flag: '🇰🇪', name: 'Kenya', nationality: 'Kenyan' },
    { flag: '🇰🇬', name: 'Kyrgyzstan', nationality: 'Kyrgyzstani' },
    { flag: '🇨🇫', name: 'Central African Republic', nationality: 'Central African' },
    { flag: '🇨🇿', name: 'Czech Republic', nationality: 'Czech' },
    { flag: '🇷🇴', name: 'Romania', nationality: 'Romanian' },
    { flag: '🇷🇼', name: 'Rwanda', nationality: 'Rwandan' },
    { flag: '🇷🇺', name: 'Russia', nationality: 'Russian' },
    { flag: '🇸🇧', name: 'Solomon Islands', nationality: 'Solomon Islander' },
    { flag: '🇼🇸', name: 'Samoa', nationality: 'Samoan' },
    { flag: '🇸🇹', name: 'Sao Tome and Principe', nationality: 'Santomean' },
    { flag: '🇸🇳', name: 'Senegal', nationality: 'Senegalese' },
    { flag: '🇸🇱', name: 'Sierra Leone', nationality: 'Sierra Leonean' },
    { flag: '🇷🇸', name: 'Serbia', nationality: 'Serbian' },
    { flag: '🇸🇨', name: 'Seychelles', nationality: 'Seychellois' },
    { flag: '🇸🇬', name: 'Singapore', nationality: 'Singaporean' },
    { flag: '🇸🇾', name: 'Syria', nationality: 'Syrian' },
    { flag: '🇸🇴', name: 'Somalia', nationality: 'Somali' },
    { flag: '🇱🇰', name: 'Sri Lanka', nationality: 'Sri Lankan' },
    { flag: '🇸🇿', name: 'Swaziland', nationality: 'Swazi' },
    { flag: '🇸🇩', name: 'Sudan', nationality: 'Sudanese' },
    { flag: '🇸🇸', name: 'South Sudan', nationality: 'South Sudanese' },
    { flag: '🇸🇪', name: 'Sweden', nationality: 'Swedish' },
    { flag: '🇨🇭', name: 'Switzerland', nationality: 'Swiss' },
    { flag: '🇸🇷', name: 'Suriname', nationality: 'Surinamer' },
    { flag: '🇹🇯', name: 'Tajikistan', nationality: 'Tajikistani' },
    { flag: '🇹🇭', name: 'Thailand', nationality: 'Thai' },
    { flag: '🇹🇹', name: 'Trinidad and Tobago', nationality: 'Trinidadian' },
    { flag: '🇹🇳', name: 'Tunisia', nationality: 'Tunisian' },
    { flag: '🇹🇲', name: 'Turkmenistan', nationality: 'Turkmen' },
    { flag: '🇹🇷', name: 'Turkey', nationality: 'Turkish' },
    { flag: '🇺🇬', name: 'Uganda', nationality: 'Ugandan' },
    { flag: '🇺🇦', name: 'Ukraine', nationality: 'Ukrainian' },
    { flag: '🇺🇾', name: 'Uruguay', nationality: 'Uruguayan' },
    { flag: '🇺🇿', name: 'Uzbekistan', nationality: 'Uzbekistani' },
    { flag: '🇻🇺', name: 'Vanuatu', nationality: 'Ni-Vanuatu' },
    { flag: '🇻🇪', name: 'Venezuela', nationality: 'Venezuelan' },
    { flag: '🇻🇳', name: 'Vietnam', nationality: 'Vietnamese' },
    { flag: '🇺🇸', name: 'United States', nationality: 'American' },
    { flag: '🇬🇧', name: 'United Kingdom', nationality: 'British' },
    { flag: '🇿🇲', name: 'Zambia', nationality: 'Zambian' },
    { flag: '🇿🇼', name: 'Zimbabwe', nationality: 'Zimbabwean' },
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

/** Maps language names to their representative country ISO code */
export const LANGUAGE_FLAGS = {
    'Portuguese': 'br',
    'English': 'gb',
    'Spanish': 'es',
    'French': 'fr',
    'German': 'de',
    'Italian': 'it',
    'Japanese': 'jp',
    'Chinese (Mandarin)': 'cn',
    'Chinese (Cantonese)': 'cn',
    'Arabic': 'sa',
    'Russian': 'ru',
    'Korean': 'kr',
    'Dutch': 'nl',
    'Swedish': 'se',
    'Norwegian': 'no',
    'Danish': 'dk',
    'Finnish': 'fi',
    'Polish': 'pl',
    'Czech': 'cz',
    'Slovak': 'sk',
    'Hungarian': 'hu',
    'Romanian': 'ro',
    'Bulgarian': 'bg',
    'Croatian': 'hr',
    'Serbian': 'rs',
    'Slovenian': 'si',
    'Albanian': 'al',
    'Greek': 'gr',
    'Turkish': 'tr',
    'Hebrew': 'il',
    'Hindi': 'in',
    'Bengali': 'bd',
    'Urdu': 'pk',
    'Persian': 'ir',
    'Punjabi': 'in',
    'Thai': 'th',
    'Vietnamese': 'vn',
    'Indonesian': 'id',
    'Malay': 'my',
    'Filipino': 'ph',
    'Burmese': 'mm',
    'Khmer': 'kh',
    'Ukrainian': 'ua',
    'Belarusian': 'by',
    'Georgian': 'ge',
    'Armenian': 'am',
    'Azerbaijani': 'az',
    'Kazakh': 'kz',
    'Uzbek': 'uz',
    'Mongolian': 'mn',
    'Swahili': 'tz',
    'Hausa': 'ng',
    'Yoruba': 'ng',
    'Igbo': 'ng',
    'Somali': 'so',
    'Amharic': 'et',
    'Malagasy': 'mg',
    'Latin': 'va',
    'Esperanto': 'eu',
    'Catalan': 'es',
    'Basque': 'es',
    'Galician': 'es',
    'Irish': 'ie',
    'Welsh': 'gb',
    'Maltese': 'mt',
};

/**
 * Returns a flagcdn.com image URL for a language name.
 */
export function getLanguageFlagUrl(languageName, size = '24x18') {
    const code = LANGUAGE_FLAGS[languageName];
    if (!code) return null;
    return `https://flagcdn.com/${size}/${code}.png`;
}


export default function CountrySearch({ value, onChange, placeholder = 'Ex: Brazil', required = false }) {
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
