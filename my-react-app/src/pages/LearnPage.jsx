import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { hadithApi, tasbeehApi, ramadanApi } from '../api/services';
import { Card, PageHeader, LoadingSpinner, EmptyState, PremiumBanner, Button, Badge } from '../components/ui';
import useAuthStore from '../store/authStore';
import { todayStr } from '../utils/helpers';
import toast from 'react-hot-toast';

// ── Data: 99 Names of Allah (bundled) ──
const ALLAH_NAMES = [
  { num: 1, arabic: 'الرَّحْمَنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Gracious', urdu: 'بہت مہربان', hindi: 'अत्यंत कृपालु' },
  { num: 2, arabic: 'الرَّحِيمُ', transliteration: 'Ar-Raheem', meaning: 'The Most Merciful', urdu: 'بہت رحم کرنے والا', hindi: 'अत्यंत दयालु' },
  { num: 3, arabic: 'الْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King', urdu: 'بادشاہ', hindi: 'राजा' },
  { num: 4, arabic: 'الْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy', urdu: 'پاک ذات', hindi: 'परम पवित्र' },
  { num: 5, arabic: 'السَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace', urdu: 'سلامتی دینے والا', hindi: 'शांति का स्रोत' },
  { num: 6, arabic: 'الْمُؤْمِنُ', transliteration: 'Al-Mumin', meaning: 'The Guardian of Faith', urdu: 'امن دینے والا', hindi: 'विश्वास का रक्षक' },
  { num: 7, arabic: 'الْمُهَيْمِنُ', transliteration: 'Al-Muhaymin', meaning: 'The Protector', urdu: 'نگہبان', hindi: 'संरक्षक' },
  { num: 8, arabic: 'الْعَزِيزُ', transliteration: 'Al-Aziz', meaning: 'The Almighty', urdu: 'زبردست', hindi: 'सर्वशक्तिमान' },
  { num: 9, arabic: 'الْجَبَّارُ', transliteration: 'Al-Jabbar', meaning: 'The Compeller', urdu: 'زور آور', hindi: 'बाध्य करने वाला' },
  { num: 10, arabic: 'الْمُتَكَبِّرُ', transliteration: 'Al-Mutakabbir', meaning: 'The Supreme', urdu: 'بڑائی والا', hindi: 'सर्वोच्च' },
  { num: 11, arabic: 'الْخَالِقُ', transliteration: 'Al-Khaliq', meaning: 'The Creator', urdu: 'پیدا کرنے والا', hindi: 'सृष्टिकर्ता' },
  { num: 12, arabic: 'الْبَارِئُ', transliteration: 'Al-Bari', meaning: 'The Evolver', urdu: 'بنانے والا', hindi: 'विकसित करने वाला' },
  { num: 13, arabic: 'الْمُصَوِّرُ', transliteration: 'Al-Musawwir', meaning: 'The Fashioner', urdu: 'صورت بنانے والا', hindi: 'रूप देने वाला' },
  { num: 14, arabic: 'الْغَفَّارُ', transliteration: 'Al-Ghaffar', meaning: 'The Forgiver', urdu: 'بہت بخشنے والا', hindi: 'क्षमाशील' },
  { num: 15, arabic: 'الْقَهَّارُ', transliteration: 'Al-Qahhar', meaning: 'The Subduer', urdu: 'زبردست قابو کرنے والا', hindi: 'विजेता' },
  { num: 16, arabic: 'الْوَهَّابُ', transliteration: 'Al-Wahhab', meaning: 'The Bestower', urdu: 'بہت دینے والا', hindi: 'दाता' },
  { num: 17, arabic: 'الرَّزَّاقُ', transliteration: 'Ar-Razzaq', meaning: 'The Provider', urdu: 'رزق دینے والا', hindi: 'पालनकर्ता' },
  { num: 18, arabic: 'الْفَتَّاحُ', transliteration: 'Al-Fattah', meaning: 'The Opener', urdu: 'کھولنے والا', hindi: 'खोलने वाला' },
  { num: 19, arabic: 'الْعَلِيمُ', transliteration: 'Al-Alim', meaning: 'The All-Knowing', urdu: 'سب جاننے والا', hindi: 'सर्वज्ञ' },
  { num: 20, arabic: 'الْقَابِضُ', transliteration: 'Al-Qabid', meaning: 'The Withholder', urdu: 'روکنے والا', hindi: 'रोकने वाला' },
  { num: 21, arabic: 'الْبَاسِطُ', transliteration: 'Al-Basit', meaning: 'The Extender', urdu: 'پھیلانے والا', hindi: 'विस्तार करने वाला' },
  { num: 22, arabic: 'الْخَافِضُ', transliteration: 'Al-Khafid', meaning: 'The Abaser', urdu: 'پست کرنے والا', hindi: 'नीचा दिखाने वाला' },
  { num: 23, arabic: 'الرَّافِعُ', transliteration: 'Ar-Rafi', meaning: 'The Exalter', urdu: 'بلند کرنے والا', hindi: 'ऊंचा उठाने वाला' },
  { num: 24, arabic: 'الْمُعِزُّ', transliteration: 'Al-Muizz', meaning: 'The Honorer', urdu: 'عزت دینے والا', hindi: 'सम्मान देने वाला' },
  { num: 25, arabic: 'الْمُذِلُّ', transliteration: 'Al-Mudhill', meaning: 'The Dishonourer', urdu: 'ذلیل کرنے والا', hindi: 'अपमान करने वाला' },
  { num: 26, arabic: 'السَّمِيعُ', transliteration: 'As-Sami', meaning: 'The All-Hearing', urdu: 'سننے والا', hindi: 'सर्वश्रवण' },
  { num: 27, arabic: 'الْبَصِيرُ', transliteration: 'Al-Basir', meaning: 'The All-Seeing', urdu: 'دیکھنے والا', hindi: 'सर्वदृष्टा' },
  { num: 28, arabic: 'الْحَكَمُ', transliteration: 'Al-Hakam', meaning: 'The Judge', urdu: 'فیصلہ کرنے والا', hindi: 'न्यायाधीश' },
  { num: 29, arabic: 'الْعَدْلُ', transliteration: 'Al-Adl', meaning: 'The Just', urdu: 'انصاف کرنے والا', hindi: 'न्यायी' },
  { num: 30, arabic: 'اللَّطِيفُ', transliteration: 'Al-Latif', meaning: 'The Subtle One', urdu: 'باریک بین', hindi: 'सूक्ष्म' },
  { num: 31, arabic: 'الْخَبِيرُ', transliteration: 'Al-Khabir', meaning: 'The All-Aware', urdu: 'خبر رکھنے والا', hindi: 'सर्वज्ञाता' },
  { num: 32, arabic: 'الْحَلِيمُ', transliteration: 'Al-Halim', meaning: 'The Forbearing', urdu: 'برد بار', hindi: 'सहनशील' },
  { num: 33, arabic: 'الْعَظِيمُ', transliteration: 'Al-Azim', meaning: 'The Magnificent', urdu: 'بزرگ', hindi: 'महान' },
  { num: 34, arabic: 'الْغَفُورُ', transliteration: 'Al-Ghafur', meaning: 'The Forgiving', urdu: 'معاف کرنے والا', hindi: 'क्षमा करने वाला' },
  { num: 35, arabic: 'الشَّكُورُ', transliteration: 'Ash-Shakur', meaning: 'The Grateful', urdu: 'قدردان', hindi: 'कृतज्ञ' },
  { num: 36, arabic: 'الْعَلِيُّ', transliteration: 'Al-Ali', meaning: 'The Most High', urdu: 'بلند', hindi: 'सर्वोच्च' },
  { num: 37, arabic: 'الْكَبِيرُ', transliteration: 'Al-Kabir', meaning: 'The Most Great', urdu: 'بڑا', hindi: 'महानतम' },
  { num: 38, arabic: 'الْحَفِيظُ', transliteration: 'Al-Hafiz', meaning: 'The Preserver', urdu: 'حفاظت کرنے والا', hindi: 'संरक्षक' },
  { num: 39, arabic: 'الْمُقِيتُ', transliteration: 'Al-Muqit', meaning: 'The Sustainer', urdu: 'رزق دینے والا', hindi: 'पालक' },
  { num: 40, arabic: 'الْحَسِيبُ', transliteration: 'Al-Hasib', meaning: 'The Reckoner', urdu: 'حساب لینے والا', hindi: 'हिसाबकार' },
  { num: 41, arabic: 'الْجَلِيلُ', transliteration: 'Al-Jalil', meaning: 'The Majestic', urdu: 'عظمت والا', hindi: 'महिमावान' },
  { num: 42, arabic: 'الْكَرِيمُ', transliteration: 'Al-Karim', meaning: 'The Generous', urdu: 'کرم کرنے والا', hindi: 'उदार' },
  { num: 43, arabic: 'الرَّقِيبُ', transliteration: 'Ar-Raqib', meaning: 'The Watchful', urdu: 'نگران', hindi: 'निगरान' },
  { num: 44, arabic: 'الْمُجِيبُ', transliteration: 'Al-Mujib', meaning: 'The Responsive', urdu: 'قبول کرنے والا', hindi: 'उत्तरदाता' },
  { num: 45, arabic: 'الْوَاسِعُ', transliteration: 'Al-Wasi', meaning: 'The All-Encompassing', urdu: 'وسیع', hindi: 'सर्वव्यापक' },
  { num: 46, arabic: 'الْحَكِيمُ', transliteration: 'Al-Hakim', meaning: 'The Wise', urdu: 'حکمت والا', hindi: 'बुद्धिमान' },
  { num: 47, arabic: 'الْوَدُودُ', transliteration: 'Al-Wadud', meaning: 'The Loving', urdu: 'محبت کرنے والا', hindi: 'प्रेमी' },
  { num: 48, arabic: 'الْمَجِيدُ', transliteration: 'Al-Majid', meaning: 'The Glorious', urdu: 'بزرگ', hindi: 'गौरवशाली' },
  { num: 49, arabic: 'الْبَاعِثُ', transliteration: 'Al-Baith', meaning: 'The Resurrector', urdu: 'اٹھانے والا', hindi: 'पुनर्जीवित करने वाला' },
  { num: 50, arabic: 'الشَّهِيدُ', transliteration: 'Ash-Shahid', meaning: 'The Witness', urdu: 'گواہ', hindi: 'साक्षी' },
  { num: 51, arabic: 'الْحَقُّ', transliteration: 'Al-Haqq', meaning: 'The Truth', urdu: 'سچ', hindi: 'सत्य' },
  { num: 52, arabic: 'الْوَكِيلُ', transliteration: 'Al-Wakil', meaning: 'The Trustee', urdu: 'وکیل', hindi: 'न्यासी' },
  { num: 53, arabic: 'الْقَوِيُّ', transliteration: 'Al-Qawwi', meaning: 'The Most Strong', urdu: 'طاقتور', hindi: 'सबसे शक्तिशाली' },
  { num: 54, arabic: 'الْمَتِينُ', transliteration: 'Al-Matin', meaning: 'The Firm', urdu: 'مضبوط', hindi: 'दृढ' },
  { num: 55, arabic: 'الْوَلِيُّ', transliteration: 'Al-Wali', meaning: 'The Protecting Friend', urdu: 'دوست', hindi: 'रक्षक मित्र' },
  { num: 56, arabic: 'الْحَمِيدُ', transliteration: 'Al-Hamid', meaning: 'The Praised One', urdu: 'حمد والا', hindi: 'प्रशंसनीय' },
  { num: 57, arabic: 'الْمُحْصِي', transliteration: 'Al-Muhsi', meaning: 'The Counter', urdu: 'شمار کرنے والا', hindi: 'गिनने वाला' },
  { num: 58, arabic: 'الْمُبْدِئُ', transliteration: 'Al-Mubdi', meaning: 'The Originator', urdu: 'شروع کرنے والا', hindi: 'उत्पत्तिकर्ता' },
  { num: 59, arabic: 'الْمُعِيدُ', transliteration: 'Al-Muid', meaning: 'The Restorer', urdu: 'لوٹانے والا', hindi: 'पुनर्स्थापक' },
  { num: 60, arabic: 'الْمُحْيِي', transliteration: 'Al-Muhyi', meaning: 'The Giver of Life', urdu: 'زندگی دینے والا', hindi: 'जीवनदाता' },
  { num: 61, arabic: 'الْمُمِيتُ', transliteration: 'Al-Mumit', meaning: 'The Bringer of Death', urdu: 'موت دینے والا', hindi: 'मृत्युदाता' },
  { num: 62, arabic: 'الْحَيُّ', transliteration: 'Al-Hayy', meaning: 'The Ever-Living', urdu: 'ہمیشہ زندہ', hindi: 'सदा जीवित' },
  { num: 63, arabic: 'الْقَيُّومُ', transliteration: 'Al-Qayyum', meaning: 'The Self-Existing', urdu: 'قائم رہنے والا', hindi: 'स्वयंभू' },
  { num: 64, arabic: 'الْوَاجِدُ', transliteration: 'Al-Wajid', meaning: 'The Finder', urdu: 'پانے والا', hindi: 'खोजने वाला' },
  { num: 65, arabic: 'الْمَاجِدُ', transliteration: 'Al-Majid', meaning: 'The Noble', urdu: 'شریف', hindi: 'महान' },
  { num: 66, arabic: 'الْوَاحِدُ', transliteration: 'Al-Wahid', meaning: 'The One', urdu: 'ایک', hindi: 'एकमात्र' },
  { num: 67, arabic: 'الْأَحَدُ', transliteration: 'Al-Ahad', meaning: 'The Unique', urdu: 'یکتا', hindi: 'अद्वितीय' },
  { num: 68, arabic: 'الصَّمَدُ', transliteration: 'As-Samad', meaning: 'The Eternal', urdu: 'بے نیاز', hindi: 'शाश्वत' },
  { num: 69, arabic: 'الْقَادِرُ', transliteration: 'Al-Qadir', meaning: 'The Omnipotent', urdu: 'قدرت والا', hindi: 'सर्वशक्तिमान' },
  { num: 70, arabic: 'الْمُقْتَدِرُ', transliteration: 'Al-Muqtadir', meaning: 'The Powerful', urdu: 'طاقتور', hindi: 'शक्तिशाली' },
  { num: 71, arabic: 'الْمُقَدِّمُ', transliteration: 'Al-Muqaddim', meaning: 'The Expediter', urdu: 'آگے کرنے والا', hindi: 'आगे करने वाला' },
  { num: 72, arabic: 'الْمُؤَخِّرُ', transliteration: 'Al-Muakhkhir', meaning: 'The Delayer', urdu: 'پیچھے کرنے والا', hindi: 'पीछे करने वाला' },
  { num: 73, arabic: 'الْأَوَّلُ', transliteration: 'Al-Awwal', meaning: 'The First', urdu: 'سب سے پہلا', hindi: 'प्रथम' },
  { num: 74, arabic: 'الْآخِرُ', transliteration: 'Al-Akhir', meaning: 'The Last', urdu: 'سب سے آخری', hindi: 'अंतिम' },
  { num: 75, arabic: 'الظَّاهِرُ', transliteration: 'Az-Zahir', meaning: 'The Manifest', urdu: 'ظاہر', hindi: 'प्रकट' },
  { num: 76, arabic: 'الْبَاطِنُ', transliteration: 'Al-Batin', meaning: 'The Hidden', urdu: 'چھپا ہوا', hindi: 'छुपा हुआ' },
  { num: 77, arabic: 'الْوَالِي', transliteration: 'Al-Wali', meaning: 'The Governor', urdu: 'حاکم', hindi: 'शासक' },
  { num: 78, arabic: 'الْمُتَعَالِ', transliteration: 'Al-Mutaali', meaning: 'The Self Exalted', urdu: 'بلند ہونے والا', hindi: 'स्वयं उच्च' },
  { num: 79, arabic: 'الْبَرُّ', transliteration: 'Al-Barr', meaning: 'The Source of Goodness', urdu: 'نیک', hindi: 'भलाई का स्रोत' },
  { num: 80, arabic: 'التَّوَّابُ', transliteration: 'At-Tawwab', meaning: 'The Ever-Relenting', urdu: 'توبہ قبول کرنے والا', hindi: 'माफ करने वाला' },
  { num: 81, arabic: 'الْمُنْتَقِمُ', transliteration: 'Al-Muntaqim', meaning: 'The Avenger', urdu: 'بدلہ لینے والا', hindi: 'बदला लेने वाला' },
  { num: 82, arabic: 'الْعَفُوُّ', transliteration: 'Al-Afuww', meaning: 'The Pardoner', urdu: 'معاف کرنے والا', hindi: 'पार्डन करने वाला' },
  { num: 83, arabic: 'الرَّؤُوفُ', transliteration: 'Ar-Rauf', meaning: 'The Compassionate', urdu: 'مہربان', hindi: 'दयालु' },
  { num: 84, arabic: 'مَالِكُ الْمُلْكِ', transliteration: 'Malik-ul-Mulk', meaning: 'Owner of All Sovereignty', urdu: 'بادشاہی کا مالک', hindi: 'संप्रभुता के मालिक' },
  { num: 85, arabic: 'ذُو الْجَلَالِ وَالْإِكْرَامِ', transliteration: 'Dhul-Jalali-Wal-Ikram', meaning: 'Lord of Majesty and Generosity', urdu: 'عظمت و اکرام والا', hindi: 'महिमा और उदारता के स्वामी' },
  { num: 86, arabic: 'الْمُقْسِطُ', transliteration: 'Al-Muqsit', meaning: 'The Equitable', urdu: 'انصاف کرنے والا', hindi: 'न्यायसंगत' },
  { num: 87, arabic: 'الْجَامِعُ', transliteration: 'Al-Jami', meaning: 'The Gatherer', urdu: 'جمع کرنے والا', hindi: 'एकत्र करने वाला' },
  { num: 88, arabic: 'الْغَنِيُّ', transliteration: 'Al-Ghani', meaning: 'The Rich', urdu: 'بے نیاز', hindi: 'धनवान' },
  { num: 89, arabic: 'الْمُغْنِي', transliteration: 'Al-Mughni', meaning: 'The Enricher', urdu: 'امیر کرنے والا', hindi: 'समृद्ध करने वाला' },
  { num: 90, arabic: 'الْمَانِعُ', transliteration: 'Al-Mani', meaning: 'The Preventer', urdu: 'روکنے والا', hindi: 'रोकने वाला' },
  { num: 91, arabic: 'الضَّارُّ', transliteration: 'Ad-Darr', meaning: 'The Distresser', urdu: 'نقصان پہنچانے والا', hindi: 'हानि पहुंचाने वाला' },
  { num: 92, arabic: 'النَّافِعُ', transliteration: 'An-Nafi', meaning: 'The Benefiter', urdu: 'فائدہ دینے والا', hindi: 'लाभ देने वाला' },
  { num: 93, arabic: 'النُّورُ', transliteration: 'An-Nur', meaning: 'The Light', urdu: 'نور', hindi: 'प्रकाश' },
  { num: 94, arabic: 'الْهَادِي', transliteration: 'Al-Hadi', meaning: 'The Guide', urdu: 'ہدایت دینے والا', hindi: 'मार्गदर्शक' },
  { num: 95, arabic: 'الْبَدِيعُ', transliteration: 'Al-Badi', meaning: 'The Originator', urdu: 'پیدا کرنے والا', hindi: 'उत्पत्ति करने वाला' },
  { num: 96, arabic: 'الْبَاقِي', transliteration: 'Al-Baqi', meaning: 'The Everlasting', urdu: 'ہمیشہ رہنے والا', hindi: 'शाश्वत' },
  { num: 97, arabic: 'الْوَارِثُ', transliteration: 'Al-Warith', meaning: 'The Supreme Heir', urdu: 'وارث', hindi: 'उत्तराधिकारी' },
  { num: 98, arabic: 'الرَّشِيدُ', transliteration: 'Ar-Rashid', meaning: 'The Guide to the Right Path', urdu: 'سیدھی راہ دکھانے والا', hindi: 'सही मार्ग दिखाने वाला' },
  { num: 99, arabic: 'الصَّبُورُ', transliteration: 'As-Sabur', meaning: 'The Patient', urdu: 'صبر کرنے والا', hindi: 'धैर्यवान' },
];

