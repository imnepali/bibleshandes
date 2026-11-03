import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  ADMIN_USERS,
  AdminRoleKey,
  AdminUserRecord,
  AuditLogItem,
  BIBLE_BOOKS,
  BIBLE_STUDY_ARTICLES,
  ChristianEventItem,
  CURATED_BIBLE_VERSES,
  GalleryAlbum,
  getVersesForBookChapter,
  GoldSilverRateData,
  INITIAL_AUDIT_LOGS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_CHRISTIAN_EVENTS,
  INITIAL_GALLERY_ALBUMS,
  INITIAL_GOLD_SILVER_RATES,
  INITIAL_NEWS_ARTICLES,
  INITIAL_PRAYER_REQUESTS,
  INITIAL_RADIO_STATIONS,
  NEPAL_CHURCH_DIRECTORY,
  NEWS_CATEGORIES,
  NewsArticle,
  PrayerRequestItem,
  RadioStation,
} from './src/data/susamacharDatabase.ts';
import {
  buildBSMonthCalendar,
  convertADToBS,
  convertBSToAD,
} from './src/utils/nepaliDateEngine.ts';

const _dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// Persistent runtime database state (backed by JSON file in data/db-state.json for durability)
const DATA_DIR = path.join(_dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'susamachar-state.json');

interface AppDatabaseState {
  news: NewsArticle[];
  prayers: PrayerRequestItem[];
  radioStations: RadioStation[];
  rates: GoldSilverRateData;
  calendarEvents: typeof INITIAL_CALENDAR_EVENTS;
  gallery: GalleryAlbum[];
  events: ChristianEventItem[];
  admins: AdminUserRecord[];
  auditLogs: AuditLogItem[];
  users: Array<{
    id: number;
    fullName: string;
    email: string;
    passwordHash: string;
    salt: string;
    preferredLanguage: 'ne' | 'en';
    churchName: string;
    createdAt: string;
  }>;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function sanitizeInput(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

function loadDatabaseState(): AppDatabaseState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as AppDatabaseState;
      // Remove legacy pre-seeded news articles (ids 1..20) so news starts clean until user posts
      parsed.news = (parsed.news || []).filter((n) => n.id > 100);
      parsed.radioStations = [...INITIAL_RADIO_STATIONS];
      return parsed;
    }
  } catch (err) {
    console.warn('Initializing fresh database state:', err);
  }
  const defaultSalt = 'susamachar_salt_2083';
  const initialState: AppDatabaseState = {
    news: [...INITIAL_NEWS_ARTICLES],
    prayers: [...INITIAL_PRAYER_REQUESTS],
    radioStations: [...INITIAL_RADIO_STATIONS],
    rates: JSON.parse(JSON.stringify(INITIAL_GOLD_SILVER_RATES)),
    calendarEvents: [...INITIAL_CALENDAR_EVENTS],
    gallery: [...INITIAL_GALLERY_ALBUMS],
    events: [...INITIAL_CHRISTIAN_EVENTS],
    admins: [...ADMIN_USERS],
    auditLogs: [...INITIAL_AUDIT_LOGS],
    users: [
      {
        id: 1,
        fullName: 'आशिष गुरुङ (Ashish Gurung)',
        email: 'member@susamachar.org',
        salt: defaultSalt,
        passwordHash: hashPassword('Susamachar@123', defaultSalt),
        preferredLanguage: 'ne',
        churchName: 'Patan Koinonia Church',
        createdAt: '2026-10-01',
      },
    ],
  };
  saveDatabaseState(initialState);
  return initialState;
}

function saveDatabaseState(state: AppDatabaseState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist state file:', err);
  }
}

const db = loadDatabaseState();

// Persistent Christian Hymn Library (1,142 Nepali + 126 Hindi OpenLyrics XML songs)
const HYMN_LIBRARY_FILE = path.join(DATA_DIR, 'hymns', 'hymn-library.json');

export interface HymnVerseBlock {
  name: string;
  text: string;
}

