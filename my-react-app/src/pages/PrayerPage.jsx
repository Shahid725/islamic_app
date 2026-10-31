import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { prayerTimesApi, qiblaApi, prayersApi } from '../api/services';
import usePrayerStore from '../store/prayerStore';
import useAuthStore from '../store/authStore';
import { Card, PageHeader, LoadingSpinner, Button } from '../components/ui';
import { todayStr, getTimeDiff } from '../utils/helpers';
import toast from 'react-hot-toast';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const LABELS  = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' };
const ICONS   = { fajr: '🌅', dhuhr: '☀️', asr: '🌤️', maghrib: '🌇', isha: '🌙' };

// ── Status Config ──────────────────────────────────────────
const STATUSES = [
  { value: 'with_jamaat', label: 'With Jamaat', color: '#14532d', bg: '#dcfce7', text: '#14532d' },
  { value: 'on_time',     label: 'On Time',     color: '#16a34a', bg: '#bbf7d0', text: '#166534' },
  { value: 'qaza',        label: 'Qaza',        color: '#eab308', bg: '#fef9c3', text: '#854d0e' },
  { value: 'umar_qaza',   label: 'Umar-e-Qaza', color: '#d1d5db', bg: '#f3f4f6', text: '#6b7280' },
  { value: 'missed',      label: 'Missed',      color: '#ef4444', bg: '#fee2e2', text: '#991b1b' },
];

// Ring color by status – matches the spec exactly
const RING_COLOR = {
  with_jamaat: '#14532d',  // dark green
  on_time:     '#4ade80',  // light green
  qaza:        '#facc15',  // yellow
  umar_qaza:   '#d1d5db',  // light gray
  missed:      '#ffffff',  // white (border only)
  pending:     '#e5e7eb',  // neutral gray
};
const RING_BORDER = {
  with_jamaat: '#14532d',
  on_time:     '#16a34a',
  qaza:        '#ca8a04',
  umar_qaza:   '#9ca3af',
  missed:      '#9ca3af',
  pending:     '#d1d5db',
};

function statusLabel(s) {
  return STATUSES.find((x) => x.value === s)?.label || '—';
}

function statusColors(s) {
  return STATUSES.find((x) => x.value === s) || { bg: '#f3f4f6', text: '#6b7280' };
}

