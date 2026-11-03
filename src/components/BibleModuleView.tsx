import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns,
  Copy,
  Download,
  FileText,
  Globe,
  History,
  Image as ImageIcon,
  Layers,
  ListFilter,
  Search,
  Share2,
  Type,
  Volume2,
  X,
} from 'lucide-react';
import {
  BIBLE_BOOKS,
  BIBLE_STUDY_ARTICLES,
  BibleBook,
  BibleStudyArticle,
  BibleVerse,
  CURATED_BIBLE_VERSES,
  getVersesForBookChapter,
} from '../data/susamacharDatabase';
import { toNepaliDigits } from '../utils/nepaliDateEngine';
import { VerseImageShareModal } from './VerseImageShareModal';

export interface MultilingualBibleVerse extends BibleVerse {
  bookNameHi?: string;
  textHi?: string | null;
  textNe: string;
  textEn: string;
  hasNe?: boolean;
  hasHi?: boolean;
  hasEn?: boolean;
}

export interface BibleTranslationMeta {
  id: number;
  code: string;
  language: 'ne' | 'hi' | 'en';
  displayName: string;
  fullName: string;
  shortLabel: string;
  publisher: string;
  sourceRepository: string;
  format: string;
  license: string;
  copyrightNotice: string;
  totalBooks: number;
  totalChapters: number;
  totalVerses: number;
  hasAudio: boolean;
  hasIntros: boolean;
  isEnabled: boolean;
}

export type ReadingModeKey = 'single' | 'parallel' | 'tri';
export type ComparisonPresetKey = 'ne_en' | 'hi_ne' | 'hi_en' | 'ne_hi_en';

interface BibleModuleViewProps {
  lang: 'ne' | 'en';
  bookmarks: string[];
  onToggleBookmark: (verseId: string) => void;
  onNotify: (msg: string) => void;
}

function renderVerbatimNepaliVerse(
  rawOrCleanText: string | null | undefined,
  redLetterEnabled: boolean
): React.ReactNode {
  if (!rawOrCleanText) {
    return (
      <span className="italic text-xs text-amber-700 dark:text-amber-400">
        [यस संस्करणमा यो पद अघिल्लो पदमा गाभिएको छ]
      </span>
    );
  }
  if (!redLetterEnabled || !/<red>/i.test(rawOrCleanText)) {
    return rawOrCleanText.replace(/<\/?red>/gi, '');
  }

  const parts = rawOrCleanText.split(/(<red>[\s\S]*?<\/red>)/gi);
  return parts.map((part, idx) => {
    if (/^<red>[\s\S]*<\/red>$/i.test(part)) {
      const inner = part.replace(/<\/?red>/gi, '');
      return (
        <span key={idx} className="text-red-700 dark:text-rose-400 font-semibold">
          {inner}
        </span>
      );
    }
    return <React.Fragment key={idx}>{part.replace(/<\/?red>/gi, '')}</React.Fragment>;
  });
}

