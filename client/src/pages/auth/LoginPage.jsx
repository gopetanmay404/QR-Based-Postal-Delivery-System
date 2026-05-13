import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card"
    >
      <h2 className="text-xl font-bold text-slate-200 mb-6">Sign In</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
          <input
            id="login-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-slate-600"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
          <input
            id="login-password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-slate-600"
            placeholder="••••••••"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 gradient-gold text-navy-900 rounded-lg font-semibold disabled:opacity-50 transition-all"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </motion.button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <p className="text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-gold-500 hover:text-gold-400 font-medium">Register</Link>
        </p>
        <p className="text-slate-600">
          <Link to="/postman-login" className="text-sky-500 hover:text-sky-400">Postman Login →</Link>
        </p>
      </div>
    </motion.div>
  );
}
