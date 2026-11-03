import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Eye,
  Filter,
  Globe,
  HeartHandshake,
  Lock,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PrayerRequestItem } from '../data/susamacharDatabase';
import { toNepaliDigits } from '../utils/nepaliDateEngine';

interface PrayerWallViewProps {
  lang: 'ne' | 'en';
  prayers: PrayerRequestItem[];
  onSubmitPrayer: (data: {
    requesterName: string;
    location: string;
    category: PrayerRequestItem['category'];
    title: string;
    requestText: string;
    visibility: 'public' | 'private';
  }) => Promise<void>;
  onPrayForRequest: (id: number) => void;
  onNotify: (msg: string) => void;
}

export const PrayerWallView: React.FC<PrayerWallViewProps> = ({
  lang,
  prayers,
  onSubmitPrayer,
  onPrayForRequest,
  onNotify,
}) => {
  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [prayedIds, setPrayedIds] = useState<number[]>([]);
  const [reminderTime, setReminderTime] = useState<string>('06:30');
  const [reminderActive, setReminderActive] = useState<boolean>(true);

  // Form states
  const [requesterName, setRequesterName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<PrayerRequestItem['category']>('healing');
  const [title, setTitle] = useState('');
  const [requestText, setRequestText] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(
    () => [
      { key: 'all', ne: 'सबै विषय', en: 'All Categories' },
      { key: 'healing', ne: 'निको र स्वास्थ्य (Healing)', en: 'Healing & Health' },
      { key: 'family', ne: 'परिवार र शान्ति (Family)', en: 'Family & Marriage' },
      { key: 'guidance', ne: 'ईश्वरीय मार्गदर्शन (Guidance)', en: 'Guidance & Direction' },
      { key: 'church', ne: 'मण्डली र सेवा (Church)', en: 'Church & Ministry' },
      { key: 'youth', ne: 'युवा र शिक्षा (Youth)', en: 'Youth & Education' },
      { key: 'nation', ne: 'राष्ट्र र समाज (Nation)', en: 'Nation & Peace' },
      { key: 'thanksgiving', ne: 'धन्यवादको गवाही (Thanksgiving)', en: 'Thanksgiving & Answered' },
    ],
    []
  );

  const visibilityOptions: Array<{
    key: 'all' | 'public' | 'private';
    ne: string;
    en: string;
    icon: typeof Eye;
  }> = [
    { key: 'all', ne: 'सबै दृश्यता', en: 'All Visibility', icon: Eye },
    { key: 'public', ne: 'सार्वजनिक पर्खाल', en: 'Public Wall', icon: Globe },
    { key: 'private', ne: 'गोप्य / पास्टोरल', en: 'Private Pastoral', icon: Lock },
  ];

  // Dynamic counts for each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: prayers.filter((p) => p.moderationStatus === 'approved').length,
    };
    categories.forEach((c) => {
      if (c.key !== 'all') {
        counts[c.key] = prayers.filter(
          (p) => p.moderationStatus === 'approved' && p.category === c.key
        ).length;
      }
    });
    return counts;
  }, [prayers, categories]);

  // Dynamic counts for visibility
  const visibilityCounts = useMemo(() => {
    const approved = prayers.filter((p) => p.moderationStatus === 'approved');
    return {
      all: approved.length,
      public: approved.filter((p) => p.visibility === 'public').length,
      private: approved.filter((p) => p.visibility === 'private').length,
    };
  }, [prayers]);

  // Filtered prayers based on category, visibility status, and search query
  const filteredPrayers = useMemo(() => {
    return prayers.filter((p) => {
      // Must be approved by moderation
      if (p.moderationStatus !== 'approved') return false;

      // Filter by category
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // Filter by visibility status
      if (selectedVisibility !== 'all' && p.visibility !== selectedVisibility) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullContent = `${p.titleNe} ${p.titleEn} ${p.requestTextNe} ${p.requestTextEn} ${p.requesterName} ${p.location} ${p.category}`.toLowerCase();
        if (!fullContent.includes(q)) return false;
      }

      return true;
    });
  }, [prayers, selectedCategory, selectedVisibility, searchQuery]);

  const hasActiveFilters =
    selectedCategory !== 'all' || selectedVisibility !== 'all' || searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedVisibility('all');
    setSearchQuery('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !requestText.trim()) {
      onNotify(
        lang === 'ne'
          ? 'कृपया प्रार्थनाको शीर्षक र विवरण लेख्नुहोस्।'
          : 'Please enter prayer title and details.'
      );
      return;
    }
    setSubmitting(true);
    try {
      await onSubmitPrayer({
        requesterName: requesterName.trim() || (lang === 'ne' ? 'एक विश्वासी' : 'A Believer'),
        location: location.trim() || 'Nepal',
        category,
        title: title.trim(),
        requestText: requestText.trim(),
        visibility,
      });
      setTitle('');
      setRequestText('');
      onNotify(
        visibility === 'private'
          ? lang === 'ne'
            ? 'तपाईंको गोप्य प्रार्थना निवेदन पास्टर/प्रार्थना टोलीमा सुरक्षित पठाइयो।'
            : 'Your private prayer request has been securely sent to the pastoral prayer team.'
          : lang === 'ne'
          ? 'प्रार्थना निवेदन प्राप्त भयो! एडमिन स्वीकृतिपछि सार्वजनिक पर्खालमा प्रकाशित हुनेछ।'
          : 'Prayer request submitted! Public requests appear on the Prayer Wall after admin moderation.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#BC986A]/20 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold text-[#8D8741] dark:text-[#DAAD86] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {lang === 'ne'
                ? '"एउटाले अर्काको निम्ति प्रार्थना गर, र तिमीहरू निको हुनेछौ।" — याकूब ५:१६'
                : '"Pray one for another, that ye may be healed." — James 5:16'}
            </span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white mt-1">
            {lang === 'ne' ? 'प्रार्थना पर्खाल र मध्यस्थता (Prayer Wall)' : 'Community Prayer Wall & Intercession'}
          </h1>
        </div>

        {/* Daily Prayer Reminder Widget */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-[#BC986A]/30 dark:border-slate-800 shadow-2xs">
          <Bell className="w-4 h-4 text-[#8D8741] dark:text-[#DAAD86] shrink-0" />
          <div className="text-xs">
            <span className="font-semibold text-slate-900 dark:text-white block">
              {lang === 'ne' ? 'दैनिक प्रार्थना रिमाइन्डर' : 'Daily Prayer Reminder'}
            </span>
            <span className="text-slate-500">
              {reminderActive ? `${reminderTime} AM` : lang === 'ne' ? 'बन्द छ' : 'Paused'}
            </span>
          </div>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="h-8 px-2 rounded-lg bg-[#FAF6EC] dark:bg-slate-800 border border-[#BC986A]/30 text-xs font-mono tabular-nums"
          />
          <button
            onClick={() => {
              setReminderActive((v) => !v);
              onNotify(
                lang === 'ne'
                  ? 'प्रार्थना रिमाइन्डर समय अपडेट गरियो।'
                  : 'Prayer reminder schedule updated.'
              );
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              reminderActive
                ? 'bg-[#8D8741] text-white hover:bg-[#787334]'
                : 'bg-stone-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {reminderActive ? (lang === 'ne' ? 'सक्रिय' : 'Active') : lang === 'ne' ? 'खोल्नुहोस्' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submit Prayer Request Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#BC986A]/25 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-serif text-slate-900 dark:text-white">
              {lang === 'ne' ? 'प्रार्थना निवेदन पठाउनुहोस्' : 'Submit a Prayer Request'}
            </h2>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {lang === 'ne'
              ? 'गोपनीयताको पूर्ण सम्मान गरिन्छ। सार्वजनिक प्रार्थना निवेदनहरू स्वीकृतिपछि प्रकाशित हुन्छन्। व्यक्तिगत विषयका लागि "गोप्य (Private)" छान्नुहोस्।'
              : 'Your privacy is strictly respected. Public requests are moderated before publishing. Choose "Private" for confidential pastoral prayer.'}
          </p>

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ne' ? 'तपाईंको नाम (Name)' : 'Your Name (or Anonymous)'}
                </label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder={lang === 'ne' ? 'उदा: सन्तोष श्रेष्ठ' : 'e.g. Santosh Shrestha'}
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF6EC]/60 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-700 text-xs focus:outline-none focus:border-[#659DBD]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'ne' ? 'स्थान / जिल्ला (Location)' : 'City / District'}
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={lang === 'ne' ? 'उदा: पोखरा, कास्की' : 'e.g. Pokhara, Kaski'}
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF6EC]/60 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-700 text-xs focus:outline-none focus:border-[#659DBD]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? 'प्रार्थनाको विषय (Category)' : 'Prayer Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PrayerRequestItem['category'])}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF6EC]/60 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:border-[#659DBD]"
              >
                {categories.slice(1).map((c) => (
                  <option key={c.key} value={c.key}>
                    {lang === 'ne' ? c.ne : c.en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? 'प्रार्थनाको शीर्षक (Title)' : 'Prayer Title'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={lang === 'ne' ? 'उदा: आमाको शीघ्र स्वास्थ्य लाभको निम्ति' : 'e.g. Complete healing after surgery'}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF6EC]/60 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-700 text-xs focus:outline-none focus:border-[#659DBD]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'ne' ? 'प्रार्थना विवरण (Prayer Details)' : 'Prayer Request Description'}
              </label>
              <textarea
                rows={4}
                required
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder={lang === 'ne' ? 'तपाईंको प्रार्थनाको विषय यहाँ विस्तृतमा लेख्नुहोस्...' : 'Share your prayer burden or thanksgiving testimony...'}
                className="w-full p-3 rounded-xl bg-[#FAF6EC]/60 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-700 text-xs focus:outline-none focus:border-[#659DBD]"
              />
            </div>

            {/* Public vs Private Toggle */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  visibility === 'public'
                    ? 'border-[#659DBD] bg-[#659DBD]/15 text-[#457991] dark:text-[#FBEEC1] shadow-2xs font-bold'
                    : 'border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#659DBD]" />
                  <span>{lang === 'ne' ? 'सार्वजनिक (Public Wall)' : 'Public Prayer Wall'}</span>
                </div>
                <div className="text-[11px] font-normal opacity-80 mt-1">
                  {lang === 'ne' ? 'स्वीकृतिपछि पर्खालमा देखिने' : 'Published on Wall'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  visibility === 'private'
                    ? 'border-[#8D8741] bg-[#8D8741]/15 text-[#787334] dark:text-[#DAAD86] shadow-2xs font-bold'
                    : 'border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8D8741]" />
                  <span>{lang === 'ne' ? 'गोप्य (Private Only)' : 'Private Pastoral'}</span>
                </div>
                <div className="text-[11px] font-normal opacity-80 mt-1">
                  {lang === 'ne' ? 'प्रार्थना टोलीले मात्र हेर्ने' : 'Confidential intercession'}
                </div>
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#8D8741] hover:bg-[#787334] text-white text-xs font-bold transition-colors shadow-xs"
            >
              {submitting
                ? lang === 'ne' ? 'पठाउँदै...' : 'Submitting...'
                : lang === 'ne' ? 'प्रार्थना निवेदन दर्ता गर्नुहोस्' : 'Submit Prayer Request'}
            </button>
          </form>
        </div>

        {/* Right Column: Approved Prayer Wall with Filtering System */}
        <div className="lg:col-span-7 space-y-4">
          {/* =========================================================================
              COMPREHENSIVE FILTERING SYSTEM (Category, Visibility Status, Search)
             ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 border border-[#BC986A]/25 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#BC986A]/20 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#659DBD]/15 text-[#659DBD] flex items-center justify-center shrink-0">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {lang === 'ne' ? 'प्रार्थना निवेदन फिल्टर गर्नुहोस्' : 'Filter Prayer Requests'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === 'ne'
                      ? `जम्मा ${toNepaliDigits(filteredPrayers.length)} निवेदनहरू देखाइएको छ`
                      : `Showing ${filteredPrayers.length} prayer requests`}
                  </p>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF6EC] dark:bg-slate-800 hover:bg-[#BC986A]/20 text-[#8D8741] dark:text-[#DAAD86] text-xs font-semibold transition-colors self-start sm:self-auto border border-[#BC986A]/30"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ne' ? 'सबै फिल्टर हटाउनुहोस्' : 'Reset Filters'}</span>
                </button>
              )}
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8D8741] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'ne'
                    ? 'विषय, नाम, स्थान वा प्रार्थनाको शब्द खोजी गर्नुहोस्...'
                    : 'Search by keyword, name, location or prayer burden...'
                }
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#FAF6EC]/60 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#659DBD]"
              />
            </div>

            {/* Visibility Status Filter Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 block">
                {lang === 'ne' ? 'दृश्यता स्थिति (Visibility Status):' : 'Visibility Status:'}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {visibilityOptions.map((opt) => {
                  const Icon = opt.icon;
                  const count = visibilityCounts[opt.key];
                  const isSelected = selectedVisibility === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedVisibility(opt.key)}
                      className={`h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-[#659DBD] text-white shadow-xs'
                          : 'bg-[#FAF6EC] dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#BC986A]/20 border border-[#BC986A]/30 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{lang === 'ne' ? opt.ne : opt.en}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-[#BC986A]/20'
                        }`}
                      >
                        {lang === 'ne' ? toNepaliDigits(count) : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Horizontal Scrollable Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400 block">
                {lang === 'ne' ? 'प्रार्थना विषय (Category Filter):' : 'Prayer Category:'}
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map((cat) => {
                  const count = categoryCounts[cat.key] || 0;
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#8D8741] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border border-[#BC986A]/30 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#FAF6EC]'
                      }`}
                    >
                      <span>{lang === 'ne' ? cat.ne : cat.en}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-[#FAF6EC] dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {lang === 'ne' ? toNepaliDigits(count) : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Prayer Request Cards List */}
          <div className="space-y-4">
            {filteredPrayers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-[#BC986A]/25 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#659DBD]/15 text-[#659DBD] flex items-center justify-center mx-auto">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'ne'
                    ? 'कुनै पनि प्रार्थना निवेदन भेटिएन'
                    : 'No Prayer Requests Matched'}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {lang === 'ne'
                    ? 'तपाईंले छान्नुभएको विषय वा फिल्टर अनुसार कुनै प्रार्थना निवेदन फेला परेन। कृपया फिल्टर परिवर्तन गर्नुहोस् वा नयाँ प्रार्थना निवेदन पठाउनुहोस्।'
                    : 'No requests match your current filters. Try resetting the filters or submit a new prayer burden.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-[#8D8741] text-white text-xs font-bold hover:bg-[#787334] transition-colors"
                  >
                    {lang === 'ne' ? 'सबै फिल्टर हटाउनुहोस्' : 'Reset All Filters'}
                  </button>
                )}
              </div>
            ) : (
              filteredPrayers.map((p) => {
                const hasPrayed = prayedIds.includes(p.id);
                const isPrivate = p.visibility === 'private';
                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs transition-all ${
                      isPrivate
                        ? 'border-[#8D8741]/40 bg-[#FAF6EC]/30 dark:bg-slate-900'
                        : 'border-[#BC986A]/25 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Visibility Status Badge */}
                        {isPrivate ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8D8741]/15 text-[#8D8741] dark:text-[#DAAD86] text-[11px] font-bold border border-[#8D8741]/30">
                            <Lock className="w-3 h-3" />
                            <span>{lang === 'ne' ? 'गोप्य प्रार्थना' : 'Confidential'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#659DBD]/15 text-[#457991] dark:text-[#659DBD] text-[11px] font-bold border border-[#659DBD]/30">
                            <Globe className="w-3 h-3" />
                            <span>{lang === 'ne' ? 'सार्वजनिक' : 'Public'}</span>
                          </span>
                        )}

                        <span className="font-bold text-slate-900 dark:text-white">
                          {p.requesterName}
                        </span>
                        <span>· {p.location}</span>
                        <span>· {p.createdAtBs}</span>
                      </div>

                      <span className="font-semibold text-[#8D8741] dark:text-[#DAAD86]">
                        {p.prayerStatus === 'answered'
                          ? lang === 'ne'
                            ? '✓ उत्तर प्राप्त गवाही (Answered Prayer)'
                            : '✓ Answered Prayer Testimony'
                          : lang === 'ne'
                          ? 'निरन्तर प्रार्थनामा'
                          : 'Active Intercession'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold font-serif text-slate-900 dark:text-white">
                      {lang === 'ne' ? p.titleNe : p.titleEn}
                    </h3>

                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {lang === 'ne' ? p.requestTextNe : p.requestTextEn}
                    </p>

                    <div className="pt-3 border-t border-[#BC986A]/20 dark:border-slate-800 flex items-center justify-between gap-4">
                      <button
                        onClick={() => {
                          if (!hasPrayed) {
                            setPrayedIds((prev) => [...prev, p.id]);
                            onPrayForRequest(p.id);
                            onNotify(
                              lang === 'ne'
                                ? 'तपाईंको प्रार्थनाको निम्ति धन्यवाद!'
                                : 'Thank you for praying!'
                            );
                          }
                        }}
                        className={`h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                          hasPrayed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#659DBD] hover:bg-[#528cae] text-white shadow-xs'
                        }`}
                      >
                        {hasPrayed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <HeartHandshake className="w-4 h-4" />
                        )}
                        <span className="font-mono tabular-nums">
                          {lang === 'ne'
                            ? `मैले प्रार्थना गरें (${toNepaliDigits(p.prayedCount)})`
                            : `I Prayed (${p.prayedCount})`}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            `${p.titleNe}: ${p.requestTextNe} — Bible Sandesh Prayer Wall`
                          );
                          onNotify(
                            lang === 'ne'
                              ? 'प्रार्थना निवेदन सेयरका लागि कपी गरियो।'
                              : 'Prayer request copied to share.'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{lang === 'ne' ? 'सेयर' : 'Share'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
