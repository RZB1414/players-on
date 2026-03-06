const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const PASSWORD_MIN_LENGTH = 12;

export function validateRegisterInput({ name, email, password }) {
    const errors = [];

    // Name validation
    if (!name || typeof name !== 'string') {
        errors.push('Nome é obrigatório');
    } else if (name.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres');
    } else if (name.trim().length > 100) {
        errors.push('Nome deve ter no máximo 100 caracteres');
    }

    // Email validation
    if (!email || typeof email !== 'string') {
        errors.push('Email é obrigatório');
    } else if (!EMAIL_REGEX.test(email)) {
        errors.push('Formato de email inválido');
    } else if (email.length > 254) {
        errors.push('Email muito longo');
    }

    // Password validation
    if (!password || typeof password !== 'string') {
        errors.push('Senha é obrigatória');
    } else {
        if (password.length < PASSWORD_MIN_LENGTH) {
            errors.push(`Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`);
        }
        if (password.length > 128) {
            errors.push('Senha deve ter no máximo 128 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos 1 letra maiúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos 1 letra minúscula');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Senha deve conter pelo menos 1 número');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
            errors.push('Senha deve conter pelo menos 1 símbolo');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

export function validateLoginInput({ email, password }) {
    const errors = [];

    if (!email || typeof email !== 'string' || !email.trim()) {
        errors.push('Email é obrigatório');
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
        errors.push('Senha é obrigatória');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
