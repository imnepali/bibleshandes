import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  Filter,
  Globe,
  Heart,
  Info,
  Music,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import { toNepaliDigits } from '../utils/nepaliDateEngine';

export interface HymnVerseBlock {
  name: string;
  text: string;
}

export interface HymnSongItem {
  id: number;
  filename?: string;
  sourceRepo: string;
  licenseInfo: string;
  status: 'approved' | 'pending' | 'rejected';
  primaryTitle: string;
  secondaryTitle: string;
  rawXmlTitles?: string[];
  hymnNumber: string | null;
  language: 'ne' | 'hi';
  songbook: string;
  category: string;
  author: string;
  verses: HymnVerseBlock[];
  lyricsText: string;
  audioUrl: string | null;
}

interface HymnLibraryMeta {
  totalSongs: number;
  nepaliCount: number;
  hindiCount: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  withAudioCount: number;
  categories: Record<string, number>;
}

interface BhajanModuleViewProps {
  lang: 'ne' | 'en';
  onNotify: (msg: string) => void;
  isAdminView?: boolean;
}

export const BhajanModuleView: React.FC<BhajanModuleViewProps> = ({
  lang,
  onNotify,
  isAdminView = false,
}) => {
  const [viewMode, setViewMode] = useState<'library' | 'admin' | 'inspection'>(
    isAdminView ? 'admin' : 'library'
  );
  const [languageTab, setLanguageTab] = useState<'all' | 'ne' | 'hi'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'approved' | 'pending' | 'rejected' | 'all'>('approved');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const [songs, setSongs] = useState<HymnSongItem[]>([]);
  const [meta, setMeta] = useState<HymnLibraryMeta>({
    totalSongs: 1268,
    nepaliCount: 1142,
    hindiCount: 126,
    approvedCount: 1268,
    pendingCount: 0,
    rejectedCount: 0,
    withAudioCount: 0,
    categories: {
      'Nepali Bhajan': 748,
      'Nepali Chorus': 324,
      'Nepali Bal Chorus': 70,
      'HOGC Hindi Song Book': 77,
      'Masihi Geet': 49,
    },
  });
  const [totalMatched, setTotalMatched] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSong, setSelectedSong] = useState<HymnSongItem | null>(null);
  const [isReadingFocused, setIsReadingFocused] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(19);
  const readerTopRef = useRef<HTMLDivElement | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('susamachar_fav_hymns');
      return saved ? JSON.parse(saved) : [1, 2, 3];
    } catch {
      return [1, 2, 3];
    }
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Authorized audio playback state (only plays when song.audioUrl is non-null)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Admin Create/Edit Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [editingSong, setEditingSong] = useState<HymnSongItem | null>(null);
  const [formLanguage, setFormLanguage] = useState<'ne' | 'hi'>('ne');
  const [formCategory, setFormCategory] = useState<string>('Nepali Bhajan');
  const [formSongbook, setFormSongbook] = useState<string>('Nepali Khristiya Bhajan (नेपाली ख्रीष्टिय भजन)');
  const [formHymnNumber, setFormHymnNumber] = useState<string>('');
  const [formPrimaryTitle, setFormPrimaryTitle] = useState<string>('');
  const [formSecondaryTitle, setFormSecondaryTitle] = useState<string>('');
  const [formAuthor, setFormAuthor] = useState<string>('Author Unknown');
  const [formAudioUrl, setFormAudioUrl] = useState<string>('');
  const [formLicenseInfo, setFormLicenseInfo] = useState<string>('Verified Church / Public Domain Permission');
  const [formStatus, setFormStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [formLyricsText, setFormLyricsText] = useState<string>('');
  const [savingAdmin, setSavingAdmin] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHymns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        language: languageTab,
        category: categoryFilter,
        status: viewMode === 'admin' ? statusFilter : 'approved',
        q: debouncedQuery,
        limit: '400',
      });
      const res = await fetch(`/api/hymns?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load hymns');
      const data = await res.json();
      if (data.meta) setMeta(data.meta);
      const list: HymnSongItem[] = data.songs || [];
      setSongs(list);
      setTotalMatched(data.totalMatched ?? list.length);
      if (list.length > 0 && (!selectedSong || !list.some((s) => s.id === selectedSong.id))) {
        setSelectedSong(list[0]);
      }
    } catch (err) {
      console.error('Error loading hymns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHymns();
  }, [languageTab, categoryFilter, statusFilter, debouncedQuery, viewMode]);

  useEffect(() => {
    // Stop audio if selected song changes
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }
  }, [selectedSong?.id]);

  const displayedSongs = useMemo(() => {
    if (!showFavoritesOnly) return songs;
    return songs.filter((s) => favoriteIds.includes(s.id));
  }, [songs, showFavoritesOnly, favoriteIds]);

  const handleLanguageChange = (newLang: 'all' | 'ne' | 'hi') => {
    setLanguageTab(newLang);
    setCategoryFilter('all');
    setIsReadingFocused(false);
  };

  const handleSelectSongToRead = (song: HymnSongItem) => {
    setSelectedSong(song);
    setSearchQuery('');
    setIsReadingFocused(true);
    setTimeout(() => {
      readerTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('susamachar_fav_hymns', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      onNotify(
        exists
          ? lang === 'ne'
            ? 'मनपर्ने सूचीबाट हटाइयो।'
            : 'Removed from saved hymns.'
          : lang === 'ne'
          ? 'मनपर्ने भजनमा सुरक्षित गरियो!'
          : 'Saved to favorite hymns!'
      );
      return next;
    });
  };

  const handleCopyHymn = (song: HymnSongItem) => {
    const numPrefix = song.hymnNumber ? `#${song.hymnNumber} ` : '';
    const text = `${numPrefix}${song.primaryTitle}\n${song.secondaryTitle ? `${song.secondaryTitle}\n` : ''}(${song.songbook} • ${
      song.language === 'ne' ? 'Nepali' : 'Hindi'
    })\n\n${song.lyricsText}\n\n— Susamachar Christian Hymn Library (सुसमाचार भजन पुस्तकालय)`;
    navigator.clipboard.writeText(text);
    onNotify(
      lang === 'ne'
        ? 'भजनका शब्दहरू हुबहु कपी गरियो!'
        : 'Verbatim hymn lyrics copied to clipboard!'
    );
  };

  const handleShareHymn = async (song: HymnSongItem) => {
    const numPrefix = song.hymnNumber ? `#${song.hymnNumber} ` : '';
    const shareText = `${numPrefix}${song.primaryTitle}\n${song.secondaryTitle || ''}\n\n${song.lyricsText}\n\n— Susamachar App`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.primaryTitle,
          text: shareText,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    handleCopyHymn(song);
  };

  const openCreateModal = () => {
    setEditingSong(null);
    setFormLanguage('ne');
    setFormCategory('Nepali Bhajan');
    setFormSongbook('Nepali Khristiya Bhajan (नेपाली ख्रीष्टिय भजन)');
    setFormHymnNumber('');
    setFormPrimaryTitle('');
    setFormSecondaryTitle('');
    setFormAuthor('Author Unknown');
    setFormAudioUrl('');
    setFormLicenseInfo('Admin Contributed • Verified Copyright Permission');
    setFormStatus('approved');
    setFormLyricsText('');
    setIsAdminModalOpen(true);
  };

  const openEditModal = (song: HymnSongItem) => {
    setEditingSong(song);
    setFormLanguage(song.language);
    setFormCategory(song.category);
    setFormSongbook(song.songbook);
    setFormHymnNumber(song.hymnNumber || '');
    setFormPrimaryTitle(song.primaryTitle);
    setFormSecondaryTitle(song.secondaryTitle || '');
    setFormAuthor(song.author || 'Author Unknown');
    setFormAudioUrl(song.audioUrl || '');
    setFormLicenseInfo(song.licenseInfo || '');
    setFormStatus(song.status);
    setFormLyricsText(song.lyricsText);
    setIsAdminModalOpen(true);
  };

  const handleSaveHymnAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrimaryTitle.trim() || !formLyricsText.trim()) {
      onNotify(
        lang === 'ne'
          ? 'कृपया भजनको शीर्षक र शब्दहरू भर्नुहोस्।'
          : 'Please provide both hymn title and verbatim lyrics.'
      );
      return;
    }
    setSavingAdmin(true);
    try {
      const payload = {
        language: formLanguage,
        category: formCategory,
        songbook: formSongbook,
        hymnNumber: formHymnNumber.trim() || null,
        primaryTitle: formPrimaryTitle.trim(),
        secondaryTitle: formSecondaryTitle.trim(),
        author: formAuthor.trim() || 'Author Unknown',
        audioUrl: formAudioUrl.trim() || null,
        licenseInfo: formLicenseInfo.trim(),
        status: formStatus,
        lyricsText: formLyricsText,
      };

      const url = editingSong ? `/api/admin/hymns/${editingSong.id}` : '/api/admin/hymns';
      const method = editingSong ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save hymn');
      const data = await res.json();
      setIsAdminModalOpen(false);
      if (data.song) {
        setSelectedSong(data.song);
      }
      await fetchHymns();
      onNotify(
        editingSong
          ? lang === 'ne'
            ? 'भजन सफलतापूर्वक अद्यावधिक गरियो!'
            : 'Hymn updated successfully!'
          : lang === 'ne'
          ? 'नयाँ भजन पुस्तकालयमा थपियो!'
          : 'New hymn added to the library!'
      );
    } catch (err) {
      console.error(err);
      onNotify(lang === 'ne' ? 'भजन सुरक्षित गर्न सकिएन।' : 'Could not save hymn.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleQuickStatusChange = async (
    song: HymnSongItem,
    newStatus: 'approved' | 'pending' | 'rejected'
  ) => {
    try {
      const res = await fetch(`/api/admin/hymns/${song.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      await fetchHymns();
      if (selectedSong?.id === song.id) {
        setSelectedSong({ ...song, status: newStatus });
      }
      onNotify(
        lang === 'ne'
          ? `भजन #${song.id} को स्थिति '${newStatus}' मा परिवर्तन गरियो।`
          : `Hymn #${song.id} status changed to '${newStatus}'.`
      );
    } catch {
      onNotify(lang === 'ne' ? 'स्थिति परिवर्तन गर्न समस्या भयो।' : 'Failed to update status.');
    }
  };

  const handleDeleteSong = async (song: HymnSongItem) => {
    try {
      const res = await fetch(`/api/admin/hymns/${song.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchHymns();
      onNotify(
        lang === 'ne'
          ? `भजन "${song.primaryTitle}" हटाइयो।`
          : `Deleted hymn "${song.primaryTitle}".`
      );
    } catch {
      onNotify(lang === 'ne' ? 'भजन हटाउन सकिएन।' : 'Could not delete hymn.');
    }
  };

  const formatVerseLabel = (rawName: string, language: 'ne' | 'hi') => {
    const lower = rawName.toLowerCase();
    if (lower.startsWith('c')) {
      const num = lower.replace('c', '');
      if (language === 'ne') {
        return lang === 'ne' ? `कोरस (स्थायी) ${num && num !== '1' ? num : ''}` : `Chorus ${num && num !== '1' ? num : ''}`;
      }
      return `कोरस / Chorus ${num && num !== '1' ? num : ''}`;
    }
    if (lower.startsWith('v')) {
      const num = lower.replace('v', '');
      if (language === 'ne') {
        return lang === 'ne' ? `पद ${toNepaliDigits(num)}` : `Verse ${num}`;
      }
      return `पद / Verse ${num}`;
    }
    return rawName.toUpperCase();
  };

  const categoryOptions = useMemo(() => {
    if (languageTab === 'ne') {
      return [
        { id: 'all', labelNe: 'सबै नेपाली (१,१४२)', labelEn: 'All Nepali (1,142)', count: meta.nepaliCount },
        {
          id: 'Nepali Bhajan',
          labelNe: 'नेपाली ख्रीष्टिय भजन',
          labelEn: 'Nepali Bhajan',
          count: meta.categories['Nepali Bhajan'] || 748,
        },
        {
          id: 'Nepali Chorus',
          labelNe: 'नेपाली ख्रीष्टिय कोरस',
          labelEn: 'Nepali Chorus',
          count: meta.categories['Nepali Chorus'] || 324,
        },
        {
          id: 'Nepali Bal Chorus',
          labelNe: 'बाल तथा युवा कोरस',
          labelEn: 'Nepali Bal Chorus',
          count: meta.categories['Nepali Bal Chorus'] || 70,
        },
      ];
    }
    if (languageTab === 'hi') {
      return [
        { id: 'all', labelNe: 'सबै हिन्दी (१२६)', labelEn: 'All Hindi (126)', count: meta.hindiCount },
        {
          id: 'HOGC Hindi Song Book',
          labelNe: 'HOGC हिन्दी सङ बुक',
          labelEn: 'HOGC Hindi Song Book',
          count: meta.categories['HOGC Hindi Song Book'] || 77,
        },
        {
          id: 'Masihi Geet',
          labelNe: 'मसीही गीत (Masihi Geet)',
          labelEn: 'Masihi Geet',
          count: meta.categories['Masihi Geet'] || 49,
        },
      ];
    }
    return [
      { id: 'all', labelNe: 'सबै श्रेणी (१,२६८)', labelEn: 'All Categories (1,268)', count: meta.totalSongs },
      {
        id: 'Nepali Bhajan',
        labelNe: 'नेपाली भजन (748)',
        labelEn: 'Nepali Bhajan (748)',
        count: meta.categories['Nepali Bhajan'] || 748,
      },
      {
        id: 'Nepali Chorus',
        labelNe: 'नेपाली कोरस (324)',
        labelEn: 'Nepali Chorus (324)',
        count: meta.categories['Nepali Chorus'] || 324,
      },
      {
        id: 'Nepali Bal Chorus',
        labelNe: 'बाल कोरस (70)',
        labelEn: 'Nepali Bal Chorus (70)',
        count: meta.categories['Nepali Bal Chorus'] || 70,
      },
      {
        id: 'HOGC Hindi Song Book',
        labelNe: 'HOGC हिन्दी (77)',
        labelEn: 'HOGC Hindi Song Book (77)',
        count: meta.categories['HOGC Hindi Song Book'] || 77,
      },
      {
        id: 'Masihi Geet',
        labelNe: 'मसीही गीत (49)',
        labelEn: 'Masihi Geet (49)',
        count: meta.categories['Masihi Geet'] || 49,
      },
    ];
  }, [languageTab, meta]);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner & Mode Switcher */}
      <div className="bg-gradient-to-r from-[#5B0E14] via-[#7F1D1D] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-xl border border-amber-400/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold mb-2">
              <Music className="w-3.5 h-3.5" />
              <span>
                {lang === 'ne'
                  ? 'ख्रीष्टिय भजन र मसीही गीत पुस्तकालय • १,२६८ प्रामाणिक गीतहरू'
                  : 'Christian Hymn Library • 1,268 Authentic Songs'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {lang === 'ne'
                ? 'सुसमाचार भजन संग्रह र हिन्दी मसीही गीत पुस्तकालय'
                : 'Susamachar Nepali Hymn & Hindi Song Book Library'}
            </h1>
            <p className="text-sm text-amber-100/90 mt-1 max-w-3xl">
              {lang === 'ne'
                ? 'नेपाली ख्रीष्टिय भजन (७४८), नेपाली कोरस (३२४), बाल कोरस (७०) तथा हिन्दी HOGC Song Book (७७) र मसीही गीत (४९)।'
                : 'Nepali Hymns (748 Bhajans, 324 Choruses, 70 Bal Choruses) and Hindi Songs (77 HOGC Hindi Song Book, 49 Masihi Geet).'}
            </p>
          </div>

          {/* Mode Switch Buttons (Only in Admin CMS) */}
          {isAdminView && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setViewMode('library')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  viewMode === 'library'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{lang === 'ne' ? 'भजन पुस्तकालय (Library)' : 'Hymn Reader'}</span>
              </button>

              <button
                onClick={() => setViewMode('admin')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  viewMode === 'admin'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'ne' ? 'भजन एडमिन (Hymn Admin)' : 'Hymn Admin CMS'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Separation Bar (Nepali vs Hindi) */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLanguageChange('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                languageTab === 'all'
                  ? 'bg-white text-[#7F1D1D] shadow'
                  : 'bg-black/25 text-white hover:bg-black/40 border border-white/15'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>
                {lang === 'ne'
                  ? `सबै गीतहरू (${toNepaliDigits(meta.totalSongs)})`
                  : `All Songs (${meta.totalSongs})`}
              </span>
            </button>

            <button
              onClick={() => handleLanguageChange('ne')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                languageTab === 'ne'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-black/25 text-white hover:bg-black/40 border border-white/15'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-red-800 text-white text-[10px]">NE</span>
              <span>
                {lang === 'ne'
                  ? `नेपाली भजन र कोरस (${toNepaliDigits(meta.nepaliCount)})`
                  : `Nepali Hymns & Chorus (${meta.nepaliCount})`}
              </span>
            </button>

            <button
              onClick={() => handleLanguageChange('hi')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                languageTab === 'hi'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-black/25 text-white hover:bg-black/40 border border-white/15'
              }`}
            >
              <span className="px-1.5 py-0.5 rounded bg-blue-800 text-white text-[10px]">HI</span>
              <span>
                {lang === 'ne'
                  ? `हिन्दी मसीही गीत / Hindi Songs (${toNepaliDigits(meta.hindiCount)})`
                  : `Hindi Song Book — HOGC & Masihi Geet (${meta.hindiCount})`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-200/90">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'ne'
                ? 'हिन्दी गीतहरू नेपालीमा अनुवाद नगरी मूल हिन्दीमै सुरक्षित राखिएको छ।'
                : 'Hindi lyrics are preserved verbatim in original Hindi without translation.'}
            </span>
          </div>
        </div>
      </div>

      {/* MODE 1: REPOSITORY & LICENSE INSPECTION REPORT */}
      {viewMode === 'inspection' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'गिटहब रिपोजिटरी परीक्षण र प्रतिलिपि अधिकार प्रतिवेदन'
                  : 'GitHub Repository Inspection & License Verification Report'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'ne'
                  ? 'दुवै रिपोजिटरीको फाइल संरचना, गीत संख्या, भाषा, अडियो र लाइसेन्सको पूर्ण विवरण'
                  : 'Verified technical audit of files, songbooks, languages, audio availability, and redistribution terms'}
              </p>
            </div>
            <button
              onClick={() => setViewMode('library')}
              className="px-4 py-2 rounded-xl bg-red-800 text-white text-xs font-bold hover:bg-red-700"
            >
              {lang === 'ne' ? 'भजन पुस्तकालयमा फर्कनुहोस्' : 'Back to Hymn Library'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Repo 1: Nepali Hymns & Chorus */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-bold">
                  Repository #2 • Nepali (ne)
                </span>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  GPL-3.0 License
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                himalayan-sumit/nepali-hymns-chorus
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <li>
                  <strong>File Format:</strong> OpenLyrics v0.8 XML (<code>openlp/*.xml</code> created with OpenLP 2.4.4).
                </li>
                <li>
                  <strong>Total Songs Verified:</strong> <strong>1,142 XML files</strong>:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    <li><strong>Nepali Bhajan (भजन):</strong> 748 hymns (numbered e.g. <code>Bhajan 1</code> to <code>Bhajan 748</code>)</li>
                    <li><strong>Nepali Chorus (कोरस):</strong> 324 choruses (numbered e.g. <code>Chorus 1</code> to <code>Chorus 324</code>)</li>
                    <li><strong>Nepali Bal Chorus (बाल कोरस):</strong> 70 children/youth choruses (e.g. <code>Bal Chorus 1</code> to <code>Bal Chorus 70</code>)</li>
                  </ul>
                </li>
                <li>
                  <strong>Language & Script:</strong> Titles contain category + number + Romanized Nepali transliteration in <code>&lt;title&gt;</code>, and <code>&lt;verse&gt;&lt;lines&gt;</code> contain authentic <strong>Nepali Devanagari Unicode</strong> stanzas.
                </li>
                <li>
                  <strong>Audio Files in Repo:</strong> <strong>0 audio files</strong> (lyrics-only XML repository + 4 OpenLP tutorial screenshots). No fake audio URLs have been generated.
                </li>
                <li>
                  <strong>License & Redistribution:</strong> Root <code>LICENSE</code> file is <strong>GNU General Public License v3.0 (GPL-3.0)</strong>. Individual XML files list <code>&lt;author&gt;Author Unknown&lt;/author&gt;</code>.
                </li>
              </ul>
            </div>

            {/* Repo 2: Hindi Song Book */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold">
                  Repository #1 • Hindi (hi)
                </span>
                <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                  No LICENSE File • Fair Use Notice
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                DigitalChristianLibrary/Hindi-Song-Book
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <li>
                  <strong>File Format:</strong> OpenLyrics v0.8 XML (created with OpenLP 2.4.6).
                </li>
                <li>
                  <strong>Available Songbooks & Counts:</strong> <strong>126 XML files</strong> across 2 songbook directories:
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    <li>
                      <strong>HOGC Hindi Song Book (77 songs):</strong> <code>&lt;songbook name="HOGC Hindi Song"/&gt;</code>. Contains Romanized Hindi titles and dual-script stanzas (both <strong>Hindi Devanagari</strong> and <strong>Romanized Hindi</strong> transliteration).
                    </li>
                    <li>
                      <strong>Masihi Geet (49 songs):</strong> <code>&lt;songbook name="Hindi Song Book"/&gt;</code>. Contains dual <code>&lt;title&gt;</code> elements (Hindi Devanagari title + Romanized Hindi title) and Hindi Devanagari stanzas.
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>Audio Files in Repo:</strong> <strong>0 audio files</strong> (lyrics-only XML files).
                </li>
                <li>
                  <strong>Copyright & Redistribution Caution:</strong> Contains <strong>no open-source LICENSE file</strong>. The README states: <em>&quot;Add songs only if you have permission to do so or the usage is within the boundaries of the fair usage policies.&quot;</em> Therefore, public/commercial redistribution is not automatically granted for all songs; each song carries a moderation status (<code>approved</code> / <code>pending</code> / <code>rejected</code>) controllable in the Hymn Admin Dashboard.
                </li>
              </ul>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 text-slate-100 p-4 text-xs font-mono space-y-1.5">
            <div className="text-amber-400 font-bold">MySQL Data Import Command (cPanel / Node.js Backend):</div>
            <div>$ node scripts/import-hymns-mysql.js</div>
            <div>$ node scripts/import-hymns-mysql.js --emit-sql &gt; database/hymn_library_seed.sql</div>
            <div>$ mysql -u cpanel_user -p susamachar_db &lt; database/schema.sql</div>
            <div>$ mysql -u cpanel_user -p susamachar_db &lt; database/hymn_library_seed.sql</div>
          </div>
        </div>
      )}

      {/* MODE 2: HYMN ADMIN DASHBOARD */}
      {viewMode === 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-700 dark:text-amber-400" />
                <span>
                  {lang === 'ne'
                    ? 'भजन पुस्तकालय एडमिन ड्यासबोर्ड (Hymn Admin Dashboard)'
                    : 'Hymn Library Admin Dashboard — Add, Edit, Approve & Manage Songs'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'ne'
                  ? 'नेपाली र हिन्दी भजनहरू थप्नुहोस्, सम्पादन गर्नुहोस्, प्रतिलिपि अधिकार स्वीकृत (Approve/Reject) गर्नुहोस् र आधिकारिक अडियो लिङ्क जोड्नुहोस्।'
                  : 'Add new Nepali or Hindi songs, edit verbatim stanzas, attach authorized audio URLs, and control copyright approval status.'}
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ne' ? '+ नयाँ भजन / गीत थप्नुहोस्' : '+ Add New Hymn / Song'}</span>
            </button>
          </div>

          {/* Admin Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Total Library</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{meta.totalSongs}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50">
              <div className="text-[11px] text-red-700 dark:text-red-300">Nepali (ne)</div>
              <div className="text-xl font-bold text-red-900 dark:text-red-200 mt-0.5">{meta.nepaliCount}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50">
              <div className="text-[11px] text-blue-700 dark:text-blue-300">Hindi (hi)</div>
              <div className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-0.5">{meta.hindiCount}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300">Approved</div>
              <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">{meta.approvedCount}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
              <div className="text-[11px] text-amber-700 dark:text-amber-300">Pending / Restricted</div>
              <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                {meta.pendingCount + meta.rejectedCount}
              </div>
            </div>
          </div>

          {/* Admin Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'ne'
                    ? 'भजन नम्बर, शीर्षक वा शब्दले खोज्नुहोस्...'
                    : 'Search by hymn number, title, or lyrics...'
                }
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'approved', 'pending', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                    statusFilter === st
                      ? 'bg-red-800 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Status: {st}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3 font-bold"># / No.</th>
                  <th className="py-3 px-3 font-bold">Title (Primary & Secondary)</th>
                  <th className="py-3 px-3 font-bold">Lang</th>
                  <th className="py-3 px-3 font-bold">Category / Songbook</th>
                  <th className="py-3 px-3 font-bold">Audio</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {songs.slice(0, 100).map((song) => (
                  <tr
                    key={song.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {song.hymnNumber ? `#${song.hymnNumber}` : `ID:${song.id}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {song.primaryTitle}
                      </div>
                      {song.secondaryTitle && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {song.secondaryTitle}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          song.language === 'ne'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}
                      >
                        {song.language === 'ne' ? 'Nepali' : 'Hindi'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{song.category}</div>
                      <div className="text-[10px] text-slate-500">{song.songbook}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      {song.audioUrl ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Authorized Audio</span>
                      ) : (
                        <span className="text-slate-400">Lyrics Only</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          song.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : song.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {song.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                        {song.status === 'pending' && <Clock className="w-3 h-3" />}
                        {song.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {song.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {song.status !== 'approved' && (
                          <button
                            onClick={() => handleQuickStatusChange(song, 'approved')}
                            title="Approve Song"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {song.status !== 'pending' && (
                          <button
                            onClick={() => handleQuickStatusChange(song, 'pending')}
                            title="Mark Pending Review"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {song.status !== 'rejected' && (
                          <button
                            onClick={() => handleQuickStatusChange(song, 'rejected')}
                            title="Restrict / Reject Song"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(song)}
                          title="Edit Hymn"
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSong(song)}
                          title="Delete Hymn"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 3: MAIN HYMN LIBRARY READER (NEPALI & HINDI) */}
      {viewMode === 'library' && (
        <div ref={readerTopRef} className="space-y-4">
          {/* Category Pills & Search Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setIsReadingFocused(false);
                    }
                  }}
                  placeholder={
                    languageTab === 'hi'
                      ? 'हिन्दी गीत शीर्षक, Roman Hindi या शब्दों से खोजें (e.g., Aaj ka din, यहोवा, स्तुति)...'
                      : lang === 'ne'
                      ? 'भजन नम्बर (जस्तै: 1, 24, 93), नेपाली वा रोमन शीर्षक र शब्दहरू खोज्नुहोस्...'
                      : 'Search by hymn number (e.g. 1, 93), Devanagari/Roman title, or lyrics...'
                  }
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-700"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Hymn Dropdown to jump directly to any hymn */}
                {displayedSongs.length > 0 && (
                  <select
                    value={selectedSong?.id || ''}
                    onChange={(e) => {
                      const found = displayedSongs.find((s) => s.id === Number(e.target.value));
                      if (found) handleSelectSongToRead(found);
                    }}
                    className="h-10 max-w-[230px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-700"
                  >
                    {displayedSongs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.hymnNumber ? `#${s.hymnNumber}` : `#${s.id}`} — {s.primaryTitle}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => {
                    setShowFavoritesOnly(!showFavoritesOnly);
                    setIsReadingFocused(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition ${
                    showFavoritesOnly
                      ? 'bg-red-800 text-white border-red-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                  <span>
                    {lang === 'ne'
                      ? `मनपर्ने (${toNepaliDigits(favoriteIds.length)})`
                      : `Saved (${favoriteIds.length})`}
                  </span>
                </button>

                {isAdminView && (
                  <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'गीत थप्नुहोस्' : 'Add Song'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5" />
                {lang === 'ne' ? 'पुस्तक / श्रेणी:' : 'Songbook:'}
              </span>
              {categoryOptions.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryFilter(cat.id);
                    setIsReadingFocused(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                    categoryFilter === cat.id
                      ? 'bg-[#7F1D1D] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {lang === 'ne' ? cat.labelNe : cat.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* FOCUSED SONGBOOK READER VIEW (When a hymn is selected to read and not searching) */}
          {isReadingFocused && selectedSong && !searchQuery.trim() ? (
            <div className="bg-[#FCFBF7] dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-sm overflow-hidden">
              {/* Top Reader Navigation Bar: Back to List + Prev/Next Hymn */}
              <div className="px-4 sm:px-6 py-3.5 bg-stone-100/80 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setIsReadingFocused(false)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-red-800 hover:text-red-800 transition shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>
                    {lang === 'ne' ? 'सबै भजन सूची (All Hymns List)' : 'Back to All Hymns List'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const idx = displayedSongs.findIndex((s) => s.id === selectedSong.id);
                      if (idx > 0) {
                        handleSelectSongToRead(displayedSongs[idx - 1]);
                      }
                    }}
                    disabled={
                      displayedSongs.findIndex((s) => s.id === selectedSong.id) <= 0
                    }
                    className="h-9 px-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 disabled:opacity-40 hover:bg-stone-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{lang === 'ne' ? 'अघिल्लो भजन' : 'Prev Hymn'}</span>
                  </button>
                  <button
                    onClick={() => {
                      const idx = displayedSongs.findIndex((s) => s.id === selectedSong.id);
                      if (idx >= 0 && idx < displayedSongs.length - 1) {
                        handleSelectSongToRead(displayedSongs[idx + 1]);
                      }
                    }}
                    disabled={
                      displayedSongs.findIndex((s) => s.id === selectedSong.id) >=
                      displayedSongs.length - 1
                    }
                    className="h-9 px-3 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1 disabled:opacity-40 hover:bg-stone-50"
                  >
                    <span>{lang === 'ne' ? 'अर्को भजन' : 'Next Hymn'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Songbook Page Header */}
              <div className="p-6 sm:p-8 border-b border-stone-200/80 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        selectedSong.language === 'ne'
                          ? 'bg-red-800 text-white'
                          : 'bg-blue-800 text-white'
                      }`}
                    >
                      {selectedSong.language === 'ne' ? 'नेपाली (Nepali)' : 'हिन्दी (Hindi)'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold">
                      {selectedSong.category}
                    </span>
                    {selectedSong.hymnNumber && (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold">
                        #{selectedSong.hymnNumber}
                      </span>
                    )}
                  </div>

                  {/* Reader Action Controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFontSize((f) => Math.max(14, f - 2))}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
                      title="Decrease Font Size"
                    >
                      A-
                    </button>
                    <button
                      onClick={() => setFontSize((f) => Math.min(28, f + 2))}
                      className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800"
                      title="Increase Font Size"
                    >
                      A+
                    </button>
                    <button
                      onClick={() => toggleFavorite(selectedSong.id)}
                      className={`p-2 rounded-lg border transition ${
                        favoriteIds.includes(selectedSong.id)
                          ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/50 dark:border-red-800'
                          : 'border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                      title="Bookmark Hymn"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favoriteIds.includes(selectedSong.id) ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleCopyHymn(selectedSong)}
                      className="p-2 rounded-lg border border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                      title="Copy Lyrics"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShareHymn(selectedSong)}
                      className="p-2 rounded-lg border border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                      title="Share Hymn"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {isAdminView && (
                      <button
                        onClick={() => openEditModal(selectedSong)}
                        className="p-2 rounded-lg border border-stone-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
                        title="Edit in Hymn Admin"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                  {selectedSong.primaryTitle}
                </h2>
                {selectedSong.secondaryTitle && (
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                    {selectedSong.secondaryTitle}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <strong>{lang === 'ne' ? 'गीतको पुस्तक:' : 'Songbook:'}</strong>{' '}
                    {selectedSong.songbook}
                  </span>
                  {selectedSong.author &&
                    !selectedSong.author.toLowerCase().includes('unknown') && (
                      <span>
                        <strong>{lang === 'ne' ? 'रचयिता:' : 'Author:'}</strong>{' '}
                        {selectedSong.author}
                      </span>
                    )}
                </div>

                {selectedSong.audioUrl && (
                  <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-slate-700/80">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            if (!audioRef.current) return;
                            if (isPlayingAudio) {
                              audioRef.current.pause();
                              setIsPlayingAudio(false);
                            } else {
                              audioRef.current.play();
                              setIsPlayingAudio(true);
                            }
                          }}
                          className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center hover:bg-emerald-600 transition shrink-0"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          {lang === 'ne' ? 'भजन अडियो (Audio)' : 'Hymn Audio Track'}
                        </div>
                      </div>
                      <audio
                        ref={audioRef}
                        src={selectedSong.audioUrl}
                        onPlay={() => setIsPlayingAudio(true)}
                        onPause={() => setIsPlayingAudio(false)}
                        onEnded={() => setIsPlayingAudio(false)}
                        controls
                        className="h-8 max-w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Whole-Book Style Hymn Stanzas Body */}
              <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
                {selectedSong.verses && selectedSong.verses.length > 0 ? (
                  selectedSong.verses.map((v, idx) => {
                    const isChorus = v.name.toLowerCase().startsWith('c');
                    return (
                      <div
                        key={`${v.name}-${idx}`}
                        className={`rounded-2xl p-5 border ${
                          isChorus
                            ? 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/90 dark:border-amber-800/50'
                            : 'bg-white dark:bg-slate-800/40 border-stone-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="mb-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                              isChorus
                                ? 'bg-amber-300/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200'
                                : 'bg-red-800/10 text-red-800 dark:bg-slate-700 dark:text-amber-300'
                            }`}
                          >
                            {formatVerseLabel(v.name, selectedSong.language)}
                          </span>
                        </div>
                        <div
                          style={{ fontSize: `${fontSize}px` }}
                          className="whitespace-pre-line leading-relaxed text-slate-900 dark:text-slate-100 font-medium"
                        >
                          {v.text}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{ fontSize: `${fontSize}px` }}
                    className="whitespace-pre-line leading-relaxed text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {selectedSong.lyricsText}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Master-Detail / Search & Browse List View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Song List */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {loading
                      ? lang === 'ne'
                        ? 'गीतहरू लोड हुँदैछ...'
                        : 'Loading songs...'
                      : lang === 'ne'
                      ? `जम्मा ${toNepaliDigits(totalMatched)} मध्ये ${toNepaliDigits(
                          displayedSongs.length
                        )} गीतहरू (पढ्न क्लिक गर्नुहोस्)`
                      : `Showing ${displayedSongs.length} of ${totalMatched} songs (Click to read)`}
                  </span>
                  <button
                    onClick={fetchHymns}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  {displayedSongs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {lang === 'ne'
                        ? 'तपाईंको खोजी अनुसार कुनै भजन वा गीत फेला परेन।'
                        : 'No hymns or songs matched your search criteria.'}
                    </div>
                  ) : (
                    displayedSongs.map((song) => {
                      const isSelected = selectedSong?.id === song.id;
                      const isFav = favoriteIds.includes(song.id);
                      return (
                        <button
                          key={song.id}
                          onClick={() => handleSelectSongToRead(song)}
                          className={`w-full text-left p-3.5 transition flex items-start gap-3 ${
                            isSelected
                              ? 'bg-red-50/90 dark:bg-red-950/40 border-l-4 border-l-red-800 dark:border-l-amber-400'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div
                            className={`min-w-[42px] h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold shrink-0 px-1.5 ${
                              song.language === 'ne'
                                ? isSelected
                                  ? 'bg-red-800 text-white'
                                  : 'bg-red-100/80 dark:bg-red-950/60 text-red-900 dark:text-red-200'
                                : isSelected
                                ? 'bg-blue-800 text-white'
                                : 'bg-blue-100/80 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200'
                            }`}
                          >
                            <span className="text-[9px] uppercase opacity-80">
                              {song.language === 'ne' ? 'NE' : 'HI'}
                            </span>
                            <span>{song.hymnNumber ? `#${song.hymnNumber}` : `#${song.id}`}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                {song.primaryTitle}
                              </h3>
                              {isFav && (
                                <Heart className="w-3.5 h-3.5 text-red-600 fill-current shrink-0" />
                              )}
                            </div>
                            {song.secondaryTitle && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {song.secondaryTitle}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                {song.category}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate">
                                {song.verses.length} {lang === 'ne' ? 'पद/स्थायी' : 'stanzas'}
                              </span>
                              {song.audioUrl && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                  <Volume2 className="w-3 h-3" /> Audio
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Verbatim Hymn Lyrics Reader Preview */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {selectedSong ? (
                  <div>
                    <div className="p-6 bg-gradient-to-br from-slate-50 to-amber-50/40 dark:from-slate-800/90 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                              selectedSong.language === 'ne'
                                ? 'bg-red-800 text-white'
                                : 'bg-blue-800 text-white'
                            }`}
                          >
                            {selectedSong.language === 'ne'
                              ? 'नेपाली (Nepali)'
                              : 'हिन्दी (Hindi)'}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold">
                            {selectedSong.category}
                          </span>
                          {selectedSong.hymnNumber && (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold">
                              #{selectedSong.hymnNumber}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setIsReadingFocused(true)}
                            className="px-3 py-1.5 rounded-lg bg-red-800 text-white text-xs font-bold hover:bg-red-700"
                          >
                            {lang === 'ne' ? 'पूर्ण पृष्ठमा पढ्नुहोस्' : 'Full Book View'}
                          </button>
                          <button
                            onClick={() => setFontSize((f) => Math.max(14, f - 2))}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            A-
                          </button>
                          <button
                            onClick={() => setFontSize((f) => Math.min(28, f + 2))}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            A+
                          </button>
                          <button
                            onClick={() => toggleFavorite(selectedSong.id)}
                            className={`p-2 rounded-lg border transition ${
                              favoriteIds.includes(selectedSong.id)
                                ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/50 dark:border-red-800'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favoriteIds.includes(selectedSong.id) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleCopyHymn(selectedSong)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleShareHymn(selectedSong)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                        {selectedSong.primaryTitle}
                      </h2>
                      {selectedSong.secondaryTitle && (
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
                          {selectedSong.secondaryTitle}
                        </p>
                      )}
                    </div>

                    <div className="p-6 space-y-5">
                      {selectedSong.verses && selectedSong.verses.length > 0 ? (
                        selectedSong.verses.map((v, idx) => {
                          const isChorus = v.name.toLowerCase().startsWith('c');
                          return (
                            <div
                              key={`${v.name}-${idx}`}
                              className={`rounded-xl p-4 border ${
                                isChorus
                                  ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/50'
                                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                    isChorus
                                      ? 'bg-amber-200/80 text-amber-950 dark:bg-amber-900/60 dark:text-amber-200'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {formatVerseLabel(v.name, selectedSong.language)}
                                </span>
                              </div>
                              <div
                                style={{ fontSize: `${fontSize}px` }}
                                className="whitespace-pre-line leading-relaxed text-slate-900 dark:text-slate-100 font-medium"
                              >
                                {v.text}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{ fontSize: `${fontSize}px` }}
                          className="whitespace-pre-line leading-relaxed text-slate-900 dark:text-slate-100 font-medium"
                        >
                          {selectedSong.lyricsText}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500">
                    {lang === 'ne'
                      ? 'पढ्नको लागि बायाँ सूचीबाट भजन वा गीत छान्नुहोस्।'
                      : 'Select a hymn or song from the list on the left to read its lyrics.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* HYMN ADMIN ADD / EDIT MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingSong
                  ? lang === 'ne'
                    ? `भजन सम्पादन गर्नुहोस् (#${editingSong.id})`
                    : `Edit Hymn / Song (#${editingSong.id})`
                  : lang === 'ne'
                  ? 'नयाँ भजन वा मसीही गीत थप्नुहोस्'
                  : 'Add New Hymn / Song to Library'}
              </h3>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHymnAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Language (भाषा) *
                  </label>
                  <select
                    value={formLanguage}
                    onChange={(e) => {
                      const newLang = e.target.value as 'ne' | 'hi';
                      setFormLanguage(newLang);
                      if (newLang === 'hi') {
                        setFormCategory('Masihi Geet');
                        setFormSongbook('Hindi Song Book (Masihi Geet)');
                      } else {
                        setFormCategory('Nepali Bhajan');
                        setFormSongbook('Nepali Khristiya Bhajan (नेपाली ख्रीष्टिय भजन)');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ne">Nepali (नेपाली)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category (श्रेणी) *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Nepali Bhajan">Nepali Bhajan (नेपाली भजन)</option>
                    <option value="Nepali Chorus">Nepali Chorus (नेपाली कोरस)</option>
                    <option value="Nepali Bal Chorus">Nepali Bal Chorus (बाल कोरस)</option>
                    <option value="HOGC Hindi Song Book">HOGC Hindi Song Book</option>
                    <option value="Masihi Geet">Masihi Geet (मसीही गीत)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hymn Number (गीत नम्बर)
                  </label>
                  <input
                    type="text"
                    value={formHymnNumber}
                    onChange={(e) => setFormHymnNumber(e.target.value)}
                    placeholder="e.g. 1, 93, 511"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Title (मुख्य शीर्षक) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formPrimaryTitle}
                    onChange={(e) => setFormPrimaryTitle(e.target.value)}
                    placeholder="Devanagari or Primary Title"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Secondary / Romanized Title
                  </label>
                  <input
                    type="text"
                    value={formSecondaryTitle}
                    onChange={(e) => setFormSecondaryTitle(e.target.value)}
                    placeholder="e.g. Bhajan 1 (Halleluyah Hosanna)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Songbook Name
                  </label>
                  <input
                    type="text"
                    value={formSongbook}
                    onChange={(e) => setFormSongbook(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Author / Lyricist
                  </label>
                  <input
                    type="text"
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Moderation Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) =>
                      setFormStatus(e.target.value as 'approved' | 'pending' | 'rejected')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="approved">Approved (Public)</option>
                    <option value="pending">Pending Copyright Review</option>
                    <option value="rejected">Rejected / Restricted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Authorized Audio URL (आधिकारिक अडियो लिङ्क मात्र)
                  </label>
                  <input
                    type="url"
                    value={formAudioUrl}
                    onChange={(e) => setFormAudioUrl(e.target.value)}
                    placeholder="Leave blank if no authorized audio file exists"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    License / Copyright Attribution
                  </label>
                  <input
                    type="text"
                    value={formLicenseInfo}
                    onChange={(e) => setFormLicenseInfo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Verbatim Song Lyrics (अलग-अलग पदको बीचमा खाली लाइन राख्नुहोस्) *
                </label>
                <textarea
                  rows={8}
                  required
                  value={formLyricsText}
                  onChange={(e) => setFormLyricsText(e.target.value)}
                  placeholder="Enter exact Nepali or Hindi lyrics without alteration..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdmin}
                  className="px-5 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold shadow-sm disabled:opacity-50"
                >
                  {savingAdmin
                    ? 'Saving...'
                    : editingSong
                    ? 'Update Hymn'
                    : 'Save Hymn to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