// ── Five Prayer Rings (one per prayer) ──────────────────────
function PrayerRings({ prayers }) {
  return (
    <div className="flex gap-[3px] mt-1 justify-center">
      {PRAYERS.map((p) => {
        const st = prayers?.[p]?.status || 'pending';
        return (
          <span
            key={p}
            title={`${LABELS[p]}: ${statusLabel(st)}`}
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: RING_COLOR[st],
              border: `1.5px solid ${RING_BORDER[st]}`,
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ── Status Picker Modal ─────────────────────────────────────
function StatusModal({ prayer, currentStatus, onSelect, onClose }) {
  const overlayRef = useRef(null);
  // close on backdrop click
  const handleOverlayClick = (e) => { if (e.target === overlayRef.current) onClose(); };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[1px]"
    >
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl">{ICONS[prayer]}</span>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-base">{LABELS[prayer]}</p>
            <p className="text-xs text-gray-400">Select prayer status</p>
          </div>
        </div>

        {/* Status options */}
        <div className="space-y-2">
          {STATUSES.map((s) => {
            const isActive = currentStatus === s.value;
            return (
              <button
                key={s.value}
                onClick={() => onSelect(s.value)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]"
                style={{
                  borderColor: isActive ? s.color : '#e5e7eb',
                  background: isActive ? s.bg : 'transparent',
                }}
              >
                {/* Color dot */}
                <span
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: RING_COLOR[s.value],
                    border: `2px solid ${RING_BORDER[s.value]}`,
                    flexShrink: 0,
                  }}
                />
                <span
                  className="flex-1 text-left font-semibold text-sm"
                  style={{ color: isActive ? s.text : '#374151' }}
                >
                  {s.label}
                </span>
                {isActive && (
                  <span style={{ color: s.color }} className="text-lg">✓</span>
                )}
              </button>
            );
          })}

          {/* Clear option */}
          {currentStatus && currentStatus !== 'pending' && (
            <button
              onClick={() => onSelect('pending')}
              className="w-full text-center text-xs text-gray-400 hover:text-red-500 pt-2 pb-1 transition-colors"
            >
              Clear status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ── NAMAZ TRACKER PAGE ──
// ══════════════════════════════════════════════════════
function NamazTrackerPage() {
  const { user } = useAuthStore();
  const { fetchMonthlyStats, monthlyStats, updatePrayer } = usePrayerStore();

  const now     = new Date();
  const todayD  = todayStr();
  const curYear = now.getFullYear();
  const curMonth= now.getMonth() + 1;

  // Default to current year/month
  const [viewYear,  setViewYear]  = useState(curYear);
  const [viewMonth, setViewMonth] = useState(curMonth);
  const [selectedDate, setSelectedDate] = useState(todayD);
  const [dayLog,       setDayLog]       = useState(null);
  const [loadingDay,   setLoadingDay]   = useState(false);
  const [modal,        setModal]        = useState(null); // { prayer }
  const [savingPrayer, setSavingPrayer] = useState(null);

  // Fetch monthly stats whenever view month changes
  useEffect(() => {
    fetchMonthlyStats(viewMonth, viewYear);
  }, [viewMonth, viewYear]);

  // Fetch day log whenever selected date changes
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingDay(true);
    prayersApi.getDayLog(selectedDate)
      .then(({ data }) => setDayLog(data.data))
      .catch(() => toast.error('Failed to load day log.'))
      .finally(() => setLoadingDay(false));
  }, [selectedDate]);

  // Navigate month
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    // Don't allow navigating past current month
    if (viewYear === curYear && viewMonth === curMonth) return;
    if (viewMonth === 12) { setViewMonth(1); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const isNextDisabled = viewYear === curYear && viewMonth === curMonth;

  // Build calendar grid
  const daysInMonth  = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun

  const allDates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  });

  // Map date → prayer statuses from monthlyStats
  const logMap = {};
  monthlyStats?.dailyLogs?.forEach((l) => { logMap[l.date] = l; });

  // Click a calendar date
  const handleDateClick = (date) => {
    if (date > todayD) return; // block future
    setSelectedDate(date);
  };

  // Open status modal
  const openModal = (prayer) => {
    if (!selectedDate || selectedDate > todayD) return;
    setModal({ prayer });
  };

  // Save a prayer status
  const handleSelectStatus = async (status) => {
    const prayer = modal.prayer;
    setModal(null);
    setSavingPrayer(prayer);
    try {
      const { data } = await prayersApi.updatePrayer(selectedDate, prayer, { status });
      setDayLog(data.data);
      // Also refresh monthly stats so rings update immediately
      await fetchMonthlyStats(viewMonth, viewYear);
      toast.success(`${LABELS[prayer]} → ${statusLabel(status)}`);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSavingPrayer(null);
    }
  };

  const isFutureDate = selectedDate > todayD;

  // ── Day/week header labels
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-lg mx-auto pb-6">
      <PageHeader title="Namaz Tracker" subtitle="Track your daily prayers" />

      {/* ── Month Navigator ── */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={prevMonth}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          ‹
        </button>
        <h2 className="font-bold text-gray-900 dark:text-white text-base">
          {new Date(viewYear, viewMonth - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button
          onClick={nextMonth}
          disabled={isNextDisabled}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="px-3">
        {/* Day name headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {allDates.map((date) => {
            const day        = parseInt(date.split('-')[2]);
            const isToday    = date === todayD;
            const isSelected = date === selectedDate;
            const isFuture   = date > todayD;
            const log        = logMap[date];
            const prayers    = log?.prayers;

            return (
              <button
                key={date}
                onClick={() => handleDateClick(date)}
                disabled={isFuture}
                className={[
                  'flex flex-col items-center pt-1.5 pb-1 rounded-xl transition-all',
                  isFuture
                    ? 'opacity-30 cursor-not-allowed'
                    : 'cursor-pointer active:scale-95',
                  isSelected && !isFuture
                    ? 'bg-green-700 ring-2 ring-green-500 ring-offset-1'
                    : isToday
                    ? 'bg-green-50 dark:bg-green-950/40 ring-1 ring-green-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {/* Date number */}
                <span
                  className={[
                    'text-xs font-bold leading-none mb-1',
                    isSelected && !isFuture
                      ? 'text-white'
                      : isToday
                      ? 'text-green-700 dark:text-green-400'
                      : isFuture
                      ? 'text-gray-300 dark:text-gray-600'
                      : 'text-gray-800 dark:text-gray-200',
                  ].join(' ')}
                >
                  {day}
                </span>

                {/* 5 Prayer Rings */}
                <PrayerRings prayers={prayers} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="px-4 mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {STATUSES.map((s) => (
          <span key={s.value} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: RING_COLOR[s.value],
              border: `1.5px solid ${RING_BORDER[s.value]}`,
              display: 'inline-block', flexShrink: 0,
            }} />
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#e5e7eb', border: '1.5px solid #d1d5db',
            display: 'inline-block', flexShrink: 0,
          }} />
          Not recorded
        </span>
      </div>

      {/* ── Selected Date Prayer Table ── */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
            {selectedDate
              ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })
              : 'Select a date'}
          </h3>
          {selectedDate === todayD && (
            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
              TODAY
            </span>
          )}
          {isFutureDate && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              FUTURE — locked
            </span>
          )}
        </div>

        {loadingDay ? (
          <div className="flex justify-center py-6"><LoadingSpinner size={24} /></div>
        ) : (
          <Card className="overflow-hidden">
            {PRAYERS.map((prayer, idx) => {
              const status  = dayLog?.prayers?.[prayer]?.status || 'pending';
              const sc      = statusColors(status);
              const isLast  = idx === PRAYERS.length - 1;
              const isSaving= savingPrayer === prayer;

              return (
                <button
                  key={prayer}
                  onClick={() => !isFutureDate && openModal(prayer)}
                  disabled={isFutureDate || isSaving}
                  className={[
                    'w-full flex items-center gap-4 px-4 py-3.5 transition-all',
                    !isLast ? 'border-b border-gray-100 dark:border-gray-700' : '',
                    !isFutureDate ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60 active:scale-[0.99]' : '',
                    isFutureDate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {/* Prayer icon */}
                  <span className="text-2xl w-9 text-center flex-shrink-0">
                    {ICONS[prayer]}
                  </span>

                  {/* Prayer name */}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {LABELS[prayer]}
                    </p>
                  </div>

                  {/* Status badge */}
                  {isSaving ? (
                    <LoadingSpinner size={18} />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          background: sc.bg,
                          color: sc.text,
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 10px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {status === 'pending' ? 'Tap to set' : statusLabel(status)}
                      </span>
                      {/* Color ring indicator */}
                      <span
                        style={{
                          width: 12, height: 12, borderRadius: '50%',
                          background: RING_COLOR[status],
                          border: `2px solid ${RING_BORDER[status]}`,
                          display: 'inline-block', flexShrink: 0,
                        }}
                      />
                    </div>
                  )}

                  {/* Chevron */}
                  {!isFutureDate && (
                    <span className="text-gray-300 dark:text-gray-600 text-sm ml-1">›</span>
                  )}
                </button>
              );
            })}
          </Card>
        )}

        {/* Completion bar for selected date */}
        {dayLog && !isFutureDate && (() => {
          const SCORE = { with_jamaat: 1, on_time: 1, qaza: 0.5, umar_qaza: 0.25, missed: 0, pending: 0 };
          const score = PRAYERS.reduce((s, p) => s + (SCORE[dayLog.prayers?.[p]?.status] ?? 0), 0);
          const pct   = Math.round((score / 5) * 100);
          const done  = PRAYERS.filter(p => dayLog.prayers?.[p]?.status && dayLog.prayers[p].status !== 'pending').length;
          return (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{done} of 5 prayers recorded</span>
                <span className="font-semibold text-green-700 dark:text-green-400">{pct}% score</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80 ? '#16a34a' : pct >= 50 ? '#eab308' : '#ef4444',
                  }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Monthly Summary ── */}
      {monthlyStats && (
        <div className="px-4 mt-5">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-3">Monthly Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{monthlyStats.completionPercentage}%</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Avg Score</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{monthlyStats.performed}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">On Time</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{monthlyStats.missed}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Missed</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Modal ── */}
      {modal && (
        <StatusModal
          prayer={modal.prayer}
          currentStatus={dayLog?.prayers?.[modal.prayer]?.status || 'pending'}
          onSelect={handleSelectStatus}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ── PRAYER TIMES PAGE ──
// ══════════════════════════════════════════════════════
function PrayerTimesPage() {
  const { user } = useAuthStore();
  const [times,    setTimes]    = useState(null);
  const [location, setLocation] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let lat  = user?.location?.lat;
        let lng  = user?.location?.lng;
        let city = user?.location?.city || 'Your Location';

        if (!lat || !lng) {
          await new Promise((resolve) => {
            navigator.geolocation?.getCurrentPosition(
              (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; resolve(); },
              ()    => { lat = 21.3891; lng = 39.8579; city = 'Makkah'; resolve(); },
              { timeout: 5000 }
            );
          });
        }

        setLocation({ lat, lng, city });
        const method = user?.settings?.calcMethod || 'Karachi';
        const madhab = user?.settings?.madhab     || 'Hanafi';
        const { data } = await prayerTimesApi.getTimes({ lat, lng, method, madhab });
        setTimes(data.data);
      } catch { toast.error('Failed to load prayer times.'); }
      finally   { setLoading(false); }
    };
    load();
  }, [user]);

  // Live countdown
  useEffect(() => {
    if (!times) return;
    const nextTime = times.prayers?.[times.nextPrayer]?.time24;
    if (!nextTime) return;
    const tick = () => setCountdown(getTimeDiff(nextTime));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [times]);

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size={32} /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <PageHeader title="Prayer Times" subtitle={location?.city || 'Calculating...'} />

      {times && (
        <div className="space-y-3 mt-4">
          <Card className="p-5 bg-gradient-to-br from-green-800 to-green-900 border-0 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-300 text-xs uppercase tracking-wide">Next Prayer</p>
                <p className="text-2xl font-bold capitalize mt-0.5">
                  {LABELS[times.nextPrayer] || times.nextPrayer} {ICONS[times.nextPrayer]}
                </p>
                <p className="text-green-200 text-sm">{times.prayers?.[times.nextPrayer]?.time}</p>
              </div>
              {countdown && (
                <div className="text-right">
                  <p className="text-green-300 text-xs">Remaining</p>
                  <p className="text-3xl font-mono font-bold tabular-nums">
                    {String(countdown.hours).padStart(2,'0')}:{String(countdown.mins).padStart(2,'0')}
                  </p>
                  <p className="text-green-200 text-xs tabular-nums">
                    :{String(countdown.secs).padStart(2,'0')}
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRAYERS.map((p) => (
                <div key={p} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${times.nextPrayer === p ? 'bg-white/25' : 'bg-white/10'}`}>
                  <span className="text-sm flex items-center gap-2">{ICONS[p]} {LABELS[p]}</span>
                  <span className="font-semibold text-sm">{times.prayers[p]?.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Sunnah Times</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">🌙 Middle of Night</span>
                <span className="font-medium">{times.sunnah?.middleOfTheNight}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">⭐ Last Third of Night</span>
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

// ══════════════════════════════════════════════════════
// ── QIBLA PAGE ──
// ══════════════════════════════════════════════════════
function QiblaPage() {
  const { user } = useAuthStore();
  const [qibla,   setQibla]   = useState(null);
  const [heading, setHeading] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

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
              ()  => resolve(),
              { timeout: 5000 }
            );
          });
        }
        const { data } = await qiblaApi.getQibla({ lat, lng });
        setQibla(data.data);
      } catch { setError('Could not calculate Qibla direction.'); }
      finally   { setLoading(false); }
    };
    load();

    const handleOrientation = (e) => {
      const compassHeading = e.webkitCompassHeading || (e.alpha ? 360 - e.alpha : 0);
      setHeading(compassHeading);
    };
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
      return () => window.removeEventListener('deviceorientation', handleOrientation, true);
    }
  }, [user]);

  const arrowAngle = (qibla?.bearing || 0) - heading;

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size={32} /></div>;

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <PageHeader title="Qibla Compass" subtitle="Direction to the Kaaba" />
      <div className="mt-6 flex flex-col items-center gap-6">
        {error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : (
          <>
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full border-4 border-green-200 bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center">
                <div className="text-5xl">🕋</div>
              </div>
              {[['N','top-2 left-1/2 -translate-x-1/2'],['S','bottom-2 left-1/2 -translate-x-1/2'],['E','right-2 top-1/2 -translate-y-1/2'],['W','left-2 top-1/2 -translate-y-1/2']].map(([l,pos]) => (
                <span key={l} className={`absolute ${pos} text-xs font-bold text-gray-400`}>{l}</span>
              ))}
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
                🧭 Hold device flat, away from metal objects. Calibrate by moving in a figure-8 pattern.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Prayer Page Router ──────────────────────────────────
export default function PrayerPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/prayer',         label: 'Times'   },
    { path: '/prayer/tracker', label: 'Tracker' },
    { path: '/prayer/qibla',   label: 'Qibla'   },
  ];

  return (
    <div>
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Routes>
        <Route index          element={<PrayerTimesPage />}  />
        <Route path="tracker" element={<NamazTrackerPage />} />
        <Route path="qibla"   element={<QiblaPage />}        />
      </Routes>
    </div>
  );
}
