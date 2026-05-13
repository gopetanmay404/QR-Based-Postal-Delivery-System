import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function PostmanLoginPage() {
  const { postmanLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ employeeId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await postmanLogin(form.employeeId, form.password);
      navigate('/postman');
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-sky-500/20 flex items-center justify-center">
          <span className="text-xl">📮</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-200">Postman Login</h2>
          <p className="text-xs text-slate-500">Delivery Personnel Access</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Employee ID</label>
          <input
            id="postman-employeeId"
            type="text"
            required
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors placeholder-slate-600"
            placeholder="POST001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
          <input
            id="postman-password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500 transition-colors placeholder-slate-600"
            placeholder="••••••••"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 bg-sky-500 text-white rounded-lg font-semibold disabled:opacity-50 hover:bg-sky-400 transition-all"
        >
          {loading ? 'Signing in...' : 'Postman Sign In'}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="text-gold-500 hover:text-gold-400">← User Login</Link>
      </p>
    </motion.div>
  );
}
