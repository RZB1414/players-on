import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ALL_LANGUAGES = [
    'Abkhazian', 'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian',
    'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Bulgarian',
    'Burmese', 'Catalan', 'Cantonese (Chinese)', 'Cebuano', 'Corsican', 'Croatian',
    'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Filipino',
    'Finnish', 'French', 'Frisian', 'Galician', 'Georgian', 'German', 'Greek',
    'Gujarati', 'Haitian Creole', 'Hausa', 'Hebrew', 'Hindi', 'Hungarian',
    'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian', 'Japanese', 'Javanese',
    'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latin', 'Latvian',
    'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malagasy', 'Malay', 'Malayalam',
    'Maltese', 'Mandarin (Chinese)', 'Maori', 'Marathi', 'Mongolian', 'Nepali',
    'Norwegian', 'Odia', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi',
    'Romanian', 'Russian', 'Serbian', 'Sindhi', 'Sinhala', 'Slovak', 'Slovenian',
    'Somali', 'Spanish', 'Swahili', 'Swedish', 'Tajik', 'Tamil', 'Telugu',
    'Thai', 'Tibetan', 'Turkish', 'Turkmen', 'Ukrainian', 'Uyghur', 'Welsh'
];

const LANGUAGE_ALIASES = {
    'Mandarin (Chinese)': ['mandarin', 'china', 'chinese'],
    'Cantonese (Chinese)': ['cantonese', 'china', 'chinese'],
    'French': ['francais', 'français'],
    'German': ['deutsch'],
    'Spanish': ['castellano', 'spain', 'latin america'],
    'Italian': ['italiano'],
    'Portuguese': ['brasil', 'brazilian', 'portugal', 'ptbr', 'pt-br']
};


function LanguageSearch({ value, onChange }) {
    const [query, setQuery] = useState(value || '');
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [dropdownStyle, setDropdownStyle] = useState({});
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const openDropdown = () => {
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
            const filtered = ALL_LANGUAGES.filter(lang => {
                if (lang.toLowerCase().includes(valLower)) return true;
                const aliases = LANGUAGE_ALIASES[lang];
                if (aliases && aliases.some(alias => alias.includes(valLower))) return true;
                return false;
            });
            setSuggestions(filtered);
            if (filtered.length > 0) openDropdown();
            else setOpen(false);
        }
    };

    const handleSelect = (lang) => {
        setQuery(lang);
        onChange(lang);
        setSuggestions([]);
        setOpen(false);
    };

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
            {suggestions.map((lang) => (
                <li
                    key={lang}
                    onMouseDown={() => handleSelect(lang)}
                    style={{
                        padding: '0.55rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        color: 'rgba(255,255,255,0.85)',
                        transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    {lang}
                </li>
            ))}
        </ul>
    );

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInput}
                onFocus={() => {
                    if (suggestions.length > 0) openDropdown();
                }}
                placeholder="Ex: English"
                autoComplete="off"
            />
            {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
        </div>
    );
}

export default function LanguageList({ nativeLanguage = '', setNativeLanguage, items = [], setItems }) {
    const MAX_ITEMS = 10;

    const handleAdd = () => {
        if (items.length >= MAX_ITEMS) return;
        setItems([...items, { name: '', level: '' }]);
    };

    const handleRemove = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    return (
        <div className="dynamic-list">
            {/* Native Language — always shown at the top */}
            <div className="dynamic-list-item" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="item-row">
                    <div className="form-group" style={{ flex: 2, position: 'relative' }}>
                        <label>Native Language</label>
                        <LanguageSearch
                            value={nativeLanguage}
                            onChange={(val) => setNativeLanguage && setNativeLanguage(val)}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Level</label>
                        <div style={{ padding: '0.6rem 0.8rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                            Native
                        </div>
                    </div>
                </div>
            </div>

            {/* Other languages */}
            {items.map((item, index) => (
                <div key={index} className="dynamic-list-item">
                    <button
                        type="button"
                        className="btn-danger remove-btn-absolute"
                        onClick={() => handleRemove(index)}
                        title="Remove language"
                    >
                        &times;
                    </button>
                    <div className="item-row">
                        <div className="form-group" style={{ flex: 2, position: 'relative' }}>
                            <label>Language</label>
                            <LanguageSearch
                                value={item.name}
                                onChange={(val) => handleChange(index, 'name', val)}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Level</label>
                            <select
                                value={item.level}
                                onChange={(e) => handleChange(index, 'level', e.target.value)}
                            >
                                <option value="" disabled>Select</option>
                                <option value="Basic">Basic</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Fluent">Fluent</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}

            {items.length < MAX_ITEMS && (
                <button
                    type="button"
                    onClick={handleAdd}
                    style={{
                        width: '100%',
                        padding: '0.9rem',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                        border: '1px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        letterSpacing: '0.3px',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }}
                >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>＋</span>
                    Add another language
                </button>
            )}
            {items.length >= MAX_ITEMS && (
                <p className="limit-warning">Limit of {MAX_ITEMS} languages reached.</p>
            )}
        </div>
    );
}