// ── Data: Daily Duas (bundled) ──
const DUAS = {
  waking_up: {
    category: 'Waking Up',
    emoji: '🌄',
    duas: [
      {
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        transliteration: 'Alhamdu lillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur.',
        english: 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.',
        urdu: 'تمام تعریفیں اللہ کے لیے ہیں جس نے ہمیں موت دینے کے بعد زندہ کیا اور اسی کی طرف اٹھنا ہے۔',
        hindi: 'सभी प्रशंसा अल्लाह के लिए है जिसने हमें मौत देने के बाद जीवित किया।',
        reference: 'Bukhari 6324',
      },
    ],
  },
  sleeping: {
    category: 'Before Sleeping',
    emoji: '🌙',
    duas: [
      {
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: "Bismika Allahumma amutu wa ahya.",
        english: 'In Your name, O Allah, I die and I live.',
        urdu: 'اے اللہ تیرے نام سے مرتا ہوں اور جیتا ہوں۔',
        hindi: 'हे अल्लाह, तेरे नाम से मरता हूं और जीता हूं।',
        reference: 'Bukhari 6324',
      },
    ],
  },
  eating: {
    category: 'Before Eating',
    emoji: '🍽️',
    duas: [
      {
        arabic: 'بِسْمِ اللَّهِ',
        transliteration: 'Bismillah.',
        english: 'In the name of Allah.',
        urdu: 'اللہ کے نام سے۔',
        hindi: 'अल्लाह के नाम से।',
        reference: 'Abu Dawood 3767',
      },
    ],
  },
  after_eating: {
    category: 'After Eating',
    emoji: '🤲',
    duas: [
      {
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ',
        transliteration: "Alhamdu lillahil-ladhi at'amana wa saqana wa ja'alana muslimin.",
        english: 'Praise be to Allah who fed us and gave us drink and made us Muslims.',
        urdu: 'اللہ کا شکر ہے جس نے ہمیں کھانا اور پانی دیا اور مسلمان بنایا۔',
        hindi: 'अल्लाह की प्रशंसा जिसने हमें खाना पिलाया और मुसलमान बनाया।',
        reference: 'Abu Dawood 3850',
      },
    ],
  },
  morning: {
    category: 'Morning Adhkar',
    emoji: '🌅',
    duas: [
      {
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ',
        transliteration: "Asbahna wa asbahal-mulku lillah, wal-hamdu lillah.",
        english: 'We have entered the morning and at this very time unto Allah belongs all sovereignty, and all praise is for Allah.',
        urdu: 'ہم نے صبح کی اور صبح ہوئی اللہ کی بادشاہت میں۔',
        hindi: 'हमने सुबह की और सुबह हुई अल्लाह की बादशाहत में।',
        reference: 'Muslim 2723',
      },
    ],
  },
  forgiveness: {
    category: 'Seeking Forgiveness',
    emoji: '🙏',
    duas: [
      {
        arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
        transliteration: "Astaghfirullahal-'Azim alladhi la ilaha illa Huwal-Hayyul-Qayyumu wa atubu ilayh.",
        english: 'I seek forgiveness from Allah the Mighty, Whom there is none worthy of worship except Him, the Living, the Eternal, and I repent to Him.',
        urdu: 'میں اللہ عظیم سے معافی مانگتا ہوں جس کے سوا کوئی معبود نہیں۔',
        hindi: 'मैं अल्लाह से माफी मांगता हूं जिसके अलावा कोई उपासना के योग्य नहीं।',
        reference: 'Tirmidhi 3577',
      },
    ],
  },
  travelling: {
    category: 'Travelling',
    emoji: '🚗',
    duas: [
      {
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ',
        transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun.",
        english: 'Glory to Him Who has subjected this to us, and we could never have it (by our efforts). And to our Lord, indeed, we are to return!',
        urdu: 'پاک ہے وہ ذات جس نے اسے ہمارے تابع کیا۔',
        hindi: 'पवित्र है वह जिसने इसे हमारे अधीन किया।',
        reference: 'Quran 43:13-14',
      },
    ],
  },
};

