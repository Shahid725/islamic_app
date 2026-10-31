import { NavLink, useLocation } from 'react-router-dom';
import { Home, Clock, BookOpen, GraduationCap, User } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/prayer', label: 'Prayer', icon: Clock },
  { to: '/quran', label: 'Quran', icon: BookOpen },
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-0.5 group"
            >
              <span
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-green-100 dark:bg-green-900'
                    : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                }`}
              >
                <Icon
                  size={20}
                  className={
                    isActive
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }
                />
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isActive
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
