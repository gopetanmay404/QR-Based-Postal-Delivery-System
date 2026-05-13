import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = {
    USER: [
      { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
    ],
    POSTMAN: [
      { path: '/postman', label: 'Dashboard', icon: '📦' },
    ],
    ADMIN: [
      { path: '/admin', label: 'Dashboard', icon: '📊' },
    ],
  };

  const links = navLinks[user?.role] || [];

  return (
    <nav className="glass sticky top-0 z-40 border-b border-gold-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
              <span className="text-navy-900 font-bold text-lg">🏛️</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-gradient-gold leading-tight">GOV DELIVERY</h1>
              <p className="text-xs text-slate-500">Secure Document System</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-gold-500/10 text-gold-500'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {user?.role === 'USER' && (
              <div className="relative">
                <button className="text-slate-400 hover:text-gold-500 transition-colors p-2">
                  🔔
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-crimson-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </button>
              </div>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-slate-200">{user.name}</p>
                  <p className="text-xs text-gold-500">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm border border-crimson-500/30 text-crimson-400 rounded-lg hover:bg-crimson-500/10 transition-all"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-gold-500"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pb-4"
          >
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2 text-sm text-slate-400 hover:text-gold-500 hover:bg-navy-700/50 rounded-lg"
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </nav>
  );
}
