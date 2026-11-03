import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  Eye,
  Film,
  Globe,
  Heart,
  Image as ImageIcon,
  MessageSquarePlus,
  Newspaper,
  PlayCircle,
  Search,
  Send,
  Share2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import {
  NEPALI_NEWS_PORTALS,
  NEWS_CATEGORIES,
  NewsArticle,
} from '../data/susamacharDatabase';
import { toNepaliDigits } from '../utils/nepaliDateEngine';

interface NewsPortalViewProps {
  lang: 'ne' | 'en';
  articles: NewsArticle[];
  savedNewsIds: number[];
  onToggleSaveNews: (id: number) => void;
  onCreatePost?: (post: Partial<NewsArticle>) => void;
  onNotify: (msg: string) => void;
}

const NEPAL_REAL_PHOTO_PRESETS = [
  { labelNe: 'लालीगुराँस र हिमाल', labelEn: 'Rhododendron & Himalayas', url: '/assets/aistudio/image_fed91b50.png' },
  { labelNe: 'फोक्सुण्डो ताल, डोल्पा', labelEn: 'Phoksundo Lake, Dolpa', url: '/assets/aistudio/image_4e1a2ab5.png' },
  { labelNe: 'कर्णाली नदी र पहाड', labelEn: 'Karnali River Valley', url: '/assets/aistudio/image_d40a1d65.png' },
  { labelNe: 'हिमाली फूल र शिखर', labelEn: 'Alpine Wildflowers', url: '/assets/aistudio/image_05744a49.png' },
  { labelNe: 'सूर्यास्तमा सुनौलो हिमाल', labelEn: 'Golden Himalayan Sunset', url: '/assets/aistudio/image_8235fd25.png' },
  { labelNe: 'उपल्लो मुस्ताङ बस्ती', labelEn: 'Upper Mustang Village', url: '/assets/aistudio/image_3fb48649.png' },
  { labelNe: 'पहाडी उपत्यका', labelEn: 'Himalayan Trail', url: '/assets/aistudio/image_42266620.png' },
  { labelNe: 'नदी र्याफ्टिङ', labelEn: 'River Rafting Nepal', url: '/assets/aistudio/image_2d66d8cd.png' },
  { labelNe: 'पहाडी राजमार्ग', labelEn: 'Mountain Highway', url: '/assets/aistudio/image_124cf814.png' },
  { labelNe: 'पवित्र बाइबल', labelEn: 'Holy Bible', url: '/assets/aistudio/image_312e60b5.png' },
];

/**
 * Extracts YouTube video ID and detects whether the URL is a YouTube Short
 */
export function parseYouTubeEmbed(url?: string): { embedUrl: string | null; isShort: boolean } {
  if (!url) return { embedUrl: null, isShort: false };
  const trimmed = url.trim();
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i);
  if (shortsMatch?.[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}`,
      isShort: true,
    };
  }
  const watchMatch =
    trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i) ||
    trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i) ||
    trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i);
  if (watchMatch?.[1]) {
    return {
      embedUrl: `https://www.youtube.com/embed/${watchMatch[1]}`,
      isShort: false,
    };
  }
  return { embedUrl: null, isShort: false };
}

