export function validatePlayerProfile(data) {
    const errors = [];

    // Name
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('O nome deve ter pelo menos 2 caracteres.');
    }

    // Position
    const validPositions = ['Levantador', 'Ponteiro', 'Oposto', 'Central', 'Libero'];
    if (!data.position || !validPositions.includes(data.position)) {
        errors.push('A posição informada é inválida.');
    }

    // Height
    const height = Number(data.heightCm);
    if (isNaN(height) || height < 100 || height > 250) {
        errors.push('A altura deve estar entre 100cm e 250cm.');
    }

    // Weight
    const weight = Number(data.weightKg);
    if (isNaN(weight) || weight < 30 || weight > 200) {
        errors.push('O peso deve estar entre 30kg e 200kg.');
    }

    // Reach
    const attackReach = Number(data.attackReachCm);
    const blockReach = Number(data.blockReachCm);
    if (isNaN(attackReach) || attackReach < 150 || attackReach > 400) {
        errors.push('O alcance de ataque deve estar entre 150cm e 400cm.');
    }
    if (isNaN(blockReach) || blockReach < 150 || blockReach > 400) {
        errors.push('O alcance de bloqueio deve estar entre 150cm e 400cm.');
    }

    // Birth Year (>= 1950 and <= currentYear)
    const birthYear = Number(data.birthYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(birthYear) || birthYear < 1950 || birthYear > currentYear) {
        errors.push(`O ano de nascimento deve estar entre 1950 e ${currentYear}.`);
    }

    // WhatsApp
    if (!data.whatsappNumber || typeof data.whatsappNumber !== 'string' || data.whatsappNumber.trim().length < 8) {
        errors.push('Número de WhatsApp inválido.');
    }

    // Current Team (optional)
    if (data.currentTeam && data.currentTeam.length > 100) {
        errors.push('O nome do time não pode exceder 100 caracteres.');
    }
    if (data.currentTeamCountry && data.currentTeamCountry.length > 50) {
        errors.push('O país do time não pode exceder 50 caracteres.');
    }

    // Nationality
    if (!data.nationality || typeof data.nationality !== 'string' || data.nationality.trim().length < 2) {
        errors.push('A nacionalidade é obrigatória.');
    }
    if (data.secondNationality && typeof data.secondNationality !== 'string') {
        errors.push('A segunda nacionalidade, se fornecida, deve ser texto válida.');
    }

    // Languages
    if (!data.nativeLanguage || typeof data.nativeLanguage !== 'string' || data.nativeLanguage.trim().length < 2) {
        errors.push('O idioma nativo é obrigatório.');
    }
    if (data.otherLanguages) {
        if (!Array.isArray(data.otherLanguages)) {
            errors.push('Outros idiomas devem ser uma lista válida.');
        } else if (data.otherLanguages.length > 10) {
            errors.push('Você pode adicionar no máximo 10 outros idiomas.');
        } else {
            data.otherLanguages.forEach((lang, index) => {
                if (!lang.name || typeof lang.name !== 'string' || lang.name.trim().length === 0) {
                    errors.push(`Outro idioma [${index + 1}]: o nome do idioma é obrigatório.`);
                }
                if (!lang.level || typeof lang.level !== 'string' || lang.level.trim().length === 0) {
                    errors.push(`Outro idioma [${index + 1}]: o nível de proficiência é obrigatório.`);
                }
            });
        }
    }

    // Arrays validation (max 30 items)
    const validateArrayItem = (item, prefix) => {
        if (!item || typeof item !== 'object') {
            errors.push(`${prefix} item inválido.`);
            return;
        }

        if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
            errors.push(`${prefix} título é obrigatório.`);
        } else if (item.title.length > 100) {
            errors.push(`${prefix} título não pode exceder 100 caracteres.`);
        }

        if (!item.championship || typeof item.championship !== 'string' || item.championship.trim().length === 0) {
            errors.push(`${prefix} campeonato é obrigatório.`);
        } else if (item.championship.length > 150) {
            errors.push(`${prefix} campeonato não pode exceder 150 caracteres.`);
        }

        const year = Number(item.year);
        if (isNaN(year) || year < 1990 || year > currentYear) {
            errors.push(`${prefix} ano deve estar entre 1990 e ${currentYear}.`);
        }
    };

    if (data.achievements) {
        if (!Array.isArray(data.achievements)) {
            errors.push('As conquistas devem ser uma lista válida.');
        } else if (data.achievements.length > 30) {
            errors.push('Você pode adicionar no máximo 30 conquistas.');
        } else {
            data.achievements.forEach((item, index) => validateArrayItem(item, `Conquista [${index + 1}]:`));
        }
    }

    if (data.individualAwards) {
        if (!Array.isArray(data.individualAwards)) {
            errors.push('As premiações devem ser uma lista válida.');
        } else if (data.individualAwards.length > 30) {
            errors.push('Você pode adicionar no máximo 30 premiações.');
        } else {
            data.individualAwards.forEach((item, index) => validateArrayItem(item, `Premiação [${index + 1}]:`));
        }
    }

    // YouTube Videos (optional, max 10)
    if (data.youtubeVideos) {
        if (!Array.isArray(data.youtubeVideos)) {
            errors.push('Os vídeos devem ser uma lista válida.');
        } else if (data.youtubeVideos.length > 10) {
            errors.push('Você pode adicionar no máximo 10 vídeos.');
        } else {
            const ytRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/;
            data.youtubeVideos.forEach((video, index) => {
                if (!video.url || typeof video.url !== 'string' || !ytRegex.test(video.url)) {
                    errors.push(`Vídeo [${index + 1}]: URL do YouTube inválida.`);
                }
                if (video.title && video.title.length > 100) {
                    errors.push(`Vídeo [${index + 1}]: título não pode exceder 100 caracteres.`);
                }
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
