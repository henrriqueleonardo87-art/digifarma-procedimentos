import React, { useState } from 'react';
import { Lock, KeyRound, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { updatePassword } from '../lib/authService';
import type { AppUser } from '../types/auth';

interface ResetPasswordModalProps {
  user: AppUser;
  isOpen: boolean;
  forced?: boolean;
  onSuccess: () => void;
  onClose?: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  isOpen,
  forced = false,
  onSuccess,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('A confirmação da senha não coincide.');
      return;
    }

    if (newPassword === 'Trein@mento123') {
      setError('Por segurança, escolha uma senha diferente da senha padrão temporária.');
      return;
    }

    setSaving(true);
    try {
      const res = await updatePassword(user.id, newPassword);
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Erro ao atualizar senha.');
      }
    } catch {
      setError('Erro ao salvar nova senha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop-login">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <div className="reset-password-icon">
            <KeyRound size={24} />
          </div>
          <h2 className="reset-password-title">
            {forced ? 'Redefinir Senha Obrigatória' : 'Alterar Senha'}
          </h2>
          <p className="reset-password-sub">
            Olá, <strong>{user.name}</strong>!{' '}
            {forced
              ? 'Por políticas de segurança no primeiro acesso, cadastre sua nova senha pessoal.'
              : 'Defina uma nova senha para acessar a plataforma Digifarma.'}
          </p>
        </div>

        {error && (
          <div className="login-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label className="login-form-label">
              <Lock size={14} />
              <span>Nova Senha</span>
            </label>
            <div className="login-password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="login-form-input"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                required
              />
              <button
                type="button"
                className="login-toggle-eye"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-form-label">
              <Lock size={14} />
              <span>Confirmar Nova Senha</span>
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              className="login-form-input"
              placeholder="Digite novamente a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <div className="reset-password-actions">
            {!forced && onClose && (
              <button
                type="button"
                className="btn secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              className="login-btn-submit"
              disabled={saving}
              style={{ flex: 1 }}
            >
              <Check size={16} />
              <span>{saving ? 'Gravando...' : 'Salvar Nova Senha'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
