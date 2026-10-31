import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useAppStore from '../store/appStore';
import { userApi } from '../api/services';
import { Card, PageHeader, Button, LoadingSpinner, Badge } from '../components/ui';
import toast from 'react-hot-toast';

// ── Profile Main ──
function ProfileMain() {
  const { user, logout, isPremium, updateUser } = useAuthStore();
  const { theme, setTheme } = useAppStore();
  const navigate = useNavigate();
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const premium = isPremium();

  const saveName = async () => {
    setSavingName(true);
    try {
      await userApi.updateProfile({ name });
      updateUser({ name });
      setEditName(false);
      toast.success('Name updated!');
    } catch { toast.error('Failed to update.'); }
    finally { setSavingName(false); }
  };

  const handleLogout = () => {
    if (window.confirm('Sign out?')) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      <div className="pt-6 pb-4 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-4xl font-bold text-green-700 dark:text-green-300">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        {editName ? (
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-green-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <Button onClick={saveName} loading={savingName} className="py-1.5">Save</Button>
            <Button variant="ghost" onClick={() => setEditName(false)}>✕</Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</p>
            <button onClick={() => setEditName(true)} className="text-xs text-green-700 dark:text-green-400 hover:underline">Edit name</button>
          </div>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        <div className="flex items-center gap-2">
          {premium ? (
            <Badge variant="gold">⭐ Premium</Badge>
          ) : (
            <Badge variant="gray">Free Plan</Badge>
          )}
          {user?.role === 'admin' && <Badge variant="green">Admin</Badge>}
        </div>
      </div>

      {/* Subscription */}
      {!premium && (
        <Card className="p-4 mb-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-700">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <div className="flex-1">
              <p className="font-bold text-amber-800 dark:text-amber-300">Upgrade to Premium</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">Starting ₹99/month</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('subscription')} className="text-amber-700 bg-amber-100 hover:bg-amber-200">
              Upgrade
            </Button>
          </div>
        </Card>
      )}

      {/* Settings */}
      <Card className="mb-4 overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Appearance</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
            <div className="flex gap-1">
              {['light', 'dark', 'system'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize ${
                    theme === t ? 'bg-green-700 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Prayer Settings */}
      <Card className="mb-4 overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Prayer Settings</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 px-4">
          <SettingRow
            label="Calculation Method"
            value={user?.settings?.calcMethod || 'Karachi'}
            options={['MWL', 'ISNA', 'Karachi', 'Egypt', 'UmmAlQura', 'Tehran']}
            settingKey="calcMethod"
          />
          <SettingRow
            label="Madhab (Asr)"
            value={user?.settings?.madhab || 'Hanafi'}
            options={['Hanafi', 'Shafi']}
            settingKey="madhab"
          />
        </div>
      </Card>

      {/* Quran Settings */}
      <Card className="mb-4 overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Quran Settings</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700 px-4">
          <SettingRow
            label="Translation"
            value={user?.settings?.translationLanguage || 'en'}
            options={[{ value: 'en', label: 'English' }, { value: 'ur', label: 'Urdu' }, { value: 'hi', label: 'Hindi' }]}
            settingKey="translationLanguage"
          />
        </div>
      </Card>

      {/* Account */}
      <Card className="mb-4 overflow-hidden">
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Account</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <button
            onClick={() => navigate('password')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span className="text-sm text-gray-700 dark:text-gray-300">Change Password</span>
            <span className="text-gray-400">›</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <span className="text-sm text-red-600">Sign Out</span>
            <span className="text-gray-400">›</span>
          </button>
        </div>
      </Card>

      <p className="text-center text-xs text-gray-400">Islamic Lifestyle App v1.0 • Made with ❤️</p>
    </div>
  );
}

function SettingRow({ label, value, options, settingKey }) {
  const { updateUser, user } = useAuthStore();
  const [saving, setSaving] = useState(false);

  const handleChange = async (newVal) => {
    setSaving(true);
    try {
      await userApi.updateSettings({ [settingKey]: newVal });
      updateUser({ settings: { ...user.settings, [settingKey]: newVal } });
    } catch { toast.error('Failed to save.'); }
    finally { setSaving(false); }
  };

  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      {saving ? (
        <LoadingSpinner size={14} />
      ) : (
        <select
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none text-gray-700 dark:text-gray-300"
        >
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </div>
  );
}

// ── Subscription Page ──
function SubscriptionPage() {
  const { user, isPremium } = useAuthStore();
  const navigate = useNavigate();
  const premium = isPremium();

  const PLANS = [
    { id: 'monthly', name: 'Monthly', price: '₹99', period: '/month', amount: 9900, features: ['Full Hadith library', 'All Quran reciters', '600 Arabic words', 'Advanced stats'] },
    { id: 'annual', name: 'Annual', price: '₹499', period: '/year', amount: 49900, features: ['Everything in Monthly', 'Offline downloads', 'Advanced Ramadan', 'Priority support'], badge: 'Best Value' },
    { id: 'lifetime', name: 'Lifetime', price: '₹1,499', period: 'one-time', amount: 149900, features: ['Everything in Annual', 'All future features', 'No renewal needed'], badge: 'Forever' },
  ];

  const handlePurchase = async (plan) => {
    toast('Payment integration requires Razorpay setup. Add RAZORPAY_KEY_ID to your .env file.', { icon: 'ℹ️' });
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      <PageHeader title="Premium Plans" back={() => navigate(-1)} />
      {premium && (
        <div className="mx-0 mt-4 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-2xl text-center">
          <p className="text-green-800 dark:text-green-300 font-semibold">⭐ You're already Premium!</p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
            {user?.subscription?.plan === 'lifetime' ? 'Lifetime access' : `Expires: ${new Date(user?.subscription?.expiresAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
      <div className="mt-4 space-y-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{plan.name}</h3>
                  {plan.badge && <Badge variant="gold">{plan.badge}</Badge>}
                </div>
                <p className="text-2xl font-bold text-green-700 mt-1">{plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span></p>
              </div>
            </div>
            <ul className="space-y-1.5 mb-4">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-green-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <Button onClick={() => handlePurchase(plan)} className="w-full" disabled={premium}>
              {premium ? 'Already Premium' : `Get ${plan.name}`}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Change Password Page ──
function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match.'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 chars.'); return; }
    setLoading(true);
    try {
      await userApi.updatePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated!');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      <PageHeader title="Change Password" back={() => navigate(-1)} />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {[
          { key: 'currentPassword', label: 'Current Password' },
          { key: 'newPassword', label: 'New Password' },
          { key: 'confirm', label: 'Confirm New Password' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
            <input
              type="password"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
        ))}
        <Button type="submit" className="w-full" loading={loading}>Update Password</Button>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Routes>
      <Route index element={<ProfileMain />} />
      <Route path="subscription" element={<SubscriptionPage />} />
      <Route path="password" element={<ChangePasswordPage />} />
    </Routes>
  );
}
