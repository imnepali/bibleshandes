import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  HeartPulse,
  Mic,
  Pin,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Youtube,
} from 'lucide-react';
import { sacredRadioEngine } from '../utils/sacredAudioSynthesizer';

export interface PersonalNoteItem {
  id: string;
  title: string;
  content: string;
  scriptureRef: string;
  category: 'sermon' | 'devotional' | 'prayer' | 'personal';
  remindAt: string; // ISO datetime-local string e.g. "2026-10-31T18:00"
  reminderFired: boolean;
  isPinned: boolean;
  createdAtBs: string;
  createdAtAd: string;
}

export interface PodcastEpisodeItem {
  id: string;
  titleNe: string;
  titleEn: string;
  speakerNe: string;
  speakerEn: string;
  duration: string;
  categoryNe: string;
  categoryEn: string;
  scriptureRef: string;
  youtubeId: string;
  summaryNe: string;
  summaryEn: string;
}

export interface LifeHealthTipItem {
  id: string;
  category: 'health' | 'mental_peace' | 'family' | 'spiritual_life';
  categoryNe: string;
  categoryEn: string;
  titleNe: string;
  titleEn: string;
  verseRefNe: string;
  verseRefEn: string;
  verseTextNe: string;
  verseTextEn: string;
  tipsNe: string[];
  tipsEn: string[];
}

export interface ForexRateItem {
  code: string;
  flag: string;
  nameNe: string;
  nameEn: string;
  unit: number;
  buyNpr: number;
  sellNpr: number;
}

export const TODAY_FOREX_RATES: ForexRateItem[] = [
  { code: 'INR', flag: '🇮🇳', nameNe: 'भारतीय रूपैयाँ (Indian Rupee)', nameEn: 'Indian Rupee', unit: 100, buyNpr: 160.0, sellNpr: 160.15 },
  { code: 'USD', flag: '🇺🇸', nameNe: 'अमेरिकी डलर (US Dollar)', nameEn: 'US Dollar', unit: 1, buyNpr: 134.50, sellNpr: 135.10 },
  { code: 'EUR', flag: '🇪🇺', nameNe: 'युरोपेली युरो (European Euro)', nameEn: 'European Euro', unit: 1, buyNpr: 145.85, sellNpr: 146.50 },
  { code: 'GBP', flag: '🇬🇧', nameNe: 'बेलायती पाउण्ड स्टर्लिङ (UK Pound)', nameEn: 'UK Pound Sterling', unit: 1, buyNpr: 174.20, sellNpr: 174.98 },
  { code: 'AUD', flag: '🇦🇺', nameNe: 'अष्ट्रेलियन डलर (Australian Dollar)', nameEn: 'Australian Dollar', unit: 1, buyNpr: 88.40, sellNpr: 88.80 },
  { code: 'CAD', flag: '🇨🇦', nameNe: 'क्यानेडियन डलर (Canadian Dollar)', nameEn: 'Canadian Dollar', unit: 1, buyNpr: 96.75, sellNpr: 97.18 },
  { code: 'CHF', flag: '🇨🇭', nameNe: 'स्विस फ्र्याङ्क (Swiss Franc)', nameEn: 'Swiss Franc', unit: 1, buyNpr: 155.30, sellNpr: 155.99 },
  { code: 'SGD', flag: '🇸🇬', nameNe: 'सिङ्गापुर डलर (Singapore Dollar)', nameEn: 'Singapore Dollar', unit: 1, buyNpr: 101.60, sellNpr: 102.05 },
  { code: 'JPY', flag: '🇯🇵', nameNe: 'जापानी येन (Japanese Yen)', nameEn: 'Japanese Yen', unit: 10, buyNpr: 8.82, sellNpr: 8.86 },
  { code: 'CNY', flag: '🇨🇳', nameNe: 'चिनियाँ युआन (Chinese Yuan)', nameEn: 'Chinese Yuan', unit: 1, buyNpr: 18.88, sellNpr: 18.96 },
  { code: 'SAR', flag: '🇸🇦', nameNe: 'साउदी अरेबियन रियाल (Saudi Riyal)', nameEn: 'Saudi Arabian Riyal', unit: 1, buyNpr: 35.81, sellNpr: 35.97 },
  { code: 'QAR', flag: '🇶🇦', nameNe: 'कतारी रियाल (Qatari Riyal)', nameEn: 'Qatari Riyal', unit: 1, buyNpr: 36.89, sellNpr: 37.05 },
  { code: 'AED', flag: '🇦🇪', nameNe: 'युएई दिर्हाम (UAE Dirham)', nameEn: 'UAE Dirham', unit: 1, buyNpr: 36.62, sellNpr: 36.78 },
  { code: 'MYR', flag: '🇲🇾', nameNe: 'मलेसियन रिंगिट (Malaysian Ringgit)', nameEn: 'Malaysian Ringgit', unit: 1, buyNpr: 30.75, sellNpr: 30.89 },
  { code: 'KRW', flag: '🇰🇷', nameNe: 'दक्षिण कोरियन वन (South Korean Won)', nameEn: 'South Korean Won', unit: 100, buyNpr: 9.76, sellNpr: 9.81 },
  { code: 'KWD', flag: '🇰🇼', nameNe: 'कुवेती दिनार (Kuwaiti Dinar)', nameEn: 'Kuwaiti Dinar', unit: 1, buyNpr: 438.50, sellNpr: 440.45 },
  { code: 'BHD', flag: '🇧🇭', nameNe: 'बहराइन दिनार (Bahraini Dinar)', nameEn: 'Bahraini Dinar', unit: 1, buyNpr: 356.70, sellNpr: 358.29 },
];

