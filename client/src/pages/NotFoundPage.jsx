import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card max-w-md w-full text-center"
      >
        <div className="text-7xl mb-4">🔍</div>
        <h1 className="text-4xl font-bold text-gold-500 mb-2">404</h1>
        <p className="text-slate-400 mb-6">Page not found</p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 gradient-gold text-navy-900 rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Go Home
        </Link>
      </motion.div>
    </div>
  );
}
