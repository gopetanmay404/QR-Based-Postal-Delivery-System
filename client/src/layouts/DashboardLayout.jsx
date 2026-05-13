import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Toast from '../components/common/Toast';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar />
      <Toast />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
