import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const isDetail = location.pathname !== '/';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
        {isDetail && (
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
        )}
        <Link to="/" className="text-lg font-bold text-brand-600 tracking-tight">
          Task Manager
        </Link>
        {isAuthenticated && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name?.split(' ')[0]} {user?.lastname?.split(' ')[0]}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
