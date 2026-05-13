import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '../../services/adminService';
import { useSocket } from '../../context/SocketContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STATUS_COLORS = {
  GENERATED: '#475569', IN_TRANSIT: '#0ea5e9', NEAR_POST_OFFICE: '#8b5cf6',
  OUT_FOR_DELIVERY: '#d4a843', DELIVERED: '#10b981', EXPIRED: '#ef4444',
};

export default function AdminDashboard() {
  const { socket } = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [postmen, setPostmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analytics');
  const [deliveryPage, setDeliveryPage] = useState(1);
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [totalDeliveryPages, setTotalDeliveryPages] = useState(1);

  useEffect(() => { fetchAnalytics(); }, []);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) fetchUsers();
    if (activeTab === 'deliveries') fetchDeliveries();
    if (activeTab === 'postmen' && postmen.length === 0) fetchPostmen();
  }, [activeTab, deliveryPage, deliveryFilter]);

  // Real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('delivery:statusUpdate', () => fetchAnalytics());
      socket.on('delivery:completed', () => fetchAnalytics());
      return () => { socket.off('delivery:statusUpdate'); socket.off('delivery:completed'); };
    }
  }, [socket]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await adminService.getAnalytics();
      setAnalytics(data.analytics);
      setRecentDeliveries(data.recentDeliveries);
      setDailyStats(data.dailyDeliveries.map(d => ({ name: d.status, count: d._count.id })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try { const { data } = await adminService.getUsers(); setUsers(data.users); }
    catch (err) { console.error(err); }
  };

  const fetchDeliveries = async () => {
    try {
      const { data } = await adminService.getDeliveries(deliveryPage, 15, deliveryFilter);
      setDeliveries(data.deliveries);
      setTotalDeliveryPages(data.pagination.totalPages);
    } catch (err) { console.error(err); }
  };

  const fetchPostmen = async () => {
    try { const { data } = await adminService.getPostmen(); setPostmen(data.postmen); }
    catch (err) { console.error(err); }
  };

  const handleDeleteDelivery = async (id) => {
    if (!confirm('Delete this delivery permanently?')) return;
    try {
      await adminService.deleteDelivery(id);
      fetchDeliveries();
      fetchAnalytics();
    } catch (err) { console.error(err); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await adminService.updateDelivery(id, { status });
      fetchDeliveries();
      fetchAnalytics();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" text="Loading analytics..." /></div>;

  const statCards = [
    { label: 'Total Users', value: analytics?.totalUsers || 0, icon: '👥', color: 'text-sky-400' },
    { label: 'Total QR Generated', value: analytics?.totalDeliveries || 0, icon: '📦', color: 'text-gold-500' },
    { label: 'Active Deliveries', value: analytics?.activeDeliveries || 0, icon: '🚛', color: 'text-purple-400' },
    { label: 'Delivered', value: analytics?.deliveredCount || 0, icon: '✅', color: 'text-emerald-400' },
    { label: 'Expired', value: analytics?.expiredCount || 0, icon: '⚠️', color: 'text-crimson-400' },
    { label: 'Success Rate', value: `${analytics?.successRate || 0}%`, icon: '📊', color: 'text-gold-500' },
  ];

  const pieData = [
    { name: 'Delivered', value: analytics?.deliveredCount || 0 },
    { name: 'Active', value: analytics?.activeDeliveries || 0 },
    { name: 'Expired', value: analytics?.expiredCount || 0 },
  ];
  const PIE_COLORS = ['#10b981', '#d4a843', '#ef4444'];

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'deliveries', label: 'Deliveries', icon: '📦' },
    { id: 'postmen', label: 'Postmen', icon: '📮' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-slate-200">🏛️ Admin <span className="text-gradient-gold">Dashboard</span></h2>
          <p className="text-sm text-slate-500 mt-1">System Overview & Management</p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card text-center p-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-navy-700/50'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Delivery Status Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyStats}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                    <Bar dataKey="count" fill="#d4a843" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card">
                <h3 className="text-sm font-semibold text-slate-300 mb-4">Success Rate</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map((d, i) => (
                    <span key={d.name} className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />{d.name}: {d.value}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent */}
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Recent Deliveries</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 border-b border-navy-700">
                    <th className="pb-2 pr-4">Address</th><th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Date</th>
                  </tr></thead>
                  <tbody>
                    {recentDeliveries.map(d => (
                      <tr key={d.id} className="border-b border-navy-800/50">
                        <td className="py-2 pr-4 text-slate-300 max-w-[200px] truncate">{d.address}</td>
                        <td className="py-2 pr-4 text-slate-400">{d.user?.name}</td>
                        <td className="py-2 pr-4"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${STATUS_COLORS[d.status]}20`, color: STATUS_COLORS[d.status] }}>{d.status}</span></td>
                        <td className="py-2 text-slate-500 text-xs">{new Date(d.generatedAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">👥 All Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-navy-700">
                  <th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Phone</th><th className="pb-2">Role</th><th className="pb-2">Deliveries</th><th className="pb-2">Joined</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-navy-800/50">
                      <td className="py-2 text-slate-300">{u.name}</td>
                      <td className="py-2 text-slate-400">{u.email}</td>
                      <td className="py-2 text-slate-400">{u.phone}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'ADMIN' ? 'bg-gold-500/20 text-gold-500' : 'bg-sky-500/20 text-sky-400'}`}>{u.role}</span></td>
                      <td className="py-2 text-slate-400">{u._count?.deliveries || 0}</td>
                      <td className="py-2 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'deliveries' && (
          <motion.div key="deliveries" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-300">📦 All Deliveries</h3>
              <select value={deliveryFilter} onChange={e => { setDeliveryFilter(e.target.value); setDeliveryPage(1); }}
                className="px-3 py-1.5 bg-navy-800 border border-navy-600 rounded-lg text-xs text-slate-300">
                <option value="">All Status</option>
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 border-b border-navy-700">
                  <th className="pb-2">Address</th><th className="pb-2">User</th><th className="pb-2">Postman</th><th className="pb-2">Status</th><th className="pb-2">Actions</th>
                </tr></thead>
                <tbody>
                  {deliveries.map(d => (
                    <tr key={d.id} className="border-b border-navy-800/50">
                      <td className="py-2 text-slate-300 max-w-[180px] truncate">{d.address}</td>
                      <td className="py-2 text-slate-400 text-xs">{d.user?.name}</td>
                      <td className="py-2 text-slate-400 text-xs">{d.postman?.name || '-'}</td>
                      <td className="py-2"><span className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${STATUS_COLORS[d.status]}20`, color: STATUS_COLORS[d.status] }}>{d.status}</span></td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          {d.status !== 'EXPIRED' && d.status !== 'DELIVERED' && (
                            <button onClick={() => handleUpdateStatus(d.id, 'EXPIRED')} className="px-2 py-0.5 text-xs bg-crimson-500/20 text-crimson-400 rounded hover:bg-crimson-500/30">Expire</button>
                          )}
                          <button onClick={() => handleDeleteDelivery(d.id)} className="px-2 py-0.5 text-xs bg-crimson-500/10 text-crimson-500 rounded hover:bg-crimson-500/20">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalDeliveryPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button disabled={deliveryPage <= 1} onClick={() => setDeliveryPage(p => p - 1)} className="px-3 py-1 text-xs bg-navy-700 text-slate-400 rounded disabled:opacity-30">← Prev</button>
                <span className="px-3 py-1 text-xs text-slate-500">{deliveryPage}/{totalDeliveryPages}</span>
                <button disabled={deliveryPage >= totalDeliveryPages} onClick={() => setDeliveryPage(p => p + 1)} className="px-3 py-1 text-xs bg-navy-700 text-slate-400 rounded disabled:opacity-30">Next →</button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'postmen' && (
          <motion.div key="postmen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">📮 Delivery Personnel</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {postmen.map(p => (
                <div key={p.id} className="p-4 bg-navy-800/50 rounded-xl border border-navy-700/50">
                  <p className="font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-sky-500 mt-1">ID: {p.employeeId}</p>
                  <p className="text-xs text-slate-500 mt-1">{p._count?.deliveries || 0} deliveries</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
