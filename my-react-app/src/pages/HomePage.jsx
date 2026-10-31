import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import usePrayerStore from '../store/prayerStore';
import { prayerTimesApi } from '../api/services';
import { hadithApi } from '../api/services';
import { Card, LoadingSpinner } from '../components/ui';
import { todayStr, formatTime12, getTimeDiff } from '../utils/helpers';

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const PRAYER_ICONS = { fajr: '🌅', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌙' };

function useCountdown(targetTime24) {
  const [countdown, setCountdown] = useState(null);
  useEffect(() => {
    if (!targetTime24) return;
    const tick = () => setCountdown(getTimeDiff(targetTime24));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime24]);
  return countdown;
}

function getHijriDate() {
  // Simple Hijri approximation — accurate enough for display
  const now = new Date();
  try {
    return now.toLocaleDateString('ar-SA-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function HomePage() {
  const { user } = useAuthStore();
  const { todayLog, fetchDayLog, fetchMonthlyStats, monthlyStats } = usePrayerStore();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [dailyHadith, setDailyHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = todayStr();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const nextPrayerTime = prayerTimes?.prayers?.[prayerTimes?.nextPrayer]?.time24;
  const countdown = useCountdown(nextPrayerTime);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Load prayer times using saved location or geolocation
        const loc = user?.location;
        let lat = loc?.lat;
        let lng = loc?.lng;

        if (!lat || !lng) {
          // Try geolocation
          await new Promise((resolve) => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
                () => { lat = 21.3891; lng = 39.8579; resolve(); }, // fallback: Makkah
                { timeout: 5000 }
              );
            } else {
              lat = 21.3891; lng = 39.8579; resolve();
            }
          });
        }

        const method = user?.settings?.calcMethod || 'Karachi';
        const madhab = user?.settings?.madhab || 'Hanafi';

        const [timesRes, hadithRes] = await Promise.allSettled([
          prayerTimesApi.getTimes({ lat, lng, method, madhab }),
          hadithApi.getDaily(),
        ]);

        if (timesRes.status === 'fulfilled') setPrayerTimes(timesRes.value.data.data);
        if (hadithRes.status === 'fulfilled') setDailyHadith(hadithRes.value.data.data);

        await Promise.allSettled([
          fetchDayLog(today),
          fetchMonthlyStats(month, year),
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const completedCount = PRAYER_NAMES.filter(
    (p) => todayLog?.prayers?.[p]?.status === 'performed' || todayLog?.prayers?.[p]?.status === 'late'
  ).length;

  const completionPct = Math.round((completedCount / 5) * 100);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-3">🕌</div>
          <LoadingSpinner size={28} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {getHijriDate() && (
            <p className="text-xs text-green-700 dark:text-green-400 font-arabic mt-0.5">
              {getHijriDate()}
            </p>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            Assalamu Alaikum{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 🌙
          </h1>
        </div>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-lg">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </Link>
      </div>

      {/* Next Prayer Card */}
      {prayerTimes && (
        <Card className="p-5 bg-gradient-to-br from-green-800 to-green-900 text-white border-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-green-300 text-xs uppercase tracking-wide">Next Prayer</p>
              <p className="text-2xl font-bold capitalize">
                {PRAYER_LABELS[prayerTimes.nextPrayer] || prayerTimes.nextPrayer}
                {' '}{PRAYER_ICONS[prayerTimes.nextPrayer]}
              </p>
              <p className="text-green-200 text-sm">
                {prayerTimes.prayers?.[prayerTimes.nextPrayer]?.time}
              </p>
            </div>
            {countdown && (
              <div className="text-right">
                <p className="text-green-300 text-xs">Remaining</p>
                <p className="text-3xl font-mono font-bold tabular-nums">
                  {String(countdown.hours).padStart(2, '0')}:{String(countdown.mins).padStart(2, '0')}
                </p>
                <p className="text-green-200 text-xs">hours : mins</p>
              </div>
            )}
          </div>

          {/* Prayer strip */}
          <div className="flex gap-2 mt-3">
            {PRAYER_NAMES.map((p) => {
              const status = todayLog?.prayers?.[p]?.status;
              const isNext = prayerTimes.nextPrayer === p;
              return (
                <div key={p} className={`flex-1 rounded-xl p-2 text-center ${
                  isNext ? 'bg-white/20' :
                  status === 'performed' || status === 'late' ? 'bg-green-500/30' :
                  status === 'missed' ? 'bg-red-500/30' : 'bg-white/10'
                }`}>
                  <p className="text-[10px] text-green-200">{PRAYER_LABELS[p]}</p>
                  <p className="text-xs font-semibold">{prayerTimes.prayers?.[p]?.time?.replace(' AM', 'a').replace(' PM', 'p')}</p>
                  <span className="text-[10px]">
                    {status === 'performed' || status === 'late' ? '✅' :
                     status === 'missed' ? '❌' : '⏳'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Today's Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">Today's Prayers</h2>
          <span className="text-xs text-green-700 dark:text-green-400 font-semibold">{completedCount}/5</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">{completionPct}% complete</p>
          <Link to="/prayer/tracker" className="text-xs text-green-700 dark:text-green-400 font-medium">
            Mark Prayers →
          </Link>
        </div>
      </Card>

      {/* Monthly Stats */}
      {monthlyStats && (
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-800 dark:text-white mb-3">
            {now.toLocaleString('default', { month: 'long' })} Stats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-green-50 dark:bg-green-950/30 rounded-xl p-3">
              <p className="text-2xl font-bold text-green-700">{monthlyStats.completionPercentage}%</p>
              <p className="text-xs text-gray-500 mt-0.5">Completion</p>
            </div>
            <div className="text-center bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
              <p className="text-2xl font-bold text-blue-700">{monthlyStats.performed}</p>
              <p className="text-xs text-gray-500 mt-0.5">Performed</p>
            </div>
            <div className="text-center bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
              <p className="text-2xl font-bold text-red-600">{monthlyStats.missed}</p>
              <p className="text-xs text-gray-500 mt-0.5">Missed</p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { to: '/quran', emoji: '📖', label: 'Quran' },
          { to: '/learn/hadith', emoji: '📚', label: 'Hadith' },
          { to: '/learn/duas', emoji: '🤲', label: 'Duas' },
          { to: '/learn/tasbeeh', emoji: '📿', label: 'Tasbeeh' },
          { to: '/prayer/qibla', emoji: '🧭', label: 'Qibla' },
          { to: '/learn/names', emoji: '☪️', label: '99 Names' },
          { to: '/learn/arabic', emoji: '🔤', label: 'Arabic' },
          { to: '/learn/ramadan', emoji: '🌙', label: 'Ramadan' },
        ].map(({ to, emoji, label }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-800 rounded-2xl hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors border border-gray-100 dark:border-gray-700 shadow-sm">
            <span className="text-2xl">{emoji}</span>
            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{label}</span>
          </Link>
        ))}
      </div>

      {/* Daily Hadith */}
      {dailyHadith && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">📖</span>
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">Daily Hadith</h2>
            <span className="ml-auto text-xs text-gray-400">{dailyHadith.collectionName}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4">
            {dailyHadith.text}
          </p>
          <Link to="/learn/hadith" className="text-xs text-green-700 dark:text-green-400 mt-2 inline-block font-medium">
            Read more →
          </Link>
        </Card>
      )}

      {/* Location */}
      {user?.location?.city && (
        <p className="text-center text-xs text-gray-400 pb-2">
          📍 {[user.location.city, user.location.country].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  );
}
