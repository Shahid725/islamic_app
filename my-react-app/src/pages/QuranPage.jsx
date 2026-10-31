import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { quranApi } from '../api/services';
import { Card, PageHeader, LoadingSpinner, EmptyState, Badge, Button } from '../components/ui';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

// ── Surah List ──
function SurahListPage() {
  const [surahs, setSurahs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    quranApi.getSurahs().then(({ data }) => {
      setSurahs(data.data);
      setLoading(false);
    }).catch(() => { toast.error('Failed to load Surahs.'); setLoading(false); });
  }, []);

  const filtered = surahs.filter((s) =>
    s.englishName.toLowerCase().includes(search.toLowerCase()) ||
    s.name.includes(search) ||
    String(s.number).includes(search)
  );

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="The Holy Quran" subtitle="114 Surahs" />

      {/* Search */}
      <div className="px-4 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search Surah..."
          className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><LoadingSpinner size={28} /></div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((s) => (
            <button
              key={s.number}
              onClick={() => navigate(`/quran/${s.number}`)}
              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-400 flex-shrink-0">
                {s.number}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.englishName}</p>
                <p className="text-xs text-gray-500">{s.englishNameTranslation} • {s.numberOfAyahs} verses</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-arabic text-gray-800 dark:text-gray-200">{s.name}</p>
                <Badge variant={s.revelationType === 'Meccan' ? 'green' : 'gold'}>
                  {s.revelationType}
                </Badge>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <EmptyState icon="🔍" title="No results" />}
        </div>
      )}
    </div>
  );
}

// ── Surah Reader ──
function SurahReaderPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [surahNum, setSurahNum] = useState(1);
  const [surah, setSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(user?.settings?.quranFontSize || 24);
  const [showTranslation, setShowTranslation] = useState(true);
  const [edition, setEdition] = useState('en.asad');
  const [audioUrl, setAudioUrl] = useState(null);
  const [playingAyah, setPlayingAyah] = useState(null);
  const audioRef = useRef(null);

  // Get surahNum from URL
  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const num = parseInt(parts[parts.length - 1]);
    if (num >= 1 && num <= 114) setSurahNum(num);
  }, []);

  useEffect(() => {
    setLoading(true);
    quranApi.getSurah(surahNum, edition).then(({ data }) => {
      setSurah(data.data);
      setLoading(false);
    }).catch(() => { toast.error('Failed to load Surah.'); setLoading(false); });
  }, [surahNum, edition]);

  const playAyahAudio = (surahN, ayahN) => {
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${
      ((surahN - 1) * 10000 + ayahN)
    }.mp3`;
    // Build proper Quran audio URL
    const paddedSurah = String(surahN).padStart(3, '0');
    const paddedAyah = String(ayahN).padStart(3, '0');
    const audioSrc = `https://verse.mp3quran.net/arabic/alafasy/128/${paddedSurah}${paddedAyah}.mp3`;
    setPlayingAyah(ayahN);
    setAudioUrl(audioSrc);
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl]);

  const addBookmark = async (ayah) => {
    try {
      await quranApi.addBookmark({ surahNumber: surahNum, ayahNumber: ayah.numberInSurah, surahName: surah.englishName });
      toast.success('Bookmark added! 🔖');
    } catch (err) {
      if (err.response?.status === 409) toast.error('Already bookmarked.');
      else toast.error('Failed to bookmark.');
    }
  };

  const EDITIONS = [
    { value: 'en.asad', label: 'English (Asad)' },
    { value: 'en.pickthall', label: 'English (Pickthall)' },
    { value: 'ur.maududi', label: 'Urdu (Maududi)' },
    { value: 'hi.farooq', label: 'Hindi' },
  ];

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size={32} /></div>;
  if (!surah) return null;

  return (
    <div className="max-w-lg mx-auto pb-8">
      <PageHeader title={surah.englishName} subtitle={`${surah.englishNameTranslation} • ${surah.numberOfAyahs} verses`} back={() => navigate('/quran')}>
        {/* Font size controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize(Math.max(18, fontSize - 2))} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">A-</button>
          <button onClick={() => setFontSize(Math.min(48, fontSize + 2))} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">A+</button>
        </div>
      </PageHeader>

      {/* Controls */}
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap">
        <select
          value={edition}
          onChange={(e) => setEdition(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none"
        >
          {EDITIONS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <button
          onClick={() => setShowTranslation(!showTranslation)}
          className={`text-xs px-3 py-1.5 rounded-lg border ${showTranslation ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-100 border-gray-200 text-gray-600'}`}
        >
          Translation {showTranslation ? 'On' : 'Off'}
        </button>
        <div className="flex gap-1">
          <button onClick={() => surahNum > 1 && setSurahNum(surahNum - 1)} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100">← Prev</button>
          <button onClick={() => surahNum < 114 && setSurahNum(surahNum + 1)} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-green-100">Next →</button>
        </div>
      </div>

      {/* Bismillah */}
      {surahNum !== 1 && surahNum !== 9 && (
        <div className="text-center py-4 px-4 border-b border-gray-100 dark:border-gray-800">
          <p className="font-arabic text-2xl text-green-800 dark:text-green-300" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
        </div>
      )}

      {/* Ayahs */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {surah.ayahs.map((ayah) => (
          <div key={ayah.numberInSurah} className="px-4 py-5">
            {/* Ayah number + actions */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                {ayah.numberInSurah}
              </div>
              <div className="flex-1" />
              <button onClick={() => playAyahAudio(surahNum, ayah.numberInSurah)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-green-600">
                {playingAyah === ayah.numberInSurah ? '⏸️' : '▶️'}
              </button>
              <button onClick={() => addBookmark(ayah)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-amber-500">
                🔖
              </button>
            </div>

            {/* Arabic Text */}
            <p
              dir="rtl"
              className="font-arabic text-gray-900 dark:text-gray-100 leading-loose text-right"
              style={{ fontSize: `${fontSize}px` }}
            >
              {ayah.text}
            </p>

            {/* Translation */}
            {showTranslation && ayah.translation && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
                {ayah.translation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingAyah(null)} className="hidden" />
    </div>
  );
}

export default function QuranPage() {
  return (
    <Routes>
      <Route index element={<SurahListPage />} />
      <Route path=":surahNum" element={<SurahReaderPage />} />
    </Routes>
  );
}
