import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Code2,
  Coins,
  Download,
  FileText,
  Lock,
  Newspaper,
  Plus,
  Radio,
  Shield,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import {
  ADMIN_USERS,
  AdminRoleKey,
  AdminUserRecord,
  AuditLogItem,
  GoldSilverRateData,
  NEWS_CATEGORIES,
  NewsArticle,
  PrayerRequestItem,
  RadioStation,
} from '../data/susamacharDatabase';
import { BhajanModuleView } from './BhajanModuleView';


interface AdminDashboardViewProps {
  lang: 'ne' | 'en';
  currentAdmin: AdminUserRecord;
  onSelectAdminRole: (admin: AdminUserRecord) => void;
  news: NewsArticle[];
  onCreateNews: (payload: Partial<NewsArticle>) => Promise<void>;
  onDeleteNews: (id: number) => Promise<void>;
  prayers: PrayerRequestItem[];
  onModeratePrayer: (id: number, moderationStatus: 'approved' | 'rejected', prayerStatus?: 'active' | 'answered') => Promise<void>;
  rates: GoldSilverRateData;
  onUpdateRates: (payload: { fineGoldTola: number; tejabiGoldTola: number; silverTola: number; rateDateBs: string }) => Promise<void>;
  radioStations: RadioStation[];
  onAddRadioStation: (payload: { nameEn: string; nameNe: string; frequency: string; locationEn: string; locationNe: string; streamUrl: string }) => Promise<void>;
  auditLogs: AuditLogItem[];
  onNotify: (msg: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  lang,
  currentAdmin,
  onSelectAdminRole,
  news,
  onCreateNews,
  onDeleteNews,
  prayers,
  onModeratePrayer,
  rates,
  onUpdateRates,
  radioStations,
  onAddRadioStation,
  auditLogs,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'news' | 'hymns' | 'prayer' | 'rates' | 'radio' | 'admins' | 'deliverables'
  >('overview');

  // News creation form states
  const [newsTitleNe, setNewsTitleNe] = useState('');
  const [newsTitleEn, setNewsTitleEn] = useState('');
  const [newsCategory, setNewsCategory] = useState('christian-news-nepal');
  const [newsSummaryNe, setNewsSummaryNe] = useState('');
  const [newsSummaryEn, setNewsSummaryEn] = useState('');
  const [newsStatus, setNewsStatus] = useState<'published' | 'draft'>('published');

  // Finance Gold/Silver update states
  const [goldInput, setGoldInput] = useState(String(rates.fineGoldTola));
  const [tejabiInput, setTejabiInput] = useState(String(rates.tejabiGoldTola));
  const [silverInput, setSilverInput] = useState(String(rates.silverTola));
  const [rateDateBsInput, setRateDateBsInput] = useState(rates.rateDateBs);

  // Radio station form states
  const [stationNameNe, setStationNameNe] = useState('');
  const [stationNameEn, setStationNameEn] = useState('');
  const [stationFreq, setStationFreq] = useState('102.4 MHz');
  const [stationLocNe, setStationLocNe] = useState('बुटवल');
  const [stationLocEn, setStationLocEn] = useState('Butwal');
  const [stationUrl, setStationUrl] = useState('https://stream.susamachar.org/butwal-1024.mp3');

  // Deliverable viewer state
  const [deliverableType, setDeliverableType] = useState<'schema' | 'android' | 'cpanel' | 'api'>('schema');
  const [deliverableContent, setDeliverableContent] = useState<string>('Loading deliverable file...');
  const [deliverableFilename, setDeliverableFilename] = useState<string>('schema.sql');

  useEffect(() => {
    if (activeTab === 'deliverables') {
      fetch(`/api/deliverables/${deliverableType}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.content) {
            setDeliverableContent(data.content);
            setDeliverableFilename(data.filename);
          }
        })
        .catch(() => {
          setDeliverableContent('-- Deliverable file available in repository');
        });
    }
  }, [activeTab, deliverableType]);

  const hasAccess = (mod: string) =>
    currentAdmin.roleKey === 'SUPER_ADMIN' || currentAdmin.allowedModules.includes(mod);

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess('news')) {
      onNotify('Access Denied: Current role does not have News Admin permissions.');
      return;
    }
    await onCreateNews({
      titleNe: newsTitleNe,
      titleEn: newsTitleEn,
      categorySlug: newsCategory,
      summaryNe: newsSummaryNe || newsTitleNe,
      summaryEn: newsSummaryEn || newsTitleEn,
      contentNe: newsSummaryNe || newsTitleNe,
      contentEn: newsSummaryEn || newsTitleEn,
      status: newsStatus,
    });
    setNewsTitleNe('');
    setNewsTitleEn('');
    setNewsSummaryNe('');
    setNewsSummaryEn('');
    onNotify(lang === 'ne' ? 'नयाँ समाचार सफलतापूर्वक प्रकाशित गरियो!' : 'News article created successfully!');
  };

  const handleRatesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess('rates')) {
      onNotify('Access Denied: Current role does not have Finance Content Admin permissions.');
      return;
    }
    await onUpdateRates({
      fineGoldTola: Number(goldInput),
      tejabiGoldTola: Number(tejabiInput),
      silverTola: Number(silverInput),
      rateDateBs: rateDateBsInput,
    });
    onNotify(lang === 'ne' ? 'सुनचाँदीको नयाँ दर अद्यावधिक गरियो!' : 'Gold & Silver rates updated and logged!');
  };

  const handleRadioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAccess('radio')) {
      onNotify('Access Denied: Current role does not have Radio Admin permissions.');
      return;
    }
    await onAddRadioStation({
      nameNe: stationNameNe,
      nameEn: stationNameEn,
      frequency: stationFreq,
      locationNe: stationLocNe,
      locationEn: stationLocEn,
      streamUrl: stationUrl,
    });
    setStationNameNe('');
    setStationNameEn('');
    onNotify(lang === 'ne' ? 'नयाँ एफ.एम. रेडियो स्टेशन थपियो!' : 'New FM Radio station added!');
  };

  const publishedCount = news.filter((n) => n.status === 'published').length;
  const draftCount = news.filter((n) => n.status !== 'published').length;
  const pendingPrayersCount = prayers.filter((p) => p.moderationStatus === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Top Admin Header & 8-Role RBAC Switcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
            <Shield className="w-4 h-4" />
            <span>MULTI-ADMIN RBAC CONSOLE · 2FA & AUDIT LOGGING ACTIVE</span>
          </div>
          <h1 className="text-2xl font-bold">
            {lang === 'ne' ? 'सुसमाचार मल्टी-एडमिन ड्यासबोर्ड (CMS)' : 'Susamachar Multi-Admin CMS Dashboard'}
          </h1>
          <p className="text-xs text-slate-300">
            {lang === 'ne'
              ? `सक्रिय एडमिन: ${currentAdmin.fullNameNe} (${currentAdmin.roleNameNe})`
              : `Signed in as: ${currentAdmin.fullNameEn} — Role: ${currentAdmin.roleNameEn}`}
          </p>
        </div>

        {/* Role Simulator Switcher to test all 8 Admin Roles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <label className="text-xs text-slate-400 whitespace-nowrap">
            {lang === 'ne' ? 'एडमिन भूमिका छान्नुहोस् (Test 8 Roles):' : 'Switch Active Admin Role (RBAC):'}
          </label>
          <select
            value={currentAdmin.id}
            onChange={(e) => {
              const found = ADMIN_USERS.find((a) => a.id === Number(e.target.value));
              if (found) {
                onSelectAdminRole(found);
                onNotify(`Switched RBAC session to ${found.roleNameEn} (${found.fullNameEn})`);
              }
            }}
            className="h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white"
          >
            {ADMIN_USERS.map((adm) => (
              <option key={adm.id} value={adm.id}>
                {adm.roleNameEn} ({adm.roleNameNe}) — {adm.username}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dashboard Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-200/80 dark:bg-slate-900 rounded-xl">
        {[
          { id: 'overview', ne: 'तथ्याङ्क र सारांश (Overview)', en: 'Overview & Stats', mod: 'overview' },
          { id: 'news', ne: `समाचार व्यवस्थापन (${news.length})`, en: `News CMS (${news.length})`, mod: 'news' },
          { id: 'hymns', ne: 'भजन पुस्तकालय (१,२६८)', en: 'Hymn Library CMS (1,268)', mod: 'bible' },
          { id: 'prayer', ne: `प्रार्थना स्वीकृति (${pendingPrayersCount} Pending)`, en: `Prayer Moderation (${pendingPrayersCount})`, mod: 'prayer' },
          { id: 'rates', ne: 'सुनचाँदी दर अपडेट (Finance)', en: 'Gold/Silver Rates', mod: 'rates' },
          { id: 'radio', ne: `एफ.एम. रेडियो (${radioStations.length})`, en: `FM Radio (${radioStations.length})`, mod: 'radio' },
          { id: 'admins', ne: '८ एडमिन भूमिका र अडिट लग', en: '8 Roles & Audit Logs', mod: 'admins' },
          { id: 'deliverables', ne: 'SQL, APK र cPanel कोड', en: 'SQL, Android & cPanel Code', mod: 'overview' },
        ].map((tab) => {
          const permitted = hasAccess(tab.mod);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-red-800 text-white'
                  : permitted
                  ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
                  : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {!permitted && <Lock className="w-3 h-3" />}
              <span>{lang === 'ne' ? tab.ne : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD STATISTICS & OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Required Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { labelNe: 'कुल प्रयोगकर्ता (Total Users)', labelEn: 'Total Registered Users', value: '1,428', sub: '+34 this week' },
              { labelNe: 'कुल समाचार (Total News)', labelEn: 'Total News Articles', value: String(news.length), sub: `${publishedCount} Published · ${draftCount} Draft` },
              { labelNe: 'प्रकाशित समाचार (Published)', labelEn: 'Published News', value: String(publishedCount), sub: 'SEO Indexed' },
              { labelNe: 'ड्राफ्ट समाचार (Draft News)', labelEn: 'Draft / Scheduled News', value: String(draftCount), sub: 'Editorial Queue' },
              { labelNe: 'रेडियो स्टेशन (Radio Stations)', labelEn: 'Active FM Stations', value: String(radioStations.length), sub: '24/7 Live Streams' },
              { labelNe: 'इसाई कार्यक्रम (Total Events)', labelEn: 'Christian Events', value: '3', sub: '1,472 RSVPs' },
              { labelNe: 'प्रार्थना निवेदन (Prayer Requests)', labelEn: 'Total Prayer Requests', value: String(prayers.length), sub: `${pendingPrayersCount} Awaiting Approval` },
              { labelNe: 'ग्यालरी एल्बम (Gallery Albums)', labelEn: 'Photo Gallery Albums', value: '4', sub: '112 Approved Photos' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 space-y-1"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'ne' ? stat.labelNe : stat.labelEn}
                </p>
                <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-red-800 dark:text-amber-400">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne' ? 'हालैका एडमिन गतिविधि लग (Security Audit Logs)' : 'Recent Admin Activity & Security Audit Logs'}
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                RBAC Policy: Enforced
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 text-slate-500">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Admin User</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Module / Action</th>
                    <th className="py-3 px-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800">
                  {auditLogs.slice(0, 8).map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500">{log.timestamp}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{log.adminName}</td>
                      <td className="py-3 px-4 text-red-800 dark:text-amber-400 font-medium">{log.roleName}</td>
                      <td className="py-3 px-4 font-mono">{log.module} · {log.action}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NEWS PORTAL CMS */}
      {activeTab === 'news' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-800" />
              <span>{lang === 'ne' ? 'नयाँ समाचार प्रकाशन गर्नुहोस्' : 'Create & Publish News Article'}</span>
            </h2>

            {!hasAccess('news') ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-300">
                Your current role (<strong>{currentAdmin.roleNameEn}</strong>) does not have permission to modify news. Switch to <strong>Super Admin</strong> or <strong>News Admin</strong> above.
              </div>
            ) : (
              <form onSubmit={handleNewsSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    नेपाली शीर्षक (Nepali Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newsTitleNe}
                    onChange={(e) => setNewsTitleNe(e.target.value)}
                    placeholder="उदा: पोखरामा बृहत् युवा आत्मिक सम्मेलन सम्पन्न"
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    अंग्रेजी शीर्षक (English Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newsTitleEn}
                    onChange={(e) => setNewsTitleEn(e.target.value)}
                    placeholder="e.g. Regional Youth Fellowship Convenes in Pokhara"
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      समाचार विधा (Category)
                    </label>
                    <select
                      value={newsCategory}
                      onChange={(e) => setNewsCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                    >
                      {NEWS_CATEGORIES.slice(1).map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.nameNe} ({c.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      स्थिति (Status)
                    </label>
                    <select
                      value={newsStatus}
                      onChange={(e) => setNewsStatus(e.target.value as 'published' | 'draft')}
                      className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                    >
                      <option value="published">Published (प्रकाशित)</option>
                      <option value="draft">Draft (ड्राफ्ट)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    नेपाली विवरण (Nepali Summary & Content)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newsSummaryNe}
                    onChange={(e) => setNewsSummaryNe(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    अंग्रेजी विवरण (English Summary & Content)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newsSummaryEn}
                    onChange={(e) => setNewsSummaryEn(e.target.value)}
                    className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold"
                >
                  {lang === 'ne' ? 'समाचार सुरक्षित गर्नुहोस्' : 'Publish News Article'}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ne' ? 'सबै समाचार सूची (Manage News Articles)' : 'Manage Existing News Articles'}
            </h2>
            <div className="divide-y divide-stone-200 dark:divide-slate-800">
              {news.map((item) => (
                <div key={item.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      <span className="font-semibold text-red-800 dark:text-amber-400">{item.categoryNameNe}</span>
                      {' · '}
                      <span>{item.publishedAtBs}</span>
                      {' · '}
                      <span className="uppercase font-mono">{item.status}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {item.titleNe}
                    </h3>
                    <p className="text-xs text-slate-500">{item.titleEn}</p>
                  </div>
                  {hasAccess('news') && (
                    <button
                      onClick={() => onDeleteNews(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800"
                      title="Delete Article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRAYER WALL MODERATION */}
      {activeTab === 'prayer' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne' ? 'प्रार्थना निवेदन स्वीकृति तथा मोडरेसन (Prayer Request Moderation)' : 'Prayer Request Moderation Queue'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ne'
                  ? 'सार्वजनिक प्रार्थना पर्खालमा देखाउनुअघि एडमिनले स्वीकृत (Approve) गर्नुपर्नेछ।'
                  : 'Approve public requests to display them on the Prayer Wall, or mark requests as Answered.'}
              </p>
            </div>
          </div>

          {!hasAccess('prayer') ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-300">
              Switch to <strong>Super Admin</strong> or <strong>Prayer Admin</strong> to moderate prayer requests.
            </div>
          ) : (
            <div className="divide-y divide-stone-200 dark:divide-slate-800">
              {prayers.map((p) => (
                <div key={p.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{p.requesterName}</span>
                      <span>·</span>
                      <span className="font-mono uppercase text-red-800 dark:text-amber-400">
                        Moderation: {p.moderationStatus}
                      </span>
                      <span>·</span>
                      <span className="font-mono uppercase text-slate-500">
                        Visibility: {p.visibility}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {p.titleNe} ({p.titleEn})
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{p.requestTextNe}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {p.moderationStatus !== 'approved' && (
                      <button
                        onClick={() => {
                          onModeratePrayer(p.id, 'approved');
                          onNotify('Prayer request approved and published to the Prayer Wall.');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}
                    {p.moderationStatus !== 'rejected' && (
                      <button
                        onClick={() => {
                          onModeratePrayer(p.id, 'rejected');
                          onNotify('Prayer request hidden from public wall.');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        onModeratePrayer(
                          p.id,
                          p.moderationStatus as 'approved' | 'rejected',
                          p.prayerStatus === 'answered' ? 'active' : 'answered'
                        );
                        onNotify('Updated prayer answered testimony status.');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-amber-400 text-amber-800 dark:text-amber-300 text-xs font-semibold"
                    >
                      {p.prayerStatus === 'answered' ? 'Answered ✓' : 'Mark Answered'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GOLD & SILVER RATES ADMIN */}
      {activeTab === 'rates' && (
        <div className="max-w-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ne' ? 'दैनिक सुनचाँदी दर अद्यावधिक (Finance Content Admin)' : 'Update Daily Gold & Silver Bullion Rates (NPR)'}
            </h2>
          </div>

          {!hasAccess('rates') ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-300">
              Switch to <strong>Super Admin</strong> or <strong>Finance Content Admin</strong> to update gold and silver prices.
            </div>
          ) : (
            <form onSubmit={handleRatesSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  नेपाली मिति (BS Date)
                </label>
                <input
                  type="text"
                  value={rateDateBsInput}
                  onChange={(e) => setRateDateBsInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    छापावाल सुन (Fine Gold / Tola NPR)
                  </label>
                  <input
                    type="number"
                    required
                    value={goldInput}
                    onChange={(e) => setGoldInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs font-mono tabular-nums font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    तेजाबी सुन (Tejabi Gold / Tola NPR)
                  </label>
                  <input
                    type="number"
                    required
                    value={tejabiInput}
                    onChange={(e) => setTejabiInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs font-mono tabular-nums font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    असल चाँदी (Silver / Tola NPR)
                  </label>
                  <input
                    type="number"
                    required
                    value={silverInput}
                    onChange={(e) => setSilverInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs font-mono tabular-nums font-bold"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold"
              >
                {lang === 'ne' ? 'नयाँ सुनचाँदी दर प्रकाशित गर्नुहोस्' : 'Update Official NPR Bullion Rates'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 5: FM RADIO ADMIN */}
      {activeTab === 'radio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-800" />
              <span>{lang === 'ne' ? 'नयाँ रेडियो स्टेशन थप्नुहोस्' : 'Add Christian FM Radio Station'}</span>
            </h2>
            {!hasAccess('radio') ? (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-xs text-red-800 dark:text-red-300">
                Switch to <strong>Super Admin</strong> or <strong>Radio Admin</strong> to manage FM stations.
              </div>
            ) : (
              <form onSubmit={handleRadioSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    रेडियोको नाम (Nepali Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={stationNameNe}
                    onChange={(e) => setStationNameNe(e.target.value)}
                    placeholder="उदा: शान्ति सुसमाचार एफ.एम. १०२.४"
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    अंग्रेजी नाम (English Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={stationNameEn}
                    onChange={(e) => setStationNameEn(e.target.value)}
                    placeholder="e.g. Shanti Gospel FM 102.4 MHz"
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      फ्रिक्वेन्सी (Frequency)
                    </label>
                    <input
                      type="text"
                      value={stationFreq}
                      onChange={(e) => setStationFreq(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      सहर (Location)
                    </label>
                    <input
                      type="text"
                      value={stationLocEn}
                      onChange={(e) => {
                        setStationLocEn(e.target.value);
                        setStationLocNe(e.target.value);
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    अधिकृत स्ट्रिमिङ URL (Authorized Stream URL)
                  </label>
                  <input
                    type="url"
                    required
                    value={stationUrl}
                    onChange={(e) => setStationUrl(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-700 text-xs font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-10 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold"
                >
                  {lang === 'ne' ? 'रेडियो स्टेशन थप्नुहोस्' : 'Save FM Radio Station'}
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Active FM Radio Stations ({radioStations.length})
            </h2>
            <div className="divide-y divide-stone-200 dark:divide-slate-800">
              {radioStations.map((st) => (
                <div key={st.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {st.nameNe} ({st.nameEn})
                    </p>
                    <p className="text-xs font-mono text-slate-500">
                      {st.frequency} · {st.locationEn} · {st.streamUrl}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">Enabled</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 8 ADMIN ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'admins' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-stone-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'ne'
                ? '८ विशिष्ट एडमिन भूमिका र अधिकार तालिका (Multi-Admin RBAC Directory)'
                : '8 Specialized Admin Roles & Security Permissions Matrix'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 text-slate-500">
                  <th className="py-3 px-4 font-semibold">Role Title</th>
                  <th className="py-3 px-4 font-semibold">Assigned Administrator</th>
                  <th className="py-3 px-4 font-semibold">Email / Username</th>
                  <th className="py-3 px-4 font-semibold">2FA Status</th>
                  <th className="py-3 px-4 font-semibold">Authorized Modules</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800">
                {ADMIN_USERS.map((adm) => (
                  <tr key={adm.id}>
                    <td className="py-3 px-4 font-bold text-red-800 dark:text-amber-400">
                      {adm.roleNameEn}
                      <div className="text-[11px] font-normal text-slate-500">{adm.roleNameNe}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {adm.fullNameEn}
                      <div className="text-[11px] font-normal text-slate-500">{adm.fullNameNe}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {adm.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-600">
                        {adm.twoFactorEnabled ? '2FA Verified' : 'Password + Session'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {adm.allowedModules.join(', ')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          onSelectAdminRole(adm);
                          onNotify(`Switched active admin role to ${adm.roleNameEn}`);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-red-800 hover:text-white transition-colors"
                      >
                        Test Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: DELIVERABLES SOURCE CODE & DEPLOYMENT FILES */}
      {activeTab === 'deliverables' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-red-800 dark:text-amber-400" />
                <span>Production Deliverables: MySQL Schema, Android Kotlin Source & cPanel Guide</span>
              </h2>
              <p className="text-xs text-slate-500">
                Inspect or download the production SQL database schema, native Android Jetpack Compose source, and cPanel deployment instructions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'schema', label: 'MySQL schema.sql' },
                { id: 'android', label: 'Android MainActivity.kt' },
                { id: 'cpanel', label: 'cPanel & APK Guide' },
                { id: 'api', label: 'REST API Docs' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDeliverableType(item.id as typeof deliverableType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    deliverableType === item.id
                      ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                      : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-mono">{deliverableFilename}</span>
            <button
              onClick={() => {
                const blob = new Blob([deliverableContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = deliverableFilename;
                a.click();
                URL.revokeObjectURL(url);
                onNotify(`Downloaded ${deliverableFilename}`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-800 text-white font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {deliverableFilename}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
            {deliverableContent}
          </pre>
        </div>
      )}

      {/* TAB 8: CHRISTIAN HYMN LIBRARY ADMIN CMS */}
      {activeTab === 'hymns' && (
        <BhajanModuleView lang={lang} onNotify={onNotify} isAdminView={true} />
      )}
    </div>
  );
};
