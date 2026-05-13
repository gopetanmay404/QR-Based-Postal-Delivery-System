import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.details) {
        setError(errData.details.map((d) => d.message).join('. '));
      } else {
        setError(errData?.error || 'Registration failed');
      }
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
      <h2 className="text-xl font-bold text-slate-200 mb-6">Create Account</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
          <input
            id="register-name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-slate-600"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Mobile Number</label>
          <input
            id="register-phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-slate-600"
            placeholder="9876543210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
          <input
            id="register-email"
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
            id="register-password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 bg-navy-800 border border-navy-600 rounded-lg text-slate-200 focus:outline-none focus:border-gold-500 transition-colors placeholder-slate-600"
            placeholder="Min 8 chars, uppercase, number, special"
          />
          <p className="text-xs text-slate-600 mt-1">Must contain uppercase, lowercase, number & special character</p>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 gradient-gold text-navy-900 rounded-lg font-semibold disabled:opacity-50 transition-all"
        >
          {loading ? 'Creating Account...' : 'Register'}
        </motion.button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-gold-500 hover:text-gold-400 font-medium">Sign In</Link>
      </p>
    </motion.div>
  );
}
