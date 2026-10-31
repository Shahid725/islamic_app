import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { prayerTimesApi, qiblaApi } from '../api/services';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { Card, PageHeader, LoadingSpinner, Button } from '../components/ui';
import { todayStr, formatTime12, getTimeDiff } from '../utils/helpers';
import toast from 'react-hot-toast';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LABELS = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const ICONS = { fajr: '🌅', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌙' };

// ── Prayer Times Page ──
function PrayerTimesPage() {
  const { user } = useAuthStore();
  const [times, setTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let lat = user?.location?.lat;
        let lng = user?.location?.lng;
        let city = user?.location?.city || 'Your Location';

        if (!lat || !lng) {
          await new Promise((resolve) => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
              () => { lat = 21.3891; lng = 39.8579; city = 'Makkah'; resolve(); },
              { timeout: 5000 }
            );
          });
        }

        setLocation({ lat, lng, city });
        const method = user?.settings?.calcMethod || 'Karachi';
        const madhab = user?.settings?.madhab || 'Hanafi';
        const { data } = await prayerTimesApi.getTimes({ lat, lng, method, madhab });
        setTimes(data.data);
      } catch { toast.error('Failed to load prayer times.'); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size={32} /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <PageHeader title="Prayer Times" subtitle={location?.city || 'Calculating...'} />

      {times && (
        <div className="space-y-3 mt-4">
          {/* Next Prayer Highlight */}
          <Card className="p-5 bg-gradient-to-br from-green-800 to-green-900 border-0 text-white">
            <p className="text-green-300 text-xs mb-1">Current: <span className="font-semibold capitalize">{LABELS[times.currentPrayer] || 'N/A'}</span></p>
            <p className="text-xs text-green-300 mb-2">Next: <span className="font-bold capitalize text-white">{LABELS[times.nextPrayer] || ''}</span></p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {PRAYERS.map((p) => (
                <div key={p} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${times.nextPrayer === p ? 'bg-white/25' : 'bg-white/10'}`}>
                  <span className="text-sm flex items-center gap-2">{ICONS[p]} {LABELS[p]}</span>
                  <span className="font-semibold text-sm">{times.prayers[p]?.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Sunnah Times */}
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Sunnah Times</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">🌙 Middle of Night</span>
                <span className="font-medium">{times.sunnah?.middleOfTheNight}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">⭐ Last Third</span>
                <span className="font-medium">{times.sunnah?.lastThirdOfTheNight}</span>
              </div>
            </div>
          </Card>

          <p className="text-xs text-center text-gray-400">
            Method: {times.method} • Madhab: {times.madhab}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Namaz Tracker Page ──
function NamazTrackerPage() {
  const { user } = useAuthStore();
  const { todayLog, fetchDayLog, updatePrayer, fetchMonthlyStats, monthlyStats } = usePrayerStore();
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [loadingPrayer, setLoadingPrayer] = useState(null);
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    fetchDayLog(selectedDate);
    fetchMonthlyStats(month, year);
  }, [selectedDate]);

  const handleToggle = async (prayer) => {
    const current = todayLog?.prayers?.[prayer]?.status;
    const next = current === 'performed' ? 'missed' : 'performed';
    setLoadingPrayer(prayer);
    try {
      await updatePrayer(selectedDate, prayer, next);
      toast.success(`${LABELS[prayer]} marked as ${next}.`);
    } catch {
      toast.error('Failed to update prayer.');
    } finally {
      setLoadingPrayer(null);
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <PageHeader title="Namaz Tracker" subtitle="Track your daily prayers" />

      <div className="mt-4 space-y-4">
        {/* Date Strip */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {days.slice(Math.max(0, now.getDate() - 4), now.getDate() + 3).map((d) => {
            const day = parseInt(d.split('-')[2]);
            const isToday = d === todayStr();
            const isSelected = d === selectedDate;
            const dayLog = monthlyStats?.dailyLogs?.find((l) => l.date === d);
            const pct = dayLog?.completionPercentage || 0;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-[52px] border transition-all ${
                  isSelected
                    ? 'bg-green-700 border-green-700 text-white'
                    : isToday
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-[10px] font-medium">
                  {new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-base font-bold">{day}</span>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: pct === 100 ? '#16a34a' : '#e5e7eb' }}>
                  {pct === 100 && <span className="text-[8px]">✓</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Prayer Cards */}
        <div className="space-y-2">
          {PRAYERS.map((prayer) => {
            const status = todayLog?.prayers?.[prayer]?.status || 'pending';
            const isLoading = loadingPrayer === prayer;
            return (
              <Card key={prayer} className="p-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{ICONS[prayer]}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{LABELS[prayer]}</p>
                    <p className="text-xs text-gray-400 capitalize">{status}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(prayer)}
                    disabled={isLoading}
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all active:scale-95 ${
                      status === 'performed' || status === 'late'
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700'
                        : status === 'missed'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                    }`}
                  >
                    {isLoading ? <LoadingSpinner size={18} /> :
                     status === 'performed' || status === 'late' ? '✅' :
                     status === 'missed' ? '❌' : '⭕'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Monthly Calendar */}
        {monthlyStats && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">
              Monthly Overview — {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const day = parseInt(d.split('-')[2]);
                const log = monthlyStats.dailyLogs?.find((l) => l.date === d);
                const pct = log?.completionPercentage || 0;
                const isSelected = d === selectedDate;
                const isFuture = d > todayStr();
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                      isSelected ? 'ring-2 ring-green-500' : ''
                    } ${
                      isFuture ? 'bg-gray-50 dark:bg-gray-800 text-gray-300' :
                      pct === 100 ? 'bg-green-500 text-white' :
                      pct >= 60 ? 'bg-green-200 text-green-800' :
                      pct > 0 ? 'bg-yellow-200 text-yellow-800' :
                      'bg-red-100 text-red-500'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 mt-3 text-xs text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> 100%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> 60%+</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200 inline-block" /> Partial</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Missed</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Qibla Page ──
function QiblaPage() {
  const { user } = useAuthStore();
  const [qibla, setQibla] = useState(null);
  const [heading, setHeading] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let lat = user?.location?.lat || 21.3891;
        let lng = user?.location?.lng || 39.8579;
        if (!user?.location?.lat) {
          await new Promise((resolve) => {
            navigator.geolocation?.getCurrentPosition(
              (p) => { lat = p.coords.latitude; lng = p.coords.longitude; resolve(); },
              () => resolve(), { timeout: 5000 }
            );
          });
        }
        const { data } = await qiblaApi.getQibla({ lat, lng });
        setQibla(data.data);
      } catch { setError('Could not calculate Qibla direction.'); }
      finally { setLoading(false); }
    };
    load();

    // Device orientation
    const handleOrientation = (e) => {
      const compassHeading = e.webkitCompassHeading || (e.alpha ? 360 - e.alpha : 0);
      setHeading(compassHeading);
    };
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleOrientation, true);
    }
  }, [user]);

  const qiblaBearing = qibla?.bearing || 0;
  const arrowAngle = qiblaBearing - heading;

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size={32} /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <PageHeader title="Qibla Compass" subtitle="Direction to the Kaaba" />
      <div className="mt-6 flex flex-col items-center gap-6">
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <>
            {/* Compass */}
            <div className="relative w-64 h-64">
              {/* Compass background */}
              <div className="absolute inset-0 rounded-full border-4 border-green-200 bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center">
                <div className="text-5xl">🕋</div>
              </div>
              {/* N / S / E / W */}
              {[['N', 'top-2 left-1/2 -translate-x-1/2'], ['S', 'bottom-2 left-1/2 -translate-x-1/2'], ['E', 'right-2 top-1/2 -translate-y-1/2'], ['W', 'left-2 top-1/2 -translate-y-1/2']].map(([l, pos]) => (
                <span key={l} className={`absolute ${pos} text-xs font-bold text-gray-400`}>{l}</span>
              ))}
              {/* Qibla Arrow */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${arrowAngle}deg)`, transition: 'transform 0.3s ease' }}
              >
                <div className="h-28 w-1 bg-green-600 rounded-full relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-green-600" />
                </div>
              </div>
            </div>

            <Card className="p-4 w-full max-w-xs text-center">
              <p className="text-xs text-gray-500 mb-1">Qibla Direction</p>
              <p className="text-3xl font-bold text-green-700">{qibla?.direction}</p>
              <p className="text-xs text-gray-400 mt-1">from North (clockwise)</p>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-3 w-full max-w-xs">
              <p className="text-xs text-amber-800 dark:text-amber-300 text-center">
                🧭 For accuracy, hold your device flat and away from metal objects. Calibrate by moving in a figure-8 pattern.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Prayer Page Router ──
export default function PrayerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/prayer', label: 'Times' },
    { path: '/prayer/tracker', label: 'Tracker' },
    { path: '/prayer/qibla', label: 'Qibla' },
  ];

  return (
    <div>
      {/* Tab Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="flex max-w-lg mx-auto">
          {tabs.map(({ path, label }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  isActive
                    ? 'border-green-600 text-green-700 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Routes>
        <Route index element={<PrayerTimesPage />} />
        <Route path="tracker" element={<NamazTrackerPage />} />
        <Route path="qibla" element={<QiblaPage />} />
      </Routes>
    </div>
  );
}
