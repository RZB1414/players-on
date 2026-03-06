import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const passwordStrength = useMemo(() => {
        const checks = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
        };

        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;

        let level = 'weak';
        if (passed >= 5) level = 'strong';
        else if (passed >= 3) level = 'medium';

        return { checks, passed, total, level };
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (passwordStrength.passed < 5) {
            setError('A senha não atende todos os requisitos');
            return;
        }

        setIsSubmitting(true);

        try {
            await register(name, email, password);
            navigate('/login', {
                replace: true,
                state: { message: 'Conta criada com sucesso! Faça login.' },
            });
        } catch (err) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <span className="auth-logo-icon">⚡</span>
                            <h1>Players On</h1>
                        </div>
                        <p className="auth-subtitle">Crie sua conta</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        {error && (
                            <div className="auth-error">
                                <span className="auth-error-icon">⚠</span>
                                {error}
                            </div>
                        )}

                        <div className="auth-field">
                            <label htmlFor="register-name">Nome</label>
                            <input
                                id="register-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                required
                                minLength={2}
                                maxLength={100}
                                autoComplete="name"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-email">Email</label>
                            <input
                                id="register-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                autoComplete="email"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-password">Senha</label>
                            <input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 12 caracteres"
                                required
                                autoComplete="new-password"
                                disabled={isSubmitting}
                            />
                            {password && (
                                <div className="password-strength">
                                    <div className="password-strength-bar">
                                        <div
                                            className={`password-strength-fill ${passwordStrength.level}`}
                                            style={{ width: `${(passwordStrength.passed / passwordStrength.total) * 100}%` }}
                                        />
                                    </div>
                                    <ul className="password-requirements">
                                        <li className={passwordStrength.checks.length ? 'met' : ''}>
                                            12+ caracteres
                                        </li>
                                        <li className={passwordStrength.checks.uppercase ? 'met' : ''}>
                                            1 letra maiúscula
                                        </li>
                                        <li className={passwordStrength.checks.lowercase ? 'met' : ''}>
                                            1 letra minúscula
                                        </li>
                                        <li className={passwordStrength.checks.number ? 'met' : ''}>
                                            1 número
                                        </li>
                                        <li className={passwordStrength.checks.symbol ? 'met' : ''}>
                                            1 símbolo
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-confirm">Confirmar Senha</label>
                            <input
                                id="register-confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a senha"
                                required
                                autoComplete="new-password"
                                disabled={isSubmitting}
                            />
                            {confirmPassword && password !== confirmPassword && (
                                <span className="auth-field-error">As senhas não coincidem</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={isSubmitting || passwordStrength.passed < 5}
                        >
                            {isSubmitting ? (
                                <span className="auth-button-loading">
                                    <span className="auth-spinner" />
                                    Criando conta...
                                </span>
                            ) : (
                                'Criar Conta'
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Já tem uma conta?{' '}
                            <Link to="/login" className="auth-link">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
