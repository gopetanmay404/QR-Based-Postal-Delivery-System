import { motion } from 'framer-motion';

const STATUS_STEPS = [
  { key: 'GENERATED', label: 'QR Generated', icon: '📄' },
  { key: 'IN_TRANSIT', label: 'In Transit', icon: '🚛' },
  { key: 'NEAR_POST_OFFICE', label: 'Near Post Office', icon: '🏤' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🚴' },
  { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
];

const statusColors = {
  GENERATED: 'bg-navy-600',
  IN_TRANSIT: 'bg-sky-500',
  NEAR_POST_OFFICE: 'bg-purple-500',
  OUT_FOR_DELIVERY: 'bg-gold-500',
  DELIVERED: 'bg-emerald-500',
  EXPIRED: 'bg-crimson-500',
};

export default function DeliveryStatusTracker({ status }) {
  if (status === 'EXPIRED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-crimson-500/10 border border-crimson-500/30 rounded-lg">
        <span className="text-lg">⚠️</span>
        <span className="text-sm text-crimson-400 font-medium">Delivery Expired</span>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`flex flex-col items-center gap-1 min-w-[70px]`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  isCompleted ? statusColors[step.key] : 'bg-navy-700'
                } ${isCurrent ? 'ring-2 ring-gold-500/50 scale-110' : ''}`}
              >
                {step.icon}
              </div>
              <span className={`text-[10px] text-center leading-tight ${
                isCompleted ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {step.label}
              </span>
            </motion.div>

            {index < STATUS_STEPS.length - 1 && (
              <div className={`w-6 h-0.5 mx-0.5 flex-shrink-0 ${
                index < currentIndex ? 'bg-gold-500' : 'bg-navy-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
