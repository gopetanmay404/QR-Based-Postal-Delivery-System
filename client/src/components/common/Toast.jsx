import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../../context/NotificationContext';

const icons = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: '📢',
};

const bgColors = {
  success: 'bg-emerald-500/20 border-emerald-500/30',
  error: 'bg-crimson-500/20 border-crimson-500/30',
  warning: 'bg-gold-500/20 border-gold-500/30',
  info: 'bg-sky-500/20 border-sky-500/30',
};

export default function Toast() {
  const { toasts, removeToast } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`glass-card flex items-start gap-3 p-4 border ${bgColors[toast.type]} cursor-pointer`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-lg flex-shrink-0">{icons[toast.type]}</span>
            <p className="text-sm text-slate-200 leading-relaxed">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
