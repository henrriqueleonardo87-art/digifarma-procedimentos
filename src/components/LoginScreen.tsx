import React, { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { login } from '../lib/authService';
import type { AppUser } from '../types/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Credenciais inválidas. Verifique seu usuário e senha.');
      }
    } catch {
      setError('Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (name: string) => {
    setUsername(name);
    setPassword('Trein@mento123');
    setError('');
  };

  return (
    <div className="login-screen-root">
      <div className="login-card-container">
        {/* Marca / Topo */}
        <div className="login-brand-header">
          <div className="login-brand-logo">
            <span>D</span>
          </div>
          <h1 className="login-brand-title">Digifarma</h1>
          <p className="login-brand-subtitle">Plataforma de Treinamento & POPs</p>
        </div>

        {error && (
          <div className="login-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-form-label">
              <UserIcon size={14} />
              <span>Usuário</span>
            </label>
            <input
              type="text"
              className="login-form-input"
              placeholder="Digite seu nome de usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="login-form-group">
            <label className="login-form-label">
              <Lock size={14} />
              <span>Senha</span>
            </label>
            <div className="login-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-form-input"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="login-toggle-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn-submit"
            disabled={loading}
          >
            <span>{loading ? 'Acessando...' : 'Entrar no Sistema'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Usuários Rápidos */}
        <div className="login-quick-users">
          <span className="login-quick-title">Acesso rápido:</span>
          <div className="login-quick-badges">
            {['Icaro', 'Leonardo', 'Wallace', 'Whitalo'].map((name) => (
              <button
                key={name}
                type="button"
                className={`login-quick-btn ${username.toLowerCase() === name.toLowerCase() ? 'active' : ''}`}
                onClick={() => handleQuickSelect(name)}
              >
                {name}
              </button>
            ))}
          </div>
          <span className="login-quick-hint">Senha padrão inicial: <code>Trein@mento123</code></span>
        </div>

        <div className="login-card-foot">
          <ShieldCheck size={14} />
          <span>Digifarma ERP · Acesso Seguro e Auditado</span>
        </div>
      </div>
    </div>
  );
};