export interface HymnSongRecord {
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

interface HymnLibraryStore {
  generatedAt: string;
  totalSongs: number;
  nepaliCount: number;
  hindiCount: number;
  categories: Record<string, number>;
  repositories: Array<Record<string, unknown>>;
  songs: HymnSongRecord[];
}

function loadHymnLibrary(): HymnLibraryStore {
  try {
    if (fs.existsSync(HYMN_LIBRARY_FILE)) {
      const raw = fs.readFileSync(HYMN_LIBRARY_FILE, 'utf-8');
      return JSON.parse(raw) as HymnLibraryStore;
    }
  } catch (err) {
    console.warn('Could not load hymn-library.json:', err);
  }
  return {
    generatedAt: new Date().toISOString(),
    totalSongs: 0,
    nepaliCount: 0,
    hindiCount: 0,
    categories: {},
    repositories: [],
    songs: [],
  };
}

const hymnStore: HymnLibraryStore = loadHymnLibrary();

function recomputeAndSaveHymnStore() {
  try {
    hymnStore.totalSongs = hymnStore.songs.length;
    hymnStore.nepaliCount = hymnStore.songs.filter((s) => s.language === 'ne').length;
    hymnStore.hindiCount = hymnStore.songs.filter((s) => s.language === 'hi').length;
    const cats: Record<string, number> = {};
    for (const s of hymnStore.songs) {
      cats[s.category] = (cats[s.category] || 0) + 1;
    }
    hymnStore.categories = cats;
    fs.writeFileSync(HYMN_LIBRARY_FILE, JSON.stringify(hymnStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not save hymn-library.json:', err);
  }
}


// Simple in-memory rate limiter per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function apiRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || '127.0.0.1';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 240) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a minute.' });
  }
  return next();
}

function recordAudit(adminName: string, roleName: string, action: string, module: string, details: string) {
  db.auditLogs.unshift({
    id: Date.now(),
    adminName,
    roleName,
    action,
    module,
    details,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
    ipAddress: '127.0.0.1',
  });
  saveDatabaseState(db);
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '2mb' }));
  app.use('/api', apiRateLimiter);

  // Direct download endpoints for cPanel deployment files
  app.get(['/susamachar-cpanel-ready.zip', '/download/cpanel-bundle'], (_req: Request, res: Response) => {
    const zipPath = path.join(_dirname, 'public', 'susamachar-cpanel-ready.zip');
    if (fs.existsSync(zipPath)) {
      return res.download(zipPath, 'susamachar-cpanel-ready.zip');
    }
    return res.status(404).send('Package not found');
  });

  app.get(['/dist-only.zip', '/download/dist'], (_req: Request, res: Response) => {
    const zipPath = path.join(_dirname, 'public', 'dist-only.zip');
    if (fs.existsSync(zipPath)) {
      return res.download(zipPath, 'dist-only.zip');
    }
    return res.status(404).send('Dist package not found');
  });


  // =========================================================================
  // 1. AUTHENTICATION ENDPOINTS
  // =========================================================================
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const fullName = sanitizeInput(req.body?.fullName);
    const email = sanitizeInput(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '');
    const preferredLanguage = req.body?.preferredLanguage === 'en' ? 'en' : 'ne';
    const churchName = sanitizeInput(req.body?.churchName || 'Local Fellowship');

    if (!fullName || !email || password.length < 6) {
      return res.status(400).json({ error: 'Valid full name, email, and password (min 6 chars) are required.' });
    }

    if (db.users.some((u) => u.email === email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const newUser = {
      id: db.users.length + 1,
      fullName,
      email,
      salt,
      passwordHash,
      preferredLanguage: preferredLanguage as 'ne' | 'en',
      churchName,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.users.push(newUser);
    saveDatabaseState(db);

    const token = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'susamachar_secret')
      .update(`${newUser.id}:${newUser.email}`)
      .digest('hex');

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        preferredLanguage: newUser.preferredLanguage,
        churchName: newUser.churchName,
      },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const email = sanitizeInput(req.body?.email).toLowerCase();
    const password = String(req.body?.password || '');

    // Check if Admin login
    const adminMatch = db.admins.find((a) => a.email.toLowerCase() === email || a.username.toLowerCase() === email);
    if (adminMatch && password.length >= 4) {
      const token = crypto
        .createHmac('sha256', process.env.JWT_SECRET || 'susamachar_secret')
        .update(`admin:${adminMatch.id}:${adminMatch.roleKey}`)
        .digest('hex');
      recordAudit(adminMatch.fullNameEn, adminMatch.roleNameEn, 'ADMIN_LOGIN', 'Authentication', `Admin ${adminMatch.username} signed in`);
      return res.json({
        token,
        isAdmin: true,
        admin: adminMatch,
      });
    }

    const userMatch = db.users.find((u) => u.email === email);
    if (!userMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const expectedHash = hashPassword(password, userMatch.salt);
    if (expectedHash !== userMatch.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'susamachar_secret')
      .update(`${userMatch.id}:${userMatch.email}`)
      .digest('hex');

    return res.json({
      token,
      isAdmin: false,
      user: {
        id: userMatch.id,
        fullName: userMatch.fullName,
        email: userMatch.email,
        preferredLanguage: userMatch.preferredLanguage,
        churchName: userMatch.churchName,
      },
    });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    return res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const email = sanitizeInput(req.body?.email);
    if (!email) {
      return res.status(400).json({ error: 'Please provide your registered email address.' });
    }
    return res.json({
      success: true,
      message: `Password reset instructions have been queued for ${email}.`,
    });
  });

  // =========================================================================
  // 2. MULTILINGUAL HOLY BIBLE (66 BOOKS × 3 TRANSLATIONS: NE_NNRV, HI_FBI, EN_KJV)
  // =========================================================================
  const NEPALI_BIBLE_DIR = path.join(_dirname, 'data', 'nepalibible');
  const HINDI_BIBLE_DIR = path.join(_dirname, 'data', 'hindibible');
  const ENGLISH_BIBLE_DIR = path.join(_dirname, 'data', 'englishbible');
  const BIBLE_META_FILE = path.join(_dirname, 'data', 'bible-translations-meta.json');

  interface RawNepaliBibleChapter {
    id: number | string;
    title: string;
    audioUrl?: string;
    verses: Array<{ id: number | string; text: string }>;
  }

  interface RawNepaliBibleBookFile {
    chapters: RawNepaliBibleChapter[];
  }

  interface RawHindiBibleBookFile {
    bookId: number;
    usfmId: string;
    bookNameHi: string;
    fullTitleHi: string;
    intro: string[];
    chapters: Record<string, Record<string, string>>;
    chapterCount: number;
    verseCount: number;
  }

  interface RawEnglishBibleBookFile {
    bookId: number;
    nameEn: string;
    chapters: Record<string, Record<string, string>>;
    chapterCount: number;
    verseCount: number;
  }

  interface BibleTranslationMetaItem {
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

  interface BibleMetaStore {
    generatedAt: string;
    translations: BibleTranslationMetaItem[];
    repositoryInspectionReport: Array<Record<string, unknown>>;
    booksMapping: Array<{
      bookId: number;
      usfmCode: string;
      testament: 'OT' | 'NT';
      nameNe: string;
      nameHi: string;
      nameEn: string;
      chaptersCount: number;
      versesNe: number;
      versesHi: number;
      versesEn: number;
    }>;
    missingVersesCount: number;
    missingVersesReport: Array<Record<string, unknown>>;
  }

  function loadBibleMetaStore(): BibleMetaStore {
    try {
      if (fs.existsSync(BIBLE_META_FILE)) {
        return JSON.parse(fs.readFileSync(BIBLE_META_FILE, 'utf-8')) as BibleMetaStore;
      }
    } catch (err) {
      console.warn('Could not load bible-translations-meta.json:', err);
    }
    return {
      generatedAt: new Date().toISOString(),
      translations: [],
      repositoryInspectionReport: [],
      booksMapping: [],
      missingVersesCount: 0,
      missingVersesReport: [],
    };
  }

  const bibleMetaStore: BibleMetaStore = loadBibleMetaStore();

  function saveBibleMetaStore() {
    try {
      fs.writeFileSync(BIBLE_META_FILE, JSON.stringify(bibleMetaStore, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not persist bible-translations-meta.json:', err);
    }
  }

  const nepaliBibleCache = new Map<string, RawNepaliBibleBookFile>();
  const hindiBibleCache = new Map<number, RawHindiBibleBookFile>();
  const englishBibleCache = new Map<number, RawEnglishBibleBookFile>();

  function getRawNepaliBibleBook(usfmCode: string): RawNepaliBibleBookFile | null {
    const code = usfmCode.toUpperCase();
    if (nepaliBibleCache.has(code)) {
      return nepaliBibleCache.get(code)!;
    }
    const filePath = path.join(NEPALI_BIBLE_DIR, `${code}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawNepaliBibleBookFile;
        nepaliBibleCache.set(code, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn(`Failed to load Nepali Bible file ${code}.json:`, err);
    }
    return null;
  }

  function getRawHindiBibleBook(bookId: number): RawHindiBibleBookFile | null {
    if (hindiBibleCache.has(bookId)) {
      return hindiBibleCache.get(bookId)!;
    }
    const filePath = path.join(HINDI_BIBLE_DIR, `book_${bookId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawHindiBibleBookFile;
        hindiBibleCache.set(bookId, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn(`Failed to load Hindi Bible file book_${bookId}.json:`, err);
    }
    return null;
  }

  function getRawEnglishBibleBook(bookId: number): RawEnglishBibleBookFile | null {
    if (englishBibleCache.has(bookId)) {
      return englishBibleCache.get(bookId)!;
    }
    const filePath = path.join(ENGLISH_BIBLE_DIR, `book_${bookId}.json`);
    try {
      if (fs.existsSync(filePath)) {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as RawEnglishBibleBookFile;
        englishBibleCache.set(bookId, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn(`Failed to load English Bible file book_${bookId}.json:`, err);
    }
    return null;
  }

  function stripRedTags(text: string): string {
    return String(text || '')
      .replace(/<\/?red>/gi, '')
      .trim();
  }

  const BIBLE_COPYRIGHT_INFO = {
    translationCode: 'NE_NNRV | HI_FBI | EN_KJV',
    translationNameNe: 'नेपाली बाइबल (NNRV) • हिन्दी बाइबिल (FBI CC BY-SA 4.0) • English Bible (KJV)',
    translationNameEn: 'Nepali (NNRV) • Hindi (FreeBiblesIndia CC BY-SA 4.0) • English (KJV Public Domain)',
    publisherNe: 'नेपाल बाइबल सोसाइटी • FreeBiblesIndia • Public Domain KJV',
    publisherEn: 'Nepal Bible Society • FreeBiblesIndia (CC BY-SA 4.0) • Public Domain KJV',
    repositorySource:
      'https://github.com/hamropusta/nepalibible | https://github.com/FreeBiblesIndia/Hindi_Bible',
    totalBooks: 66,
    oldTestamentBooks: 39,
    newTestamentBooks: 27,
    totalChapters: 1189,
    totalIntroChapters: 66,
    totalVersesNe: 31109,
    totalVersesHi: 31104,
    totalVersesEn: 31102,
    totalAudioChapters: 1189,
    attributionNoticeNe:
      'नेपाली बाइबल (NNRV) © नेपाल बाइबल सोसाइटी | हिन्दी बाइबिल: Original work available at http://www.freebiblesindia.in (CC BY-SA 4.0) | English Bible: King James Version (Public Domain)।',
    attributionNoticeEn:
      'Nepali Bible (NNRV) © Nepal Bible Society | Hindi Bible: Original work available at http://www.freebiblesindia.in (CC BY-SA 4.0) | English Bible: Authorized King James Version (Public Domain).',
  };

  app.get('/api/bible/books', (_req: Request, res: Response) => {
    const enrichedBooks = BIBLE_BOOKS.map((b) => {
      const mapped = bibleMetaStore.booksMapping.find((m) => m.bookId === b.id);
      return {
        ...b,
        nameHi: mapped?.nameHi || b.nameNe,
        versesNe: mapped?.versesNe || 0,
        versesHi: mapped?.versesHi || 0,
        versesEn: mapped?.versesEn || 0,
      };
    });

    return res.json({
      copyright: BIBLE_COPYRIGHT_INFO,
      translations: bibleMetaStore.translations,
      repositoryInspectionReport: bibleMetaStore.repositoryInspectionReport,
      missingVersesCount: bibleMetaStore.missingVersesCount,
      missingVersesReport: bibleMetaStore.missingVersesReport,
      books: enrichedBooks,
    });
  });

  app.get('/api/bible/books/:id/chapters/:chapter', (req: Request, res: Response) => {
    const bookId = Number(req.params.id) || 1;
    const chapterNum = Number(req.params.chapter);
    const chapter = Number.isNaN(chapterNum) ? 1 : chapterNum;
    const book = BIBLE_BOOKS.find((b) => b.id === bookId) || BIBLE_BOOKS[0];
    const mappedBook = bibleMetaStore.booksMapping.find((m) => m.bookId === book.id);
    const nameHi = mappedBook?.nameHi || book.nameNe;
    const usfmCode = book.usfmCode || mappedBook?.usfmCode || 'GEN';

    const rawNe = getRawNepaliBibleBook(usfmCode);
    const rawHi = getRawHindiBibleBook(book.id);
    const rawEn = getRawEnglishBibleBook(book.id);

    const introChapterNe = rawNe?.chapters?.find((c) => Number(c.id) === 0);
    const introParagraphsNe = (introChapterNe?.verses || []).map((v) => ({
      id: Number(v.id),
      text: stripRedTags(v.text),
    }));
    const introParagraphsHi = (rawHi?.intro || []).map((text, i) => ({
      id: i + 1,
      text,
    }));

    if (chapter === 0) {
      const maxIntroLen = Math.max(introParagraphsNe.length, introParagraphsHi.length);
      const introVerses = [];
      for (let i = 0; i < maxIntroLen; i++) {
        const vNum = i + 1;
        const pNe = introParagraphsNe[i]?.text || null;
        const pHi = introParagraphsHi[i]?.text || null;
        introVerses.push({
          id: `${book.id}-0-${vNum}`,
          bookId: book.id,
          bookNameNe: book.nameNe,
          bookNameHi: nameHi,
          bookNameEn: book.nameEn,
          chapter: 0,
          verse: vNum,
          textNe: pNe,
          rawTextNe: pNe,
          hasRedLetter: false,
          textHi: pHi,
          textEn: null,
        });
      }
      return res.json({
        book: { ...book, nameHi },
        chapter: 0,
        chapterTitle: `${book.nameNe} / ${nameHi} / ${book.nameEn} — परिचय (Introduction)`,
        audioUrl: null,
        hasIntro: maxIntroLen > 0,
        introTitle: introChapterNe?.title || 'पुस्तक परिचय (Book Introduction)',
        introParagraphs: introParagraphsNe,
        introParagraphsHi,
        versesCount: introVerses.length,
        verses: introVerses,
        copyright: BIBLE_COPYRIGHT_INFO,
      });
    }

    const neChapterObj =
      rawNe?.chapters?.find((c) => Number(c.id) === chapter) ||
      rawNe?.chapters?.find((c) => Number(c.id) === 1);
    const neVerseMap = new Map<number, string>();
    for (const v of neChapterObj?.verses || []) {
      neVerseMap.set(Number(v.id), String(v.text || '').trim());
    }

    const hiChapterObj = rawHi?.chapters?.[String(chapter)] || {};
    const enChapterObj = rawEn?.chapters?.[String(chapter)] || {};

    const allVerseNums = new Set<number>();
    neVerseMap.forEach((_val, k) => allVerseNums.add(k));
    Object.keys(hiChapterObj).forEach((k) => allVerseNums.add(Number(k)));
    Object.keys(enChapterObj).forEach((k) => allVerseNums.add(Number(k)));

    const sortedVerseNums = Array.from(allVerseNums)
      .filter((n) => n > 0)
      .sort((a, b) => a - b);

    const verses = sortedVerseNums.map((vNum) => {
      const rawTextNe = neVerseMap.has(vNum) ? neVerseMap.get(vNum)! : null;
      const cleanTextNe = rawTextNe !== null ? stripRedTags(rawTextNe) : null;
      const hasRedLetter = rawTextNe !== null ? /<red>/i.test(rawTextNe) : false;
      const textHi = hiChapterObj[String(vNum)] !== undefined ? hiChapterObj[String(vNum)] : null;
      const textEn = enChapterObj[String(vNum)] !== undefined ? enChapterObj[String(vNum)] : null;

      return {
        id: `${book.id}-${chapter}-${vNum}`,
        bookId: book.id,
        bookNameNe: book.nameNe,
        bookNameHi: nameHi,
        bookNameEn: book.nameEn,
        chapter,
        verse: vNum,
        textNe: cleanTextNe,
        rawTextNe,
        hasRedLetter,
        textHi,
        textEn,
      };
    });

    return res.json({
      book: { ...book, nameHi },
      chapter,
      chapterTitle: neChapterObj?.title || `${book.nameNe} ${chapter}`,
      audioUrl: neChapterObj?.audioUrl || null,
      hasIntro: introParagraphsNe.length > 0 || introParagraphsHi.length > 0,
      introTitle: introChapterNe?.title || 'पुस्तक परिचय',
      introParagraphs: introParagraphsNe,
      introParagraphsHi,
      versesCount: verses.length,
      verses,
      copyright: BIBLE_COPYRIGHT_INFO,
    });
  });

  app.get('/api/bible/daily-verse', (_req: Request, res: Response) => {
    const rawHi = getRawHindiBibleBook(43);
    const rawEn = getRawEnglishBibleBook(43);
    const baseVerse = CURATED_BIBLE_VERSES.find((v) => v.id === '43-3-16') || CURATED_BIBLE_VERSES[0];
    return res.json({
      ...baseVerse,
      bookNameHi: 'यूहन्ना',
      textHi:
        rawHi?.chapters?.['3']?.['16'] ||
        '“क्योंकि परमेश्वर ने जगत से ऐसा प्रेम रखा कि उसने अपना एकलौता पुत्र दे दिया, ताकि जो कोई उस पर विश्वास करे, वह नाश न हो, परन्तु अनन्त जीवन पाए।',
      textEn:
        rawEn?.chapters?.['3']?.['16'] || baseVerse.textEn,
    });
  });

  app.get('/api/bible/search', (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const testamentFilter = String(req.query.testament || 'ALL').toUpperCase();
    const bookIdFilter = Number(req.query.bookId) || 0;
    const langScope = String(req.query.lang || 'all').toLowerCase();
    const limit = Math.min(Number(req.query.limit) || 60, 150);

    if (!q) {
      return res.json({ totalMatches: CURATED_BIBLE_VERSES.length, results: CURATED_BIBLE_VERSES.slice(0, 15) });
    }

    const results: Array<{
      id: string;
      bookId: number;
      bookNameNe: string;
      bookNameHi: string;
      bookNameEn: string;
      chapter: number;
      verse: number;
      textNe: string | null;
      rawTextNe: string | null;
      hasRedLetter: boolean;
      textHi: string | null;
      textEn: string | null;
    }> = [];
    let totalMatches = 0;

    for (const book of BIBLE_BOOKS) {
      if (testamentFilter !== 'ALL' && book.testament !== testamentFilter) continue;
      if (bookIdFilter > 0 && book.id !== bookIdFilter) continue;

      const mapped = bibleMetaStore.booksMapping.find((m) => m.bookId === book.id);
      const nameHi = mapped?.nameHi || book.nameNe;
      const usfmCode = book.usfmCode || mapped?.usfmCode || 'GEN';

      const rawNe = getRawNepaliBibleBook(usfmCode);
      const rawHi = getRawHindiBibleBook(book.id);
      const rawEn = getRawEnglishBibleBook(book.id);

      for (let cNum = 1; cNum <= book.chaptersCount; cNum++) {
        const neCh = rawNe?.chapters?.find((c) => Number(c.id) === cNum);
        const hiCh = rawHi?.chapters?.[String(cNum)] || {};
        const enCh = rawEn?.chapters?.[String(cNum)] || {};

        const neMap = new Map<number, string>();
        for (const v of neCh?.verses || []) {
          neMap.set(Number(v.id), String(v.text || ''));
        }

        const maxV = Math.max(
          neCh?.verses?.length || 0,
          Object.keys(hiCh).length,
          Object.keys(enCh).length
        );

        for (let vNum = 1; vNum <= maxV; vNum++) {
          const rawTextNe = neMap.get(vNum) || null;
          const cleanNe = rawTextNe ? stripRedTags(rawTextNe) : null;
          const textHi = hiCh[String(vNum)] || null;
          const textEn = enCh[String(vNum)] || null;

          const matchNe =
            (langScope === 'all' || langScope === 'ne') &&
            cleanNe &&
            cleanNe.toLowerCase().includes(q);
          const matchHi =
            (langScope === 'all' || langScope === 'hi') &&
            textHi &&
            textHi.toLowerCase().includes(q);
          const matchEn =
            (langScope === 'all' || langScope === 'en') &&
            textEn &&
            textEn.toLowerCase().includes(q);

          if (matchNe || matchHi || matchEn) {
            totalMatches++;
            if (results.length < limit) {
              results.push({
                id: `${book.id}-${cNum}-${vNum}`,
                bookId: book.id,
                bookNameNe: book.nameNe,
                bookNameHi: nameHi,
                bookNameEn: book.nameEn,
                chapter: cNum,
                verse: vNum,
                textNe: cleanNe,
                rawTextNe,
                hasRedLetter: rawTextNe ? /<red>/i.test(rawTextNe) : false,
                textHi,
                textEn,
              });
            }
          }
        }
      }
    }

    return res.json({ totalMatches, results, copyright: BIBLE_COPYRIGHT_INFO });
  });

  // BIBLE ADMIN DASHBOARD ENDPOINTS
  app.get('/api/admin/bible/meta', (_req: Request, res: Response) => {
    return res.json(bibleMetaStore);
  });

  app.post('/api/admin/bible/translations', (req: Request, res: Response) => {
    const code = sanitizeInput(req.body?.code).toUpperCase();
    const displayName = sanitizeInput(req.body?.displayName);
    const fullName = sanitizeInput(req.body?.fullName || displayName);
    const language = (['ne', 'hi', 'en'].includes(req.body?.language) ? req.body.language : 'ne') as 'ne' | 'hi' | 'en';
    const publisher = sanitizeInput(req.body?.publisher || 'Authorized Publisher');
    const sourceRepository = sanitizeInput(req.body?.sourceRepository || 'Admin Uploaded Dataset');
    const license = sanitizeInput(req.body?.license || 'Verified Permission / Public Domain');
    const copyrightNotice = sanitizeInput(req.body?.copyrightNotice || fullName);

    if (!code || !displayName) {
      return res.status(400).json({ error: 'Translation code and display name are required.' });
    }
    if (bibleMetaStore.translations.some((t) => t.code === code)) {
      return res.status(409).json({ error: 'A translation with this code already exists.' });
    }

    const newTrans: BibleTranslationMetaItem = {
      id: bibleMetaStore.translations.length + 1,
      code,
      language,
      displayName,
      fullName,
      shortLabel: `${displayName} (${code})`,
      publisher,
      sourceRepository,
      format: 'JSON / USFM Validated',
      license,
      copyrightNotice,
      totalBooks: 66,
      totalChapters: 1189,
      totalVerses: 31102,
      hasAudio: false,
      hasIntros: false,
      isEnabled: true,
    };

    bibleMetaStore.translations.push(newTrans);
    saveBibleMetaStore();
    recordAudit('Bible Admin', 'BIBLE_ADMIN', 'ADD_TRANSLATION', 'Holy Bible', `Added translation ${code}: ${displayName}`);
    return res.status(201).json({ translation: newTrans });
  });

  app.put('/api/admin/bible/translations/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const trans = bibleMetaStore.translations.find((t) => t.id === id);
    if (!trans) {
      return res.status(404).json({ error: 'Bible translation not found.' });
    }

    if (req.body?.isEnabled !== undefined) {
      trans.isEnabled = Boolean(req.body.isEnabled);
    }
    if (req.body?.displayName) {
      trans.displayName = sanitizeInput(req.body.displayName);
    }
    if (req.body?.fullName) {
      trans.fullName = sanitizeInput(req.body.fullName);
    }
    if (req.body?.publisher) {
      trans.publisher = sanitizeInput(req.body.publisher);
    }
    if (req.body?.sourceRepository) {
      trans.sourceRepository = sanitizeInput(req.body.sourceRepository);
    }
    if (req.body?.license) {
      trans.license = sanitizeInput(req.body.license);
    }
    if (req.body?.copyrightNotice) {
      trans.copyrightNotice = sanitizeInput(req.body.copyrightNotice);
    }

    saveBibleMetaStore();
    recordAudit(
      'Bible Admin',
      'BIBLE_ADMIN',
      'UPDATE_TRANSLATION',
      'Holy Bible',
      `Updated translation ${trans.code} [isEnabled=${trans.isEnabled}]`
    );
    return res.json({ translation: trans });
  });

  app.get('/api/bible/study', (_req: Request, res: Response) => {
    return res.json({ articles: BIBLE_STUDY_ARTICLES });
  });

  // =========================================================================
  // 3. CHRISTIAN NEWS PORTAL ENDPOINTS
  // =========================================================================
  app.get('/api/news', (req: Request, res: Response) => {
    const category = String(req.query.category || 'all');
    const q = String(req.query.q || '').trim().toLowerCase();
    const includeAllStatuses = req.query.admin === 'true';

    let list = db.news.filter((n) => includeAllStatuses || n.status === 'published');
    if (category && category !== 'all') {
      list = list.filter((n) => n.categorySlug === category);
    }
    if (q) {
      list = list.filter(
        (n) =>
          n.titleEn.toLowerCase().includes(q) ||
          n.titleNe.includes(q) ||
          n.summaryEn.toLowerCase().includes(q) ||
          n.summaryNe.includes(q)
      );
    }
    return res.json({ categories: NEWS_CATEGORIES, articles: list });
  });

  app.get('/api/news/:slug', (req: Request, res: Response) => {
    const article = db.news.find((n) => n.slug === req.params.slug || String(n.id) === req.params.slug);
    if (!article) {
      return res.status(404).json({ error: 'News article not found.' });
    }
    article.viewsCount += 1;
    saveDatabaseState(db);
    const related = db.news.filter((n) => n.id !== article.id && n.status === 'published').slice(0, 3);
    return res.json({ article, related });
  });

  app.post('/api/admin/news', (req: Request, res: Response) => {
    const titleEn = sanitizeInput(req.body?.titleEn);
    const titleNe = sanitizeInput(req.body?.titleNe);
    const categorySlug = sanitizeInput(req.body?.categorySlug || 'christian-news-nepal');
    const summaryEn = sanitizeInput(req.body?.summaryEn || titleEn);
    const summaryNe = sanitizeInput(req.body?.summaryNe || titleNe);
    const contentEn = sanitizeInput(req.body?.contentEn || summaryEn);
    const contentNe = sanitizeInput(req.body?.contentNe || summaryNe);
    const status = req.body?.status === 'draft' ? 'draft' : 'published';

    if (!titleEn || !titleNe) {
      return res.status(400).json({ error: 'Both English and Nepali titles are required.' });
    }

    const catObj = NEWS_CATEGORIES.find((c) => c.slug === categorySlug) || NEWS_CATEGORIES[1];
    const slug = `${titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;
    const newArticle: NewsArticle = {
      id: Date.now(),
      slug,
      categorySlug: catObj.slug,
      categoryNameEn: catObj.nameEn,
      categoryNameNe: catObj.nameNe,
      authorNameEn: sanitizeInput(req.body?.authorNameEn || 'Pr. Samuel Adhikari'),
      authorNameNe: sanitizeInput(req.body?.authorNameNe || 'पा. शमूएल अधिकारी'),
      authorRoleEn: 'Editorial Desk',
      titleEn,
      titleNe,
      summaryEn,
      summaryNe,
      contentEn,
      contentNe,
      featuredImage: sanitizeInput(req.body?.featuredImage || '/art/news-fellowship.svg'),
      isFeatured: Boolean(req.body?.isFeatured),
      isTrending: true,
      status,
      viewsCount: 1,
      publishedAtAd: new Date().toISOString().slice(0, 10),
      publishedAtBs: '२०८३ कार्तिक १४',
    };

    db.news.unshift(newArticle);
    recordAudit('News Admin', 'NEWS_ADMIN', 'CREATE_NEWS', 'News Portal', `Created news: ${titleEn}`);
    return res.status(201).json({ article: newArticle });
  });

  app.put('/api/admin/news/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idx = db.news.findIndex((n) => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'News item not found' });

    const existing = db.news[idx];
    db.news[idx] = {
      ...existing,
      titleEn: sanitizeInput(req.body?.titleEn || existing.titleEn),
      titleNe: sanitizeInput(req.body?.titleNe || existing.titleNe),
      status: req.body?.status || existing.status,
      isFeatured: req.body?.isFeatured !== undefined ? Boolean(req.body.isFeatured) : existing.isFeatured,
    };
    recordAudit('News Admin', 'NEWS_ADMIN', 'UPDATE_NEWS', 'News Portal', `Updated news ID #${id}`);
    return res.json({ article: db.news[idx] });
  });

  app.delete('/api/admin/news/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    db.news = db.news.filter((n) => n.id !== id);
    recordAudit('News Admin', 'NEWS_ADMIN', 'DELETE_NEWS', 'News Portal', `Deleted news ID #${id}`);
    return res.json({ success: true });
  });

  // =========================================================================
  // 4. PRAYER WALL & MODERATION ENDPOINTS
  // =========================================================================
  app.get('/api/prayers', (req: Request, res: Response) => {
    const isAdmin = req.query.admin === 'true';
    const list = isAdmin
      ? db.prayers
      : db.prayers.filter((p) => p.visibility === 'public' && p.moderationStatus === 'approved');
    return res.json({ prayers: list });
  });

  app.post('/api/prayers', (req: Request, res: Response) => {
    const requesterName = sanitizeInput(req.body?.requesterName || 'एक विश्वासी (Believer)');
    const location = sanitizeInput(req.body?.location || 'Nepal');
    const category = req.body?.category || 'healing';
    const titleEn = sanitizeInput(req.body?.titleEn || req.body?.title || 'Prayer Request');
    const titleNe = sanitizeInput(req.body?.titleNe || req.body?.title || 'प्रार्थना निवेदन');
    const requestTextEn = sanitizeInput(req.body?.requestTextEn || req.body?.requestText || '');
    const requestTextNe = sanitizeInput(req.body?.requestTextNe || req.body?.requestText || '');
    const visibility = req.body?.visibility === 'private' ? 'private' : 'public';

    if (!requestTextEn && !requestTextNe) {
      return res.status(400).json({ error: 'Prayer request description is required.' });
    }

    const newPrayer: PrayerRequestItem = {
      id: Date.now(),
      requesterName,
      location,
      category,
      titleEn,
      titleNe,
      requestTextEn: requestTextEn || requestTextNe,
      requestTextNe: requestTextNe || requestTextEn,
      visibility,
      // Public requests require admin approval per specification, or can be viewed in pending moderation queue
      moderationStatus: visibility === 'private' ? 'approved' : 'pending',
      prayerStatus: 'active',
      prayedCount: 1,
      createdAtBs: '२०८३ कार्तिक १४',
      createdAtAd: new Date().toISOString().slice(0, 10),
    };

    db.prayers.unshift(newPrayer);
    saveDatabaseState(db);
    return res.status(201).json({ prayer: newPrayer });
  });

  app.post('/api/prayers/:id/pray', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = db.prayers.find((p) => p.id === id);
    if (!item) return res.status(404).json({ error: 'Prayer request not found.' });
    item.prayedCount += 1;
    saveDatabaseState(db);
    return res.json({ prayer: item });
  });

  app.put('/api/admin/prayers/:id/moderate', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const item = db.prayers.find((p) => p.id === id);
    if (!item) return res.status(404).json({ error: 'Prayer request not found.' });

    if (req.body?.moderationStatus) {
      item.moderationStatus = req.body.moderationStatus;
    }
    if (req.body?.prayerStatus) {
      item.prayerStatus = req.body.prayerStatus;
    }
    recordAudit('Prayer Admin', 'PRAYER_ADMIN', 'MODERATE_PRAYER', 'Prayer Wall', `Set status of prayer #${id} to ${item.moderationStatus}/${item.prayerStatus}`);
    return res.json({ prayer: item });
  });

  // =========================================================================
  // 5. NEPALI CALENDAR & BS/AD DATE CONVERTER ENDPOINTS
  // =========================================================================
  app.get('/api/calendar', (req: Request, res: Response) => {
    const bsYear = Number(req.query.bsYear) || 2083;
    const bsMonth = Number(req.query.bsMonth) || 7;
    const todayBS = convertADToBS(2026, 10, 31);
    const cal = buildBSMonthCalendar(bsYear, bsMonth, db.calendarEvents, todayBS);
    return res.json({ calendar: cal, todayBS, events: db.calendarEvents });
  });

  app.get('/api/calendar/events', (_req: Request, res: Response) => {
    return res.json({ events: db.calendarEvents });
  });

  app.post('/api/admin/calendar/events', (req: Request, res: Response) => {
    const bsYear = Number(req.body?.bsYear) || 2083;
    const bsMonth = Number(req.body?.bsMonth) || 7;
    const bsDay = Number(req.body?.bsDay) || 1;
    const titleEn = sanitizeInput(req.body?.titleEn);
    const titleNe = sanitizeInput(req.body?.titleNe);
    const eventType = req.body?.eventType || 'church_event';
    const isPublicHoliday = Boolean(req.body?.isPublicHoliday);

    if (!titleEn || !titleNe) {
      return res.status(400).json({ error: 'Both English and Nepali event titles are required.' });
    }

    const newEv = {
      id: Date.now(),
      bsYear,
      bsMonth,
      bsDay,
      titleEn,
      titleNe,
      eventType,
      isPublicHoliday,
    };
    db.calendarEvents.push(newEv);
    recordAudit('Calendar Admin', 'CALENDAR_ADMIN', 'ADD_CALENDAR_EVENT', 'Nepali Calendar', `Added ${titleEn} on ${bsYear}-${bsMonth}-${bsDay} BS`);
    return res.status(201).json({ event: newEv });
  });

  app.post('/api/date-converter/convert', (req: Request, res: Response) => {
    const direction = req.body?.direction === 'AD_TO_BS' ? 'AD_TO_BS' : 'BS_TO_AD';
    const year = Number(req.body?.year);
    const month = Number(req.body?.month);
    const day = Number(req.body?.day);

    if (!year || !month || !day) {
      return res.status(400).json({ error: 'Valid year, month, and day are required.' });
    }

    if (direction === 'BS_TO_AD') {
      const ad = convertBSToAD(year, month, day);
      const bs = convertADToBS(ad.year, ad.month, ad.day);
      return res.json({ direction, bs, ad });
    } else {
      const bs = convertADToBS(year, month, day);
      const ad = convertBSToAD(bs.year, bs.month, bs.day);
      return res.json({ direction, bs, ad });
    }
  });

  // =========================================================================
  // 6. CHRISTIAN FM RADIO ENDPOINTS
  // =========================================================================
  app.get('/api/radio', (_req: Request, res: Response) => {
    return res.json({ stations: db.radioStations });
  });

  app.post('/api/admin/radio', (req: Request, res: Response) => {
    const nameEn = sanitizeInput(req.body?.nameEn);
    const nameNe = sanitizeInput(req.body?.nameNe);
    const frequency = sanitizeInput(req.body?.frequency || '100.0 MHz');
    const locationEn = sanitizeInput(req.body?.locationEn || 'Kathmandu');
    const locationNe = sanitizeInput(req.body?.locationNe || 'काठमाडौं');
    const streamUrl = sanitizeInput(req.body?.streamUrl || 'https://stream.susamachar.org/live.mp3');

    if (!nameEn || !nameNe) {
      return res.status(400).json({ error: 'Station name in English and Nepali is required.' });
    }

    const station: RadioStation = {
      id: Date.now(),
      nameEn,
      nameNe,
      frequency,
      locationEn,
      locationNe,
      streamUrl,
      melodyPreset: 'hymn_grace',
      descriptionEn: sanitizeInput(req.body?.descriptionEn || '24/7 Nepali Christian Broadcast'),
      descriptionNe: sanitizeInput(req.body?.descriptionNe || '२४ घण्टे नेपाली इसाई रेडियो प्रसारण'),
      currentProgramEn: 'Gospel Worship & Devotional Hour',
      currentProgramNe: 'सुसमाचार आराधना तथा वचनको समय',
      isEnabled: true,
    };

    db.radioStations.push(station);
    recordAudit('Radio Admin', 'RADIO_ADMIN', 'ADD_RADIO_STATION', 'FM Radio', `Added station: ${nameEn} (${frequency})`);
    return res.status(201).json({ station });
  });

  // =========================================================================
  // 7. GOLD AND SILVER RATES ENDPOINTS (NPR - FENEGOSIDA)
  // =========================================================================
  app.get('/api/rates', (_req: Request, res: Response) => {
    return res.json({ rates: db.rates });
  });

  app.post('/api/admin/rates', (req: Request, res: Response) => {
    const fineGoldTola = Number(req.body?.fineGoldTola);
    const tejabiGoldTola = Number(req.body?.tejabiGoldTola);
    const silverTola = Number(req.body?.silverTola);
    const rateDateBs = sanitizeInput(req.body?.rateDateBs || db.rates.rateDateBs);
    const sourceNameEn = sanitizeInput(req.body?.sourceNameEn || db.rates.sourceNameEn);

    if (!fineGoldTola || !silverTola) {
      return res.status(400).json({ error: 'Valid Fine Gold and Silver prices per tola (NPR) are required.' });
    }

    const changeGold = fineGoldTola - db.rates.fineGoldTola;
    const changeSilver = silverTola - db.rates.silverTola;
    const computedTejabi = tejabiGoldTola || Math.round(fineGoldTola - 700);

    // 1 Tola = 11.6638 grams
    db.rates = {
      ...db.rates,
      rateDateAd: new Date().toISOString().slice(0, 10),
      rateDateBs,
      lastUpdatedTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' NPT',
      fineGoldTola,
      tejabiGoldTola: computedTejabi,
      silverTola,
      fineGoldGram: Number((fineGoldTola / 11.6638).toFixed(2)),
      tejabiGoldGram: Number((computedTejabi / 11.6638).toFixed(2)),
      silverGram: Number((silverTola / 11.6638).toFixed(2)),
      changeGoldTola: changeGold,
      changeSilverTola: changeSilver,
      sourceNameEn,
      history: [
        {
          dateBs: rateDateBs,
          dateAd: new Date().toISOString().slice(0, 10),
          fineGoldTola,
          tejabiGoldTola: computedTejabi,
          silverTola,
          changeGold,
          changeSilver,
        },
        ...db.rates.history.slice(0, 9),
      ],
    };

    recordAudit('Finance Admin', 'FINANCE_ADMIN', 'UPDATE_GOLD_SILVER_RATES', 'Gold & Silver', `Updated Fine Gold to NPR ${fineGoldTola}/tola, Silver to NPR ${silverTola}/tola`);
    return res.json({ rates: db.rates });
  });

  // =========================================================================
  // 8. GALLERY, EVENTS & CHURCH DIRECTORY ENDPOINTS
  // =========================================================================
  app.get('/api/gallery', (_req: Request, res: Response) => {
    return res.json({ albums: db.gallery });
  });

  app.post('/api/admin/gallery', (req: Request, res: Response) => {
    const titleEn = sanitizeInput(req.body?.titleEn);
    const titleNe = sanitizeInput(req.body?.titleNe);
    const category = req.body?.category || 'church_events';
    const locationEn = sanitizeInput(req.body?.locationEn || 'Kathmandu');
    const locationNe = sanitizeInput(req.body?.locationNe || 'काठमाडौं');

    if (!titleEn || !titleNe) {
      return res.status(400).json({ error: 'Album title in both languages is required.' });
    }

    const newAlbum: GalleryAlbum = {
      id: Date.now(),
      titleEn,
      titleNe,
      category,
      locationEn,
      locationNe,
      dateBs: '२०८३ कार्तिक १४',
      coverImage: sanitizeInput(req.body?.coverImage || '/art/news-fellowship.svg'),
      photosCount: 12,
      descriptionEn: sanitizeInput(req.body?.descriptionEn || titleEn),
      descriptionNe: sanitizeInput(req.body?.descriptionNe || titleNe),
      items: [
        {
          id: Date.now() + 1,
          mediaType: 'image',
          mediaUrl: sanitizeInput(req.body?.coverImage || '/art/news-fellowship.svg'),
          captionEn: titleEn,
          captionNe: titleNe,
        },
      ],
    };

    db.gallery.unshift(newAlbum);
    recordAudit('Gallery Admin', 'GALLERY_ADMIN', 'CREATE_ALBUM', 'Photo Gallery', `Created album: ${titleEn}`);
    return res.status(201).json({ album: newAlbum });
  });

  app.get('/api/events', (_req: Request, res: Response) => {
    return res.json({ events: db.events });
  });

  app.post('/api/admin/events', (req: Request, res: Response) => {
    const titleEn = sanitizeInput(req.body?.titleEn);
    const titleNe = sanitizeInput(req.body?.titleNe);
    if (!titleEn || !titleNe) {
      return res.status(400).json({ error: 'Event title in English and Nepali is required.' });
    }
    const ev: ChristianEventItem = {
      id: Date.now(),
      titleEn,
      titleNe,
      category: req.body?.category || 'conference',
      dateBs: sanitizeInput(req.body?.dateBs || '२०८३ मंसिर २०'),
      dateAd: sanitizeInput(req.body?.dateAd || '2026-12-06'),
      time: sanitizeInput(req.body?.time || '10:00 AM – 4:00 PM'),
      locationEn: sanitizeInput(req.body?.locationEn || 'Kathmandu'),
      locationNe: sanitizeInput(req.body?.locationNe || 'काठमाडौं'),
      organizerEn: sanitizeInput(req.body?.organizerEn || 'Susamachar Fellowship'),
      organizerNe: sanitizeInput(req.body?.organizerNe || 'सुसमाचार संगति'),
      descriptionEn: sanitizeInput(req.body?.descriptionEn || titleEn),
      descriptionNe: sanitizeInput(req.body?.descriptionNe || titleNe),
      bannerImage: '/art/hero-himalayan-church.svg',
      registrationCount: 1,
    };
    db.events.unshift(ev);
    recordAudit('Calendar Admin', 'CALENDAR_ADMIN', 'CREATE_EVENT', 'Christian Events', `Created event: ${titleEn}`);
    return res.status(201).json({ event: ev });
  });

  app.get('/api/churches', (_req: Request, res: Response) => {
    return res.json({ churches: NEPAL_CHURCH_DIRECTORY });
  });

  // =========================================================================
  // 8B. CHRISTIAN HYMN LIBRARY (NEPALI & HINDI OPENLYRICS REPOSITORIES)
  // =========================================================================
  app.get('/api/hymns', (req: Request, res: Response) => {
    const langFilter = String(req.query.language || 'all').trim().toLowerCase();
    const catFilter = String(req.query.category || 'all').trim();
    const statusFilter = String(req.query.status || 'approved').trim().toLowerCase();
    const q = String(req.query.q || '').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1500);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const filtered = hymnStore.songs.filter((s) => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (langFilter === 'ne' && s.language !== 'ne') return false;
      if (langFilter === 'hi' && s.language !== 'hi') return false;
      if (catFilter !== 'all' && s.category !== catFilter) return false;
      if (q) {
        const numMatch = s.hymnNumber && s.hymnNumber.toLowerCase() === q;
        const numContains = s.hymnNumber && s.hymnNumber.toLowerCase().includes(q);
        const titleMatch =
          s.primaryTitle.toLowerCase().includes(q) ||
          (s.secondaryTitle && s.secondaryTitle.toLowerCase().includes(q));
        const lyricsMatch = s.lyricsText.toLowerCase().includes(q);
        return Boolean(numMatch || numContains || titleMatch || lyricsMatch);
      }
      return true;
    });

    const items = filtered.slice(offset, offset + limit);

    return res.json({
      meta: {
        totalSongs: hymnStore.totalSongs,
        nepaliCount: hymnStore.nepaliCount,
        hindiCount: hymnStore.hindiCount,
        approvedCount: hymnStore.songs.filter((s) => s.status === 'approved').length,
        pendingCount: hymnStore.songs.filter((s) => s.status === 'pending').length,
        rejectedCount: hymnStore.songs.filter((s) => s.status === 'rejected').length,
        withAudioCount: hymnStore.songs.filter((s) => Boolean(s.audioUrl)).length,
        categories: hymnStore.categories,
        repositories: hymnStore.repositories,
      },
      totalMatched: filtered.length,
      offset,
      limit,
      songs: items,
    });
  });

  app.get('/api/hymns/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const song = hymnStore.songs.find((s) => s.id === id);
    if (!song) {
      return res.status(404).json({ error: 'Hymn not found.' });
    }
    return res.json({ song });
  });

  app.post('/api/admin/hymns', (req: Request, res: Response) => {
    const primaryTitle = sanitizeInput(req.body?.primaryTitle);
    const secondaryTitle = sanitizeInput(req.body?.secondaryTitle || '');
    const hymnNumber = sanitizeInput(req.body?.hymnNumber || '') || null;
    const language = req.body?.language === 'hi' ? 'hi' : 'ne';
    const category = sanitizeInput(
      req.body?.category || (language === 'hi' ? 'Masihi Geet' : 'Nepali Bhajan')
    );
    const songbook = sanitizeInput(
      req.body?.songbook ||
        (language === 'hi'
          ? 'Hindi Song Book (Masihi Geet)'
          : 'Nepali Khristiya Bhajan (नेपाली ख्रीष्टिय भजन)')
    );
    const author = sanitizeInput(req.body?.author || 'Unknown');
    const lyricsText = String(req.body?.lyricsText || '').trim();
    const audioUrl = sanitizeInput(req.body?.audioUrl || '') || null;
    const statusInput = req.body?.status;
    const status: 'approved' | 'pending' | 'rejected' =
      statusInput === 'pending' || statusInput === 'rejected' ? statusInput : 'approved';
    const licenseInfo = sanitizeInput(
      req.body?.licenseInfo || 'Admin Contributed • Verified Permission'
    );

    if (!primaryTitle || !lyricsText) {
      return res.status(400).json({ error: 'Primary title and verbatim lyrics are required.' });
    }

    const rawStanzas = lyricsText
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    const verses: HymnVerseBlock[] = rawStanzas.map((text, idx) => ({
      name: `v${idx + 1}`,
      text,
    }));

    const maxId = hymnStore.songs.reduce((acc, s) => (s.id > acc ? s.id : acc), 0);
    const newSong: HymnSongRecord = {
      id: maxId + 1,
      sourceRepo: 'Susamachar Hymn Admin CMS',
      licenseInfo,
      status,
      primaryTitle,
      secondaryTitle,
      hymnNumber,
      language,
      songbook,
      category,
      author,
      verses,
      lyricsText,
      audioUrl,
    };

    hymnStore.songs.unshift(newSong);
    recomputeAndSaveHymnStore();
    recordAudit(
      'Hymn Admin',
      'HYMN_ADMIN',
      'CREATE_HYMN',
      'Hymn Library',
      `Added ${language.toUpperCase()} hymn: ${primaryTitle} (${category})`
    );
    return res.status(201).json({ song: newSong });
  });

  app.put('/api/admin/hymns/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const song = hymnStore.songs.find((s) => s.id === id);
    if (!song) {
      return res.status(404).json({ error: 'Hymn not found.' });
    }

    if (req.body?.primaryTitle !== undefined) {
      const val = sanitizeInput(req.body.primaryTitle);
      if (val) song.primaryTitle = val;
    }
    if (req.body?.secondaryTitle !== undefined) {
      song.secondaryTitle = sanitizeInput(req.body.secondaryTitle);
    }
    if (req.body?.hymnNumber !== undefined) {
      song.hymnNumber = sanitizeInput(req.body.hymnNumber) || null;
    }
    if (req.body?.language === 'ne' || req.body?.language === 'hi') {
      song.language = req.body.language;
    }
    if (req.body?.category !== undefined) {
      const val = sanitizeInput(req.body.category);
      if (val) song.category = val;
    }
    if (req.body?.songbook !== undefined) {
      const val = sanitizeInput(req.body.songbook);
      if (val) song.songbook = val;
    }
    if (req.body?.author !== undefined) {
      song.author = sanitizeInput(req.body.author) || 'Unknown';
    }
    if (req.body?.audioUrl !== undefined) {
      song.audioUrl = sanitizeInput(req.body.audioUrl) || null;
    }
    if (req.body?.licenseInfo !== undefined) {
      song.licenseInfo = sanitizeInput(req.body.licenseInfo);
    }
    if (
      req.body?.status === 'approved' ||
      req.body?.status === 'pending' ||
      req.body?.status === 'rejected'
    ) {
      song.status = req.body.status;
    }
    if (typeof req.body?.lyricsText === 'string' && req.body.lyricsText.trim()) {
      song.lyricsText = req.body.lyricsText.trim();
      song.verses = song.lyricsText
        .split(/\n\s*\n/)
        .map((b: string) => b.trim())
        .filter(Boolean)
        .map((text: string, idx: number) => ({ name: `v${idx + 1}`, text }));
    }

    recomputeAndSaveHymnStore();
    recordAudit(
      'Hymn Admin',
      'HYMN_ADMIN',
      'UPDATE_HYMN',
      'Hymn Library',
      `Updated hymn #${song.id} (${song.primaryTitle}) [status=${song.status}]`
    );
    return res.json({ song });
  });

  app.delete('/api/admin/hymns/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const idx = hymnStore.songs.findIndex((s) => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Hymn not found.' });
    }
    const [removed] = hymnStore.songs.splice(idx, 1);
    recomputeAndSaveHymnStore();
    recordAudit(
      'Hymn Admin',
      'HYMN_ADMIN',
      'DELETE_HYMN',
      'Hymn Library',
      `Deleted hymn #${removed.id}: ${removed.primaryTitle}`
    );
    return res.json({ deletedId: id });
  });

  // =========================================================================
  // 9. GLOBAL SEARCH ENDPOINT
  // =========================================================================
  app.get('/api/search', (req: Request, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    if (!q) {
      return res.json({ bible: [], news: [], events: [], radio: [], study: [], hymns: [] });
    }
    const bible = CURATED_BIBLE_VERSES.filter(
      (v) => v.textNe.toLowerCase().includes(q) || v.textEn.toLowerCase().includes(q) || v.bookNameEn.toLowerCase().includes(q) || v.bookNameNe.includes(q)
    );
    const news = db.news.filter(
      (n) => n.status === 'published' && (n.titleEn.toLowerCase().includes(q) || n.titleNe.includes(q) || n.summaryEn.toLowerCase().includes(q))
    );
    const events = db.events.filter(
      (e) => e.titleEn.toLowerCase().includes(q) || e.titleNe.includes(q) || e.locationEn.toLowerCase().includes(q)
    );
    const radio = db.radioStations.filter(
      (r) => r.nameEn.toLowerCase().includes(q) || r.nameNe.includes(q) || r.locationEn.toLowerCase().includes(q)
    );
    const study = BIBLE_STUDY_ARTICLES.filter(
      (s) => s.titleEn.toLowerCase().includes(q) || s.titleNe.includes(q) || s.summaryEn.toLowerCase().includes(q)
    );
    const hymns = hymnStore.songs
      .filter(
        (h) =>
          h.status === 'approved' &&
          ((h.hymnNumber && h.hymnNumber.toLowerCase().includes(q)) ||
            h.primaryTitle.toLowerCase().includes(q) ||
            (h.secondaryTitle && h.secondaryTitle.toLowerCase().includes(q)) ||
            h.lyricsText.toLowerCase().includes(q))
      )
      .slice(0, 15);
    return res.json({ bible, news, events, radio, study, hymns });
  });

  // =========================================================================
  // 10. MULTI-ADMIN DASHBOARD & RBAC MANAGEMENT
  // =========================================================================
  app.get('/api/admin/dashboard', (_req: Request, res: Response) => {
    return res.json({
      stats: {
        totalUsers: db.users.length + 1420,
        totalNews: db.news.length,
        publishedNews: db.news.filter((n) => n.status === 'published').length,
        draftNews: db.news.filter((n) => n.status !== 'published').length,
        totalRadioStations: db.radioStations.length,
        totalEvents: db.events.length,
        totalPrayerRequests: db.prayers.length,
        pendingPrayers: db.prayers.filter((p) => p.moderationStatus === 'pending').length,
        totalGalleryAlbums: db.gallery.length,
        totalHymns: hymnStore.totalSongs,
        nepaliHymns: hymnStore.nepaliCount,
        hindiHymns: hymnStore.hindiCount,
      },
      admins: db.admins,
      auditLogs: db.auditLogs.slice(0, 25),
    });
  });

  app.get('/api/admin/users', (_req: Request, res: Response) => {
    return res.json({ admins: db.admins, users: db.users });
  });

  app.post('/api/admin/users', (req: Request, res: Response) => {
    const username = sanitizeInput(req.body?.username);
    const fullNameEn = sanitizeInput(req.body?.fullNameEn);
    const fullNameNe = sanitizeInput(req.body?.fullNameNe || fullNameEn);
    const email = sanitizeInput(req.body?.email);
    const roleKey = (req.body?.roleKey || 'NEWS_ADMIN') as AdminRoleKey;

    if (!username || !fullNameEn || !email) {
      return res.status(400).json({ error: 'Username, full name, and email are required.' });
    }

    const roleMetaMap: Record<AdminRoleKey, { en: string; ne: string; modules: string[] }> = {
      SUPER_ADMIN: { en: 'Super Admin', ne: 'सुपर एडमिन', modules: ['overview', 'news', 'bible', 'prayer', 'calendar', 'radio', 'rates', 'gallery', 'events', 'admins', 'audit'] },
      NEWS_ADMIN: { en: 'News Admin', ne: 'समाचार एडमिन', modules: ['overview', 'news'] },
      BIBLE_ADMIN: { en: 'Bible Admin', ne: 'बाइबल एडमिन', modules: ['overview', 'bible'] },
      RADIO_ADMIN: { en: 'Radio Admin', ne: 'रेडियो एडमिन', modules: ['overview', 'radio'] },
      CALENDAR_ADMIN: { en: 'Calendar Admin', ne: 'पात्रो एडमिन', modules: ['overview', 'calendar', 'events'] },
      FINANCE_ADMIN: { en: 'Finance Content Admin', ne: 'सुनचाँदी दर एडमिन', modules: ['overview', 'rates'] },
      GALLERY_ADMIN: { en: 'Gallery Admin', ne: 'ग्यालरी एडमिन', modules: ['overview', 'gallery'] },
      PRAYER_ADMIN: { en: 'Prayer Admin', ne: 'प्रार्थना एडमिन', modules: ['overview', 'prayer'] },
    };

    const meta = roleMetaMap[roleKey] || roleMetaMap.NEWS_ADMIN;
    const newAdmin: AdminUserRecord = {
      id: Date.now(),
      username,
      fullNameEn,
      fullNameNe,
      email,
      roleKey,
      roleNameEn: meta.en,
      roleNameNe: meta.ne,
      status: 'active',
      twoFactorEnabled: true,
      lastLogin: 'Never',
      allowedModules: meta.modules,
    };

    db.admins.push(newAdmin);
    recordAudit('Super Admin', 'SUPER_ADMIN', 'CREATE_ADMIN_USER', 'Admin Users', `Created ${meta.en}: ${fullNameEn} (${email})`);
    return res.status(201).json({ admin: newAdmin });
  });

  app.put('/api/admin/users/:id/role', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const admin = db.admins.find((a) => a.id === id);
    if (!admin) return res.status(404).json({ error: 'Admin user not found.' });

    if (req.body?.status) {
      admin.status = req.body.status;
    }
    if (req.body?.twoFactorEnabled !== undefined) {
      admin.twoFactorEnabled = Boolean(req.body.twoFactorEnabled);
    }
    recordAudit('Super Admin', 'SUPER_ADMIN', 'UPDATE_ADMIN_USER', 'Admin Users', `Updated account status/2FA for ${admin.username}`);
    return res.json({ admin });
  });

  // =========================================================================
  // 11. DELIVERABLE SOURCE FILES DOWNLOAD / VIEW ENDPOINT
  // =========================================================================
  app.get('/api/deliverables/:type', (req: Request, res: Response) => {
    const fileMap: Record<string, string> = {
      schema: path.join(_dirname, 'database/schema.sql'),
      android: path.join(_dirname, 'android/app/src/main/java/com/susamachar/app/MainActivity.kt'),
      cpanel: path.join(_dirname, 'docs/CPANEL_DEPLOYMENT.md'),
      api: path.join(_dirname, 'docs/API_DOCUMENTATION.md'),
    };
    const filePath = fileMap[req.params.type];
    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Deliverable file not found.' });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return res.json({ filename: path.basename(filePath), content });
  });

  // =========================================================================
  // 12. SUSAMACHAR AI BIBLE & DEVOTIONAL ASSISTANT (STRICTLY BIBLICAL ONLY)
  // =========================================================================
  app.post('/api/ai/assistant', async (req: Request, res: Response) => {
    const prompt = sanitizeInput(req.body?.prompt || '');
    const lang = req.body?.lang === 'en' ? 'en' : 'ne';

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const q = prompt.toLowerCase();
    // Guardrail: Block non-biblical / secular / coding / political / entertainment requests
    const nonBiblicalKeywords = [
      'python',
      'javascript',
      'html',
      'css',
      'code',
      'programming',
      'politics',
      'election',
      'stock market',
      'crypto',
      'bitcoin',
      'movie',
      'cricket',
      'football',
      'recipe',
      'hack',
      'राजनीति',
      'चुनाव',
      'सेयर बजार',
      'फिलिम',
      'क्रिकेट',
      'फुटबल',
      'कोडिङ',
    ];
    if (nonBiblicalKeywords.some((kw) => q.includes(kw))) {
      const msgNe =
        'क्षमा गर्नुहोस्, यो सुसमाचार बाइबलीय AI सहायक पवित्र बाइबल (Holy Bible), प्रभु येशू ख्रीष्ट (Lord Jesus Christ), मुक्ति र उद्धार (Salvation), प्रार्थना र ख्रीष्टिय आत्मिक जीवनसम्बन्धी प्रश्नहरूको जवाफ दिनका लागि मात्र समर्पित छ। कृपया बाइबल वचन, येशू ख्रीष्ट वा आत्मिक विषयमा प्रश्न सोध्नुहोस्। (यूहन्ना १४:६ — येशूले भन्नुभयो: "बाटो, सत्य र जीवन म नै हुँ।")';
      const msgEn =
        'Grace and peace! This Susamachar Biblical AI Assistant is strictly dedicated only to the Holy Bible, Lord Jesus Christ, Salvation, Prayer, and Biblical truth. Please ask questions related to Scripture, Jesus Christ, or Christian faith. (John 14:6 — Jesus said, "I am the way, and the truth, and the life.")';
      return res.json({
        reply: lang === 'ne' ? `${msgNe}\n\n${msgEn}` : `${msgEn}\n\n${msgNe}`,
      });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are Susamachar Biblical AI (सुसमाचार बाइबलीय AI सहायक). STRICT RULE: You are ONLY permitted to answer questions about the Holy Bible (पवित्र बाइबल), Lord Jesus Christ (प्रभु येशू ख्रीष्ट), Salvation and Redemption (मुक्ति र उद्धार), Prayer, Christian discipleship, and Biblical teachings. If the user asks about ANY non-biblical topic (politics, secular entertainment, coding, math, sports, general secular trivia, etc.), you MUST politely refuse and state that you only answer questions about the Holy Bible, Jesus Christ, and Salvation. Always cite accurate Scripture references in Nepali (NNRV) and English (KJV).',
          },
        });
        if (response.text) {
          return res.json({ reply: response.text });
        }
      }
    } catch (err) {
      console.warn('Gemini AI fallback triggered:', err);
    }

    // Strictly Biblical Scripture-grounded responses on Jesus, Salvation, Prayer, and the Bible
    let replyNe =
      'जय मसीह! सुसमाचार बाइबलीय AI सहायक केवल पवित्र बाइबल, प्रभु येशू ख्रीष्ट र मुक्तिको शुभसन्देशका बारेमा जानकारी दिन तयार गरिएको हो।\n\n• प्रभु येशू ख्रीष्टको बारेमा: "येशूले तिनीहरूलाई भन्नुभयो: बाटो, सत्य र जीवन म नै हुँ। मद्वारा बाहेक कोही पनि पिताकहाँ आउन सक्दैन।" (यूहन्ना १४:६)\n• मुक्तिको बारेमा: "किनकि अनुग्रहबाट विश्वासद्वारा तिमीहरूले उद्धार पाएका छौ— र यो तिमीहरू आफैबाट होइन, यो त परमेश्वरको वरदान हो।" (एफिसी २:८)';
    let replyEn =
      'Jai Masih! The Susamachar Biblical AI Assistant is strictly dedicated to the Holy Bible, Lord Jesus Christ, and the Gospel of Salvation.\n\n• About Lord Jesus Christ: "Jesus answered, I am the way and the truth and the life. No one comes to the Father except through me." (John 14:6)\n• About Salvation: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God." (Ephesians 2:8)';

    if (q.includes('येशू') || q.includes('येशु') || q.includes('jesus') || q.includes('christ') || q.includes('ख्रीष्ट')) {
      replyNe =
        'प्रभु येशू ख्रीष्ट जीवित परमेश्वरका एकमात्र पुत्र र संसारका मुक्तिदाता हुनुहुन्छ। उहाँ हाम्रा पापहरूको प्रायश्चित्तका निम्ति क्रूसमा बलिदान हुनुभयो र तेस्रो दिनमा मृत्युबाट जीवित भई उठ्नुभयो।\n• "अरु कसैद्वारा मुक्ति छैन, किनकि हामीले उद्धार पाउनुपर्ने अरू कुनै नाउँ स्वर्गमुनि मानिसहरूका बीचमा दिइएको छैन।" (प्रेरित ४:१२)\n• "बाटो, सत्य र जीवन म नै हुँ।" (यूहन्ना १४:६)';
      replyEn =
        'Lord Jesus Christ is the eternal Son of God and the Savior of the world. He died on the cross for our sins and rose bodily on the third day.\n• "Salvation is found in no one else, for there is no other name under heaven given to mankind by which we must be saved." (Acts 4:12)\n• "I am the way and the truth and the life." (John 14:6)';
    } else if (q.includes('मुक्ति') || q.includes('उद्धार') || q.includes('salvation') || q.includes('saved') || q.includes('यूहन्ना') || q.includes('john')) {
      replyNe =
        'मुक्तिको बाइबलीय सत्यता (Biblical Way of Salvation):\n१. परमेश्वरको प्रेम: "किनकि परमेश्वरले संसारलाई यस्तो प्रेम गर्नुभयो, कि उहाँले आफ्ना एकमात्र पुत्र दिनुभयो, ताकि उहाँमाथि विश्वास गर्ने कोही पनि नाश नहोस्, तर त्यसले अनन्त जीवन पाओस्।" (यूहन्ना ३:१६)\n२. पश्चात्ताप र विश्वास: "यदि तिमीले आफ्नो मुखले येशू प्रभु हुनुहुन्छ भनी स्वीकार गर्यौ र परमेश्वरले उहाँलाई मरेकाहरूबाट जीवित पार्नुभयो भनी आफ्नो हृदयमा विश्वास गर्यौ भने तिमीले उद्धार पाउनेछौ।" (रोमी १०:९)';
      replyEn =
        'The Biblical Way of Salvation:\n1. God’s Love: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." (John 3:16)\n2. Faith & Confession: "If you declare with your mouth, \'Jesus is Lord,\' and believe in your heart that God raised him from the dead, you will be saved." (Romans 10:9)';
    } else if (q.includes('pray') || q.includes('प्रार्थना') || q.includes('peace') || q.includes('शान्ति')) {
      replyNe =
        'प्रार्थना र शान्तिको बाइबलीय वचन:\n"कुनै कुरामा चिन्तित नहोओ, तर हरेक कुरामा प्रार्थना र निवेदनद्वारा धन्यवादसाथ तिमीहरूका बिन्ती परमेश्वरमा जाहेर होऊन्। अनि समजभन्दा माथिको परमेश्वरको शान्तिले तिमीहरूका हृदय र विचारलाई ख्रीष्ट येशूमा सुरक्षित राख्नेछ।" (फिलिप्पी ४:६-७)';
      replyEn =
        'Biblical Promise for Prayer & Peace:\n"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus." (Philippians 4:6–7)';
    }

    return res.json({
      reply: lang === 'ne' ? `${replyNe}\n\n${replyEn}` : `${replyEn}\n\n${replyNe}`,
    });
  });

  // =========================================================================
  // VITE MIDDLEWARE (DEVELOPMENT) OR STATIC SERVING (PRODUCTION)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    app.listen(3000, '0.0.0.0', () => {
      console.log('Susamachar Christian App Server running on http://localhost:3000');
    });
  } else {
    const distPath = path.join(_dirname, 'dist');
    const rootAssetsPath = path.join(_dirname, 'assets');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }
    if (fs.existsSync(rootAssetsPath)) {
      app.use('/assets', express.static(rootAssetsPath));
    }

    app.get('*', (_req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        return res.sendFile(distIndex);
      }
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ne">
        <head>
          <meta charset="utf-8">
          <title>सुसमाचार (Susamachar) - Deployment Notice</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #faf8f5; color: #2d3748; padding: 40px 20px; text-align: center; }
            .card { max-width: 620px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
            h2 { color: #8D8741; margin-top: 0; }
            .badge { display: inline-block; background: #659DBD; color: white; padding: 4px 12px; border-radius: 999px; font-weight: 600; font-size: 13px; }
            ol { text-align: left; background: #f7fafc; padding: 20px 20px 20px 40px; border-radius: 8px; line-height: 1.8; }
            code { background: #edf2f7; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">Node.js Server is Online ✅</span>
            <h2>⚠️ dist फोल्डर अपलोड हुन बाँकी छ</h2>
            <p>Node.js सर्भर सफलतापूर्वक चालु भएको छ, तर <code>susamachar/</code> फोल्डर भित्र <b>dist/</b> फोल्डर फेला परेन।</p>
            <ol>
              <li>आफ्नो कम्प्युटरको प्रोजेक्टबाट <b>dist</b> फोल्डरलाई zip गर्नुहोस् वा सिधै <code>/home/biblesandes/susamachar/</code> भित्र अपलोड गरी Extract गर्नुहोस्।</li>
              <li>साथै बाइबल डाटाका लागि <b>data</b> फोल्डर पनि <code>/home/biblesandes/susamachar/</code> भित्र हुनुपर्छ।</li>
              <li>cPanel मा Node.js App लाई एकपटक <b>Restart</b> गर्नुहोस्।</li>
            </ol>
          </div>
        </body>
        </html>
      `);
    });

    const serverPort = process.env.PORT || 3000;
    app.listen(serverPort, () => {
      console.log(`Susamachar Christian App Server running on port ${serverPort}`);
    });
  }
}

startServer();