const INITIAL_PODCAST_EPISODES: PodcastEpisodeItem[] = [
  {
    id: 'pod-1',
    titleNe: 'येशू ख्रीष्टमा मुक्ति र अनन्त जीवनको निश्चयता (Salvation in Jesus Christ)',
    titleEn: 'Assurance of Salvation & Eternal Life in Lord Jesus Christ',
    speakerNe: 'सुसमाचार बाइबल पोडकास्ट डेस्क',
    speakerEn: 'Susamachar Bible Podcast Desk',
    duration: '18:45',
    categoryNe: 'मुक्ति र सुसमाचार',
    categoryEn: 'Salvation & Gospel',
    scriptureRef: 'यूहन्ना ३:१६ • रोमी १०:९-१० (John 3:16 • Romans 10:9-10)',
    youtubeId: 'ea7K6b7rG5g',
    summaryNe: 'मानिसले आफ्नै कर्मबाट होइन तर प्रभु येशू ख्रीष्टको क्रूसको बलिदानमा विश्वास गरेर कसरी पापको क्षमा र अनन्त जीवन पाउँछ भन्ने गहन बाइबलीय पोडकास्ट।',
    summaryEn: 'A clear biblical exposition on how salvation is received by grace through faith in the finished work of Jesus Christ on the cross.',
  },
  {
    id: 'pod-2',
    titleNe: 'कठिन समयमा परमेश्वरको शान्ति र प्रार्थनाको शक्ति',
    titleEn: 'God’s Peace in Difficult Times & The Power of Prayer',
    speakerNe: 'आत्मिक मनन श्रृंखला',
    speakerEn: 'Daily Devotional Podcast',
    duration: '14:20',
    categoryNe: 'प्रार्थना र आत्मिक जीवन',
    categoryEn: 'Prayer & Spiritual Growth',
    scriptureRef: 'फिलिप्पी ४:६-७ • भजनसंग्रह २३ (Philippians 4:6-7 • Psalm 23)',
    youtubeId: '5qap5aO4i9A',
    summaryNe: 'चिन्ता, डर र निराशाको बीचमा प्रार्थनाद्वारा परमेश्वरको उपस्थितिमा कसरी विश्राम लिने भन्ने व्यावहारिक बाइबलीय सन्देश।',
    summaryEn: 'How to cast every anxiety upon the Lord in prayer and experience the peace of Christ that surpasses all understanding.',
  },
  {
    id: 'pod-3',
    titleNe: 'युवा जीवन, पवित्रता र परमेश्वरको उद्देश्य',
    titleEn: 'Christian Youth, Holiness & Walking in God’s Purpose',
    speakerNe: 'युवा जाग्रति पोडकास्ट',
    speakerEn: 'Youth Revival Podcast',
    duration: '21:10',
    categoryNe: 'युवा र चेलापन',
    categoryEn: 'Youth & Discipleship',
    scriptureRef: 'भजनसंग्रह ११९:९ • १ तिमोथी ४:१२ (Psalm 119:9 • 1 Timothy 4:12)',
    youtubeId: 'jfKfPfyJRdk',
    summaryNe: 'आजको डिजिटल युगमा युवाहरूले बाइबल वचनअनुसार आफ्नो जीवन कसरी शुद्ध र फलदायी बनाउने भन्ने प्रेरणादायी संवाद।',
    summaryEn: 'Inspiring biblical guidance for young believers to set an example in speech, conduct, love, faith, and purity.',
  },
];

