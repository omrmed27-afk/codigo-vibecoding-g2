import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const BASE = 'http://localhost:3000';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [lastname, setLastname] = useState('');
  const [lastnameTouched, setLastnameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const nameValid = name.trim().length > 0;
  const lastnameValid = lastname.trim().length > 0;
  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= 6;

  const showNameError = nameTouched && !nameValid;
  const showLastnameError = lastnameTouched && !lastnameValid;
  const showEmailError = emailTouched && email.length > 0 && !emailValid;
  const showPasswordError = passwordTouched && !passwordValid;

  const canSubmit = nameValid && lastnameValid && emailValid && passwordValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setServerError('');
    try {
      const res = await fetch(`${BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), lastname: lastname.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'Error al crear la cuenta');
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
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-sm text-gray-500 mt-1">Regístrate para empezar</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="name"
                type="text"
                autoComplete="given-name"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => { setName(e.target.value); if (!nameTouched) setNameTouched(true); }}
                onBlur={() => setNameTouched(true)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors
                  focus:ring-2 focus:ring-brand-500 focus:ring-offset-0
                  ${showNameError ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-brand-500'}`}
              />
            </div>
            {showNameError && (
              <p className="mt-1.5 text-xs text-danger-500">El nombre es requerido</p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1.5">
              Apellido
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="lastname"
                type="text"
                autoComplete="family-name"
                placeholder="Tu apellido"
                value={lastname}
                onChange={(e) => { setLastname(e.target.value); if (!lastnameTouched) setLastnameTouched(true); }}
                onBlur={() => setLastnameTouched(true)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors
                  focus:ring-2 focus:ring-brand-500 focus:ring-offset-0
                  ${showLastnameError ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-brand-500'}`}
              />
            </div>
            {showLastnameError && (
              <p className="mt-1.5 text-xs text-danger-500">El apellido es requerido</p>
            )}
          </div>

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
                onChange={(e) => { setEmail(e.target.value); if (!emailTouched) setEmailTouched(true); }}
                onBlur={() => setEmailTouched(true)}
                className={`w-full pl-10 pr-4 py-2.5 text-sm border rounded-lg outline-none transition-colors
                  focus:ring-2 focus:ring-brand-500 focus:ring-offset-0
                  ${showEmailError ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-brand-500'}`}
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
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (!passwordTouched) setPasswordTouched(true); }}
                onBlur={() => setPasswordTouched(true)}
                className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-lg outline-none transition-colors
                  focus:ring-2 focus:ring-brand-500 focus:ring-offset-0
                  ${showPasswordError ? 'border-danger-500 focus:ring-danger-500' : 'border-gray-300 focus:border-brand-500'}`}
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
            {showPasswordError && (
              <p className="mt-1.5 text-xs text-danger-500">La contraseña debe tener al menos 6 caracteres</p>
            )}
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
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
