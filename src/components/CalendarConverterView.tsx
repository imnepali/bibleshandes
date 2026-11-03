import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Share2,
  Sparkles,
} from 'lucide-react';
import {
  buildBSMonthCalendar,
  convertADToBS,
  convertBSToAD,
  ENGLISH_MONTHS,
  getDaysInBSMonth,
  NEPALI_MONTHS,
  toNepaliDigits,
  WEEKDAYS,
} from '../utils/nepaliDateEngine';

interface CalendarConverterViewProps {
  lang: 'ne' | 'en';
  calendarEvents: Array<{
    id: number;
    bsYear: number;
    bsMonth: number;
    bsDay: number;
    titleEn: string;
    titleNe: string;
    eventType: 'christian_festival' | 'national_holiday' | 'church_event';
    isPublicHoliday: boolean;
  }>;
  initialSubTab?: 'calendar' | 'converter';
  onNotify: (msg: string) => void;
  onOpenDailyWord?: () => void;
  onOpenBible?: () => void;
}

export const CalendarConverterView: React.FC<CalendarConverterViewProps> = ({
  lang,
  calendarEvents,
  initialSubTab = 'calendar',
  onNotify,
  onOpenDailyWord,
  onOpenBible,
}) => {
  const todayBS = useMemo(() => convertADToBS(2026, 10, 31), []);
  const [subTab, setSubTab] = useState<'calendar' | 'converter'>(initialSubTab);
  const [bsYear, setBsYear] = useState<number>(todayBS.year); // 2083 BS
  const [bsMonth, setBsMonth] = useState<number>(todayBS.month); // 7 (Kartik)
  const [useNepaliNumerals, setUseNepaliNumerals] = useState<boolean>(true);
  const [searchEventQuery, setSearchEventQuery] = useState('');
  const [savedReminders, setSavedReminders] = useState<number[]>([6]);

  // Date Converter states
  const [convDirection, setConvDirection] = useState<'BS_TO_AD' | 'AD_TO_BS'>('BS_TO_AD');
  const [convBsYear, setConvBsYear] = useState<number>(2083);
  const [convBsMonth, setConvBsMonth] = useState<number>(7);
  const [convBsDay, setConvBsDay] = useState<number>(14);

  const [convAdYear, setConvAdYear] = useState<number>(2026);
  const [convAdMonth, setConvAdMonth] = useState<number>(10);
  const [convAdDay, setConvAdDay] = useState<number>(31);
  const [copiedConv, setCopiedConv] = useState(false);

  const monthData = useMemo(
    () => buildBSMonthCalendar(bsYear, bsMonth, calendarEvents, todayBS),
    [bsYear, bsMonth, calendarEvents, todayBS]
  );

  const conversionResult = useMemo(() => {
    if (convDirection === 'BS_TO_AD') {
      const ad = convertBSToAD(convBsYear, convBsMonth, convBsDay);
      const bs = convertADToBS(ad.year, ad.month, ad.day);
      return { bs, ad };
    } else {
      const bs = convertADToBS(convAdYear, convAdMonth, convAdDay);
      const ad = convertBSToAD(bs.year, bs.month, bs.day);
      return { bs, ad };
    }
  }, [convDirection, convBsYear, convBsMonth, convBsDay, convAdYear, convAdMonth, convAdDay]);

  const formatNum = (n: number | string) => (useNepaliNumerals ? toNepaliDigits(n) : String(n));

  const handlePrevMonth = () => {
    if (bsMonth === 1) {
      setBsYear((y) => Math.max(2000, y - 1));
      setBsMonth(12);
    } else {
      setBsMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (bsMonth === 12) {
      setBsYear((y) => Math.min(2090, y + 1));
      setBsMonth(1);
    } else {
      setBsMonth((m) => m + 1);
    }
  };

  const handleCopyConverted = () => {
    const text = `BS: ${conversionResult.bs.formattedNe} (${conversionResult.bs.formattedEn}) ↔ AD: ${conversionResult.ad.formattedEn}`;
    navigator.clipboard?.writeText(text);
    setCopiedConv(true);
    onNotify(lang === 'ne' ? 'परिवर्तित मिति कपी गरियो!' : 'Converted date copied to clipboard!');
    setTimeout(() => setCopiedConv(false), 2000);
  };

  const handleShareConverted = async () => {
    const text = `Susamachar Date Converter:\nBikram Sambat (BS): ${conversionResult.bs.formattedNe}\nGregorian (AD): ${conversionResult.ad.formattedEn}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Susamachar BS/AD Date Converter', text });
        return;
      } catch {
        // fallback
      }
    }
    handleCopyConverted();
  };

  const filteredEvents = useMemo(() => {
    if (!searchEventQuery.trim()) return calendarEvents;
    const q = searchEventQuery.toLowerCase();
    return calendarEvents.filter(
      (ev) => ev.titleEn.toLowerCase().includes(q) || ev.titleNe.includes(q)
    );
  }, [calendarEvents, searchEventQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-medium text-red-800 dark:text-amber-400">
            {lang === 'ne'
              ? `आजको मिति: ${todayBS.formattedNe} · Oct 31, 2026 AD`
              : `Today: ${todayBS.formattedEn} · Oct 31, 2026 AD`}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {lang === 'ne' ? 'नेपाली पात्रो र मिति परिवर्तन (BS ↔ AD)' : 'Nepali Calendar & BS/AD Date Converter'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-stone-200/80 dark:bg-slate-900 rounded-xl">
            <button
              onClick={() => setSubTab('calendar')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'calendar'
                  ? 'bg-red-800 text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'ne' ? 'नेपाली पात्रो (BS Calendar)' : 'Nepali Calendar'}
            </button>
            <button
              onClick={() => setSubTab('converter')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                subTab === 'converter'
                  ? 'bg-red-800 text-white'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'ne' ? 'मिति परिवर्तन (Date Converter)' : 'BS ↔ AD Converter'}
            </button>
            {onOpenDailyWord && (
              <button
                onClick={onOpenDailyWord}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 text-red-800 dark:text-amber-400 hover:bg-red-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ne' ? 'आजको बचन (Today’s Word)' : 'Today’s Word'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB 1: BIKRAM SAMBAT NEPALI CALENDAR */}
      {subTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Calendar Grid Card */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
            {/* Calendar Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="h-10 w-10 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <select
                  value={bsYear}
                  onChange={(e) => setBsYear(Number(e.target.value))}
                  className="h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                >
                  {Array.from({ length: 91 }, (_, i) => 2000 + i).map((yr) => (
                    <option key={yr} value={yr}>
                      {useNepaliNumerals ? `${toNepaliDigits(yr)} वि.सं.` : `${yr} BS`}
                    </option>
                  ))}
                </select>

                <select
                  value={bsMonth}
                  onChange={(e) => setBsMonth(Number(e.target.value))}
                  className="h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                >
                  {NEPALI_MONTHS.map((m) => (
                    <option key={m.number} value={m.number}>
                      {m.ne} ({m.en})
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextMonth}
                  className="h-10 w-10 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-slate-800"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {monthData.adSpanLabel} AD
                </span>
                <button
                  onClick={() => setUseNepaliNumerals((v) => !v)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                >
                  {useNepaliNumerals ? '१२३ → 123' : '123 → १२३'}
                </button>
              </div>
            </div>

            {/* Weekday Header Row */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {WEEKDAYS.map((w, idx) => (
                <div
                  key={w.en}
                  className={`py-2 text-xs font-bold ${
                    idx === 6 ? 'text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div>{w.neShort}</div>
                  <div className="text-[10px] font-normal opacity-75">{w.enShort}</div>
                </div>
              ))}
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: monthData.startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl bg-stone-50/50 dark:bg-slate-950/30" />
              ))}

              {monthData.cells.map((cell) => {
                const hasHoliday = cell.isSaturday || cell.events.some((e) => e.isPublicHoliday);
                const hasFestival = cell.events.length > 0;
                return (
                  <div
                    key={cell.bsDay}
                    onClick={() => {
                      setConvDirection('BS_TO_AD');
                      setConvBsYear(bsYear);
                      setConvBsMonth(bsMonth);
                      setConvBsDay(cell.bsDay);
                    }}
                    className={`h-20 sm:h-24 p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      cell.isToday
                        ? 'bg-red-800 text-white border-red-800 shadow-xs'
                        : hasHoliday
                        ? 'bg-red-50/55 dark:bg-red-950/20 border-stone-200 dark:border-slate-800 hover:border-red-400'
                        : 'bg-stone-50/60 dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-base sm:text-lg font-bold font-mono tabular-nums leading-none ${
                          cell.isToday
                            ? 'text-white'
                            : hasHoliday
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {formatNum(cell.bsDay)}
                      </span>
                      <span
                        className={`text-[11px] font-mono tabular-nums ${
                          cell.isToday ? 'text-amber-200' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {cell.adDate.day}
                      </span>
                    </div>

                    {hasFestival && (
                      <div
                        className={`text-[10px] leading-tight line-clamp-2 font-medium ${
                          cell.isToday ? 'text-amber-100' : 'text-red-800 dark:text-amber-400'
                        }`}
                      >
                        {lang === 'ne' ? cell.events[0].titleNe : cell.events[0].titleEn}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar: Christian Festivals, Holidays & Reminders */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ne' ? 'पर्व, बिदा र मण्डली कार्यक्रमहरू' : 'Christian Festivals & Public Holidays'}
            </h2>

            <input
              type="text"
              value={searchEventQuery}
              onChange={(e) => setSearchEventQuery(e.target.value)}
              placeholder={lang === 'ne' ? 'पर्व वा कार्यक्रम खोज्नुहोस्...' : 'Search festival or holiday...'}
              className="w-full h-10 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />

            <div className="divide-y divide-stone-200/80 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {filteredEvents.map((ev) => {
                const mMeta = NEPALI_MONTHS[ev.bsMonth - 1] || NEPALI_MONTHS[0];
                const isReminded = savedReminders.includes(ev.id);
                return (
                  <div key={ev.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono tabular-nums text-red-800 dark:text-amber-400 font-semibold">
                        {formatNum(ev.bsYear)} {mMeta.ne} {formatNum(ev.bsDay)} · {mMeta.en} {ev.bsDay}
                        {ev.isPublicHoliday ? (lang === 'ne' ? ' · सार्वजनिक बिदा' : ' · Public Holiday') : ''}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {lang === 'ne' ? ev.titleNe : ev.titleEn}
                      </h3>
                    </div>

                    <button
                      onClick={() => {
                        setSavedReminders((prev) =>
                          prev.includes(ev.id) ? prev.filter((i) => i !== ev.id) : [...prev, ev.id]
                        );
                        onNotify(
                          lang === 'ne'
                            ? 'कार्यक्रमको रिमाइन्डर अपडेट गरियो।'
                            : 'Event reminder updated.'
                        );
                      }}
                      className={`p-2 rounded-lg border transition-colors shrink-0 ${
                        isReminded
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300'
                          : 'border-stone-200 dark:border-slate-800 text-slate-400 hover:text-slate-700'
                      }`}
                      title="Toggle Reminder"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFIED BS <-> AD DATE CONVERTER */}
      {subTab === 'converter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {convDirection === 'BS_TO_AD'
                    ? lang === 'ne'
                      ? 'विक्रम संवत् (BS) बाट ईस्वी संवत् (AD) मा परिवर्तन'
                      : 'Convert Bikram Sambat (BS) to Gregorian (AD)'
                    : lang === 'ne'
                    ? 'ईस्वी संवत् (AD) बाट विक्रम संवत् (BS) मा परिवर्तन'
                    : 'Convert Gregorian (AD) to Bikram Sambat (BS)'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'ne'
                    ? 'प्रमाणित पञ्चाङ्ग तालिकामा आधारित यथार्थ मिति रूपान्तरण (१९४३–२०३४ AD / २०००–२०९० BS)'
                    : 'Verified lookup dataset conversion (2000–2090 BS / 1943–2034 AD)'}
                </p>
              </div>

              <button
                onClick={() => setConvDirection((d) => (d === 'BS_TO_AD' ? 'AD_TO_BS' : 'BS_TO_AD'))}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-red-800 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{convDirection === 'BS_TO_AD' ? 'Switch to AD → BS' : 'Switch to BS → AD'}</span>
              </button>
            </div>

            {convDirection === 'BS_TO_AD' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ne' ? 'वर्ष (BS Year)' : 'BS Year'}
                  </label>
                  <select
                    value={convBsYear}
                    onChange={(e) => setConvBsYear(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-sm font-mono tabular-nums font-semibold"
                  >
                    {Array.from({ length: 91 }, (_, i) => 2000 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} BS ({toNepaliDigits(yr)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ne' ? 'महिना (BS Month)' : 'BS Month'}
                  </label>
                  <select
                    value={convBsMonth}
                    onChange={(e) => setConvBsMonth(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-sm font-semibold"
                  >
                    {NEPALI_MONTHS.map((m) => (
                      <option key={m.number} value={m.number}>
                        {m.number}. {m.ne} ({m.en})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ne' ? 'गते (BS Day)' : 'BS Day'}
                  </label>
                  <select
                    value={convBsDay}
                    onChange={(e) => setConvBsDay(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-sm font-mono tabular-nums font-semibold"
                  >
                    {Array.from({ length: getDaysInBSMonth(convBsYear, convBsMonth) }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d} ({toNepaliDigits(d)} गते)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ne' ? 'सन् (AD Year)' : 'AD Year'}
                  </label>
                  <select
                    value={convAdYear}
                    onChange={(e) => setConvAdYear(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-sm font-mono tabular-nums font-semibold"
                  >
                    {Array.from({ length: 90 }, (_, i) => 1944 + i).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr} AD
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ne' ? 'महिना (AD Month)' : 'AD Month'}
                  </label>
                  <select
                    value={convAdMonth}
                    onChange={(e) => setConvAdMonth(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-sm font-semibold"
                  >
                    {ENGLISH_MONTHS.map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {idx + 1}. {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    {lang === 'ne' ? 'तारिख (AD Day)' : 'AD Day'}
                  </label>
                  <select
                    value={convAdDay}
                    onChange={(e) => setConvAdDay(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-300 dark:border-slate-700 text-sm font-mono tabular-nums font-semibold"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Conversion Result Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
            <p className="text-xs font-semibold text-red-800 dark:text-amber-400">
              {lang === 'ne' ? 'मिति रूपान्तरण परिणाम (Conversion Result)' : 'Exact Date Conversion Result'}
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500">विक्रम संवत् (Bikram Sambat - BS)</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {conversionResult.bs.formattedNe}
                </p>
                <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
                  {conversionResult.bs.formattedEn}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
                <span className="text-xs text-slate-500">ईस्वी संवत् (Gregorian - AD)</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {conversionResult.ad.formattedEn}
                </p>
                <p className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
                  ISO: {conversionResult.ad.isoDate} · {conversionResult.ad.dayNameNe}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleCopyConverted}
                className="flex-1 h-11 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {copiedConv ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{lang === 'ne' ? 'मिति कपी गर्नुहोस्' : 'Copy Result'}</span>
              </button>
              <button
                onClick={handleShareConverted}
                className="h-11 px-4 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <Share2 className="w-4 h-4" />
                <span>{lang === 'ne' ? 'सेयर' : 'Share'}</span>
              </button>
              <button
                onClick={() => {
                  setBsYear(conversionResult.bs.year);
                  setBsMonth(conversionResult.bs.month);
                  setSubTab('calendar');
                }}
                className="h-11 px-4 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-slate-800"
                title="View in Calendar"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          BOTTOM SECTION OF NEPALI PATRO: आजको बचन (TODAY'S WORD & DEVOTIONAL)
         =================================================================== */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-red-800/10 dark:bg-amber-400/15 text-red-800 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-amber-400">
                {lang === 'ne' ? 'नेपाली पात्रो · दैनिक आत्मिक खुराक' : 'Nepali Calendar · Daily Spiritual Manna'}
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'ne' ? `आजको बचन (${todayBS.formattedNe})` : `Today’s Word (${todayBS.formattedEn})`}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenDailyWord && (
              <button
                onClick={onOpenDailyWord}
                className="h-9 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'ne' ? 'आजको बचन पूरा पेज हेर्नुहोस् →' : 'Open Full Today’s Word Page →'}</span>
              </button>
            )}
            {onOpenBible && (
              <button
                onClick={onOpenBible}
                className="h-9 px-3.5 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 flex items-center gap-1.5 whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 text-red-800 dark:text-amber-400" />
                <span>{lang === 'ne' ? 'पवित्र बाइबल' : 'Holy Bible'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3 bg-stone-50/80 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800 rounded-2xl p-5">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-red-800/10 dark:bg-amber-400/15 text-red-800 dark:text-amber-300 text-[11px] font-bold">
              {lang === 'ne' ? 'आजको मुख्य बाइबल पद (Verse of the Day)' : 'Verse of the Day'}
            </span>
            <blockquote className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed font-editorial">
              “किनभने परमेश्वरले संसारलाई यस्तो प्रेम गर्नुभयो, कि उहाँले आफ्ना एकमात्र पुत्र दिनुभयो, ताकि उहाँमाथि विश्वास गर्ने कोही पनि नाश नहोस्, तर तिनीहरूले अनन्त जीवन पाऊन्।”
            </blockquote>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              “For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.”
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-red-800 dark:text-amber-400">
                — यूहन्ना ३:१६ (John 3:16)
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    '“किनभने परमेश्वरले संसारलाई यस्तो प्रेम गर्नुभयो, कि उहाँले आफ्ना एकमात्र पुत्र दिनुभयो, ताकि उहाँमाथि विश्वास गर्ने कोही पनि नाश नहोस्, तर तिनीहरूले अनन्त जीवन पाऊन्।” — यूहन्ना ३:१६'
                  );
                  onNotify(lang === 'ne' ? 'आजको बचन कपी गरियो!' : 'Today’s Word copied!');
                }}
                className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:border-red-800"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{lang === 'ne' ? 'वचन कपी गर्नुहोस्' : 'Copy Verse'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ne' ? 'आजको आत्मिक मनन (Daily Reflection)' : 'Daily Devotional Reflection'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'ne'
                ? 'परमेश्वरको प्रेम शर्तहीन र अनन्त छ। आजको दिन सुरु गर्दा उहाँको अनुग्रह र उपस्थितिलाई स्मरण गरौँ। जस्तोसुकै परिस्थितिमा पनि येशू ख्रीष्टमा हामीलाई अनन्त आशा, शान्ति र उद्धार प्राप्त छ।'
                : 'God’s love is unconditional and eternal. As we walk through today, let us remember His grace and presence. In every season, Jesus Christ gives us living hope, peace, and salvation.'}
            </p>
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 text-xs text-slate-700 dark:text-slate-300">
              <strong className="text-red-800 dark:text-amber-400 block mb-1">
                {lang === 'ne' ? 'आजको छोटो प्रार्थना:' : 'Today’s Short Prayer:'}
              </strong>
              {lang === 'ne'
                ? '“हे स्वर्गीय पिता, तपाईंको असीम प्रेम र आजको नयाँ दिनको निम्ति धन्यवाद। आज मेरो बोली, काम र विचारद्वारा तपाईंको महिमा भएको होस्। आमेन।”'
                : '“Heavenly Father, thank You for Your unfailing love and the gift of today. May my words, work, and thoughts glorify You. Amen.”'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
