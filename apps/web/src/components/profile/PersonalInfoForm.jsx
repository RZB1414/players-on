import React from 'react';
import CountrySearch from './CountrySearch';

const POSITIONS = ['Setter', 'Outside Hitter', 'Opposite', 'Middle Blocker', 'Libero'];

export default function PersonalInfoForm({ formData, setFormData }) {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="personal-info-grid">
            <div className="form-group">
                <label htmlFor="name">Full Name</label>
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
                <label htmlFor="position">Position</label>
                <select
                    id="position"
                    name="position"
                    value={formData.position || ''}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Select a position</option>
                    {POSITIONS.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="birthYear">Birth Year</label>
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
                <label htmlFor="nationality">Nationality</label>
                <CountrySearch
                    value={formData.nationality || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, nationality: val }))}
                    placeholder="Ex: Brazilian"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="secondNationality">Second Nationality (Optional)</label>
                <CountrySearch
                    value={formData.secondNationality || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, secondNationality: val }))}
                    placeholder="Ex: Italian"
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
                <label htmlFor="heightCm">Height (cm)</label>
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
                <label htmlFor="weightKg">Weight (kg)</label>
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
                <label htmlFor="attackReachCm">Spike Reach (cm)</label>
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
                <label htmlFor="blockReachCm">Block Reach (cm)</label>
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
                <label htmlFor="currentTeam">Current Team (Optional)</label>
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
                <label htmlFor="currentTeamCountry">Current Team Country (Optional)</label>
                <CountrySearch
                    value={formData.currentTeamCountry || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, currentTeamCountry: val }))}
                    placeholder="Search country..."
                />
            </div>

            <div className="form-group">
                <label htmlFor="agency">Agency (Optional)</label>
                <input
                    type="text"
                    id="agency"
                    name="agency"
                    value={formData.agency || ''}
                    onChange={handleChange}
                    placeholder="Ex: XYZ Sports Agency"
                    maxLength={100}
                />
            </div>

            <div className="form-group">
                <label htmlFor="agencyWhatsapp">Agency Contact WhatsApp (Optional)</label>
                <input
                    type="tel"
                    id="agencyWhatsapp"
                    name="agencyWhatsapp"
                    value={formData.agencyWhatsapp || ''}
                    onChange={handleChange}
                    placeholder="Ex: 5511999999999"
                />
            </div>
        </div>

    );
}