// ══════════════════════════════════════════════════
// ── Hadith Library ──
// ══════════════════════════════════════════════════
function HadithPage() {
  const { isPremium } = useAuthStore();
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState('bukhari');
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    hadithApi.getCollections().then(({ data }) => setCollections(data.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    hadithApi.getCollection(selected, { page, limit: 10 })
      .then(({ data }) => { setHadiths(data.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load Hadiths.'); setLoading(false); });
  }, [selected, page]);

  const premium = isPremium();

  return (
    <div className="max-w-lg mx-auto pb-4">
      <PageHeader title="Hadith Library" subtitle="Authentic Hadith Collections" />

      {!premium && <PremiumBanner onUpgrade={() => navigate('/profile/subscription')} />}

      {/* Collection Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => { setSelected(c.id); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all ${
              selected === c.id
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center pt-10"><LoadingSpinner size={28} /></div>
      ) : (
        <div className="space-y-3 px-4">
          {hadiths.map((h) => (
            <Card key={h.number} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="green">#{h.number}</Badge>
                <span className="text-xs text-gray-400">{h.collectionName}</span>
                {h.grades?.[0] && <Badge variant="gold">{h.grades[0].grade}</Badge>}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{h.text}</p>
            </Card>
          ))}

          {!premium && hadiths.length >= 10 && (
            <Card className="p-4 text-center border-dashed border-amber-300 bg-amber-50 dark:bg-amber-950/20">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                ⭐ Unlock full library with Premium
              </p>
              <Button variant="secondary" onClick={() => navigate('/profile/subscription')}>
                Upgrade
              </Button>
            </Card>
          )}

          {premium && (
            <div className="flex gap-2 justify-center pb-4">
              <Button variant="ghost" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
              <span className="self-center text-sm text-gray-500">Page {page}</span>
              <Button variant="ghost" onClick={() => setPage(page + 1)}>Next →</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Daily Duas ──
// ══════════════════════════════════════════════════
function DuasPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const categories = Object.entries(DUAS);

  if (selectedCategory) {
    const { category, emoji, duas } = DUAS[selectedCategory];
    return (
      <div className="max-w-lg mx-auto pb-4">
        <PageHeader title={`${emoji} ${category}`} back={() => setSelectedCategory(null)} />
        <div className="px-4 mt-4 space-y-4">
          {duas.map((dua, i) => (
            <Card key={i} className="p-4">
              <p dir="rtl" className="font-arabic text-xl text-gray-900 dark:text-white leading-loose text-right mb-3">
                {dua.arabic}
              </p>
              <p className="text-xs text-gray-500 italic mb-2">{dua.transliteration}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{dua.english}</p>
              {dua.urdu && <p className="text-sm text-gray-600 dark:text-gray-400" dir="rtl">{dua.urdu}</p>}
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">📖 {dua.reference}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-4">
      <PageHeader title="Daily Duas" subtitle="Authentic Supplications" />
      <div className="px-4 mt-4 grid grid-cols-2 gap-3">
        {categories.map(([key, { category, emoji }]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-left hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors shadow-sm"
          >
            <div className="text-3xl mb-2">{emoji}</div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">{category}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── 99 Names of Allah ──
// ══════════════════════════════════════════════════
function AllahNamesPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = ALLAH_NAMES.filter(
    (n) =>
      n.transliteration.toLowerCase().includes(search.toLowerCase()) ||
      n.meaning.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return (
      <div className="max-w-lg mx-auto pb-4">
        <PageHeader title={selected.transliteration} back={() => setSelected(null)} />
        <div className="px-4 mt-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-green-700">#{selected.num}</span>
          </div>
          <p className="font-arabic text-5xl text-gray-900 dark:text-white mb-3" dir="rtl">{selected.arabic}</p>
          <p className="text-xl font-bold text-green-700 dark:text-green-400 mb-1">{selected.transliteration}</p>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-4">{selected.meaning}</p>
          <div className="w-full space-y-2 mt-2">
            <Card className="p-3 text-right"><p className="font-arabic" dir="rtl">{selected.urdu}</p><p className="text-xs text-gray-400">Urdu</p></Card>
            <Card className="p-3"><p className="text-sm">{selected.hindi}</p><p className="text-xs text-gray-400">Hindi</p></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-4">
      <PageHeader title="99 Names of Allah" subtitle="Asma ul Husna" />
      <div className="px-4 py-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Search names..."
          className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
        />
      </div>
      <div className="px-4 grid grid-cols-2 gap-2.5">
        {filtered.map((n) => (
          <button
            key={n.num}
            onClick={() => setSelected(n)}
            className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
          >
            <p className="text-2xl font-arabic text-gray-900 dark:text-white mb-1" dir="rtl">{n.arabic}</p>
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">{n.transliteration}</p>
            <p className="text-[10px] text-gray-500">{n.meaning}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Tasbeeh Counter ──
// ══════════════════════════════════════════════════
const PRESETS = [
  { dhikr: 'SubhanAllah', arabic: 'سُبْحَانَ اللَّهِ', target: 33 },
  { dhikr: 'Alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', target: 33 },
  { dhikr: 'AllahuAkbar', arabic: 'اللَّهُ أَكْبَرُ', target: 34 },
  { dhikr: 'Astaghfirullah', arabic: 'أَسْتَغْفِرُ اللَّهَ', target: 100 },
  { dhikr: 'LaIlahaIllallah', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', target: 100 },
];

function TasbeehPage() {
  const [active, setActive] = useState(PRESETS[0]);
  const [count, setCount] = useState(0);
  const [saved, setSaved] = useState(false);

  const tap = useCallback(() => {
    setCount((c) => {
      const next = c + 1;
      if ('vibrate' in navigator) navigator.vibrate(30);
      return next;
    });
    setSaved(false);
  }, []);

  const reset = () => {
    if (count > 0 && !saved) {
      if (window.confirm(`Save ${count} ${active.dhikr}?`)) {
        tasbeehApi.save({
          dhikr: active.dhikr,
          arabicText: active.arabic,
          count,
          target: active.target,
        }).then(() => toast.success('Session saved!')).catch(() => {});
        setSaved(true);
      }
    }
    setCount(0);
  };

  const progress = Math.min((count / active.target) * 100, 100);
  const completed = Math.floor(count / active.target);

  return (
    <div className="max-w-lg mx-auto pb-4">
      <PageHeader title="Tasbeeh" subtitle="Digital Dhikr Counter" />

      {/* Preset Selector */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
        {PRESETS.map((p) => (
          <button
            key={p.dhikr}
            onClick={() => { setActive(p); setCount(0); setSaved(false); }}
            className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap border transition-all ${
              active.dhikr === p.dhikr
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
            }`}
          >
            {p.dhikr}
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="flex flex-col items-center px-4 mt-4 gap-6">
        {/* Progress ring */}
        <div className="relative">
          <svg width="200" height="200" className="-rotate-90">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#d1fae5" strokeWidth="12" />
            <circle
              cx="100" cy="100" r="90" fill="none"
              stroke="#16a34a" strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.3s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-green-700 dark:text-green-400">{count}</p>
            <p className="text-sm text-gray-500">/ {active.target}</p>
            {completed > 0 && <p className="text-xs text-amber-600">{completed}× completed</p>}
          </div>
        </div>

        {/* Arabic text */}
        <div className="text-center">
          <p className="font-arabic text-3xl text-gray-900 dark:text-white" dir="rtl">{active.arabic}</p>
          <p className="text-sm text-gray-500 mt-1">{active.dhikr}</p>
        </div>

        {/* Tap button */}
        <button
          onClick={tap}
          className="w-40 h-40 rounded-full bg-green-700 hover:bg-green-800 active:scale-95 text-white font-bold text-xl shadow-2xl shadow-green-300 dark:shadow-green-900 transition-all select-none"
        >
          Tap
        </button>

        {/* Reset */}
        <button onClick={reset} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
          Reset
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Ramadan Companion ──
// ══════════════════════════════════════════════════
function RamadanPage() {
  const year = new Date().getFullYear();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ramadanApi.getLog(year).then(({ data }) => {
      setLog(data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleFast = async (date) => {
    const existing = log?.fasts?.find((f) => f.date === date);
    const newStatus = existing?.status === 'fasted' ? 'missed' : 'fasted';
    try {
      const { data } = await ramadanApi.updateFast(year, date, { status: newStatus });
      setLog(data.data);
      toast.success(`${newStatus === 'fasted' ? '✅ Fast recorded' : '❌ Fast removed'}`);
    } catch { toast.error('Failed to update.'); }
  };

  // Generate this month's days
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  const fastedCount = log?.fasts?.filter((f) => f.status === 'fasted').length || 0;

  if (loading) return <div className="flex justify-center pt-20"><LoadingSpinner size={28} /></div>;

  return (
    <div className="max-w-lg mx-auto pb-4">
      <PageHeader title="Ramadan Companion" subtitle="Fasting & Ibadah Tracker" />
      <div className="px-4 mt-4 space-y-4">

        {/* Stats */}
        <Card className="p-4 bg-gradient-to-br from-green-800 to-green-900 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-xs">Fasts Completed</p>
              <p className="text-3xl font-bold">{fastedCount} / {log?.goals?.targetFasts || 30}</p>
            </div>
            <div className="text-5xl">🌙</div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${(fastedCount / (log?.goals?.targetFasts || 30)) * 100}%` }}
            />
          </div>
        </Card>

        {/* Fasting Calendar */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Fasting Log</h3>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const fast = log?.fasts?.find((f) => f.date === d);
              const day = parseInt(d.split('-')[2]);
              const isFuture = d > todayStr();
              return (
                <button
                  key={d}
                  onClick={() => !isFuture && toggleFast(d)}
                  disabled={isFuture}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    isFuture ? 'bg-gray-50 dark:bg-gray-800 text-gray-300' :
                    fast?.status === 'fasted' ? 'bg-green-500 text-white' :
                    fast?.status === 'missed' ? 'bg-red-200 text-red-700' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> Fasted</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block" /> Missed</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Arabic Vocabulary ──
// ══════════════════════════════════════════════════
const ARABIC_WORDS = [
  { id: 1, arabic: 'اللَّه', transliteration: 'Allah', english: 'God / Allah', urdu: 'اللہ', hindi: 'अल्लाह', frequency: 2699, root: 'أله', surah: 'Al-Fatihah', ayah: 1 },
  { id: 2, arabic: 'رَبّ', transliteration: "Rabb", english: 'Lord / Sustainer', urdu: 'رب', hindi: 'पालनहार', frequency: 975, root: 'ربب', surah: 'Al-Fatihah', ayah: 2 },
  { id: 3, arabic: 'رَحِيم', transliteration: 'Rahim', english: 'Merciful', urdu: 'رحیم', hindi: 'दयालु', frequency: 114, root: 'رحم', surah: 'Al-Fatihah', ayah: 1 },
  { id: 4, arabic: 'عَلِيم', transliteration: 'Alim', english: 'All-Knowing', urdu: 'علیم', hindi: 'सर्वज्ञ', frequency: 157, root: 'علم', surah: 'Al-Baqarah', ayah: 29 },
  { id: 5, arabic: 'حَكِيم', transliteration: 'Hakim', english: 'Wise', urdu: 'حکیم', hindi: 'बुद्धिमान', frequency: 97, root: 'حكم', surah: 'Al-Baqarah', ayah: 32 },
  { id: 6, arabic: 'قَدِير', transliteration: 'Qadir', english: 'Powerful / Able', urdu: 'قادر', hindi: 'शक्तिशाली', frequency: 45, root: 'قدر', surah: 'Al-Baqarah', ayah: 20 },
  { id: 7, arabic: 'إِنّ', transliteration: 'Inna', english: 'Indeed / Verily', urdu: 'بے شک', hindi: 'निश्चय ही', frequency: 1448, root: 'أن', surah: 'Al-Fatihah', ayah: 6 },
  { id: 8, arabic: 'مِن', transliteration: 'Min', english: 'From / Of', urdu: 'سے', hindi: 'से', frequency: 3226, root: 'من', surah: 'Al-Baqarah', ayah: 2 },
  { id: 9, arabic: 'فِي', transliteration: 'Fi', english: 'In', urdu: 'میں', hindi: 'में', frequency: 1708, root: 'في', surah: 'Al-Baqarah', ayah: 2 },
  { id: 10, arabic: 'عَلَى', transliteration: 'Ala', english: 'Upon / On', urdu: 'پر', hindi: 'पर', frequency: 1412, root: 'على', surah: 'Al-Fatihah', ayah: 7 },
  { id: 11, arabic: 'مَا', transliteration: 'Ma', english: 'What / That which', urdu: 'جو', hindi: 'जो', frequency: 2495, root: 'ما', surah: 'Al-Baqarah', ayah: 3 },
  { id: 12, arabic: 'لَا', transliteration: 'La', english: 'No / Not', urdu: 'نہیں', hindi: 'नहीं', frequency: 2176, root: 'لا', surah: 'Al-Baqarah', ayah: 2 },
  { id: 13, arabic: 'آيَة', transliteration: 'Ayah', english: 'Sign / Verse', urdu: 'آیت', hindi: 'आयत', frequency: 382, root: 'أيي', surah: 'Al-Baqarah', ayah: 39 },
  { id: 14, arabic: 'كِتَاب', transliteration: 'Kitab', english: 'Book', urdu: 'کتاب', hindi: 'किताब', frequency: 261, root: 'كتب', surah: 'Al-Baqarah', ayah: 2 },
  { id: 15, arabic: 'نَاس', transliteration: 'Nas', english: 'People / Mankind', urdu: 'لوگ', hindi: 'लोग', frequency: 241, root: 'أنس', surah: 'Al-Baqarah', ayah: 21 },
  { id: 16, arabic: 'قَوْل', transliteration: 'Qawl', english: 'Word / Speech', urdu: 'قول', hindi: 'वचन', frequency: 529, root: 'قول', surah: 'Al-Baqarah', ayah: 76 },
  { id: 17, arabic: 'يَوْم', transliteration: 'Yawm', english: 'Day', urdu: 'دن', hindi: 'दिन', frequency: 405, root: 'يوم', surah: 'Al-Fatihah', ayah: 4 },
  { id: 18, arabic: 'عَمَل', transliteration: 'Amal', english: 'Work / Deed', urdu: 'عمل', hindi: 'कार्य', frequency: 360, root: 'عمل', surah: 'Al-Baqarah', ayah: 25 },
  { id: 19, arabic: 'صِرَاط', transliteration: 'Sirat', english: 'Path / Way', urdu: 'راستہ', hindi: 'पथ', frequency: 45, root: 'صرط', surah: 'Al-Fatihah', ayah: 6 },
  { id: 20, arabic: 'جَنَّة', transliteration: 'Jannah', english: 'Paradise / Garden', urdu: 'جنت', hindi: 'जन्नत', frequency: 147, root: 'جنن', surah: 'Al-Baqarah', ayah: 25 },
];

function ArabicLearningPage() {
  const { isPremium } = useAuthStore();
  const premium = isPremium();
  const [mode, setMode] = useState('list'); // list | flashcard | quiz
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  const words = premium ? ARABIC_WORDS : ARABIC_WORDS.slice(0, 20);

  const generateOptions = (word) => {
    const others = ARABIC_WORDS.filter((w) => w.id !== word.id);
    const wrong = others.sort(() => Math.random() - 0.5).slice(0, 3);
    return [...wrong, word].sort(() => Math.random() - 0.5);
  };

  const current = words[currentIndex];

  return (
    <div className="max-w-lg mx-auto pb-4">
      <PageHeader title="Arabic Vocabulary" subtitle="Top Quranic Words" />

      {/* Mode Tabs */}
      <div className="flex gap-2 px-4 py-3">
        {['list', 'flashcard', 'quiz'].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setCurrentIndex(0); setFlipped(false); setQuizAnswer(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all capitalize ${
              mode === m ? 'bg-green-700 text-white border-green-700' : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 dark:border-gray-700'
            }`}
          >
            {m === 'flashcard' ? '🃏 Flashcard' : m === 'quiz' ? '✏️ Quiz' : '📋 List'}
          </button>
        ))}
      </div>

      {!premium && (
        <div className="px-4 mb-3">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300">
            ⭐ Showing 20 of 600 words. Upgrade to Premium for full access.
          </div>
        </div>
      )}

      {mode === 'list' && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {words.map((w) => (
            <div key={w.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center text-xs font-bold text-green-700">{w.id}</div>
              <div className="flex-1">
                <p className="font-arabic text-xl" dir="rtl">{w.arabic}</p>
                <p className="text-xs text-gray-500">{w.transliteration}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{w.english}</p>
                <p className="text-xs text-green-600">×{w.frequency}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === 'flashcard' && current && (
        <div className="px-4 mt-4">
          <div
            onClick={() => setFlipped(!flipped)}
            className="min-h-48 bg-gradient-to-br from-green-700 to-green-900 rounded-3xl p-6 text-white text-center flex flex-col items-center justify-center cursor-pointer select-none"
          >
            {!flipped ? (
              <>
                <p className="font-arabic text-5xl mb-2" dir="rtl">{current.arabic}</p>
                <p className="text-green-300 text-sm">{current.transliteration}</p>
                <p className="text-xs text-green-400 mt-4">Tap to reveal meaning</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold mb-1">{current.english}</p>
                <p className="text-green-300 text-sm">{current.hindi}</p>
                <p className="text-green-400 text-xs mt-2">Frequency: ×{current.frequency}</p>
              </>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" className="flex-1" onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setFlipped(false); }}>← Prev</Button>
            <Button variant="primary" className="flex-1" onClick={() => { setCurrentIndex(Math.min(words.length - 1, currentIndex + 1)); setFlipped(false); }}>Next →</Button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">{currentIndex + 1} / {words.length}</p>
        </div>
      )}

      {mode === 'quiz' && current && (
        <div className="px-4 mt-4 space-y-3">
          <Card className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-2">What does this word mean?</p>
            <p className="font-arabic text-4xl mb-1" dir="rtl">{current.arabic}</p>
            <p className="text-sm text-gray-500">{current.transliteration}</p>
          </Card>
          <div className="grid grid-cols-2 gap-2">
            {generateOptions(current).map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  setQuizAnswer(opt.id);
                  if (opt.id === current.id) setScore(s => s + 1);
                }}
                className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                  quizAnswer === null ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-50' :
                  opt.id === current.id ? 'bg-green-500 text-white border-green-500' :
                  quizAnswer === opt.id ? 'bg-red-500 text-white border-red-500' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200'
                }`}
              >
                {opt.english}
              </button>
            ))}
          </div>
          {quizAnswer !== null && (
            <Button className="w-full" onClick={() => { setCurrentIndex(Math.min(words.length - 1, currentIndex + 1)); setQuizAnswer(null); setFlipped(false); }}>
              Next Question →
            </Button>
          )}
          <p className="text-center text-xs text-gray-400">Score: {score} | Word {currentIndex + 1}/{words.length}</p>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// ── Learn Home ──
// ══════════════════════════════════════════════════
function LearnHome() {
  const navigate = useNavigate();
  const items = [
    { to: 'hadith', emoji: '📚', label: 'Hadith Library', desc: '6 major collections' },
    { to: 'duas', emoji: '🤲', label: 'Daily Duas', desc: 'Authentic supplications' },
    { to: 'names', emoji: '☪️', label: '99 Names of Allah', desc: 'Asma ul Husna' },
    { to: 'arabic', emoji: '🔤', label: 'Arabic Vocabulary', desc: 'Top 600 Quranic words' },
    { to: 'tasbeeh', emoji: '📿', label: 'Tasbeeh Counter', desc: 'Digital Dhikr' },
    { to: 'ramadan', emoji: '🌙', label: 'Ramadan Companion', desc: 'Fasting & Ibadah' },
  ];
  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <PageHeader title="Learn & Grow" subtitle="Islamic Knowledge Hub" />
      <div className="grid grid-cols-2 gap-3 mt-4">
        {items.map(({ to, emoji, label, desc }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-left hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors shadow-sm"
          >
            <div className="text-3xl mb-2">{emoji}</div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Learn Router ──
export default function LearnPage() {
  return (
    <Routes>
      <Route index element={<LearnHome />} />
      <Route path="hadith" element={<HadithPage />} />
      <Route path="duas" element={<DuasPage />} />
      <Route path="names" element={<AllahNamesPage />} />
      <Route path="arabic" element={<ArabicLearningPage />} />
      <Route path="tasbeeh" element={<TasbeehPage />} />
      <Route path="ramadan" element={<RamadanPage />} />
    </Routes>
  );
}
