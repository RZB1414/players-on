export function validatePlayerProfile(data) {
    const errors = [];

    // Name
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters.');
    }

    // Position
    const validPositions = ['Setter', 'Outside Hitter', 'Opposite', 'Middle Blocker', 'Libero'];
    if (!data.position || !validPositions.includes(data.position)) {
        errors.push('The provided position is invalid.');
    }

    // Height
    const height = Number(data.heightCm);
    if (isNaN(height) || height < 100 || height > 250) {
        errors.push('Height must be between 100cm and 250cm.');
    }

    // Weight
    const weight = Number(data.weightKg);
    if (isNaN(weight) || weight < 30 || weight > 200) {
        errors.push('Weight must be between 30kg and 200kg.');
    }

    // Reach
    const attackReach = Number(data.attackReachCm);
    const blockReach = Number(data.blockReachCm);
    if (isNaN(attackReach) || attackReach < 150 || attackReach > 400) {
        errors.push('Attack reach must be between 150cm and 400cm.');
    }
    if (isNaN(blockReach) || blockReach < 150 || blockReach > 400) {
        errors.push('Block reach must be between 150cm and 400cm.');
    }

    // Birth Year (>= 1950 and <= currentYear)
    const birthYear = Number(data.birthYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(birthYear) || birthYear < 1950 || birthYear > currentYear) {
        errors.push(`Birth year must be between 1950 and ${currentYear}.`);
    }

    // WhatsApp
    if (!data.whatsappNumber || typeof data.whatsappNumber !== 'string' || data.whatsappNumber.trim().length < 8) {
        errors.push('Invalid WhatsApp number.');
    }

    // Current Team (optional)
    if (data.currentTeam && data.currentTeam.length > 100) {
        errors.push('Team name cannot exceed 100 characters.');
    }
    if (data.currentTeamCountry && data.currentTeamCountry.length > 50) {
        errors.push('Team country cannot exceed 50 characters.');
    }

    // Agency (optional)
    if (data.agency && (typeof data.agency !== 'string' || data.agency.length > 100)) {
        errors.push('Agency name cannot exceed 100 characters.');
    }
    if (data.agencyWhatsapp && (typeof data.agencyWhatsapp !== 'string' || data.agencyWhatsapp.trim().length < 8)) {
        errors.push('Invalid agency WhatsApp number.');
    }

    // Nationality
    if (!data.nationality || typeof data.nationality !== 'string' || data.nationality.trim().length < 2) {
        errors.push('Nationality is required.');
    }
    if (data.secondNationality && typeof data.secondNationality !== 'string') {
        errors.push('Second nationality, if provided, must be a valid text.');
    }

    // Languages
    if (!data.nativeLanguage || typeof data.nativeLanguage !== 'string' || data.nativeLanguage.trim().length < 2) {
        errors.push('Native language is required.');
    }
    if (data.otherLanguages) {
        if (!Array.isArray(data.otherLanguages)) {
            errors.push('Other languages must be a valid list.');
        } else if (data.otherLanguages.length > 10) {
            errors.push('You can add a maximum of 10 other languages.');
        } else {
            data.otherLanguages.forEach((lang, index) => {
                if (!lang.name || typeof lang.name !== 'string' || lang.name.trim().length === 0) {
                    errors.push(`Other language [${index + 1}]: language name is required.`);
                }
                if (!lang.level || typeof lang.level !== 'string' || lang.level.trim().length === 0) {
                    errors.push(`Other language [${index + 1}]: proficiency level is required.`);
                }
            });
        }
    }

    // Arrays validation (max 30 items)
    const validateArrayItem = (item, prefix) => {
        if (!item || typeof item !== 'object') {
            errors.push(`${prefix} invalid item.`);
            return;
        }

        if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
            errors.push(`${prefix} title is required.`);
        } else if (item.title.length > 100) {
            errors.push(`${prefix} title cannot exceed 100 characters.`);
        }

        if (!item.championship || typeof item.championship !== 'string' || item.championship.trim().length === 0) {
            errors.push(`${prefix} championship is required.`);
        } else if (item.championship.length > 150) {
            errors.push(`${prefix} championship cannot exceed 150 characters.`);
        }

        const year = Number(item.year);
        if (isNaN(year) || year < 1990 || year > currentYear) {
            errors.push(`${prefix} year must be between 1990 and ${currentYear}.`);
        }
    };

    if (data.achievements) {
        if (!Array.isArray(data.achievements)) {
            errors.push('Achievements must be a valid list.');
        } else if (data.achievements.length > 30) {
            errors.push('You can add a maximum of 30 achievements.');
        } else {
            data.achievements.forEach((item, index) => validateArrayItem(item, `Achievement [${index + 1}]:`));
        }
    }

    if (data.individualAwards) {
        if (!Array.isArray(data.individualAwards)) {
            errors.push('Awards must be a valid list.');
        } else if (data.individualAwards.length > 30) {
            errors.push('You can add a maximum of 30 awards.');
        } else {
            data.individualAwards.forEach((item, index) => validateArrayItem(item, `Award [${index + 1}]:`));
        }
    }

    // YouTube Videos (optional, max 10)
    if (data.youtubeVideos) {
        if (!Array.isArray(data.youtubeVideos)) {
            errors.push('Videos must be a valid list.');
        } else if (data.youtubeVideos.length > 10) {
            errors.push('You can add a maximum of 10 videos.');
        } else {
            const ytRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
            data.youtubeVideos.forEach((video, index) => {
                if (!video.url || typeof video.url !== 'string' || !ytRegex.test(video.url)) {
                    errors.push(`Video [${index + 1}]: Invalid YouTube URL.`);
                }
                if (video.title && video.title.length > 100) {
                    errors.push(`Video [${index + 1}]: title cannot exceed 100 characters.`);
                }
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
