import React, { useEffect, useState } from 'react';
import {
  Bell,
  Building2,
  Calendar,
  Coins,
  Download,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  MapPin,
  Pause,
  Phone,
  Play,
  Radio,
  Search,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  Volume2,
  Wifi,
  Youtube,
} from 'lucide-react';
import {
  ChristianEventItem,
  ChurchDirectoryItem,
  GalleryAlbum,
  GoldSilverRateData,
  RadioStation,
} from '../data/susamacharDatabase';
import { toNepaliDigits } from '../utils/nepaliDateEngine';
import { useOnlineStatus } from '../utils/usePWAInstall';

interface CommunityModulesViewProps {
  lang: 'ne' | 'en';
  initialSubTab?: 'radio' | 'rates' | 'gallery' | 'events' | 'churches';
  radioStations: RadioStation[];
  activeStationId: number | null;
  isPlayingRadio: boolean;
  radioVolume: number;
  favoriteStationIds: number[];
  onPlayStation: (station: RadioStation) => void;
  onChangeVolume: (vol: number) => void;
  onToggleFavoriteStation: (id: number) => void;
  rates: GoldSilverRateData;
  galleryAlbums: GalleryAlbum[];
  onAddGalleryPhoto?: (payload: {
    titleNe: string;
    titleEn: string;
    category: GalleryAlbum['category'];
    locationNe: string;
    locationEn: string;
    coverImage: string;
    descriptionNe: string;
    descriptionEn: string;
  }) => void;
  onMakeWallpaperWithPhoto?: (imageUrl?: string) => void;
  events: ChristianEventItem[];
  churches: ChurchDirectoryItem[];
  onNotify: (msg: string) => void;
}

