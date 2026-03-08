import React from 'react';
import CountrySearch from './CountrySearch';

const POSITIONS = ['Levantador', 'Ponteiro', 'Oposto', 'Central', 'Libero'];

export default function PersonalInfoForm({ formData, setFormData }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="personal-info-grid">
            <div className="form-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    placeholder="Ex: Gilberto Amauri"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="position">Posição</label>
                <select
                    id="position"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Selecione uma posição</option>
                    {POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="birthYear">Ano de Nascimento</label>
                <input
                    type="number"
                    id="birthYear"
                    name="birthYear"
                    value={formData.birthYear || ''}
                    onChange={handleChange}
                    min="1950"
                    max={new Date().getFullYear()}
                    placeholder="Ex: 1995"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="nationality">Nacionalidade</label>
                <CountrySearch
                    value={formData.nationality || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, nationality: val }))}
                    placeholder="Ex: Brasileira"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="secondNationality">Segunda Nacionalidade (Opcional)</label>
                <CountrySearch
                    value={formData.secondNationality || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, secondNationality: val }))}
                    placeholder="Ex: Italiana"
                />
            </div>


            <div className="form-group">
                <label htmlFor="whatsappNumber">WhatsApp</label>
                <input
                    type="tel"
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={formData.whatsappNumber || ''}
                    onChange={handleChange}
                    placeholder="Ex: 5511999999999"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="heightCm">Altura (cm)</label>
                <input
                    type="number"
                    id="heightCm"
                    name="heightCm"
                    value={formData.heightCm || ''}
                    onChange={handleChange}
                    min="100"
                    max="250"
                    placeholder="Ex: 192"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="weightKg">Peso (kg)</label>
                <input
                    type="number"
                    id="weightKg"
                    name="weightKg"
                    value={formData.weightKg || ''}
                    onChange={handleChange}
                    min="30"
                    max="200"
                    step="0.1"
                    placeholder="Ex: 85.5"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="attackReachCm">Alcance de Ataque (cm)</label>
                <input
                    type="number"
                    id="attackReachCm"
                    name="attackReachCm"
                    value={formData.attackReachCm || ''}
                    onChange={handleChange}
                    min="150"
                    max="400"
                    placeholder="Ex: 330"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="blockReachCm">Alcance de Bloqueio (cm)</label>
                <input
                    type="number"
                    id="blockReachCm"
                    name="blockReachCm"
                    value={formData.blockReachCm || ''}
                    onChange={handleChange}
                    min="150"
                    max="400"
                    placeholder="Ex: 310"
                    required
                />
            </div>

            {/* Current Team */}
            <div className="form-group">
                <label htmlFor="currentTeam">Time Atual (Opcional)</label>
                <input
                    type="text"
                    id="currentTeam"
                    name="currentTeam"
                    value={formData.currentTeam || ''}
                    onChange={handleChange}
                    placeholder="Ex: Sada Cruzeiro"
                    maxLength={100}
                />
            </div>

            <div className="form-group">
                <label htmlFor="currentTeamCountry">País do Time Atual (Opcional)</label>
                <CountrySearch
                    value={formData.currentTeamCountry || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, currentTeamCountry: val }))}
                    placeholder="Pesquisar país..."
                />
            </div>
        </div>

    );
}
