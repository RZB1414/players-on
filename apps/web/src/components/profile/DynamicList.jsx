import React from 'react';

export default function DynamicList({ items = [], setItems, type }) {
    const isAchievement = type === 'achievement';

    // Limits
    const MAX_ITEMS = 30;
    const MAX_TITLE_LEN = 100;
    const MAX_CHAM_LEN = 150;
    const currentYear = new Date().getFullYear();

    const handleAdd = () => {
        if (items.length >= MAX_ITEMS) return;
        setItems([...items, { title: '', championship: '', year: '' }]);
    };

    const handleRemove = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        const newItems = [...items];

        // Front-end sanity limit enforcement
        let safeValue = value;
        if (field === 'title') safeValue = value.substring(0, MAX_TITLE_LEN);
        if (field === 'championship') safeValue = value.substring(0, MAX_CHAM_LEN);

        newItems[index] = { ...newItems[index], [field]: safeValue };
        setItems(newItems);
    };

    return (
        <div className="dynamic-list">
            {items.map((item, index) => (
                <div key={index} className="dynamic-list-item">
                    <button
                        type="button"
                        className="btn-danger remove-btn-absolute"
                        onClick={() => handleRemove(index)}
                        title="Remover item"
                    >
                        &times;
                    </button>
                    <div className="item-row">
                        <div className="form-group">
                            <label>Colocação</label>
                            <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleChange(index, 'title', e.target.value)}
                                placeholder={isAchievement ? "Ex: Campeão" : "Ex: Melhor Sacador"}
                                maxLength={MAX_TITLE_LEN}
                            />
                        </div>
                        <div className="form-group">
                            <label>Campeonato / Time</label>
                            <input
                                type="text"
                                value={item.championship}
                                onChange={(e) => handleChange(index, 'championship', e.target.value)}
                                placeholder="Ex: Superliga B"
                                maxLength={MAX_CHAM_LEN}
                            />
                        </div>
                        <div className="form-group year-group">
                            <label>Ano</label>
                            <input
                                type="number"
                                value={item.year}
                                onChange={(e) => handleChange(index, 'year', e.target.value)}
                                placeholder="2023"
                                min="1990"
                                max={currentYear}
                            />
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
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>＋</span>
                    Adicionar outra {isAchievement ? 'Conquista' : 'Premiação'}
                </button>
            )}
            {items.length >= MAX_ITEMS && (
                <p className="limit-warning">Limite de {MAX_ITEMS} itens atingido.</p>
            )}
        </div>
    );
}