export const NewsPortalView: React.FC<NewsPortalViewProps> = ({
  lang,
  articles,
  savedNewsIds,
  onToggleSaveNews,
  onCreatePost,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPortal, setSelectedPortal] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'featured' | 'trending' | 'saved' | 'video' | 'short' | 'social'>('all');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);

  // Social Post / Article / YouTube Video / YouTube Shorts Composer State
  const [showComposer, setShowComposer] = useState<boolean>(false);
  const [postType, setPostType] = useState<'social' | 'article' | 'video' | 'short'>('social');
  const [authorName, setAuthorName] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [contentInput, setContentInput] = useState<string>('');
  const [youtubeUrlInput, setYoutubeUrlInput] = useState<string>('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('/assets/aistudio/image_fed91b50.png');
  const [postCategorySlug, setPostCategorySlug] = useState<string>('christian-news-nepal');

  const publishedArticles = useMemo(() => {
    return articles.filter((a) => a.status === 'published');
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return publishedArticles.filter((a) => {
      if (selectedCategory !== 'all' && a.categorySlug !== selectedCategory) return false;
      if (selectedPortal !== 'all' && a.portalSlug !== selectedPortal) return false;
      if (filterMode === 'featured' && !a.isFeatured) return false;
      if (filterMode === 'trending' && !a.isTrending) return false;
      if (filterMode === 'saved' && !savedNewsIds.includes(a.id)) return false;
      if (filterMode === 'video' && a.postType !== 'video') return false;
      if (filterMode === 'short' && a.postType !== 'short') return false;
      if (filterMode === 'social' && a.postType !== 'social') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.titleEn.toLowerCase().includes(q) ||
          a.titleNe.includes(q) ||
          a.summaryEn.toLowerCase().includes(q) ||
          a.summaryNe.includes(q) ||
          (a.portalNameEn && a.portalNameEn.toLowerCase().includes(q)) ||
          (a.portalNameNe && a.portalNameNe.includes(q))
        );
      }
      return true;
    });
  }, [publishedArticles, selectedCategory, selectedPortal, filterMode, savedNewsIds, searchQuery]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = titleInput.trim();
    const trimmedContent = contentInput.trim();
    if (!trimmedTitle && !trimmedContent) {
      onNotify(
        lang === 'ne'
          ? 'कृपया पोस्टको शीर्षक वा विवरण लेख्नुहोस्।'
          : 'Please enter a title or post content.'
      );
      return;
    }

    const catObj =
      NEWS_CATEGORIES.find((c) => c.slug === postCategorySlug) || NEWS_CATEGORIES[1];
    const finalTitle = trimmedTitle || trimmedContent.slice(0, 90);
    const finalSummary = trimmedContent.slice(0, 180) || finalTitle;
    const finalContent = trimmedContent || finalTitle;

    const newPost: Partial<NewsArticle> = {
      categorySlug: catObj.slug,
      categoryNameEn: catObj.nameEn,
      categoryNameNe: catObj.nameNe,
      portalSlug: 'hamropusta',
      portalNameNe:
        postType === 'short'
          ? 'YouTube Shorts · बाइबल सन्देश'
          : postType === 'video'
          ? 'YouTube भिडियो · बाइबल सन्देश'
          : postType === 'social'
          ? 'बाइबल सन्देश (Social Post)'
          : 'बाइबल सन्देश (Bible Sandes)',
      portalNameEn:
        postType === 'short'
          ? 'YouTube Shorts · Bible Sandes'
          : postType === 'video'
          ? 'YouTube Video · Bible Sandes'
          : postType === 'social'
          ? 'Bible Sandes Social'
          : 'Bible Sandes',
      sourceUrl: youtubeUrlInput.trim() || 'https://biblesandes.com',
      youtubeUrl: youtubeUrlInput.trim() || undefined,
      postType,
      likesCount: 1,
      authorNameEn: authorName.trim() || 'Bible Sandes Member',
      authorNameNe: authorName.trim() || 'बाइबल सन्देश सदस्य',
      authorRoleEn:
        postType === 'short'
          ? 'YouTube Shorts Creator'
          : postType === 'video'
          ? 'Video Contributor'
          : 'Community Contributor',
      titleEn: finalTitle,
      titleNe: finalTitle,
      summaryEn: finalSummary,
      summaryNe: finalSummary,
      contentEn: finalContent,
      contentNe: finalContent,
      featuredImage: selectedPhotoUrl || '/assets/aistudio/image_fed91b50.png',
      isFeatured: true,
      isTrending: true,
      status: 'published',
      publishedAtAd: new Date().toISOString().slice(0, 10),
      publishedAtBs: '२०८३ कार्तिक १४',
    };

    if (onCreatePost) {
      onCreatePost(newPost);
    }
    setTitleInput('');
    setContentInput('');
    setYoutubeUrlInput('');
    setShowComposer(false);
    onNotify(
      lang === 'ne'
        ? 'तपाईंको पोस्ट न्युज फिडमा सफलतापूर्वक प्रकाशित भयो!'
        : 'Your post has been published to the News Feed!'
    );
  };

  const handleToggleLike = (id: number) => {
    setLikedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShareNews = async (art: NewsArticle) => {
    const title = lang === 'ne' ? art.titleNe : art.titleEn;
    const summary = lang === 'ne' ? art.summaryNe : art.summaryEn;
    const shareText = `${title}\n${summary}\n— बाइबल सन्देश (biblesandes.com)`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText });
        return;
      } catch {
        // fallback
      }
    }
    navigator.clipboard?.writeText(shareText);
    onNotify(lang === 'ne' ? 'समाचार लिंक र विवरण कपी गरियो!' : 'News article link copied to clipboard!');
  };

  // Full Article Reader View — Strictly English when lang === 'en', strictly Nepali when lang === 'ne'
  if (activeArticle) {
    const relatedArticles = publishedArticles
      .filter((a) => a.id !== activeArticle.id)
      .slice(0, 3);
    const isSaved = savedNewsIds.includes(activeArticle.id);
    const yt = parseYouTubeEmbed(activeArticle.youtubeUrl || activeArticle.videoUrl);

    const displayTitle = lang === 'ne' ? activeArticle.titleNe : activeArticle.titleEn;
    const displaySummary = lang === 'ne' ? activeArticle.summaryNe : activeArticle.summaryEn;
    const displayContent = lang === 'ne' ? activeArticle.contentNe : activeArticle.contentEn;
    const displayAuthor = lang === 'ne' ? activeArticle.authorNameNe : activeArticle.authorNameEn;
    const displayCategory = lang === 'ne' ? activeArticle.categoryNameNe : activeArticle.categoryNameEn;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setActiveArticle(null)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-red-800 dark:hover:text-amber-400 transition-colors min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {lang === 'ne'
              ? 'सबै समाचार र न्युज फिडमा फर्कनुहोस्'
              : 'Back to News & Social Feed'}
          </span>
        </button>

        <article className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {/* Top Hero Image or Embedded YouTube / Shorts Player */}
          {yt.embedUrl ? (
            <div className="bg-slate-950 p-4 sm:p-6 flex flex-col items-center">
              <div
                className={
                  yt.isShort || activeArticle.postType === 'short'
                    ? 'w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden border border-slate-800 shadow-xl'
                    : 'w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-xl'
                }
              >
                <iframe
                  src={yt.embedUrl}
                  title={displayTitle}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="relative h-64 sm:h-96 bg-slate-900 overflow-hidden">
              <img
                src={activeArticle.featuredImage}
                alt={displayTitle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300 font-medium">
                  {activeArticle.portalNameNe && (
                    <>
                      <span className="px-2.5 py-0.5 rounded-md bg-red-800 text-white font-bold">
                        {lang === 'ne' ? activeArticle.portalNameNe : activeArticle.portalNameEn}
                      </span>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span>{displayCategory}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {activeArticle.publishedAtBs} ({activeArticle.publishedAtAd})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {lang === 'ne'
                      ? `${toNepaliDigits(activeArticle.viewsCount)} पाठक`
                      : `${activeArticle.viewsCount.toLocaleString()} views`}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold leading-snug">{displayTitle}</h1>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {yt.embedUrl && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-red-800 dark:text-amber-400 font-semibold">
                  <span>{displayCategory}</span>
                  <span>·</span>
                  <span>
                    {activeArticle.publishedAtBs} ({activeArticle.publishedAtAd})
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-snug">
                  {displayTitle}
                </h1>
              </div>
            )}

            {/* Author & Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-slate-800">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{displayAuthor}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeArticle.publishedAtBs} · {activeArticle.publishedAtAd}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeArticle.sourceUrl && (
                  <a
                    href={activeArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-3.5 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-blue-800 dark:text-amber-400 flex items-center gap-1.5 hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ne'
                        ? `${activeArticle.portalNameNe || 'मूल स्रोत'} खोल्नुहोस्`
                        : `Open ${activeArticle.portalNameEn || 'Source'}`}
                    </span>
                  </a>
                )}
                <button
                  onClick={() => onToggleSaveNews(activeArticle.id)}
                  className={`h-10 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isSaved
                      ? 'bg-red-50 dark:bg-slate-800 border-red-800 text-red-800 dark:text-amber-400'
                      : 'border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                  <span>
                    {isSaved
                      ? lang === 'ne'
                        ? 'सुरक्षित'
                        : 'Saved'
                      : lang === 'ne'
                      ? 'बुकमार्क'
                      : 'Bookmark'}
                  </span>
                </button>
                <button
                  onClick={() => handleShareNews(activeArticle)}
                  className="h-10 px-3.5 rounded-xl bg-red-800 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-red-900 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'सेयर गर्नुहोस्' : 'Share Article'}</span>
                </button>
              </div>
            </div>

            {/* Single-Language Summary Lead (Strictly Nepali when lang === 'ne', strictly English when lang === 'en') */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800">
              <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                {displaySummary}
              </p>
            </div>

            {/* Full Content in Selected Language Only */}
            <div className="space-y-4 text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              <p>{displayContent}</p>
            </div>
          </div>
        </article>

        {/* Related News */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {lang === 'ne' ? 'सम्बन्धित समाचार र पोस्टहरू' : 'Related News & Posts'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedArticles.map((rel) => (
              <div
                key={rel.id}
                onClick={() => setActiveArticle(rel)}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-red-800 transition-colors space-y-2"
              >
                <p className="text-xs text-red-800 dark:text-amber-400 font-medium">
                  {lang === 'ne' ? rel.categoryNameNe : rel.categoryNameEn} · {rel.publishedAtBs} ({rel.publishedAtAd})
                </p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {lang === 'ne' ? rel.titleNe : rel.titleEn}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header, Search & Create Social/Video/Article Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-bold text-red-800 dark:text-amber-400">
            {lang === 'ne'
              ? 'बाइबल सन्देश (biblesandes.com) · समाचार फिड, सोसल पोस्ट, YouTube भिडियो र Shorts'
              : 'Bible Sandes (biblesandes.com) · News Feed, Social Posts, YouTube Videos & Shorts'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {lang === 'ne'
              ? 'नेपाली न्युज फिड, लेख र सामाजिक सञ्जाल पोस्ट'
              : 'English & Nepali News Feed, Articles & Social Posts'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowComposer((prev) => !prev)}
            className="h-10 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>
              {lang === 'ne'
                ? '+ सोसल पोस्ट / समाचार / YouTube Video & Short थप्नुहोस्'
                : '+ Create Social Post / Article / YouTube Video & Short'}
            </span>
          </button>

          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'ne'
                  ? 'समाचार, लेख वा भिडियो खोज्नुहोस्...'
                  : 'Search news, articles, or videos...'
              }
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE COMPOSER: SOCIAL POST, NEWS ARTICLE, YOUTUBE VIDEO & SHORTS
         ===================================================================== */}
      {showComposer && (
        <form
          onSubmit={handlePublishPost}
          className="bg-white dark:bg-slate-900 border-2 border-red-800/30 dark:border-amber-400/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-md"
        >
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="w-5 h-5 text-red-800 dark:text-amber-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'नयाँ सोसल पोस्ट, समाचार लेख, YouTube भिडियो वा Short पोस्ट गर्नुहोस्'
                  : 'Publish New Social Post, Article, YouTube Video, or YouTube Short'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post Type Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'social', ne: 'सोसल फोटो पोस्ट (Social Post)', en: 'Social Photo Post', icon: ImageIcon },
              { id: 'article', ne: 'समाचार / लेख (News Article)', en: 'News Article', icon: Newspaper },
              { id: 'video', ne: 'YouTube भिडियो (YouTube Video)', en: 'YouTube Video', icon: Video },
              { id: 'short', ne: 'YouTube Short / रिल्स (Short Video)', en: 'YouTube Short', icon: Film },
            ].map((tab) => {
              const IconComp = tab.icon;
              const active = postType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPostType(tab.id as typeof postType)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    active
                      ? 'bg-red-800 text-white'
                      : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{lang === 'ne' ? tab.ne : tab.en}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'ne' ? 'प्रकाशक / लेखकको नाम' : 'Author / Poster Name'}
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder={lang === 'ne' ? 'बाइबल सन्देश (Bible Sandes)' : 'Bible Sandes'}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'ne' ? 'विधा (Category)' : 'Category'}
                  </label>
                  <select
                    value={postCategorySlug}
                    onChange={(e) => setPostCategorySlug(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-semibold"
                  >
                    {NEWS_CATEGORIES.filter((c) => c.slug !== 'all').map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {lang === 'ne' ? c.nameNe : c.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'ne' ? 'शीर्षक (Title / Headline)' : 'Post Title / Headline'}
                </label>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder={
                    lang === 'ne'
                      ? 'शीर्षक लेख्नुहोस्...'
                      : 'Enter headline or title...'
                  }
                  className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
              </div>

              {(postType === 'video' || postType === 'short') && (
                <div>
                  <label className="block text-xs font-bold text-red-800 dark:text-amber-400 mb-1">
                    {postType === 'short'
                      ? lang === 'ne'
                        ? 'YouTube Shorts लिंक राख्नुहोस् (उदा: https://www.youtube.com/shorts/...)'
                        : 'Paste YouTube Shorts URL (e.g. https://www.youtube.com/shorts/...)'
                      : lang === 'ne'
                      ? 'YouTube भिडियो लिंक राख्नुहोस् (उदा: https://www.youtube.com/watch?v=...)'
                      : 'Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)'}
                  </label>
                  <input
                    type="url"
                    value={youtubeUrlInput}
                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                    placeholder={
                      postType === 'short'
                        ? 'https://www.youtube.com/shorts/5qap5aO4i9A'
                        : 'https://www.youtube.com/watch?v=ea7K6b7rG5g'
                    }
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'ne'
                    ? 'विवरण / बाइबल सन्देश / लेख (Post Content)'
                    : 'Article / Social Post Content'}
                </label>
                <textarea
                  rows={4}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  placeholder={
                    lang === 'ne'
                      ? 'यहाँ आफ्नो बाइबल सन्देश, समाचार वा विचार लेख्नुहोस्...'
                      : 'Write your Christian news article, scripture reflection, or social update...'
                  }
                  className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Photo Upload or Real Nepal Photo Selector */}
            <div className="md:col-span-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {lang === 'ne'
                  ? 'फोटो अपलोड गर्नुहोस् वा नेपालको वास्तविक फोटो छान्नुहोस्'
                  : 'Upload Photo or Choose a Real Nepal Photo'}
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-red-800 file:text-white hover:file:bg-red-900 cursor-pointer"
              />

              <div className="grid grid-cols-5 gap-1.5">
                {NEPAL_REAL_PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setSelectedPhotoUrl(preset.url)}
                    title={lang === 'ne' ? preset.labelNe : preset.labelEn}
                    className={`h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedPhotoUrl === preset.url
                        ? 'border-red-800 dark:border-amber-400 scale-105'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.labelEn}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {selectedPhotoUrl && (
                <div className="h-36 rounded-xl overflow-hidden bg-slate-950 border border-stone-200 dark:border-slate-800">
                  <img
                    src={selectedPhotoUrl}
                    alt="Selected Post Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full h-10 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>
                  {lang === 'ne'
                    ? 'न्युज फिडमा पोस्ट गर्नुहोस् (Publish Now)'
                    : 'Publish to News Feed'}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Mode Bar (All, Social Posts, YouTube Videos, YouTube Shorts, Featured, Saved) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              { id: 'all', ne: 'सबै फिड (All Feed)', en: 'All Feed' },
              { id: 'social', ne: 'सोसल पोस्ट (Social Posts)', en: 'Social Posts' },
              { id: 'video', ne: 'YouTube भिडियो (Videos)', en: 'YouTube Videos' },
              { id: 'short', ne: 'YouTube Shorts (शर्ट्स)', en: 'YouTube Shorts' },
              { id: 'featured', ne: 'प्रमुख समाचार (Featured)', en: 'Featured News' },
              { id: 'saved', ne: `सुरक्षित (${savedNewsIds.length})`, en: `Saved (${savedNewsIds.length})` },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setFilterMode(m.id)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                filterMode === m.id
                  ? 'bg-red-800 text-white'
                  : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang === 'ne' ? m.ne : m.en}
            </button>
          ))}
        </div>

        {/* Language indicator showing strict Eng / नेप article mode */}
        <span className="text-xs font-semibold text-red-800 dark:text-amber-400">
          {lang === 'ne'
            ? 'भाषा मोड: नेपाली लेख र समाचार (नेप)'
            : 'Language Mode: English Articles & News (Eng)'}
        </span>
      </div>

      {/* Horizontal Category Filter Bar (10 Categories) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {NEWS_CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat.slug
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                : 'bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-stone-400'
            }`}
          >
            {lang === 'ne' ? cat.nameNe : cat.nameEn}
          </button>
        ))}
      </div>

      {/* News, Social Posts, YouTube Videos & Shorts Grid */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-2">
          <Newspaper className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {lang === 'ne'
              ? 'यस विधामा कुनै पोस्ट वा समाचार भेटिएन।'
              : 'No matching news articles or posts found.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedPortal('all');
              setFilterMode('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-red-800 dark:text-amber-400 hover:underline"
          >
            {lang === 'ne' ? 'सबै समाचार हेर्नुहोस्' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((art) => {
            const isSaved = savedNewsIds.includes(art.id);
            const isLiked = likedPostIds.includes(art.id);
            const yt = parseYouTubeEmbed(art.youtubeUrl || art.videoUrl);
            const displayTitle = lang === 'ne' ? art.titleNe : art.titleEn;
            const displaySummary = lang === 'ne' ? art.summaryNe : art.summaryEn;
            const displayCategory = lang === 'ne' ? art.categoryNameNe : art.categoryNameEn;
            const displayAuthor = lang === 'ne' ? art.authorNameNe : art.authorNameEn;

            return (
              <article
                key={art.id}
                className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-stone-400 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Media Header: Embedded YouTube / Shorts or Real Nepal Photo */}
                  {yt.embedUrl ? (
                    <div className="bg-slate-950 relative">
                      <div
                        className={
                          yt.isShort || art.postType === 'short'
                            ? 'w-full h-72 flex items-center justify-center bg-black'
                            : 'w-full h-52 bg-black'
                        }
                      >
                        <iframe
                          src={yt.embedUrl}
                          title={displayTitle}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-800 text-white text-[10px] font-bold inline-flex items-center gap-1 shadow-xs">
                        {yt.isShort || art.postType === 'short' ? (
                          <>
                            <Film className="w-3 h-3" />
                            <span>YouTube Short</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3 h-3" />
                            <span>YouTube Video</span>
                          </>
                        )}
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => setActiveArticle(art)}
                      className="h-52 bg-slate-900 overflow-hidden cursor-pointer relative"
                    >
                      <img
                        src={art.featuredImage}
                        alt={displayTitle}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {art.portalNameNe && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white text-[11px] font-bold border border-white/15">
                          {lang === 'ne' ? art.portalNameNe : art.portalNameEn}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="p-5 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-red-800 dark:text-amber-400">
                        {displayCategory}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {art.publishedAtBs} ({art.publishedAtAd})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                        <Eye className="w-3 h-3" />
                        {lang === 'ne' ? toNepaliDigits(art.viewsCount) : art.viewsCount}
                      </span>
                    </div>

                    <h2
                      onClick={() => setActiveArticle(art)}
                      className="text-lg font-bold text-slate-900 dark:text-white leading-snug cursor-pointer hover:text-red-800 dark:hover:text-amber-400 transition-colors"
                    >
                      {displayTitle}
                    </h2>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {displaySummary}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                    {displayAuthor}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleLike(art.id)}
                      className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 font-mono text-[11px] ${
                        isLiked
                          ? 'bg-red-800/10 text-red-800 dark:text-amber-400 font-bold'
                          : 'text-slate-500 hover:text-red-800'
                      }`}
                      title="Like"
                    >
                      <Heart className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} />
                      <span>{(art.likesCount || 12) + (isLiked ? 1 : 0)}</span>
                    </button>

                    <button
                      onClick={() => onToggleSaveNews(art.id)}
                      className={`p-1.5 rounded-lg ${
                        isSaved ? 'text-red-800 dark:text-amber-400' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={() => handleShareNews(art)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setActiveArticle(art)}
                      className="font-semibold text-red-800 dark:text-amber-400 hover:underline ml-1 whitespace-nowrap shrink-0"
                    >
                      {lang === 'ne' ? 'पूरा पढ्नुहोस् →' : 'Read Full →'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Featured Nepali & Christian News Portals Directory */}
      <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-red-800 text-amber-300 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'प्रमुख नेपाली तथा इसाई समाचार पोर्टलहरू (Featured News Portals)'
                  : 'Leading Nepali & Christian News Portals Directory'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'ne'
                  ? 'अनलाइनखबर, रातोपाटी, बाह्रखरी, हाम्रोपुस्ता, खोजखबर, नयाँ पत्रिका लगायतका पोर्टलहरू'
                  : 'Browse headlines or open Onlinekhabar, Ratopati, Baahrakhari, Hamropusta, Khojkhabar & Naya Patrika'}
              </p>
            </div>
          </div>

          {selectedPortal !== 'all' && (
            <button
              onClick={() => setSelectedPortal('all')}
              className="text-xs font-bold text-red-800 dark:text-amber-400 hover:underline self-start sm:self-auto"
            >
              {lang === 'ne' ? 'सबै पोर्टलका समाचार हेर्नुहोस्' : 'Show All Portals'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {NEPALI_NEWS_PORTALS.map((portal) => {
            const isActive = selectedPortal === portal.slug;
            return (
              <div
                key={portal.slug}
                className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition-all ${
                  isActive
                    ? 'bg-red-50/90 dark:bg-red-950/35 border-red-800 dark:border-amber-400 shadow-xs'
                    : 'bg-stone-50/70 dark:bg-slate-800/50 border-stone-200/90 dark:border-slate-800 hover:border-stone-400 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold truncate ${portal.badgeColor}`}
                    >
                      {lang === 'ne' ? portal.categoryNe : portal.categoryEn}
                    </span>
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${portal.nameEn} (${portal.url})`}
                      className="text-slate-500 hover:text-red-800 dark:text-slate-400 dark:hover:text-amber-400 p-1 rounded-md hover:bg-white dark:hover:bg-slate-800 transition-colors shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() =>
                      setSelectedPortal((prev) => (prev === portal.slug ? 'all' : portal.slug))
                    }
                    className="mt-1.5 text-left w-full group"
                  >
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-800 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                      {lang === 'ne' ? portal.nameNe : portal.nameEn}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                      {lang === 'ne' ? portal.descriptionNe : portal.descriptionEn}
                    </p>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