const BIBLICAL_LIFE_HEALTH_TIPS: LifeHealthTipItem[] = [
  {
    id: 'tip-1',
    category: 'health',
    categoryNe: 'शारीरिक स्वास्थ्य र देहको हेरचाह',
    categoryEn: 'Physical Health & Body Stewardship',
    titleNe: 'तपाईंको शरीर पवित्र आत्माको मन्दिर हो — स्वास्थ्यका ५ बाइबलीय सूत्रहरू',
    titleEn: 'Your Body is the Temple of the Holy Spirit — 5 Biblical Health Habits',
    verseRefNe: '१ कोरिन्थी ६:१९-२० • ३ यूहन्ना १:२',
    verseRefEn: '1 Corinthians 6:19-20 • 3 John 1:2',
    verseTextNe: '“के तिमीहरूलाई थाहा छैन, तिमीहरूको शरीर तिमीहरूभित्र वास गर्नुहुने पवित्र आत्माको मन्दिर हो?”',
    verseTextEn: '“Do you not know that your bodies are temples of the Holy Spirit, who is in you, whom you have received from God?”',
    tipsNe: [
      'सन्तुलित र प्राकृतिक आहार: परमेश्वरले सृष्टि गर्नुभएका ताजा सागसब्जी, फलफूल, अन्न र पर्याप्त सफा पानी सेवन गर्नुहोस् (उत्पत्ति १:२९)।',
      'नियमित शारीरिक व्यायाम: दैनिक ३० मिनेट हिँड्ने वा हलुका कसरत गर्ने बानी बसाल्नुहोस्।',
      'पर्याप्त विश्राम र निद्रा: परमेश्वरले आफ्ना प्रियहरूलाई निद्रा दिनुहुन्छ (भजनसंग्रह १२७:२)—दैनिक ७–८ घण्टा समयमै सुत्नुहोस्।',
      'कुलत र हानिकारक बानीबाट टाढा: धुम्रपान, मद्यपान र शरीरलाई हानि गर्ने कुराहरूबाट पूर्ण रूपमा अलग रहनुहोस्।',
    ],
    tipsEn: [
      'Wholesome Nutrition: Eat fresh vegetables, fruits, whole grains, and drink plenty of clean water daily (Genesis 1:29).',
      'Daily Movement: Walk or exercise at least 30 minutes a day to keep your heart and body strong.',
      'Restful Sleep: Honor God’s gift of rest and Sabbath—aim for 7 to 8 hours of quality sleep each night (Psalm 127:2).',
      'Avoid Harmful Habits: Keep your body pure from tobacco, alcohol, and substances that harm the temple of God.',
    ],
  },
  {
    id: 'tip-2',
    category: 'mental_peace',
    categoryNe: 'मानसिक स्वास्थ्य र मनको शान्ति',
    categoryEn: 'Mental Peace & Emotional Wellness',
    titleNe: 'तनाव, चिन्ता र निराशाबाट मुक्त रहने बाइबलीय जीवनशैली',
    titleEn: 'Overcoming Stress, Anxiety & Worry Through Scripture',
    verseRefNe: 'हितोपदेश १७:२२ • फिलिप्पी ४:६-८',
    verseRefEn: 'Proverbs 17:22 • Philippians 4:6-8',
    verseTextNe: '“प्रसन्न हृदय असल औषधी हो, तर टुटेको आत्माले हड्डीहरूलाई सुकाउँछ।” (हितोपदेश १७:२२)',
    verseTextEn: '“A cheerful heart is good medicine, but a crushed spirit dries up the bones.” (Proverbs 17:22)',
    tipsNe: [
      'बिहानी वचन र प्रार्थना: दिनको सुरुआत मोबाइलको स्क्रोलिङबाट होइन, भजनसंग्रह र प्रार्थनाबाट गर्नुहोस्।',
      'कृतज्ञताको अभ्यास (Gratitude): हरेक साँझ परमेश्वरले दिनुभएका ३ वटा आशिषहरू डायरी वा नोटमा लेख्नुहोस्।',
      'क्षमा र मेलमिलाप: मनमा रिस वा तितोपना नराख्नुहोस्; क्षमा दिँदा मन हलुका र रक्तचाप सन्तुलित हुन्छ (एफिसी ४:३१-३२)।',
      'असल संगति: एक्लोपनबाट बच्न परिवार र विश्वासका मित्रहरूसँग नियमित कुराकानी र प्रार्थना गर्नुहोस्।',
    ],
    tipsEn: [
      'Start the Morning with Scripture: Begin your day with prayer and a Psalm before checking social media.',
      'Practice Daily Gratitude: Write down three blessings from God every evening in your personal notes.',
      'Release Bitterness & Forgive: Forgiveness heals emotional wounds and lowers stress (Ephesians 4:31-32).',
      'Stay Connected in Fellowship: Share burdens with trusted family and church friends rather than isolating yourself.',
    ],
  },
  {
    id: 'tip-3',
    category: 'family',
    categoryNe: 'पारिवारिक सुख र असल जीवन टिप्स',
    categoryEn: 'Family Harmony & Daily Life Wisdom',
    titleNe: 'आनन्दित परिवार, नम्र बोली र अनुशासित दैनिक जीवन',
    titleEn: 'Building a Joyful Home, Gentle Speech & Disciplined Living',
    verseRefNe: 'हितोपदेश १५:१ • कलस्सी ३:१२-१४',
    verseRefEn: 'Proverbs 15:1 • Colossians 3:12-14',
    verseTextNe: '“नरम जवाफले रिसलाई शान्त पार्छ, तर चर्को कुराले रीस उठाउँछ।” (हितोपदेश १५:१)',
    verseTextEn: '“A gentle answer turns away wrath, but a harsh word stirs up anger.” (Proverbs 15:1)',
    tipsNe: [
      'पारिवारिक प्रार्थना समय: साँझको खानापछि १० मिनेट परिवारका सबै सदस्य सँगै बसेर बाइबल पढ्ने र प्रार्थना गर्ने बानी बसाल्नुहोस्।',
      'मिठो र उत्साहजनक बोली: घरमा पति-पत्नी, छोराछोरी र अभिभावकबीच आदर र प्रोत्साहनका शब्दहरू प्रयोग गर्नुहोस्।',
      'समय र आर्थिक अनुशासन: अनावश्यक ऋण र फजुल खर्चबाट बच्नुहोस्, इमानदार परिश्रम र बचत गर्ने बानी बसाल्नुहोस् (हितोपदेश २१:२०)।',
      'डिजिटल सन्तुलन: खाना खाने बेला र पारिवारिक कुराकानीको समयमा मोबाइल फोन बन्द वा पर राख्नुहोस्।',
    ],
    tipsEn: [
      'Family Altar: Spend 10 minutes together after dinner reading a short Scripture passage and praying as a family.',
      'Gentle & Encouraging Words: Speak words that build up spouses, children, and parents rather than criticizing.',
      'Financial Stewardship: Avoid unnecessary debt, work diligently, and practice wise saving and generosity (Proverbs 21:20).',
      'Digital Detox at Home: Keep phones away during family meals and meaningful conversations.',
    ],
  },
];

