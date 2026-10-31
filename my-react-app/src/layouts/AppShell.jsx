import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Main content with bottom nav padding */}
      <main className="pb-20 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
