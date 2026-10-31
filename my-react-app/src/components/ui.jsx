import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-green-600 ${className}`} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl">🕌</div>
        <LoadingSpinner size={32} />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button', loading = false }) {
  const base = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-green-700 hover:bg-green-800 text-white active:scale-95',
    secondary: 'bg-green-50 hover:bg-green-100 text-green-800 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white active:scale-95',
    outline: 'border border-green-700 text-green-700 hover:bg-green-50 dark:border-green-500 dark:text-green-400',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && <LoadingSpinner size={16} />}
      {children}
    </button>
  );
}

export function Badge({ children, variant = 'green' }) {
  const variants = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    gold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, back, children }) {
  return (
    <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3 px-4 py-3">
        {back && (
          <button onClick={back} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>}
    </div>
  );
}

export function PremiumBanner({ onUpgrade }) {
  return (
    <div className="mx-4 my-3 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border border-amber-200 dark:border-amber-700 rounded-2xl">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⭐</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Unlock Premium</p>
          <p className="text-xs text-amber-700 dark:text-amber-400">Full Hadith library, all reciters & more</p>
        </div>
        <button
          onClick={onUpgrade}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg"
        >
          Upgrade
        </button>
      </div>
    </div>
  );
}