export const CommunityModulesView: React.FC<CommunityModulesViewProps> = ({
  lang,
  initialSubTab = 'radio',
  radioStations,
  activeStationId,
  isPlayingRadio,
  radioVolume,
  favoriteStationIds,
  onPlayStation,
  onChangeVolume,
  onToggleFavoriteStation,
  rates,
  galleryAlbums,
  onAddGalleryPhoto,
  onMakeWallpaperWithPhoto,
  events,
  churches,
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<'radio' | 'rates' | 'gallery' | 'events' | 'churches'>(initialSubTab);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const [selectedGalleryCat, setSelectedGalleryCat] = useState<string>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadLocation, setUploadLocation] = useState<string>('काठमाडौँ, नेपाल');
  const [uploadCategory, setUploadCategory] = useState<GalleryAlbum['category']>('worship');
  const [uploadDescription, setUploadDescription] = useState<string>('');
  const [uploadPreviewDataUrl, setUploadPreviewDataUrl] = useState<string>('');

  const [rsvpEventIds, setRsvpEventIds] = useState<number[]>([]);
  const [churchSearch, setChurchSearch] = useState('');
  const [ytMusicInput, setYtMusicInput] = useState<string>('');
  const [activeYtMusicEmbed, setActiveYtMusicEmbed] = useState<string | null>(null);
  const [activeYtTitle, setActiveYtTitle] = useState<string>('नेपाली ख्रीष्टिय भजन र आराधना संगीत');
  const isOnline = useOnlineStatus();

  const extractYoutubeEmbed = (rawUrl: string): string | null => {
    const url = rawUrl.trim();
    if (!url) return null;
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1`;
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1`;
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1`;
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/);
    if (embedMatch) return `https://www.youtube.com/embed/${embedMatch[1]}?autoplay=1`;
    return null;
  };

  const handlePlayYoutubeMusicLink = (e: React.FormEvent) => {
    e.preventDefault();
    const embed = extractYoutubeEmbed(ytMusicInput);
    if (!embed) {
      onNotify(
        lang === 'ne'
          ? 'कृपया सही YouTube भिडियो वा भजनको लिङ्क राख्नुहोस्।'
          : 'Please enter a valid YouTube music or worship link.'
      );
      return;
    }
    setActiveYtMusicEmbed(embed);
    setActiveYtTitle('YouTube भजन तथा आराधना संगीत');
    onNotify(
      lang === 'ne'
        ? 'YouTube भजन तथा आराधना संगीत बज्न सुरु भयो!'
        : 'Playing YouTube worship music!'
    );
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadPreviewDataUrl(reader.result);
        if (!uploadTitle) {
          setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPreviewDataUrl) {
      onNotify(lang === 'ne' ? 'कृपया पहिले फोटो छान्नुहोस्।' : 'Please select a photo first.');
      return;
    }
    const finalTitle = uploadTitle.trim() || 'सुसमाचार ख्रीष्टिय तस्बिर';
    onAddGalleryPhoto?.({
      titleNe: finalTitle,
      titleEn: finalTitle,
      category: uploadCategory,
      locationNe: uploadLocation || 'नेपाल',
      locationEn: uploadLocation || 'Nepal',
      coverImage: uploadPreviewDataUrl,
      descriptionNe:
        uploadDescription.trim() ||
        'biblesandes.com मा अपलोड गरिएको ख्रीष्टिय तस्बिर तथा वालपेपर।',
      descriptionEn:
        uploadDescription.trim() ||
        'Christian photo and wallpaper uploaded on biblesandes.com.',
    });
    setUploadTitle('');
    setUploadDescription('');
    setUploadPreviewDataUrl('');
    setShowUploadForm(false);
  };

  const formatNPR = (num: number) => {
    const formatted = num.toLocaleString('en-IN');
    return lang === 'ne' ? `रू ${toNepaliDigits(formatted)}` : `NPR ${formatted}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-red-800 dark:text-amber-400">
            {lang === 'ne'
              ? 'सुसमाचार रेडियो, सुनचाँदी दर, फोटो ग्यालरी, कार्यक्रम र मण्डली निर्देशिका'
              : 'Christian FM Radio, Daily Gold/Silver Rates, Gallery, Events & Church Directory'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {lang === 'ne' ? 'सामुदायिक सेवा तथा स्रोत केन्द्र' : 'Community Resources & Media Hub'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-slate-900 rounded-xl">
          {[
            { id: 'radio', ne: 'एफ.एम. रेडियो (FM Radio)', en: 'FM Radio' },
            { id: 'rates', ne: 'सुनचाँदी दर (Gold/Silver)', en: 'Gold & Silver' },
            { id: 'gallery', ne: 'फोटो ग्यालरी (Gallery)', en: 'Photo Gallery' },
            { id: 'events', ne: 'इसाई कार्यक्रम (Events)', en: 'Events' },
            { id: 'churches', ne: 'मण्डली निर्देशिका (Churches)', en: 'Churches' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px] ${
                subTab === t.id
                  ? 'bg-red-800 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'ne' ? t.ne : t.en}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================================
          1. CHRISTIAN FM RADIO & YOUTUBE WORSHIP MUSIC PLAYER MODULE
         ===================================================================== */}
      {subTab === 'radio' && (
        <div className="space-y-6">
          {/* Active Player Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <Wifi className="w-4 h-4" />
                <span>
                  {isOnline
                    ? lang === 'ne'
                      ? 'प्रत्यक्ष अडियो प्रसारण तयार छ (Real Live FM Stream + YouTube Worship)'
                      : 'Real Live FM Audio Stream + YouTube Worship Player Ready'
                    : lang === 'ne'
                    ? 'अफलाइन मोड (Local Audio Synthesizer)'
                    : 'Offline Mode'}
                </span>
              </div>
              <h2 className="text-2xl font-bold">
                {activeStationId
                  ? lang === 'ne'
                    ? radioStations.find((s) => s.id === activeStationId)?.nameNe
                    : radioStations.find((s) => s.id === activeStationId)?.nameEn
                  : lang === 'ne'
                  ? 'सुसमाचार इसाई एफ.एम. रेडियो र YouTube'
                  : 'Susamachar Christian FM Radio & YouTube'}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl">
                {activeStationId
                  ? lang === 'ne'
                    ? radioStations.find((s) => s.id === activeStationId)?.currentProgramNe
                    : radioStations.find((s) => s.id === activeStationId)?.currentProgramEn
                  : lang === 'ne'
                  ? 'तलका कुनै पनि प्रत्यक्ष एफ.एम. रेडियो स्टेशन सुन्नुहोस् वा हाम्रो आधिकारिक YouTube च्यानल @susamacharnp मा भजन तथा बचन हेर्नुहोस्।'
                  : 'Listen to live Christian FM stations below or visit our official YouTube channel @susamacharnp.'}
              </p>
            </div>

            {/* Volume & Master Play Control */}
            <div className="flex flex-wrap items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 bg-slate-800 px-3.5 py-2 rounded-xl">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={radioVolume}
                  onChange={(e) => onChangeVolume(Number(e.target.value))}
                  className="w-24 accent-amber-400"
                  aria-label="Radio Volume"
                />
                <span className="text-xs font-mono tabular-nums text-slate-300">
                  {Math.round(radioVolume * 100)}%
                </span>
              </div>

              <button
                onClick={() => {
                  const target = radioStations.find((s) => s.id === activeStationId) || radioStations[0];
                  if (target) onPlayStation(target);
                }}
                className="h-12 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                {isPlayingRadio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>
                  {isPlayingRadio
                    ? lang === 'ne' ? 'रोक्नुहोस् (Pause)' : 'Pause Broadcast'
                    : lang === 'ne' ? 'प्रत्यक्ष एफ.एम. सुन्नुहोस् (Play FM)' : 'Play Live FM Stream'}
                </span>
              </button>
            </div>
          </div>

          {/* Official YouTube Channel Showcase */}
          <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 rounded-2xl p-6 text-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Youtube className="w-7 h-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider text-white">
                  YouTube Official Channel
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {lang === 'ne' ? 'सुसमाचार आधिकारिक YouTube च्यानल' : 'Susamachar Official YouTube Channel'}
                </h3>
                <p className="text-xs text-red-100 max-w-xl">
                  {lang === 'ne'
                    ? 'ख्रीष्टिय भजन, आराधना, बाइबल सन्देश र बचनका सम्पूर्ण नयाँ भिडियोहरू हेर्न @susamacharnp मा जानुहोस्।'
                    : 'Watch Christian hymns, worship music, sermons, and faith videos on @susamacharnp.'}
                </p>
              </div>
            </div>

            <a
              href="https://www.youtube.com/@susamacharnp"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-5 rounded-xl bg-white hover:bg-stone-100 text-red-700 font-bold text-xs flex items-center gap-2 transition-all shadow-xs whitespace-nowrap shrink-0 group"
            >
              <Youtube className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
              <span>{lang === 'ne' ? 'YouTube खोल्नुहोस् (@susamacharnp)' : 'Open YouTube (@susamacharnp)'}</span>
              <ExternalLink className="w-3.5 h-3.5 text-red-600" />
            </a>
          </div>

          {/* Radio Stations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {radioStations.map((st) => {
              const isCurrent = activeStationId === st.id && isPlayingRadio;
              const isFav = favoriteStationIds.includes(st.id);

              return (
                <div
                  key={st.id}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all ${
                    isCurrent
                      ? 'border-red-800 dark:border-amber-400 shadow-xs'
                      : 'border-stone-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-red-800/10 dark:bg-amber-400/10 text-red-800 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-mono tabular-nums font-bold text-red-800 dark:text-amber-400">
                            {st.frequency} · {lang === 'ne' ? st.locationNe : st.locationEn}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {lang === 'ne' ? st.nameNe : st.nameEn}
                          </h3>
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleFavoriteStation(st.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFav ? 'text-red-700 dark:text-amber-400' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title="Favorite Station"
                      >
                        <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {lang === 'ne' ? st.descriptionNe : st.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {lang === 'ne' ? 'अहिले: ' : 'Now: '}
                      </span>
                      {lang === 'ne' ? st.currentProgramNe : st.currentProgramEn}
                    </div>

                    <button
                      onClick={() => onPlayStation(st)}
                      className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        isCurrent
                          ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                          : 'bg-red-800 hover:bg-red-900 text-white'
                      }`}
                    >
                      {isCurrent ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isCurrent ? (lang === 'ne' ? 'बजिरहेको छ' : 'Playing') : lang === 'ne' ? 'बजाउनुहोस्' : 'Listen'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          2. GOLD AND SILVER PRICE MODULE (NPR - FENEGOSIDA)
         ===================================================================== */}
      {subTab === 'rates' && (
        <div className="space-y-6">
          {/* Attribution & Last Updated Banner */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-red-800 dark:text-amber-400">
                {lang === 'ne' ? rates.sourceNameNe : rates.sourceNameEn}
              </p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {lang === 'ne'
                  ? `नेपालको दैनिक सुन तथा चाँदीको आधिकारिक दर (${rates.rateDateBs})`
                  : `Official Nepal Gold & Silver Bullion Rates (${rates.rateDateAd})`}
              </h2>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 sm:text-right">
              <div>{lang === 'ne' ? 'अन्तिम अद्यावधिक मिति:' : 'Last Updated:'} {rates.rateDateBs} ({rates.rateDateAd})</div>
              <div>{rates.lastUpdatedTime} · Currency: {rates.currency}</div>
            </div>
          </div>

          {/* 3 Primary Rate Cards (Fine Gold, Tejabi Gold, Silver) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Fine Gold (छापावाल सुन) */}
            <div className="bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">24K FINE GOLD (99.9%)</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'ne' ? 'छापावाल सुन (Fine Gold)' : 'Hallmark Fine Gold'}
                  </h3>
                </div>
                <Coins className="w-6 h-6 text-amber-500" />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500">{lang === 'ne' ? 'प्रति तोला (Per 1 Tola / 11.66g)' : 'Price Per Tola (11.6638g)'}</span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatNPR(rates.fineGoldTola)}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-slate-600 dark:text-slate-400">
                  {lang === 'ne' ? 'प्रति ग्राम:' : 'Per 1 Gram:'} {formatNPR(rates.fineGoldGram)}
                </span>
                <span className={`inline-flex items-center gap-1 font-bold ${rates.changeGoldTola >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {rates.changeGoldTola >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {rates.changeGoldTola >= 0 ? `+${rates.changeGoldTola}` : rates.changeGoldTola} NPR
                </span>
              </div>
            </div>

            {/* Tejabi Gold (तेजाबी सुन) */}
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">22K WORKED GOLD (99.5%)</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'ne' ? 'तेजाबी सुन (Tejabi Gold)' : 'Tejabi Standard Gold'}
                  </h3>
                </div>
                <Coins className="w-6 h-6 text-amber-600" />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500">{lang === 'ne' ? 'प्रति तोला (Per 1 Tola / 11.66g)' : 'Price Per Tola (11.6638g)'}</span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatNPR(rates.tejabiGoldTola)}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-slate-600 dark:text-slate-400">
                  {lang === 'ne' ? 'प्रति ग्राम:' : 'Per 1 Gram:'} {formatNPR(rates.tejabiGoldGram)}
                </span>
                <span className={`inline-flex items-center gap-1 font-bold ${rates.changeGoldTola >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {rates.changeGoldTola >= 0 ? `+${rates.changeGoldTola}` : rates.changeGoldTola} NPR
                </span>
              </div>
            </div>

            {/* Silver (चाँदी) */}
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">999 PURE SILVER</p>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {lang === 'ne' ? 'असल चाँदी (Pure Silver)' : 'Pure Bullion Silver'}
                  </h3>
                </div>
                <Coins className="w-6 h-6 text-slate-400" />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-500">{lang === 'ne' ? 'प्रति तोला (Per 1 Tola / 11.66g)' : 'Price Per Tola (11.6638g)'}</span>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatNPR(rates.silverTola)}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
                <span className="text-slate-600 dark:text-slate-400">
                  {lang === 'ne' ? 'प्रति ग्राम:' : 'Per 1 Gram:'} {formatNPR(rates.silverGram)}
                </span>
                <span className={`inline-flex items-center gap-1 font-bold ${rates.changeSilverTola >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {rates.changeSilverTola >= 0 ? `+${rates.changeSilverTola}` : rates.changeSilverTola} NPR
                </span>
              </div>
            </div>
          </div>

          {/* Historical Price Comparison Table */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne' ? 'विगतका दिनहरूको सुनचाँदी मूल्य तुलना (Historical Rate Comparison)' : 'Historical Bullion Rate Records (NPR per Tola)'}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 text-slate-500">
                    <th className="py-3 px-4 font-semibold">{lang === 'ne' ? 'मिति (BS / AD)' : 'Date (BS / AD)'}</th>
                    <th className="py-3 px-4 font-semibold text-right">{lang === 'ne' ? 'छापावाल सुन (तोला)' : 'Fine Gold (Tola)'}</th>
                    <th className="py-3 px-4 font-semibold text-right">{lang === 'ne' ? 'तेजाबी सुन (तोला)' : 'Tejabi Gold (Tola)'}</th>
                    <th className="py-3 px-4 font-semibold text-right">{lang === 'ne' ? 'चाँदी (तोला)' : 'Silver (Tola)'}</th>
                    <th className="py-3 px-4 font-semibold text-right">{lang === 'ne' ? 'परिवर्तन (सुन)' : 'Daily Change'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800 font-mono tabular-nums">
                  {rates.history.map((row, idx) => (
                    <tr key={idx} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-sans font-medium text-slate-900 dark:text-white">
                        {row.dateBs} <span className="text-slate-400 font-mono">({row.dateAd})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatNPR(row.fineGoldTola)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                        {formatNPR(row.tejabiGoldTola)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatNPR(row.silverTola)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${row.changeGold >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {row.changeGold >= 0 ? `+${row.changeGold}` : row.changeGold} NPR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. PHOTO & WALLPAPER GALLERY MODULE (WITH PHOTO UPLOAD & WALLPAPER STUDIO)
         ===================================================================== */}
      {subTab === 'gallery' && (
        <div className="space-y-6">
          {/* Top Action Banner: Upload Photo to Website + Make Bible Wallpaper */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-red-800 dark:text-amber-400">
                biblesandes.com · फोटो ग्यालरी र बाइबल वालपेपर स्टुडियो
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'वेबसाइटमा फोटो अपलोड गर्नुहोस् वा बाइबल वचन वालपेपर बनाउनुहोस्'
                  : 'Upload Photos to Website or Create Bible Verse Wallpapers'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowUploadForm((prev) => !prev)}
                className="h-10 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {lang === 'ne'
                    ? '+ वेबसाइटमा फोटो थप्नुहोस् (Upload Photo)'
                    : '+ Upload Photo to Website'}
                </span>
              </button>

              {onMakeWallpaperWithPhoto && (
                <button
                  onClick={() => onMakeWallpaperWithPhoto()}
                  className="h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {lang === 'ne'
                      ? 'वालपेपर बनाउनुहोस् (Wallpaper Maker)'
                      : 'Create Bible Wallpaper'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Photo Upload Form */}
          {showUploadForm && (
            <form
              onSubmit={handleUploadSubmit}
              className="bg-white dark:bg-slate-900 border-2 border-red-800/30 dark:border-amber-400/30 rounded-2xl p-6 space-y-4 shadow-md"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-red-800 dark:text-amber-400" />
                  <span>
                    {lang === 'ne'
                      ? 'नयाँ तस्बिर वा वालपेपर वेबसाइटमा अपलोड गर्नुहोस् (biblesandes.com)'
                      : 'Upload New Photo or Wallpaper to Website (biblesandes.com)'}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  ✕ बन्द गर्नुहोस्
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-5 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ne' ? '१. फोटो छान्नुहोस् (Select Image File)' : '1. Choose Photo File'}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleGalleryFileSelect}
                    className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-800 file:text-white hover:file:bg-red-900 cursor-pointer"
                  />
                  {uploadPreviewDataUrl && (
                    <div className="rounded-xl overflow-hidden border border-stone-200 dark:border-slate-800 h-44 bg-slate-950">
                      <img
                        src={uploadPreviewDataUrl}
                        alt="Upload Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {lang === 'ne' ? 'तस्बिरको शीर्षक (Photo Title)' : 'Photo Title'}
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder={lang === 'ne' ? 'उदा: आराधना संगति / हिमाली चर्च...' : 'e.g. Sunday Worship / Himalayan Cross'}
                        className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        {lang === 'ne' ? 'विधा (Category)' : 'Category'}
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) =>
                          setUploadCategory(e.target.value as GalleryAlbum['category'])
                        }
                        className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-semibold"
                      >
                        <option value="worship">आराधना र वालपेपर (Worship & Wallpapers)</option>
                        <option value="christian_camps">युवा शिविर (Christian Camps)</option>
                        <option value="mission">मिसन र सेवा (Mission Activities)</option>
                        <option value="seminars">सेमिनार र सम्मेलन (Seminars)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ne' ? 'स्थान (Location)' : 'Location'}
                    </label>
                    <input
                      type="text"
                      value={uploadLocation}
                      onChange={(e) => setUploadLocation(e.target.value)}
                      placeholder="काठमाडौँ, नेपाल"
                      className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'ne' ? 'छोटो विवरण (Description)' : 'Description'}
                    </label>
                    <textarea
                      rows={2}
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder={lang === 'ne' ? 'तस्बिरको बारेमा छोटो विवरण लेख्नुहोस्...' : 'Short description of this photo...'}
                      className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                    />
                  </div>

                  <div className="pt-1 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="h-10 px-5 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {lang === 'ne'
                          ? 'वेबसाइटमा प्रकाशित गर्नुहोस् (Publish Photo)'
                          : 'Publish Photo to Website'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', ne: 'सबै तस्बिर र एल्बमहरू', en: 'All Photos & Albums' },
              { id: 'worship', ne: 'आराधना र वालपेपर (Worship & Wallpapers)', en: 'Worship & Wallpapers' },
              { id: 'christian_camps', ne: 'युवा शिविर (Camps)', en: 'Christian Camps' },
              { id: 'mission', ne: 'मिसन र सेवा (Mission)', en: 'Mission Activities' },
              { id: 'seminars', ne: 'सेमिनार (Seminars)', en: 'Seminars' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedGalleryCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  selectedGalleryCat === c.id
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                    : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {lang === 'ne' ? c.ne : c.en}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {galleryAlbums
              .filter((a) => selectedGalleryCat === 'all' || a.category === selectedGalleryCat)
              .map((album) => (
                <div
                  key={album.id}
                  className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div
                      onClick={() => setSelectedAlbum(album)}
                      className="h-56 bg-slate-900 relative overflow-hidden cursor-pointer"
                    >
                      <img
                        src={album.coverImage}
                        alt={album.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-red-800 dark:text-amber-400">
                          {lang === 'ne' ? album.locationNe : album.locationEn}
                        </span>
                        <span>·</span>
                        <span>{album.dateBs}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{album.photosCount} Photos</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {lang === 'ne' ? album.titleNe : album.titleEn}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {lang === 'ne' ? album.descriptionNe : album.descriptionEn}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3.5 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedAlbum(album)}
                        className="font-semibold text-red-800 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>{lang === 'ne' ? 'हेर्नुहोस्' : 'View'}</span>
                      </button>

                      {onMakeWallpaperWithPhoto && (
                        <button
                          onClick={() => onMakeWallpaperWithPhoto(album.coverImage)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-900 dark:text-amber-300 font-bold hover:bg-amber-500/25 inline-flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {lang === 'ne' ? 'यो फोटोमा वालपेपर बनाउनुहोस्' : 'Make Verse Wallpaper'}
                          </span>
                        </button>
                      )}
                    </div>

                    <a
                      href={album.coverImage}
                      download={`biblesandes-photo-${album.id}.png`}
                      onClick={() =>
                        onNotify(
                          lang === 'ne' ? 'तस्बिर डाउनलोड सुरु भयो।' : 'Downloading photo...'
                        )
                      }
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'ne' ? 'डाउनलोड' : 'Download'}</span>
                    </a>
                  </div>
                </div>
              ))}
          </div>

          {selectedAlbum && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden">
                <div className="h-72 bg-slate-950">
                  <img
                    src={selectedAlbum.coverImage}
                    alt={selectedAlbum.titleEn}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {lang === 'ne' ? selectedAlbum.titleNe : selectedAlbum.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {lang === 'ne' ? selectedAlbum.descriptionNe : selectedAlbum.descriptionEn}
                  </p>
                  <div className="pt-3 flex items-center justify-between gap-2">
                    {onMakeWallpaperWithPhoto && (
                      <button
                        onClick={() => {
                          const imgUrl = selectedAlbum.coverImage;
                          setSelectedAlbum(null);
                          onMakeWallpaperWithPhoto(imgUrl);
                        }}
                        className="px-4 py-2 rounded-xl bg-red-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>
                          {lang === 'ne'
                            ? 'यो फोटोमा बाइबल वालपेपर बनाउनुहोस्'
                            : 'Create Bible Wallpaper with this Photo'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedAlbum(null)}
                      className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold"
                    >
                      {lang === 'ne' ? 'बन्द गर्नुहोस् (Close)' : 'Close Viewer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          4. CHRISTIAN EVENTS MODULE
         ===================================================================== */}
      {subTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((ev) => {
            const isRegistered = rsvpEventIds.includes(ev.id);
            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-slate-900">
                    <img
                      src={ev.bannerImage}
                      alt={ev.titleEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="text-xs font-mono tabular-nums text-red-800 dark:text-amber-400 font-semibold">
                      {ev.dateBs} ({ev.dateAd}) · {ev.time}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {lang === 'ne' ? ev.titleNe : ev.titleEn}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'ne' ? ev.locationNe : ev.locationEn}</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {lang === 'ne' ? ev.descriptionNe : ev.descriptionEn}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {ev.registrationCount + (isRegistered ? 1 : 0)} {lang === 'ne' ? 'सहभागी' : 'Registered'}
                  </span>
                  <button
                    onClick={() => {
                      setRsvpEventIds((prev) =>
                        prev.includes(ev.id) ? prev.filter((i) => i !== ev.id) : [...prev, ev.id]
                      );
                      onNotify(
                        lang === 'ne'
                          ? 'कार्यक्रम दर्ता तथा रिमाइन्डर सुरक्षित गरियो!'
                          : 'Event registration & reminder saved!'
                      );
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      isRegistered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-800 hover:bg-red-900 text-white'
                    }`}
                  >
                    {isRegistered
                      ? lang === 'ne' ? '✓ दर्ता भयो' : '✓ Saved & Reminded'
                      : lang === 'ne' ? 'सहभागी दर्ता (RSVP)' : 'Save & Remind'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          5. NEPAL CHURCH DIRECTORY MODULE (KEPT EMPTY & ALL PHONE NUMBERS REMOVED)
         ===================================================================== */}
      {subTab === 'churches' && (
        <div className="space-y-5">
          {churches.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-red-800/10 dark:bg-amber-400/15 text-red-800 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'मण्डली निर्देशिका (Church Directory)'
                  : 'Nepal Church Directory'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {lang === 'ne'
                  ? 'यो पृष्ठ हाल खाली राखिएको छ। आधिकारिक मण्डली विवरणहरू पछि अद्यावधिक गरिनेछ।'
                  : 'This page is currently kept empty. Official church listings will be updated soon.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {churches
                .filter(
                  (c) =>
                    !churchSearch.trim() ||
                    c.nameEn.toLowerCase().includes(churchSearch.toLowerCase()) ||
                    c.nameNe.includes(churchSearch) ||
                    c.cityEn.toLowerCase().includes(churchSearch.toLowerCase()) ||
                    c.cityNe.includes(churchSearch)
                )
                .map((ch) => (
                  <div
                    key={ch.id}
                    className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-red-800 dark:text-amber-400">
                          {lang === 'ne' ? ch.cityNe : ch.cityEn} · {ch.province}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {lang === 'ne' ? ch.nameNe : ch.nameEn}
                        </h3>
                      </div>
                      <Building2 className="w-5 h-5 text-slate-400 shrink-0" />
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {lang === 'ne' ? 'आराधना समय:' : 'Worship Service:'}
                        </strong>{' '}
                        {lang === 'ne' ? ch.serviceTimeNe : ch.serviceTimeEn}
                      </p>
                      <p>
                        <strong className="text-slate-800 dark:text-slate-200">
                          {lang === 'ne' ? 'ठेगाना:' : 'Address:'}
                        </strong>{' '}
                        {lang === 'ne' ? ch.addressNe : ch.addressEn}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
