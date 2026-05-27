import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const BASE = 'http://localhost:3000';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const emailValid = EMAIL_RE.test(email);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const canSubmit = emailValid && password.length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch(`${BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Error al iniciar sesión');
        return;
      }
      login(data.token, data.user);
      navigate('/');
    } catch {
      setServerError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-500 via-indigo-600 to-purple-700 flex items-center justify-center">
      <div className="w-full sm:max-w-sm min-h-screen sm:min-h-0 bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-2xl flex flex-col justify-center p-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!emailTouched) setEmailTouched(true);
                }}
                onBlur={() => setEmailTouched(true)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors
                  focus:ring-2 focus:ring-brand-500 focus:ring-offset-0
                  ${showEmailError
                    ? 'border-danger-500 focus:ring-danger-500'
                    : 'border-gray-300 focus:border-brand-500'
                  }`}
              />
            </div>
            {showEmailError && (
              <p className="mt-1.5 text-xs text-danger-500">Ingresa un correo válido</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg outline-none transition-colors
                  focus:ring-2 focus:ring-brand-500 focus:ring-offset-0 focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {serverError && (
            <p className="text-xs text-danger-500 bg-danger-100 px-3 py-2 rounded-lg">{serverError}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            disabled={!canSubmit}
            loading={loading}
          >
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