function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

interface LifeNotesPodcastsViewProps {
  lang: 'ne' | 'en';
  initialTab?: 'notes' | 'podcasts' | 'healthtips' | 'forex';
  onNotify: (msg: string) => void;
}

export const LifeNotesPodcastsView: React.FC<LifeNotesPodcastsViewProps> = ({
  lang,
  initialTab = 'notes',
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'podcasts' | 'healthtips' | 'forex'>(
    initialTab
  );

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // =========================================================================
  // 1. PERSONAL NOTES & REMINDERS STATE
  // =========================================================================
  const [notes, setNotes] = useState<PersonalNoteItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('susamachar_personal_notes') || 'null');
      if (Array.isArray(saved)) return saved;
    } catch {
      // ignore
    }
    return [
      {
        id: 'note-1',
        title: 'आइतबारको वचन मनन — यूहन्ना १४:६ (प्रभु येशू ख्रीष्ट बाटो, सत्य र जीवन)',
        content:
          'प्रभु येशू ख्रीष्ट मात्र मुक्तिको एकमात्र बाटो हुनुहुन्छ। यो हप्ता परिवार र साथीहरूसँग यो वचन बाँड्ने र प्रार्थना गर्ने।',
        scriptureRef: 'यूहन्ना १४:६ (John 14:6)',
        category: 'sermon',
        remindAt: '',
        reminderFired: false,
        isPinned: true,
        createdAtBs: '२०८३ कार्तिक १४',
        createdAtAd: 'Oct 31, 2026',
      },
    ];
  });

  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteScripture, setNoteScripture] = useState('');
  const [noteCategory, setNoteCategory] = useState<PersonalNoteItem['category']>('devotional');
  const [noteRemindAt, setNoteRemindAt] = useState('');
  const [noteSearch, setNoteSearch] = useState('');

  // Save notes to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('susamachar_personal_notes', JSON.stringify(notes));
    } catch {
      // ignore
    }
  }, [notes]);

  // Background Reminder Checker every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotes((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          if (n.remindAt && !n.reminderFired) {
            const targetTime = new Date(n.remindAt).getTime();
            if (!Number.isNaN(targetTime) && now >= targetTime) {
              changed = true;
              // Play gentle chime & show notification
              try {
                sacredRadioEngine.start('morning_psalm', 0.5);
                setTimeout(() => sacredRadioEngine.stop(), 3500);
              } catch {
                // ignore audio restriction
              }
              onNotify(
                lang === 'ne'
                  ? `🔔 नोट रिमाइन्डर: "${n.title}" (${n.scriptureRef || 'बाइबल डायरी'})`
                  : `🔔 Note Reminder: "${n.title}"`
              );
              if (
                typeof window !== 'undefined' &&
                'Notification' in window &&
                Notification.permission === 'granted'
              ) {
                new Notification('सुसमाचार नोट रिमाइन्डर (Susamachar Reminder)', {
                  body: `${n.title}\n${n.content}`,
                });
              }
              return { ...n, reminderFired: true };
            }
          }
          return n;
        });
        return changed ? next : prev;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [lang, onNotify]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    if (
      noteRemindAt &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    const newNote: PersonalNoteItem = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim() || (lang === 'ne' ? 'बाइबल डायरी नोट' : 'Bible Study Note'),
      content: noteContent.trim(),
      scriptureRef: noteScripture.trim(),
      category: noteCategory,
      remindAt: noteRemindAt,
      reminderFired: false,
      isPinned: false,
      createdAtBs: '२०८३ कार्तिक १४',
      createdAtAd: 'Oct 31, 2026',
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteTitle('');
    setNoteContent('');
    setNoteScripture('');
    setNoteRemindAt('');
    onNotify(
      noteRemindAt
        ? lang === 'ne'
          ? 'नोट र रिमाइन्डर सफलतापूर्वक सुरक्षित गरियो!'
          : 'Note saved with active reminder!'
        : lang === 'ne'
        ? 'तपाईंको बाइबल नोट सुरक्षित गरियो!'
        : 'Your note has been saved!'
    );
  };

  const handleTriggerReminderTest = (note: PersonalNoteItem) => {
    try {
      sacredRadioEngine.start('hymn_grace', 0.6);
      setTimeout(() => sacredRadioEngine.stop(), 3000);
    } catch {
      // ignore
    }
    onNotify(
      lang === 'ne'
        ? `🔔 रिमाइन्डर अलर्ट: "${note.title}" — ${note.scriptureRef || ''}`
        : `🔔 Reminder Alert: "${note.title}"`
    );
  };

  // =========================================================================
  // 2. PODCASTS STATE
  // =========================================================================
  const [podcasts, setPodcasts] = useState<PodcastEpisodeItem[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('susamachar_custom_podcasts') || 'null');
      if (Array.isArray(saved) && saved.length > 0) {
        return [...saved, ...INITIAL_PODCAST_EPISODES];
      }
    } catch {
      // ignore
    }
    return INITIAL_PODCAST_EPISODES;
  });
  const [activePodcastId, setActivePodcastId] = useState<string>(INITIAL_PODCAST_EPISODES[0].id);
  const [customPodTitle, setCustomPodTitle] = useState('');
  const [customPodYoutube, setCustomPodYoutube] = useState('');

  const handleAddPodcast = (e: React.FormEvent) => {
    e.preventDefault();
    const ytId = extractYoutubeId(customPodYoutube);
    if (!ytId) {
      onNotify(
        lang === 'ne'
          ? 'कृपया सही YouTube भिडियो वा पोडकास्ट लिङ्क राख्नुहोस्।'
          : 'Please enter a valid YouTube link.'
      );
      return;
    }
    const newPod: PodcastEpisodeItem = {
      id: `pod-${Date.now()}`,
      titleNe: customPodTitle.trim() || 'ख्रीष्टिय पोडकास्ट र बाइबल शिक्षा',
      titleEn: customPodTitle.trim() || 'Christian Podcast & Bible Teaching',
      speakerNe: 'सुसमाचार पोडकास्ट',
      speakerEn: 'Susamachar Podcast',
      duration: 'Live / Video',
      categoryNe: 'बाइबल र मुक्ति',
      categoryEn: 'Bible & Salvation',
      scriptureRef: 'पवित्र बाइबल (Holy Bible)',
      youtubeId: ytId,
      summaryNe: 'प्रभु येशू ख्रीष्टको वचन र आत्मिक उत्साहको पोडकास्ट।',
      summaryEn: 'Gospel podcast episode centered on Scripture and faith in Christ.',
    };
    setPodcasts((prev) => {
      const updated = [newPod, ...prev];
      try {
        const customOnly = updated.filter(
          (p) => !INITIAL_PODCAST_EPISODES.some((init) => init.id === p.id)
        );
        localStorage.setItem('susamachar_custom_podcasts', JSON.stringify(customOnly));
      } catch {
        // ignore
      }
      return updated;
    });
    setActivePodcastId(newPod.id);
    setCustomPodTitle('');
    setCustomPodYoutube('');
    onNotify(lang === 'ne' ? 'नयाँ पोडकास्ट थपियो र प्ले हुँदैछ!' : 'Podcast added and playing!');
  };

  // =========================================================================
  // 3. FOREX CONVERTER STATE
  // =========================================================================
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<string>('USD');
  const [foreignAmount, setForeignAmount] = useState<string>('100');

  const selectedForex = useMemo(
    () => TODAY_FOREX_RATES.find((f) => f.code === selectedCurrencyCode) || TODAY_FOREX_RATES[1],
    [selectedCurrencyCode]
  );

  const convertedNprBuy = useMemo(() => {
    const amt = parseFloat(foreignAmount) || 0;
    return ((amt / selectedForex.unit) * selectedForex.buyNpr).toFixed(2);
  }, [foreignAmount, selectedForex]);

  const convertedNprSell = useMemo(() => {
    const amt = parseFloat(foreignAmount) || 0;
    return ((amt / selectedForex.unit) * selectedForex.sellNpr).toFixed(2);
  }, [foreignAmount, selectedForex]);

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    const list = notes.filter(
      (n) =>
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.scriptureRef.toLowerCase().includes(q)
    );
    return [...list].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  }, [notes, noteSearch]);

  const activePodcast = podcasts.find((p) => p.id === activePodcastId) || podcasts[0];

  return (
    <div className="space-y-6">
      {/* Top Module Header & Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-800 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>
                {lang === 'ne'
                  ? 'सुसमाचार दैनिक जीवन, नोट, पोडकास्ट, स्वास्थ्य र विनिमय दर'
                  : 'Susamachar Personal Notes, Reminders, Podcasts, Health Tips & Forex'}
              </span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              {activeTab === 'notes' &&
                (lang === 'ne'
                  ? 'मेरो बाइबल नोट र रिमाइन्डर (Notes & Reminders)'
                  : 'Personal Bible Notes & Reminders')}
              {activeTab === 'podcasts' &&
                (lang === 'ne'
                  ? 'ख्रीष्टिय पोडकास्ट र बाइबल सन्देश (Christian Podcasts)'
                  : 'Christian Podcasts & Audio/Video Teachings')}
              {activeTab === 'healthtips' &&
                (lang === 'ne'
                  ? 'बाइबलीय जीवन र स्वास्थ्य टिप्स (Life & Health Tips)'
                  : 'Biblical Life & Holistic Health Tips')}
              {activeTab === 'forex' &&
                (lang === 'ne'
                  ? 'आजको विदेशी विनिमय दर (Today’s Foreign Exchange Rates)'
                  : 'Today’s Foreign Exchange Rates (NRB Forex)')}
            </h1>
          </div>

          {/* 4 Sub-Tab Switchers */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                id: 'notes',
                ne: 'नोट र रिमाइन्डर (Notes)',
                en: 'Notes & Reminders',
                icon: FileText,
              },
              {
                id: 'podcasts',
                ne: 'पोडकास्ट (Podcasts)',
                en: 'Podcasts',
                icon: Mic,
              },
              {
                id: 'healthtips',
                ne: 'जीवन र स्वास्थ्य टिप्स (Life & Health)',
                en: 'Life & Health Tips',
                icon: HeartPulse,
              },
              {
                id: 'forex',
                ne: 'विदेशी विनिमय दर (Forex)',
                en: 'Forex Rates',
                icon: DollarSign,
              },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isAct = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isAct
                      ? 'bg-red-800 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-red-800'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{lang === 'ne' ? tab.ne : tab.en}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: PERSONAL NOTES WITH SAVE & REMINDER
         ===================================================================== */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 5 Cols: Create & Save Note + Set Reminder */}
          <form
            onSubmit={handleSaveNote}
            className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-800 dark:text-amber-400" />
                <span>
                  {lang === 'ne'
                    ? 'नयाँ नोट लेख्नुहोस् र रिमाइन्डर राख्नुहोस्'
                    : 'Write a New Note & Set Reminder'}
                </span>
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? 'नोटको शीर्षक (Note Title):' : 'Note Title:'}
              </label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder={
                  lang === 'ne'
                    ? 'उदा: आजको प्रचार नोट वा प्रार्थना बुँदा...'
                    : 'e.g., Sunday Sermon Note or Prayer Reminder...'
                }
                className="w-full h-10 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ne' ? 'बाइबल पद सन्दर्भ (Scripture Ref):' : 'Bible Reference:'}
                </label>
                <input
                  type="text"
                  value={noteScripture}
                  onChange={(e) => setNoteScripture(e.target.value)}
                  placeholder={lang === 'ne' ? 'उदा: यूहन्ना ३:१६' : 'e.g., John 3:16'}
                  className="w-full h-10 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ne' ? 'विधा (Category):' : 'Category:'}
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) =>
                    setNoteCategory(e.target.value as PersonalNoteItem['category'])
                  }
                  className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-semibold"
                >
                  <option value="devotional">
                    {lang === 'ne' ? 'दैनिक वचन मनन (Devotional)' : 'Daily Devotional'}
                  </option>
                  <option value="sermon">
                    {lang === 'ne' ? 'प्रचार / संगति नोट (Sermon)' : 'Sermon Note'}
                  </option>
                  <option value="prayer">
                    {lang === 'ne' ? 'प्रार्थना सूची (Prayer List)' : 'Prayer List'}
                  </option>
                  <option value="personal">
                    {lang === 'ne' ? 'व्यक्तिगत कार्य (Personal)' : 'Personal Reminder'}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? 'पूरा विवरण लेख्नुहोस् (Note Content):' : 'Note Content:'}
              </label>
              <textarea
                rows={4}
                required
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder={
                  lang === 'ne'
                    ? 'यहाँ आफ्नो बाइबल अध्ययन नोट, आत्मिक विचार वा सम्झनुपर्ने कुराहरू लेख्नुहोस्...'
                    : 'Write your Bible study reflection, sermon points, or reminders here...'
                }
                className="w-full p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm"
              />
            </div>

            {/* Reminder Date & Time Picker */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
                <BellRing className="w-4 h-4" />
                <span>
                  {lang === 'ne'
                    ? 'रिमाइन्डर समय सेट गर्नुहोस् (Set Reminder Date & Time):'
                    : 'Set Reminder Alert Date & Time (Optional):'}
                </span>
              </label>
              <input
                type="datetime-local"
                value={noteRemindAt}
                onChange={(e) => setNoteRemindAt(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {lang === 'ne'
                  ? 'तोकिएको समयमा सुसमाचार एपले ध्वनि (Chime) र सूचनामार्फत तपाईंलाई सम्झाउनेछ।'
                  : 'Susamachar will alert you with a chime and notification at the scheduled time.'}
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {lang === 'ne'
                  ? 'नोट र रिमाइन्डर सुरक्षित गर्नुहोस् (Save Note)'
                  : 'Save Note & Reminder'}
              </span>
            </button>
          </form>

          {/* Right 7 Cols: Saved Notes List */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'ne'
                    ? `सुरक्षित गरिएका नोटहरू (${filteredNotes.length})`
                    : `Saved Personal Notes (${filteredNotes.length})`}
                </h2>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  placeholder={lang === 'ne' ? 'नोट खोज्नुहोस्...' : 'Search saved notes...'}
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            {filteredNotes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                {lang === 'ne'
                  ? 'अहिलेसम्म कुनै नोट छैन। बायाँतर्फको फारमबाट नयाँ नोट सुरक्षित गर्नुहोस्।'
                  : 'No notes found. Write and save your first note on the left.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                      note.isPinned
                        ? 'bg-amber-500/5 border-amber-500/40'
                        : 'bg-stone-50/70 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {note.isPinned && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            📌 Pinned
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-500">
                          {note.createdAtBs} · {note.createdAtAd}
                        </span>
                        {note.scriptureRef && (
                          <span className="px-2.5 py-0.5 rounded-lg bg-red-800/10 dark:bg-amber-400/15 text-red-800 dark:text-amber-300 text-xs font-bold">
                            📖 {note.scriptureRef}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTriggerReminderTest(note)}
                          className="h-7 px-2.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Test Reminder Chime"
                        >
                          <Bell className="w-3 h-3" />
                          <span>{lang === 'ne' ? 'रिमाइन्डर' : 'Remind'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setNotes((prev) =>
                              prev.map((n) =>
                                n.id === note.id ? { ...n, isPinned: !n.isPinned } : n
                              )
                            )
                          }
                          className={`p-1.5 rounded-lg border ${
                            note.isPinned
                              ? 'bg-amber-400 text-slate-950 border-amber-500'
                              : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 text-slate-500'
                          }`}
                          title="Pin Note"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNotes((prev) => prev.filter((n) => n.id !== note.id));
                            onNotify(lang === 'ne' ? 'नोट हटाइयो।' : 'Note deleted.');
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {note.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                      {note.content}
                    </p>

                    {note.remindAt && (
                      <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ne' ? 'रिमाइन्डर समय:' : 'Scheduled Reminder:'}{' '}
                          {note.remindAt.replace('T', ' ')}
                          {note.reminderFired ? ' (सम्पन्न ✓)' : ' (सक्रिय 🔔)'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CHRISTIAN PODCASTS (AUDIO & VIDEO EPISODES)
         ===================================================================== */}
      {activeTab === 'podcasts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Active Podcast Player */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-lg bg-red-800 text-white text-xs font-bold flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>{lang === 'ne' ? 'प्रत्यक्ष पोडकास्ट प्लेयर' : 'Now Playing Podcast'}</span>
              </span>
              <span className="text-xs font-mono text-slate-500">
                {activePodcast.duration} · {activePodcast.scriptureRef}
              </span>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-stone-200 dark:border-slate-800">
              <iframe
                src={`https://www.youtube.com/embed/${activePodcast.youtubeId}?rel=0`}
                title={lang === 'ne' ? activePodcast.titleNe : activePodcast.titleEn}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'ne' ? activePodcast.titleNe : activePodcast.titleEn}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'ne' ? activePodcast.summaryNe : activePodcast.summaryEn}
              </p>
            </div>
          </div>

          {/* Right 5 Cols: Podcast Episode List + Add Custom YouTube Podcast */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne' ? 'पोडकास्ट एपिसोडहरू (Episodes)' : 'Podcast Episodes'}
              </h3>
              <div className="space-y-2.5">
                {podcasts.map((ep) => {
                  const isCurrent = ep.id === activePodcast.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setActivePodcastId(ep.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'border-red-800 bg-red-800/5 dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-stone-200 dark:border-slate-800 hover:border-red-800/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <span className="text-[11px] font-bold text-red-800 dark:text-amber-400 block">
                          {lang === 'ne' ? ep.categoryNe : ep.categoryEn} · {ep.duration}
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                          {lang === 'ne' ? ep.titleNe : ep.titleEn}
                        </p>
                      </div>
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-red-800 text-white'
                            : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={handleAddPodcast}
              className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-600" />
                <span>
                  {lang === 'ne'
                    ? 'नयाँ बाइबल पोडकास्ट / YouTube लिङ्क थप्नुहोस्'
                    : 'Add YouTube Podcast Episode'}
                </span>
              </h3>
              <input
                type="text"
                value={customPodTitle}
                onChange={(e) => setCustomPodTitle(e.target.value)}
                placeholder={lang === 'ne' ? 'पोडकास्ट शीर्षक...' : 'Episode Title...'}
                className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
              />
              <input
                type="text"
                required
                value={customPodYoutube}
                onChange={(e) => setCustomPodYoutube(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-mono"
              />
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold"
              >
                {lang === 'ne' ? '+ पोडकास्ट प्ले गर्नुहोस्' : '+ Add & Play Podcast'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: BIBLICAL LIFE & HEALTH TIPS
         ===================================================================== */}
      {activeTab === 'healthtips' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {BIBLICAL_LIFE_HEALTH_TIPS.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>{lang === 'ne' ? item.categoryNe : item.categoryEn}</span>
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {lang === 'ne' ? item.titleNe : item.titleEn}
                </h2>

                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 space-y-1">
                  <p className="text-xs italic text-slate-700 dark:text-slate-300">
                    {lang === 'ne' ? item.verseTextNe : item.verseTextEn}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-red-800 dark:text-amber-400">
                    — {lang === 'ne' ? item.verseRefNe : item.verseRefEn}
                  </p>
                </div>

                <ul className="space-y-2.5 pt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {(lang === 'ne' ? item.tipsNe : item.tipsEn).map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
          TAB 4: TODAY'S FOREIGN EXCHANGE RATES (NRB FOREX + CONVERTER)
         ===================================================================== */}
      {activeTab === 'forex' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 4 Cols: Interactive Currency Converter */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="pb-3 border-b border-stone-200 dark:border-slate-800">
              <span className="text-xs font-bold text-red-800 dark:text-amber-400">
                {lang === 'ne' ? 'मुद्रा रूपान्तरण (Currency Calculator)' : 'Forex Currency Converter'}
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {lang === 'ne'
                  ? 'विदेशी मुद्रा ↔ नेपाली रूपैयाँ (NPR)'
                  : 'Foreign Currency to Nepali Rupee (NPR)'}
              </h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? 'विदेशी मुद्रा छान्नुहोस् (Select Currency):' : 'Select Foreign Currency:'}
              </label>
              <select
                value={selectedCurrencyCode}
                onChange={(e) => setSelectedCurrencyCode(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold"
              >
                {TODAY_FOREX_RATES.map((fx) => (
                  <option key={fx.code} value={fx.code}>
                    {fx.flag} {fx.code} — {lang === 'ne' ? fx.nameNe : fx.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? `रकम (${selectedForex.code} Amount):` : `Amount (${selectedForex.code}):`}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={foreignAmount}
                onChange={(e) => setForeignAmount(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-sm font-mono font-bold"
              />
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {lang === 'ne' ? 'खरिद दर अनुसार (Buying NPR):' : 'Buying Total (NPR):'}
                </span>
                <span className="text-base font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  रू {Number(convertedNprBuy).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {lang === 'ne' ? 'बिक्री दर अनुसार (Selling NPR):' : 'Selling Total (NPR):'}
                </span>
                <span className="text-base font-mono font-bold text-red-800 dark:text-amber-400">
                  रू {Number(convertedNprSell).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Right 8 Cols: Full Daily Forex Table */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {lang === 'ne'
                    ? 'नेपाल राष्ट्र बैंक — आजको विदेशी विनिमय दर (Daily Exchange Rates)'
                    : 'Nepal Rastra Bank — Today’s Foreign Exchange Rates (NPR)'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'ne'
                    ? 'मिति: वि.सं. २०८३ कार्तिक १४ (Oct 31, 2026)'
                    : 'Date: Oct 31, 2026 (२०८३ कार्तिक १४)'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 text-slate-500 text-xs">
                    <th className="py-3 px-3">{lang === 'ne' ? 'मुद्रा (Currency)' : 'Currency'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'एकाइ (Unit)' : 'Unit'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'खरिद दर (Buying)' : 'Buying (NPR)'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'बिक्री दर (Selling)' : 'Selling (NPR)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800">
                  {TODAY_FOREX_RATES.map((fx) => (
                    <tr
                      key={fx.code}
                      onClick={() => setSelectedCurrencyCode(fx.code)}
                      className="hover:bg-stone-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <td className="py-3 px-3 font-semibold flex items-center gap-2">
                        <span className="text-base">{fx.flag}</span>
                        <span>
                          <strong>{fx.code}</strong> — {lang === 'ne' ? fx.nameNe : fx.nameEn}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">{fx.unit}</td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        रू {fx.buyNpr.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-red-800 dark:text-amber-400">
                        रू {fx.sellNpr.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