export const BibleModuleView: React.FC<BibleModuleViewProps> = ({
  lang,
  bookmarks,
  onToggleBookmark,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'reader' | 'study' | 'plan' | 'bookmarks'>('reader');
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL');
  const [selectedBookId, setSelectedBookId] = useState<number>(1);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  // Selected verse(s) in book-style chapter view for highlighting, comparing, copying, or sharing
  const [selectedVerseNum, setSelectedVerseNum] = useState<number | null>(null);
  // Verse number currently expanded for inline 3-language comparison
  const [comparingVerseNum, setComparingVerseNum] = useState<number | null>(null);
  // Collapsible Book & Chapter picker modal/drawer for quick navigation
  const [isBookPickerOpen, setIsBookPickerOpen] = useState<boolean>(false);

  const [readingMode, setReadingMode] = useState<ReadingModeKey>(() => {
    const saved = localStorage.getItem('susamachar_bible_reading_mode_v2');
    if (saved === 'single' || saved === 'parallel' || saved === 'tri') {
      return saved;
    }
    return 'single';
  });

  const [singleLang, setSingleLang] = useState<'ne' | 'hi' | 'en'>(() => {
    const saved = localStorage.getItem('susamachar_bible_single_lang');
    if (saved === 'ne' || saved === 'hi' || saved === 'en') return saved;
    return 'ne';
  });

  const [comparisonPreset, setComparisonPreset] = useState<ComparisonPresetKey>(() => {
    const saved = localStorage.getItem('susamachar_bible_comparison_preset');
    if (saved === 'ne_en' || saved === 'hi_ne' || saved === 'hi_en' || saved === 'ne_hi_en') {
      return saved;
    }
    return 'ne_hi_en';
  });

  const [redLetterEnabled, setRedLetterEnabled] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('lg');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLangScope, setSearchLangScope] = useState<'all' | 'ne' | 'hi' | 'en'>('all');

  const [booksList, setBooksList] = useState<Array<BibleBook & { nameHi?: string }>>(BIBLE_BOOKS);

  // Live Chapter Verses State
  const [chapterVerses, setChapterVerses] = useState<MultilingualBibleVerse[]>([]);
  const [chapterAudioUrl, setChapterAudioUrl] = useState<string | null>(null);
  const [hasBookIntro, setHasBookIntro] = useState<boolean>(true);
  const [loadingChapter, setLoadingChapter] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readerTopRef = useRef<HTMLDivElement | null>(null);

  // Multilingual Search State
  const [searchResults, setSearchResults] = useState<MultilingualBibleVerse[]>([]);
  const [searchTotalMatches, setSearchTotalMatches] = useState<number>(0);
  const [searchingBible, setSearchingBible] = useState<boolean>(false);

  // Bookmarks, Highlights & History
  const [savedBookmarkObjects, setSavedBookmarkObjects] = useState<
    Record<string, MultilingualBibleVerse>
  >(() => {
    try {
      const raw = localStorage.getItem('susamachar_bible_bookmark_objects');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    const initial: Record<string, MultilingualBibleVerse> = {};
    for (const cv of CURATED_BIBLE_VERSES) {
      initial[cv.id] = cv;
    }
    return initial;
  });

  const [highlights, setHighlights] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(
        localStorage.getItem('susamachar_bible_highlights') || '{"43-3-16":"amber","1-1-1":"amber"}'
      );
    } catch {
      return { '43-3-16': 'amber', '1-1-1': 'amber' };
    }
  });

  const [readingHistory, setReadingHistory] = useState<
    Array<{ bookId: number; chapter: number; mode: string; timestamp: string }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem('susamachar_bible_history') || '[]');
    } catch {
      return [];
    }
  });

  const [completedPlanDays, setCompletedPlanDays] = useState<number[]>([1, 2, 3]);
  const [selectedStudyArticle, setSelectedStudyArticle] = useState<BibleStudyArticle>(
    BIBLE_STUDY_ARTICLES[0]
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(true);
  const [shareImageVerse, setShareImageVerse] = useState<BibleVerse | null>(null);

  // Persist user reading mode & language preferences
  useEffect(() => {
    try {
      localStorage.setItem('susamachar_bible_reading_mode_v2', readingMode);
      localStorage.setItem('susamachar_bible_single_lang', singleLang);
      localStorage.setItem('susamachar_bible_comparison_preset', comparisonPreset);
    } catch {
      // ignore
    }
  }, [readingMode, singleLang, comparisonPreset]);

  // Load initial books metadata
  useEffect(() => {
    async function fetchBibleBooks() {
      try {
        const res = await fetch('/api/bible/books');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.books) && data.books.length > 0) {
          setBooksList(data.books);
        }
      } catch {
        // fallback to defaults
      }
    }
    fetchBibleBooks();
  }, []);

  const selectedBook = useMemo(
    () => booksList.find((b) => b.id === selectedBookId) || booksList[0],
    [booksList, selectedBookId]
  );

  const filteredBooks = useMemo(() => {
    return booksList.filter((b) => testamentFilter === 'ALL' || b.testament === testamentFilter);
  }, [booksList, testamentFilter]);

  // Fetch aligned 3-language chapter from Backend (with offline cache fallback)
  useEffect(() => {
    let cancelled = false;
    const cacheKey = `susamachar_multilingual_chapter_${selectedBook.id}_${selectedChapter}`;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    async function loadChapter() {
      setLoadingChapter(true);
      try {
        const res = await fetch(`/api/bible/books/${selectedBook.id}/chapters/${selectedChapter}`);
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        if (cancelled) return;

        const rawVerses = (data.verses || []).map((v: Record<string, unknown>) => ({
          ...v,
          hasNe: v.textNe !== null && v.textNe !== undefined && v.textNe !== '',
          hasHi: v.textHi !== null && v.textHi !== undefined && v.textHi !== '',
          hasEn: v.textEn !== null && v.textEn !== undefined && v.textEn !== '',
          textNe: (v.textNe as string) || '',
          textHi: (v.textHi as string) || null,
          textEn: (v.textEn as string) || '',
        })) as MultilingualBibleVerse[];

        setChapterVerses(rawVerses);
        setChapterAudioUrl(data.audioUrl || null);
        setHasBookIntro(Boolean(data.hasIntro));

        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              verses: rawVerses,
              audioUrl: data.audioUrl || null,
              hasIntro: Boolean(data.hasIntro),
            })
          );
        } catch {
          // ignore storage quota
        }
      } catch {
        if (cancelled) return;
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setChapterVerses(parsed.verses || []);
            setChapterAudioUrl(parsed.audioUrl || null);
            setHasBookIntro(Boolean(parsed.hasIntro));
            setLoadingChapter(false);
            return;
          }
        } catch {
          // ignore
        }
        setChapterVerses(getVersesForBookChapter(selectedBook.id, selectedChapter || 1));
        setChapterAudioUrl(null);
      } finally {
        if (!cancelled) setLoadingChapter(false);
      }
    }

    loadChapter();
    return () => {
      cancelled = true;
    };
  }, [selectedBook.id, selectedChapter]);

  // Multilingual Search across Nepali, Hindi, and English
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchTotalMatches(0);
      setSearchingBible(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingBible(true);
      try {
        const params = new URLSearchParams({
          q,
          testament: testamentFilter,
          lang: searchLangScope,
          limit: '80',
        });
        const res = await fetch(`/api/bible/search?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) {
          const mapped = (data.results || []).map((v: Record<string, unknown>) => ({
            ...v,
            hasNe: Boolean(v.textNe),
            hasHi: Boolean(v.textHi),
            hasEn: Boolean(v.textEn),
            textNe: (v.textNe as string) || '',
            textHi: (v.textHi as string) || null,
            textEn: (v.textEn as string) || '',
          }));
          setSearchResults(mapped);
          setSearchTotalMatches(data.totalMatches || mapped.length);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
          setSearchTotalMatches(0);
        }
      } finally {
        if (!cancelled) setSearchingBible(false);
      }
    }, 240);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, testamentFilter, searchLangScope]);

  const isSearching = searchQuery.trim().length >= 2;

  const currentVerses: MultilingualBibleVerse[] = useMemo(() => {
    if (isSearching) {
      return searchResults;
    }
    return chapterVerses;
  }, [isSearching, searchResults, chapterVerses]);

  // Record reading history
  useEffect(() => {
    if (selectedChapter === 0) return;
    try {
      setReadingHistory((prev) => {
        const filtered = prev.filter(
          (item) => !(item.bookId === selectedBook.id && item.chapter === selectedChapter)
        );
        const next = [
          {
            bookId: selectedBook.id,
            chapter: selectedChapter,
            mode: readingMode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          ...filtered,
        ].slice(0, 12);
        localStorage.setItem('susamachar_bible_history', JSON.stringify(next));
        return next;
      });
    } catch {
      // ignore
    }
  }, [selectedBook.id, selectedChapter, readingMode]);

  const handleBookmarkWithObject = (v: MultilingualBibleVerse) => {
    setSavedBookmarkObjects((prev) => {
      const next = { ...prev, [v.id]: v };
      try {
        localStorage.setItem('susamachar_bible_bookmark_objects', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    onToggleBookmark(v.id);
  };

  const handleSelectBookAndChapter = (bookId: number, chapterNum: number, verseNum?: number) => {
    setSelectedBookId(bookId);
    setSelectedChapter(chapterNum);
    setSearchQuery('');
    setSelectedVerseNum(verseNum ?? null);
    setComparingVerseNum(null);
    setIsBookPickerOpen(false);
    setTimeout(() => {
      if (verseNum) {
        const el = document.getElementById(`bible-verse-${verseNum}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
      readerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleHighlight = (verseId: string, color: string) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (next[verseId] === color) {
        delete next[verseId];
      } else {
        next[verseId] = color;
      }
      localStorage.setItem('susamachar_bible_highlights', JSON.stringify(next));
      return next;
    });
  };

  // Determine active columns based on ReadingMode & ComparisonPreset
  const activeColumns = useMemo((): Array<'ne' | 'hi' | 'en'> => {
    if (readingMode === 'single') {
      return [singleLang];
    }
    if (readingMode === 'tri') {
      return ['ne', 'hi', 'en'];
    }
    if (comparisonPreset === 'ne_en') return ['ne', 'en'];
    if (comparisonPreset === 'hi_ne') return ['hi', 'ne'];
    if (comparisonPreset === 'hi_en') return ['hi', 'en'];
    return ['ne', 'hi', 'en'];
  }, [readingMode, singleLang, comparisonPreset]);

  const handleCopyVerse = (v: MultilingualBibleVerse) => {
    const lines: string[] = [];
    const hiBook = v.bookNameHi || v.bookNameNe;
    if (activeColumns.length === 1) {
      const col = activeColumns[0];
      if (col === 'ne') {
        lines.push(`${v.bookNameNe} ${toNepaliDigits(v.chapter)}:${toNepaliDigits(v.verse)}`);
        lines.push((v.textNe || '').replace(/<\/?red>/gi, ''));
      } else if (col === 'hi') {
        lines.push(`${hiBook} ${v.chapter}:${v.verse}`);
        lines.push(v.textHi || '');
      } else {
        lines.push(`${v.bookNameEn} ${v.chapter}:${v.verse}`);
        lines.push(v.textEn || '');
      }
    } else {
      lines.push(`${v.bookNameNe} / ${hiBook} / ${v.bookNameEn} ${v.chapter}:${v.verse}`);
      if (activeColumns.includes('ne') && v.textNe) {
        lines.push(`[नेपाली]: "${v.textNe.replace(/<\/?red>/gi, '')}"`);
      }
      if (activeColumns.includes('hi') && v.textHi) {
        lines.push(`[हिन्दी]: "${v.textHi}"`);
      }
      if (activeColumns.includes('en') && v.textEn) {
        lines.push(`[English]: "${v.textEn}"`);
      }
    }
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopiedId(v.id);
    onNotify(lang === 'ne' ? 'बाइबल पद कपी गरियो!' : 'Bible verse copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareVerse = async (v: MultilingualBibleVerse) => {
    const shareParts: string[] = [];
    if (activeColumns.includes('ne') && v.textNe) {
      shareParts.push(`${v.textNe.replace(/<\/?red>/gi, '')}`);
    }
    if (activeColumns.includes('hi') && v.textHi) {
      shareParts.push(`${v.textHi}`);
    }
    if (activeColumns.includes('en') && v.textEn) {
      shareParts.push(`${v.textEn}`);
    }
    const text = `${v.bookNameNe} (${v.bookNameEn}) ${v.chapter}:${v.verse}\n${shareParts.join('\n')}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Holy Bible', text });
        return;
      } catch {
        // fallback to copy
      }
    }
    handleCopyVerse(v);
  };

  const handleDownloadOfflinePack = () => {
    setIsOfflineReady(true);
    try {
      localStorage.setItem(
        `susamachar_multilingual_chapter_${selectedBook.id}_${selectedChapter}`,
        JSON.stringify({
          verses: chapterVerses,
          audioUrl: chapterAudioUrl,
          hasIntro: hasBookIntro,
        })
      );
    } catch {
      // ignore
    }
    onNotify(
      lang === 'ne'
        ? `${selectedBook.nameNe} अध्याय ${toNepaliDigits(selectedChapter)} अफलाइन अध्ययनका लागि सुरक्षित गरियो!`
        : `${selectedBook.nameEn} Chapter ${selectedChapter} cached for offline reading!`
    );
  };

  const fontSizeClass = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-relaxed',
    lg: 'text-xl leading-relaxed',
    xl: 'text-2xl leading-relaxed',
  }[fontSize];

  const highlightBgMap: Record<string, string> = {
    amber: 'bg-amber-200/70 dark:bg-amber-900/40 rounded px-1',
    rose: 'bg-rose-200/70 dark:bg-rose-900/40 rounded px-1',
    sky: 'bg-sky-200/70 dark:bg-sky-900/40 rounded px-1',
    emerald: 'bg-emerald-200/70 dark:bg-emerald-900/40 rounded px-1',
  };

  const readingPlanList = [
    { day: 1, titleNe: 'सृष्टि र परमेश्वरको महिमा', titleEn: 'Creation & Glory of God', bookId: 1, chapter: 1, refNe: 'उत्पत्ति १ • भजनसंग्रह १९', refEn: 'Genesis 1 • Psalm 19' },
    { day: 2, titleNe: 'असल गोठालोको प्रतिज्ञा', titleEn: 'Promise of the Good Shepherd', bookId: 19, chapter: 23, refNe: 'भजनसंग्रह २३ • यूहन्ना १०', refEn: 'Psalm 23 • John 10' },
    { day: 3, titleNe: 'डाँडाको उपदेश र धन्यका कुराहरू', titleEn: 'Sermon on the Mount (Beatitudes)', bookId: 40, chapter: 5, refNe: 'मत्ती ५:१–१६', refEn: 'Matthew 5:1–16' },
    { day: 4, titleNe: 'परमेश्वरको अनन्त प्रेम र उद्धार', titleEn: 'God’s Everlasting Love & Salvation', bookId: 43, chapter: 3, refNe: 'यूहन्ना ३:१–२१', refEn: 'John 3:1–21' },
    { day: 5, titleNe: 'ख्रीष्टमा विजेता जीवन', titleEn: 'More Than Conquerors in Christ', bookId: 45, chapter: 8, refNe: 'रोमी ८:१८–३९', refEn: 'Romans 8:18–39' },
    { day: 6, titleNe: 'प्रार्थना र परमेश्वरको शान्ति', titleEn: 'Prayer & Peace of God', bookId: 50, chapter: 4, refNe: 'फिलिप्पी ४:४–१३', refEn: 'Philippians 4:4–13' },
    { day: 7, titleNe: 'नयाँ आकाश र नयाँ पृथ्वीको आशा', titleEn: 'Hope of the New Creation', bookId: 66, chapter: 21, refNe: 'प्रकाश २१:१–७', refEn: 'Revelation 21:1–7' },
  ];

  const bookmarkedVerses = useMemo(() => {
    return bookmarks
      .map((id) => savedBookmarkObjects[id] || CURATED_BIBLE_VERSES.find((v) => v.id === id))
      .filter((v): v is MultilingualBibleVerse => Boolean(v));
  }, [bookmarks, savedBookmarkObjects]);

  const activeSelectedVerseObj = useMemo(() => {
    if (selectedVerseNum === null) return null;
    return currentVerses.find((v) => v.verse === selectedVerseNum) || null;
  }, [currentVerses, selectedVerseNum]);

  // Format book title & chapter header according to active reading language
  const getBookHeaderTitle = () => {
    if (readingMode === 'single') {
      if (singleLang === 'ne') {
        return selectedChapter === 0
          ? `${selectedBook.nameNe} — परिचय`
          : `${selectedBook.nameNe} — अध्याय ${toNepaliDigits(selectedChapter)}`;
      }
      if (singleLang === 'hi') {
        return selectedChapter === 0
          ? `${selectedBook.nameHi || selectedBook.nameNe} — परिचय`
          : `${selectedBook.nameHi || selectedBook.nameNe} — अध्याय ${selectedChapter}`;
      }
      return selectedChapter === 0
        ? `${selectedBook.nameEn} — Introduction`
        : `${selectedBook.nameEn} — Chapter ${selectedChapter}`;
    }
    return selectedChapter === 0
      ? `${selectedBook.nameNe} • ${selectedBook.nameHi || selectedBook.nameNe} • ${selectedBook.nameEn} — परिचय`
      : `${selectedBook.nameNe} • ${selectedBook.nameHi || selectedBook.nameNe} • ${selectedBook.nameEn} — अध्याय / Chapter ${selectedChapter}`;
  };

  // Language-specific copyright notice at the bottom of the Bible reader
  const copyrightNotices = useMemo(() => {
    const lines: string[] = [];
    if (activeColumns.includes('ne')) {
      lines.push(
        'नेपाली पवित्र बाइबल — नयाँ संशोधित संस्करण (NNRV) © नेपाल बाइबल सोसाइटी (Nepal Bible Society) 1997, 2006, 2009, 2012'
      );
    }
    if (activeColumns.includes('hi')) {
      lines.push('© Hindi Bible (Indian Revised Version) IRV');
    }
    if (activeColumns.includes('en')) {
      lines.push('© King James Version (KJV)');
    }
    return lines;
  }, [activeColumns]);

  return (
    <div ref={readerTopRef} className="space-y-4">
      {/* Clean, Compact Bible Navigation & Language Bar */}
      <div className="bg-gradient-to-r from-[#5B0E14] via-[#7F1D1D] to-[#1E3A8A] rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-amber-400/20 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Language & Parallel Compare Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => {
                setReadingMode('single');
                setSingleLang('ne');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                readingMode === 'single' && singleLang === 'ne'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>नेपाली बाइबल</span>
            </button>

            <button
              onClick={() => {
                setReadingMode('single');
                setSingleLang('hi');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                readingMode === 'single' && singleLang === 'hi'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>हिन्दी बाइबिल</span>
            </button>

            <button
              onClick={() => {
                setReadingMode('single');
                setSingleLang('en');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                readingMode === 'single' && singleLang === 'en'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>English Bible</span>
            </button>

            <button
              onClick={() => {
                if (readingMode === 'single') {
                  setReadingMode('parallel');
                  setComparisonPreset('ne_en');
                } else {
                  setReadingMode('single');
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
                readingMode !== 'single'
                  ? 'bg-white text-[#7F1D1D] shadow-sm'
                  : 'bg-black/25 hover:bg-black/40 text-amber-200 border border-amber-300/30'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{lang === 'ne' ? 'समानान्तर तुलना (Compare)' : 'Parallel Compare'}</span>
            </button>
          </div>

          {/* Sub-Navigation Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'reader', labelNe: 'पवित्र बाइबल', labelEn: 'Bible Reader', icon: BookOpen },
              { id: 'study', labelNe: 'बाइबल शिक्षा', labelEn: 'Bible Study', icon: FileText },
              { id: 'plan', labelNe: 'पठन योजना', labelEn: 'Reading Plan', icon: Layers },
              {
                id: 'bookmarks',
                labelNe: `बुकमार्क (${bookmarks.length})`,
                labelEn: `Bookmarks (${bookmarks.length})`,
                icon: Bookmark,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id as typeof subTab)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    subTab === tab.id
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{lang === 'ne' ? tab.labelNe : tab.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Parallel Comparison Preset Bar (only visible when Parallel Compare is active) */}
        {subTab === 'reader' && readingMode !== 'single' && (
          <div className="pt-2.5 border-t border-white/15 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-amber-200 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'ne' ? 'तुलना भाषा छान्नुहोस्:' : 'Compare Languages:'}</span>
            </span>
            {[
              { id: 'ne_en' as const, label: 'नेपाली + English', mode: 'parallel' as const },
              { id: 'hi_ne' as const, label: 'हिन्दी + नेपाली', mode: 'parallel' as const },
              { id: 'hi_en' as const, label: 'हिन्दी + English', mode: 'parallel' as const },
              { id: 'ne_hi_en' as const, label: 'नेपाली + हिन्दी + English', mode: 'tri' as const },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setComparisonPreset(preset.id);
                  setReadingMode(preset.mode);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  comparisonPreset === preset.id &&
                  ((preset.id === 'ne_hi_en' && readingMode === 'tri') ||
                    (preset.id !== 'ne_hi_en' && readingMode === 'parallel'))
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'bg-black/25 text-white hover:bg-white/15 border border-white/15'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SUBTAB 1: WHOLE-BOOK BIBLE READER & SEARCH */}
      {subTab === 'reader' && (
        <div className="space-y-4">
          {/* Unified Book, Chapter, Search & Typography Control Bar */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
              {/* Direct Book & Chapter Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Testament quick filter */}
                <div className="inline-flex p-1 bg-stone-100 dark:bg-slate-800 rounded-xl">
                  {(['ALL', 'OT', 'NT'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTestamentFilter(t)}
                      className={`py-1 px-2.5 text-xs font-bold rounded-lg transition-colors ${
                        testamentFilter === t
                          ? 'bg-red-800 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {t === 'ALL'
                        ? lang === 'ne'
                          ? 'सबै (६६)'
                          : 'All (66)'
                        : t === 'OT'
                        ? lang === 'ne'
                          ? 'पुरानो (३९)'
                          : 'OT (39)'
                        : lang === 'ne'
                        ? 'नयाँ (२७)'
                        : 'NT (27)'}
                    </button>
                  ))}
                </div>

                {/* Book Dropdown */}
                <select
                  value={selectedBookId}
                  onChange={(e) => handleSelectBookAndChapter(Number(e.target.value), 1)}
                  className="h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-800"
                >
                  {filteredBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bookNumber}.{' '}
                      {singleLang === 'hi' && readingMode === 'single'
                        ? `${b.nameHi || b.nameNe} (${b.nameEn})`
                        : singleLang === 'en' && readingMode === 'single'
                        ? `${b.nameEn} (${b.nameNe})`
                        : `${b.nameNe} (${b.nameEn})`}
                    </option>
                  ))}
                </select>

                {/* Chapter Dropdown */}
                <select
                  value={selectedChapter}
                  onChange={(e) =>
                    handleSelectBookAndChapter(selectedBook.id, Number(e.target.value))
                  }
                  className="h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-800"
                >
                  {hasBookIntro && <option value={0}>परिचय (Intro)</option>}
                  {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map((ch) => (
                    <option key={ch} value={ch}>
                      {singleLang === 'ne' && readingMode === 'single'
                        ? `अध्याय ${toNepaliDigits(ch)}`
                        : singleLang === 'hi' && readingMode === 'single'
                        ? `अध्याय ${ch}`
                        : `Chapter ${ch}`}
                    </option>
                  ))}
                </select>

                {/* Expandable Book & Chapter Grid Button */}
                <button
                  onClick={() => setIsBookPickerOpen((o) => !o)}
                  className={`h-10 px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition ${
                    isBookPickerOpen
                      ? 'bg-red-800 text-white border-red-800'
                      : 'bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-stone-200'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>{lang === 'ne' ? 'पुस्तक र अध्याय तालिका' : 'Book & Chapter Grid'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isBookPickerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Search Bar & Typography Controls */}
              <div className="flex flex-wrap items-center gap-2 flex-1 xl:max-w-xl justify-end">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'ne'
                        ? 'बाइबलमा वचन खोज्नुहोस् (जस्तै: प्रेम, सृष्टि, यूहन्ना)...'
                        : 'Search verses across Nepali, Hindi & English...'
                    }
                    className="w-full h-10 pl-9 pr-8 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-800"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isSearching && (
                  <select
                    value={searchLangScope}
                    onChange={(e) =>
                      setSearchLangScope(e.target.value as 'all' | 'ne' | 'hi' | 'en')
                    }
                    className="h-10 px-2.5 rounded-xl bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    <option value="all">सबै भाषा (All)</option>
                    <option value="ne">नेपाली मात्र</option>
                    <option value="hi">हिन्दी मात्र</option>
                    <option value="en">English Only</option>
                  </select>
                )}

                <button
                  onClick={() => setRedLetterEnabled((r) => !r)}
                  className={`h-10 px-2.5 rounded-xl border text-xs font-semibold transition-colors ${
                    redLetterEnabled
                      ? 'bg-red-50 dark:bg-rose-950/40 border-red-300 dark:border-rose-700 text-red-700 dark:text-rose-300'
                      : 'border-stone-200 dark:border-slate-700 text-slate-500'
                  }`}
                  title="Highlight Words of Jesus in Red"
                >
                  {lang === 'ne' ? 'रातो अक्षर' : 'Red Letter'}
                </button>

                <button
                  onClick={() => {
                    const order: Array<'sm' | 'base' | 'lg' | 'xl'> = ['sm', 'base', 'lg', 'xl'];
                    setFontSize(order[(order.indexOf(fontSize) + 1) % order.length]);
                  }}
                  className="h-10 px-3 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-stone-100 dark:hover:bg-slate-800"
                  title="Change Text Size"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>{fontSize.toUpperCase()}</span>
                </button>

                <button
                  onClick={handleDownloadOfflinePack}
                  className="h-10 px-2.5 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-blue-800 dark:text-amber-400 hover:bg-stone-100 dark:hover:bg-slate-800 inline-flex items-center gap-1"
                  title="Save Chapter Offline"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isOfflineReady ? (lang === 'ne' ? 'अफलाइन' : 'Offline') : 'Save'}
                  </span>
                </button>
              </div>
            </div>

            {/* Expandable Quick Book, Chapter & Verse Picker Panel */}
            {isBookPickerOpen && (
              <div className="pt-3 border-t border-stone-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Books Grid */}
                <div className="md:col-span-7 space-y-2">
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {lang === 'ne' ? '१. पुस्तक छान्नुहोस् (Select Book):' : '1. Select Book:'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
                    {filteredBooks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => {
                          setSelectedBookId(b.id);
                          setSelectedChapter(1);
                          setSearchQuery('');
                        }}
                        className={`px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition truncate ${
                          selectedBook.id === b.id
                            ? 'bg-red-800 text-white shadow-2xs'
                            : 'bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-red-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {b.bookNumber}. {b.nameNe} ({b.nameEn})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chapters & Verses Grid */}
                <div className="md:col-span-5 space-y-3">
                  <div>
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                      {lang === 'ne'
                        ? `२. ${selectedBook.nameNe} — अध्याय छान्नुहोस्:`
                        : `2. ${selectedBook.nameEn} — Select Chapter:`}
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {Array.from({ length: selectedBook.chaptersCount }, (_, i) => i + 1).map(
                        (ch) => (
                          <button
                            key={ch}
                            onClick={() => handleSelectBookAndChapter(selectedBook.id, ch)}
                            className={`h-8 rounded-lg text-xs font-mono font-bold transition ${
                              selectedChapter === ch && !isSearching
                                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-stone-200'
                            }`}
                          >
                            {singleLang === 'ne' && readingMode === 'single'
                              ? toNepaliDigits(ch)
                              : ch}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {chapterVerses.length > 0 && selectedChapter > 0 && (
                    <div>
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                        {lang === 'ne' ? '३. पदमा जानुहोस् (Jump to Verse):' : '3. Jump to Verse:'}
                      </div>
                      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 max-h-24 overflow-y-auto pr-1">
                        {chapterVerses.map((v) => (
                          <button
                            key={v.id}
                            onClick={() =>
                              handleSelectBookAndChapter(selectedBook.id, selectedChapter, v.verse)
                            }
                            className={`h-7 rounded text-[11px] font-mono transition ${
                              selectedVerseNum === v.verse
                                ? 'bg-red-800 text-white font-bold'
                                : 'bg-stone-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-red-50'
                            }`}
                          >
                            {singleLang === 'ne' && readingMode === 'single'
                              ? toNepaliDigits(v.verse)
                              : v.verse}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MAIN BIBLE BOOK PAGE / SEARCH RESULTS CONTAINER */}
          <div className="bg-[#FCFBF7] dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-8 shadow-sm space-y-6">
            {/* Book Chapter Heading & Prev/Next Chapter Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/90 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-red-800 dark:text-amber-400">
                  {selectedBook.testament === 'OT'
                    ? singleLang === 'hi' && readingMode === 'single'
                      ? 'पुराना नियम (Old Testament)'
                      : singleLang === 'en' && readingMode === 'single'
                      ? 'Old Testament'
                      : 'पुरानो करार (Old Testament)'
                    : singleLang === 'hi' && readingMode === 'single'
                    ? 'नया नियम (New Testament)'
                    : singleLang === 'en' && readingMode === 'single'
                    ? 'New Testament'
                    : 'नयाँ करार (New Testament)'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {isSearching
                    ? `"${searchQuery}" — ${searchTotalMatches} ${
                        lang === 'ne' ? 'खोज परिणामहरू' : 'Search Results'
                      }`
                    : getBookHeaderTitle()}
                </h2>
              </div>

              {!isSearching && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      handleSelectBookAndChapter(
                        selectedBook.id,
                        Math.max(hasBookIntro ? 0 : 1, selectedChapter - 1)
                      )
                    }
                    disabled={selectedChapter <= (hasBookIntro ? 0 : 1)}
                    className="h-9 px-3.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-stone-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'अघिल्लो अध्याय' : 'Prev Chapter'}</span>
                  </button>
                  <button
                    onClick={() =>
                      handleSelectBookAndChapter(
                        selectedBook.id,
                        Math.min(selectedBook.chaptersCount, selectedChapter + 1)
                      )
                    }
                    disabled={selectedChapter >= selectedBook.chaptersCount}
                    className="h-9 px-3.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-stone-100"
                  >
                    <span>{lang === 'ne' ? 'अर्को अध्याय' : 'Next Chapter'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Chapter Audio Player (when reading Nepali or Parallel) */}
            {!isSearching && chapterAudioUrl && activeColumns.includes('ne') && (
              <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-stone-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span className="w-8 h-8 rounded-lg bg-red-800 text-amber-300 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </span>
                  <div>
                    <p>
                      श्रव्य बाइबल (Audio Bible): {selectedBook.nameNe} अध्याय{' '}
                      {toNepaliDigits(selectedChapter)}
                    </p>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  controls
                  preload="none"
                  src={chapterAudioUrl}
                  className="h-9 w-full sm:w-64"
                />
              </div>
            )}

            {/* Helpful Hint Bar for Interactive Verse Selection in Book Mode */}
            {!isSearching && !loadingChapter && currentVerses.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-amber-50/80 dark:bg-slate-800/60 border border-amber-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span>
                  {lang === 'ne'
                    ? '💡 कुनै पनि पदमा क्लिक (Tap) गरेर कलर हाइलाइट गर्न, ३ भाषामा तुलना (Compare) गर्न, बुकमार्क वा सेयर गर्न सक्नुहुन्छ।'
                    : '💡 Tap any verse below to highlight with color, compare across languages, bookmark, copy, or share as image.'}
                </span>
                {selectedVerseNum !== null && (
                  <button
                    onClick={() => {
                      setSelectedVerseNum(null);
                      setComparingVerseNum(null);
                    }}
                    className="font-bold text-red-800 dark:text-amber-400 hover:underline"
                  >
                    {lang === 'ne' ? 'सेलेक्ट हटाउनुहोस् (Clear Selection)' : 'Clear Selection'}
                  </button>
                )}
              </div>
            )}

            {/* Floating / Sticky Selected Verse Action Toolbar when a verse is tapped in Book Mode */}
            {!isSearching && activeSelectedVerseObj && (
              <div className="sticky top-16 z-30 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-2 border-red-800/80 dark:border-amber-400/80 shadow-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-red-800 text-white text-xs font-bold font-mono">
                    {singleLang === 'ne' && readingMode === 'single'
                      ? `${activeSelectedVerseObj.bookNameNe} ${toNepaliDigits(
                          activeSelectedVerseObj.chapter
                        )}:${toNepaliDigits(activeSelectedVerseObj.verse)}`
                      : singleLang === 'hi' && readingMode === 'single'
                      ? `${
                          activeSelectedVerseObj.bookNameHi || activeSelectedVerseObj.bookNameNe
                        } ${activeSelectedVerseObj.chapter}:${activeSelectedVerseObj.verse}`
                      : `${activeSelectedVerseObj.bookNameEn} ${activeSelectedVerseObj.chapter}:${activeSelectedVerseObj.verse}`}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                    {lang === 'ne' ? 'पद सेलेक्ट गरिएको छ' : 'Verse Selected'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Color Highlight Swatches */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-stone-100 dark:bg-slate-800">
                    <span className="text-[11px] font-semibold text-slate-500 mr-0.5">
                      {lang === 'ne' ? 'कलर:' : 'Color:'}
                    </span>
                    {(['amber', 'rose', 'sky', 'emerald'] as const).map((color) => {
                      const isCurrentColor = highlights[activeSelectedVerseObj.id] === color;
                      return (
                        <button
                          key={color}
                          onClick={() => handleHighlight(activeSelectedVerseObj.id, color)}
                          className={`w-5 h-5 rounded-full border transition-transform ${
                            isCurrentColor
                              ? 'ring-2 ring-slate-900 dark:ring-white scale-110'
                              : 'opacity-80 hover:opacity-100 hover:scale-105'
                          } ${
                            color === 'amber'
                              ? 'bg-amber-300 border-amber-500'
                              : color === 'rose'
                              ? 'bg-rose-300 border-rose-500'
                              : color === 'sky'
                              ? 'bg-sky-300 border-sky-500'
                              : 'bg-emerald-300 border-emerald-500'
                          }`}
                          title={`Highlight ${color}`}
                        />
                      );
                    })}
                  </div>

                  {/* Compare Button */}
                  <button
                    onClick={() =>
                      setComparingVerseNum((prev) =>
                        prev === activeSelectedVerseObj.verse
                          ? null
                          : activeSelectedVerseObj.verse
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition ${
                      comparingVerseNum === activeSelectedVerseObj.verse
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-amber-100'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>{lang === 'ne' ? 'Compare (तुलना)' : 'Compare'}</span>
                  </button>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleBookmarkWithObject(activeSelectedVerseObj)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition ${
                      bookmarks.includes(activeSelectedVerseObj.id)
                        ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-amber-300'
                        : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Bookmark
                      className="w-3.5 h-3.5"
                      fill={
                        bookmarks.includes(activeSelectedVerseObj.id) ? 'currentColor' : 'none'
                      }
                    />
                    <span className="hidden sm:inline">
                      {lang === 'ne' ? 'बुकमार्क' : 'Bookmark'}
                    </span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={() => handleCopyVerse(activeSelectedVerseObj)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1 hover:bg-stone-200"
                  >
                    {copiedId === activeSelectedVerseObj.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{lang === 'ne' ? 'कपी' : 'Copy'}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShareVerse(activeSelectedVerseObj)}
                    className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center gap-1 hover:bg-stone-200"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{lang === 'ne' ? 'सेयर' : 'Share'}</span>
                  </button>

                  {/* Share as Image Button */}
                  <button
                    onClick={() => setShareImageVerse(activeSelectedVerseObj)}
                    className="px-2.5 py-1.5 rounded-xl bg-red-800 text-white text-xs font-bold inline-flex items-center gap-1 hover:bg-red-700"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{lang === 'ne' ? 'तस्बिर' : 'Image'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedVerseNum(null);
                      setComparingVerseNum(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* LOADING OR EMPTY STATES */}
            {loadingChapter || searchingBible ? (
              <div className="py-12 text-center text-sm text-slate-500 animate-pulse">
                {lang === 'ne' ? 'पवित्र बाइबल लोड हुँदैछ...' : 'Loading Scripture...'}
              </div>
            ) : currentVerses.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                {lang === 'ne' ? 'कुनै बाइबल पद फेला परेन।' : 'No matching Bible verses found.'}
              </div>
            ) : isSearching ? (
              /* =====================================================================
                 SEARCH RESULTS VIEW (Preserved Card Layout with Full Toolbar per Result)
                 ===================================================================== */
              <div className="divide-y divide-stone-200/70 dark:divide-slate-800/80">
                {currentVerses.map((v) => {
                  const isBookmarked = bookmarks.includes(v.id);
                  const highlightColor = highlights[v.id];
                  const bgClass = highlightColor
                    ? highlightBgMap[highlightColor]
                    : '';

                  return (
                    <div
                      id={`bible-verse-${v.verse}`}
                      key={v.id}
                      className={`py-4 px-3 -mx-3 rounded-xl transition-colors ${bgClass}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <button
                          onClick={() =>
                            handleSelectBookAndChapter(v.bookId, v.chapter, v.verse)
                          }
                          className="text-xs font-mono tabular-nums font-bold text-red-800 dark:text-amber-400 hover:underline text-left flex items-center gap-1.5"
                        >
                          <span className="px-2 py-0.5 rounded bg-red-800/10 dark:bg-amber-400/15">
                            {v.chapter}:{v.verse}
                          </span>
                          <span>
                            {v.bookNameNe} {toNepaliDigits(v.chapter)}:{toNepaliDigits(v.verse)} ·{' '}
                            {v.bookNameHi || v.bookNameNe} {v.chapter}:{v.verse} · {v.bookNameEn}{' '}
                            {v.chapter}:{v.verse}
                          </span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {(['amber', 'rose', 'sky', 'emerald'] as const).map((color) => (
                            <button
                              key={color}
                              onClick={() => handleHighlight(v.id, color)}
                              className={`w-4 h-4 rounded-full border ${
                                highlightColor === color
                                  ? 'ring-2 ring-slate-900 dark:ring-white scale-110'
                                  : 'opacity-65 hover:opacity-100'
                              } ${
                                color === 'amber'
                                  ? 'bg-amber-300 border-amber-500'
                                  : color === 'rose'
                                  ? 'bg-rose-300 border-rose-500'
                                  : color === 'sky'
                                  ? 'bg-sky-300 border-sky-500'
                                  : 'bg-emerald-300 border-emerald-500'
                              }`}
                              title={`Highlight ${color}`}
                            />
                          ))}
                          <button
                            onClick={() =>
                              handleSelectBookAndChapter(v.bookId, v.chapter, v.verse)
                            }
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                          >
                            <BookOpen className="w-3.5 h-3.5 inline mr-1" />
                            {lang === 'ne' ? 'अध्यायमा पढ्नुहोस्' : 'Open Chapter'}
                          </button>
                          <button
                            onClick={() => handleBookmarkWithObject(v)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isBookmarked
                                ? 'text-red-700 dark:text-amber-400 bg-red-50 dark:bg-slate-800'
                                : 'text-slate-400 hover:text-slate-700'
                            }`}
                          >
                            <Bookmark
                              className="w-4 h-4"
                              fill={isBookmarked ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            onClick={() => handleCopyVerse(v)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                          >
                            {copiedId === v.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleShareVerse(v)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShareImageVerse(v)}
                            className="ml-1 px-2 py-1 rounded-lg bg-red-800/10 dark:bg-amber-400/15 text-red-800 dark:text-amber-300 hover:bg-red-800 hover:text-white text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {lang === 'ne' ? 'तस्बिर' : 'Image'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {v.textNe && (
                          <p className={`${fontSizeClass} text-slate-900 dark:text-slate-100 font-medium`}>
                            {renderVerbatimNepaliVerse(v.rawTextNe || v.textNe, redLetterEnabled)}
                          </p>
                        )}
                        {v.textHi && (
                          <p className="text-base text-blue-950 dark:text-blue-200">{v.textHi}</p>
                        )}
                        {v.textEn && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">{v.textEn}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : readingMode === 'single' ? (
              /* =====================================================================
                 WHOLE-BOOK CONTINUOUS CHAPTER VIEW (Clean Book Page with Chapter:Verse)
                 ===================================================================== */
              <div className="space-y-2.5">
                {currentVerses.map((v) => {
                  const isSelected = selectedVerseNum === v.verse;
                  const isComparing = comparingVerseNum === v.verse;
                  const isBookmarked = bookmarks.includes(v.id);
                  const highlightColor = highlights[v.id];
                  const highlightClass = highlightColor ? highlightBgMap[highlightColor] : '';

                  const verseRefLabel =
                    singleLang === 'ne'
                      ? v.chapter > 0 && v.verse === 1
                        ? `${toNepaliDigits(v.chapter)}:${toNepaliDigits(v.verse)}`
                        : `${toNepaliDigits(v.verse)}`
                      : v.chapter > 0 && v.verse === 1
                      ? `${v.chapter}:${v.verse}`
                      : `${v.verse}`;

                  return (
                    <div key={v.id} id={`bible-verse-${v.verse}`} className="space-y-2">
                      <div
                        onClick={() =>
                          setSelectedVerseNum((prev) => (prev === v.verse ? null : v.verse))
                        }
                        className={`group cursor-pointer rounded-xl px-3 py-2 -mx-3 transition-all ${
                          isSelected
                            ? 'bg-amber-50/90 dark:bg-slate-800/90 ring-2 ring-red-800/60 dark:ring-amber-400/70 shadow-2xs'
                            : 'hover:bg-stone-100/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <p className={`${fontSizeClass} text-slate-900 dark:text-slate-100`}>
                          {/* Chapter:Verse on verse 1 (१:१), then २, ३, ४ on subsequent verses */}
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-xs sm:text-sm font-bold mr-2 select-none px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-red-800 text-white'
                                : 'text-red-800 dark:text-amber-400 bg-red-800/10 dark:bg-amber-400/10'
                            }`}
                          >
                            {verseRefLabel}
                            {isBookmarked && (
                              <Bookmark className="w-3 h-3 fill-current inline" />
                            )}
                          </span>

                          {/* Verse Text in Selected Language */}
                          <span
                            className={`${highlightClass} ${
                              isSelected ? 'underline decoration-red-800/40 dark:decoration-amber-400/50 underline-offset-4' : ''
                            }`}
                          >
                            {singleLang === 'ne'
                              ? renderVerbatimNepaliVerse(
                                  v.rawTextNe || v.textNe || null,
                                  redLetterEnabled
                                )
                              : singleLang === 'hi'
                              ? v.textHi || (
                                  <span className="italic text-xs text-amber-700 dark:text-amber-400">
                                    [इस अनुवाद में यह पद पिछले पद के साथ संयुक्त है]
                                  </span>
                                )
                              : v.textEn || (
                                  <span className="italic text-xs text-amber-700 dark:text-amber-400">
                                    [Verse combined in this translation]
                                  </span>
                                )}
                          </span>
                        </p>
                      </div>

                      {/* Inline 3-Language Comparison Card when user clicks "Compare" on a selected verse */}
                      {isComparing && (
                        <div className="ml-2 sm:ml-6 p-4 rounded-2xl bg-white dark:bg-slate-950 border-2 border-amber-400/70 shadow-md space-y-3">
                          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-2">
                            <span className="text-xs font-bold text-red-800 dark:text-amber-400">
                              पद तुलना (Verse Comparison) — {v.bookNameNe} {toNepaliDigits(v.chapter)}:
                              {toNepaliDigits(v.verse)} • {v.bookNameEn} {v.chapter}:{v.verse}
                            </span>
                            <button
                              onClick={() => setComparingVerseNum(null)}
                              className="text-xs font-bold text-slate-400 hover:text-slate-700"
                            >
                              ✕ बन्द गर्नुहोस्
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-1">
                              <div className="text-[11px] font-bold text-red-800 dark:text-amber-400">
                                नेपाली बाइबल (NNRV) — {v.bookNameNe} {toNepaliDigits(v.chapter)}:
                                {toNepaliDigits(v.verse)}
                              </div>
                              <p className="text-base text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                                {renderVerbatimNepaliVerse(
                                  v.rawTextNe || v.textNe,
                                  redLetterEnabled
                                )}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 space-y-1">
                              <div className="text-[11px] font-bold text-blue-800 dark:text-blue-300">
                                हिन्दी बाइबिल (IRV) — {v.bookNameHi || v.bookNameNe} {v.chapter}:
                                {v.verse}
                              </div>
                              <p className="text-base text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
                                {v.textHi || '—'}
                              </p>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1">
                              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                English Bible (KJV) — {v.bookNameEn} {v.chapter}:{v.verse}
                              </div>
                              <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed">
                                {v.textEn || '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* =====================================================================
                 PARALLEL 2-LANGUAGE OR 3-LANGUAGE SIDE-BY-SIDE BOOK VIEW
                 ===================================================================== */
              <div className="space-y-3">
                <div
                  className={`hidden md:grid gap-4 p-3 rounded-xl bg-slate-900 text-white text-xs font-bold ${
                    activeColumns.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
                  }`}
                >
                  {activeColumns.map((col) => (
                    <div key={col} className="flex items-center justify-between px-2">
                      <span>
                        {col === 'ne'
                          ? 'नेपाली बाइबल (NNRV)'
                          : col === 'hi'
                          ? 'हिन्दी बाइबिल (IRV)'
                          : 'English Bible (KJV)'}
                      </span>
                      <span className="text-[11px] font-normal text-amber-300">
                        {col === 'ne'
                          ? `${selectedBook.nameNe} ${toNepaliDigits(selectedChapter)}`
                          : col === 'hi'
                          ? `${selectedBook.nameHi || selectedBook.nameNe} ${selectedChapter}`
                          : `${selectedBook.nameEn} ${selectedChapter}`}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-stone-200/70 dark:divide-slate-800">
                  {currentVerses.map((v) => {
                    const isSelected = selectedVerseNum === v.verse;
                    const highlightColor = highlights[v.id];
                    const highlightClass = highlightColor ? highlightBgMap[highlightColor] : '';

                    return (
                      <div
                        key={v.id}
                        id={`bible-verse-${v.verse}`}
                        onClick={() =>
                          setSelectedVerseNum((prev) => (prev === v.verse ? null : v.verse))
                        }
                        className={`py-3 px-2 rounded-xl cursor-pointer transition ${
                          isSelected
                            ? 'bg-amber-50/90 dark:bg-slate-800/80 ring-2 ring-red-800/50'
                            : 'hover:bg-stone-100/60 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <div
                          className={`grid grid-cols-1 gap-4 ${
                            activeColumns.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'
                          }`}
                        >
                          {activeColumns.map((col) => {
                            if (col === 'ne') {
                              return (
                                <div key="ne" className={`${fontSizeClass} text-slate-900 dark:text-slate-100`}>
                                  <span className="font-mono text-xs font-bold text-red-800 dark:text-amber-400 mr-2">
                                    {v.chapter > 0 && v.verse === 1
                                      ? `${toNepaliDigits(v.chapter)}:${toNepaliDigits(v.verse)}`
                                      : toNepaliDigits(v.verse)}
                                  </span>
                                  <span className={highlightClass}>
                                    {renderVerbatimNepaliVerse(
                                      v.rawTextNe || v.textNe || null,
                                      redLetterEnabled
                                    )}
                                  </span>
                                </div>
                              );
                            }
                            if (col === 'hi') {
                              return (
                                <div key="hi" className={`${fontSizeClass} text-slate-900 dark:text-slate-100`}>
                                  <span className="font-mono text-xs font-bold text-blue-800 dark:text-blue-300 mr-2">
                                    {v.chapter > 0 && v.verse === 1
                                      ? `${v.chapter}:${v.verse}`
                                      : v.verse}
                                  </span>
                                  <span className={highlightClass}>{v.textHi || '—'}</span>
                                </div>
                              );
                            }
                            return (
                              <div key="en" className={`${fontSizeClass} text-slate-900 dark:text-slate-100`}>
                                <span className="font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300 mr-2">
                                  {v.chapter > 0 && v.verse === 1
                                    ? `${v.chapter}:${v.verse}`
                                    : v.verse}
                                </span>
                                <span className={highlightClass}>{v.textEn || '—'}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dynamic Language-Aware Copyright Footer */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 text-center space-y-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {copyrightNotices.map((notice, idx) => (
                <div key={idx}>{notice}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BIBLE STUDY */}
      {subTab === 'study' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-3">
            {BIBLE_STUDY_ARTICLES.map((art) => (
              <button
                key={art.id}
                onClick={() => setSelectedStudyArticle(art)}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedStudyArticle.id === art.id
                    ? 'bg-white dark:bg-slate-900 border-red-800 dark:border-amber-500 shadow-xs'
                    : 'bg-white/70 dark:bg-slate-900/60 border-stone-200 dark:border-slate-800 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center gap-2 text-xs text-red-800 dark:text-amber-400 font-medium">
                  <span>{art.category.toUpperCase()}</span>
                  <span>·</span>
                  <span>{lang === 'ne' ? art.scriptureRefNe : art.scriptureRefEn}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {lang === 'ne' ? art.titleNe : art.titleEn}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                  {lang === 'ne' ? art.summaryNe : art.summaryEn}
                </p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="text-xs text-red-800 dark:text-amber-400 font-semibold">
              {selectedStudyArticle.scriptureRefNe} · {selectedStudyArticle.scriptureRefEn}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {selectedStudyArticle.titleNe}
            </h2>
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">
              {selectedStudyArticle.titleEn}
            </p>
            <div className="space-y-4 pt-3 border-t border-stone-200 dark:border-slate-800 text-base leading-relaxed text-slate-800 dark:text-slate-200">
              <p>{selectedStudyArticle.contentNe}</p>
              <p className="text-slate-600 dark:text-slate-300">{selectedStudyArticle.contentEn}</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: DAILY READING PLAN */}
      {subTab === 'plan' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? '७ दिने बाइबल पठन योजना (7-Day Reading Plan)'
                  : '7-Day Scripture Reading Plan'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ne'
                  ? 'अध्याय पढ्न क्लिक गर्नुहोस्।'
                  : 'Click any day to open the passage in the Bible reader.'}
              </p>
            </div>
            <span className="text-sm font-mono font-bold text-red-800 dark:text-amber-400">
              {completedPlanDays.length} / {readingPlanList.length} Completed
            </span>
          </div>

          <div className="divide-y divide-stone-200/80 dark:divide-slate-800">
            {readingPlanList.map((item) => {
              const isDone = completedPlanDays.includes(item.day);
              return (
                <div
                  key={item.day}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() =>
                        setCompletedPlanDays((prev) =>
                          prev.includes(item.day)
                            ? prev.filter((d) => d !== item.day)
                            : [...prev, item.day]
                        )
                      }
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-stone-300 dark:border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <div>
                      <p className="text-xs font-mono text-slate-500">
                        Day {item.day} · {item.refNe} ({item.refEn})
                      </p>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {lang === 'ne' ? item.titleNe : item.titleEn}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBookId(item.bookId);
                      setSelectedChapter(item.chapter);
                      setSubTab('reader');
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-red-800 hover:text-white transition-colors"
                  >
                    {lang === 'ne' ? 'अध्याय खोल्नुहोस्' : 'Read Chapter'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 4: BOOKMARKS & READING HISTORY */}
      {subTab === 'bookmarks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-red-800 dark:text-amber-400" />
              <span>
                {lang === 'ne'
                  ? 'सुरक्षित गरिएका बाइबल पदहरू (Bookmarked Verses)'
                  : 'Saved Bible Verses'}
              </span>
            </h2>
            {bookmarkedVerses.length === 0 ? (
              <p className="text-sm text-slate-500 py-6">
                {lang === 'ne'
                  ? 'कुनै बाइबल पद बुकमार्क गरिएको छैन।'
                  : 'No verses bookmarked yet.'}
              </p>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-slate-800">
                {bookmarkedVerses.map((v) => (
                  <div key={v.id} className="py-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          setSelectedBookId(v.bookId);
                          setSelectedChapter(v.chapter);
                          setSelectedVerseNum(v.verse);
                          setSubTab('reader');
                        }}
                        className="text-xs font-mono font-bold text-red-800 dark:text-amber-400 hover:underline"
                      >
                        {v.bookNameNe} {toNepaliDigits(v.chapter)}:{toNepaliDigits(v.verse)} (
                        {v.bookNameEn} {v.chapter}:{v.verse})
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShareImageVerse(v)}
                          className="text-xs font-semibold text-red-800 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Share as Image</span>
                        </button>
                        <button
                          onClick={() => onToggleBookmark(v.id)}
                          className="text-xs text-slate-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{v.textNe}</p>
                    {v.textHi && (
                      <p className="text-sm text-blue-900 dark:text-blue-300">{v.textHi}</p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-400">{v.textEn}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-800 dark:text-amber-400" />
              <span>
                {lang === 'ne' ? 'भर्खरै पढिएका अध्यायहरू (Reading History)' : 'Recent Reading History'}
              </span>
            </h2>
            <div className="divide-y divide-stone-200 dark:divide-slate-800">
              {readingHistory.map((h, idx) => {
                const bk = booksList.find((b) => b.id === h.bookId) || booksList[0];
                return (
                  <div key={idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {bk.nameNe} • {bk.nameHi || bk.nameNe} • {bk.nameEn} — Ch {h.chapter}
                      </p>
                      <p className="text-xs font-mono text-slate-500">{h.timestamp}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedBookId(h.bookId);
                        setSelectedChapter(h.chapter);
                        setSubTab('reader');
                      }}
                      className="text-xs font-semibold text-red-800 dark:text-amber-400 hover:underline"
                    >
                      Open
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Share Verse as Image Modal */}
      <VerseImageShareModal
        verse={shareImageVerse}
        lang={lang}
        onClose={() => setShareImageVerse(null)}
        onNotify={onNotify}
      />
    </div>
  );
};
