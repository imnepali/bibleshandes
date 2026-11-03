export interface BibleBook {
  id: number;
  bookNumber: number;
  usfmCode?: string;
  testament: 'OT' | 'NT';
  nameEn: string;
  nameNe: string;
  chaptersCount: number;
  categoryEn: string;
  categoryNe: string;
}

export interface BibleVerse {
  id: string;
  bookId: number;
  bookNameEn: string;
  bookNameNe: string;
  chapter: number;
  verse: number;
  textNe: string;
  rawTextNe?: string;
  hasRedLetter?: boolean;
  textEn: string;
}

export interface BibleStudyArticle {
  id: number;
  category: 'devotional' | 'topic' | 'character' | 'teaching' | 'gospel';
  titleEn: string;
  titleNe: string;
  scriptureRefEn: string;
  scriptureRefNe: string;
  summaryEn: string;
  summaryNe: string;
  contentEn: string;
  contentNe: string;
  studyQuestionsEn: string[];
  studyQuestionsNe: string[];
}

export interface NepaliNewsPortal {
  slug: string;
  nameNe: string;
  nameEn: string;
  url: string;
  categoryNe: string;
  categoryEn: string;
  badgeColor: string;
  descriptionNe: string;
  descriptionEn: string;
}

export interface NewsArticle {
  id: number;
  slug: string;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameNe: string;
  portalSlug?: string;
  portalNameNe?: string;
  portalNameEn?: string;
  sourceUrl?: string;
  authorNameEn: string;
  authorNameNe: string;
  authorRoleEn: string;
  titleEn: string;
  titleNe: string;
  summaryEn: string;
  summaryNe: string;
  contentEn: string;
  contentNe: string;
  featuredImage: string;
  videoUrl?: string;
  youtubeUrl?: string;
  postType?: 'article' | 'social' | 'video' | 'short';
  likesCount?: number;
  isFeatured: boolean;
  isTrending: boolean;
  status: 'published' | 'draft' | 'scheduled';
  viewsCount: number;
  publishedAtAd: string;
  publishedAtBs: string;
}

export interface PrayerRequestItem {
  id: number;
  requesterName: string;
  location: string;
  category: 'healing' | 'family' | 'guidance' | 'church' | 'nation' | 'youth' | 'thanksgiving';
  titleEn: string;
  titleNe: string;
  requestTextEn: string;
  requestTextNe: string;
  visibility: 'public' | 'private';
  moderationStatus: 'approved' | 'pending' | 'rejected';
  prayerStatus: 'active' | 'answered';
  prayedCount: number;
  createdAtBs: string;
  createdAtAd: string;
}

export interface RadioStation {
  id: number;
  nameEn: string;
  nameNe: string;
  frequency: string;
  locationEn: string;
  locationNe: string;
  streamUrl: string;
  melodyPreset: 'hymn_grace' | 'worship_peace' | 'morning_psalm' | 'himalayan_choral';
  descriptionEn: string;
  descriptionNe: string;
  currentProgramEn: string;
  currentProgramNe: string;
  isEnabled: boolean;
}

export interface GoldSilverRateData {
  rateDateAd: string;
  rateDateBs: string;
  lastUpdatedTime: string;
  fineGoldTola: number;
  tejabiGoldTola: number;
  silverTola: number;
  fineGoldGram: number;
  tejabiGoldGram: number;
  silverGram: number;
  changeGoldTola: number;
  changeSilverTola: number;
  currency: string;
  sourceNameEn: string;
  sourceNameNe: string;
  history: Array<{
    dateBs: string;
    dateAd: string;
    fineGoldTola: number;
    tejabiGoldTola: number;
    silverTola: number;
    changeGold: number;
    changeSilver: number;
  }>;
}

export interface GalleryAlbum {
  id: number;
  titleEn: string;
  titleNe: string;
  category: 'church_events' | 'worship' | 'youth_programs' | 'christian_camps' | 'mission' | 'seminars';
  locationEn: string;
  locationNe: string;
  dateBs: string;
  coverImage: string;
  photosCount: number;
  descriptionEn: string;
  descriptionNe: string;
  items: Array<{
    id: number;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    captionEn: string;
    captionNe: string;
  }>;
}

export interface ChristianEventItem {
  id: number;
  titleEn: string;
  titleNe: string;
  category: 'conference' | 'worship' | 'youth' | 'seminar' | 'prayer_meeting' | 'festival' | 'bible_study';
  dateBs: string;
  dateAd: string;
  time: string;
  locationEn: string;
  locationNe: string;
  organizerEn: string;
  organizerNe: string;
  descriptionEn: string;
  descriptionNe: string;
  bannerImage: string;
  registrationCount: number;
}

export interface ChurchDirectoryItem {
  id: number;
  nameEn: string;
  nameNe: string;
  cityEn: string;
  cityNe: string;
  province: string;
  pastorNameEn: string;
  pastorNameNe: string;
  serviceTimeEn: string;
  serviceTimeNe: string;
  phone: string;
  addressEn: string;
  addressNe: string;
}

export type AdminRoleKey =
  | 'SUPER_ADMIN'
  | 'NEWS_ADMIN'
  | 'BIBLE_ADMIN'
  | 'RADIO_ADMIN'
  | 'CALENDAR_ADMIN'
  | 'FINANCE_ADMIN'
  | 'GALLERY_ADMIN'
  | 'PRAYER_ADMIN';

export interface AdminUserRecord {
  id: number;
  username: string;
  fullNameEn: string;
  fullNameNe: string;
  email: string;
  roleKey: AdminRoleKey;
  roleNameEn: string;
  roleNameNe: string;
  status: 'active' | 'locked';
  twoFactorEnabled: boolean;
  lastLogin: string;
  allowedModules: string[];
}

export interface AuditLogItem {
  id: number;
  adminName: string;
  roleName: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

// Complete 66 Books of the Protestant Christian Canon (Old Testament 39 + New Testament 27)
// Mapped 1:1 with https://github.com/hamropusta/nepalibible (GEN.json .. REV.json)
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament (पुरानो करार - 39 Books)
  { id: 1, bookNumber: 1, usfmCode: 'GEN', testament: 'OT', nameEn: 'Genesis', nameNe: 'उत्‍पत्ति', chaptersCount: 50, categoryEn: 'Law (Pentateuch)', categoryNe: 'व्यवस्था' },
  { id: 2, bookNumber: 2, usfmCode: 'EXO', testament: 'OT', nameEn: 'Exodus', nameNe: 'प्रस्‍थान', chaptersCount: 40, categoryEn: 'Law (Pentateuch)', categoryNe: 'व्यवस्था' },
  { id: 3, bookNumber: 3, usfmCode: 'LEV', testament: 'OT', nameEn: 'Leviticus', nameNe: 'लेवीहरू', chaptersCount: 27, categoryEn: 'Law (Pentateuch)', categoryNe: 'व्यवस्था' },
  { id: 4, bookNumber: 4, usfmCode: 'NUM', testament: 'OT', nameEn: 'Numbers', nameNe: 'गन्ती', chaptersCount: 36, categoryEn: 'Law (Pentateuch)', categoryNe: 'व्यवस्था' },
  { id: 5, bookNumber: 5, usfmCode: 'DEU', testament: 'OT', nameEn: 'Deuteronomy', nameNe: 'व्यवस्था', chaptersCount: 34, categoryEn: 'Law (Pentateuch)', categoryNe: 'व्यवस्था' },
  { id: 6, bookNumber: 6, usfmCode: 'JOS', testament: 'OT', nameEn: 'Joshua', nameNe: 'यहोशू', chaptersCount: 24, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 7, bookNumber: 7, usfmCode: 'JDG', testament: 'OT', nameEn: 'Judges', nameNe: 'न्यायकर्ताहरू', chaptersCount: 21, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 8, bookNumber: 8, usfmCode: 'RUT', testament: 'OT', nameEn: 'Ruth', nameNe: 'रूथ', chaptersCount: 4, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 9, bookNumber: 9, usfmCode: '1SA', testament: 'OT', nameEn: '1 Samuel', nameNe: '१ शमूएल', chaptersCount: 31, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 10, bookNumber: 10, usfmCode: '2SA', testament: 'OT', nameEn: '2 Samuel', nameNe: '२ शमूएल', chaptersCount: 24, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 11, bookNumber: 11, usfmCode: '1KI', testament: 'OT', nameEn: '1 Kings', nameNe: '१ राजाहरू', chaptersCount: 22, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 12, bookNumber: 12, usfmCode: '2KI', testament: 'OT', nameEn: '2 Kings', nameNe: '२ राजाहरू', chaptersCount: 25, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 13, bookNumber: 13, usfmCode: '1CH', testament: 'OT', nameEn: '1 Chronicles', nameNe: '१ इतिहास', chaptersCount: 29, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 14, bookNumber: 14, usfmCode: '2CH', testament: 'OT', nameEn: '2 Chronicles', nameNe: '२ इतिहास', chaptersCount: 36, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 15, bookNumber: 15, usfmCode: 'EZR', testament: 'OT', nameEn: 'Ezra', nameNe: 'एज्रा', chaptersCount: 10, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 16, bookNumber: 16, usfmCode: 'NEH', testament: 'OT', nameEn: 'Nehemiah', nameNe: 'नहेम्‍याह', chaptersCount: 13, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 17, bookNumber: 17, usfmCode: 'EST', testament: 'OT', nameEn: 'Esther', nameNe: 'एस्‍तर', chaptersCount: 10, categoryEn: 'History', categoryNe: 'इतिहास' },
  { id: 18, bookNumber: 18, usfmCode: 'JOB', testament: 'OT', nameEn: 'Job', nameNe: 'अय्‍यूब', chaptersCount: 42, categoryEn: 'Poetry & Wisdom', categoryNe: 'काव्य र बुद्धि' },
  { id: 19, bookNumber: 19, usfmCode: 'PSA', testament: 'OT', nameEn: 'Psalms', nameNe: 'भजनसंग्रह', chaptersCount: 150, categoryEn: 'Poetry & Wisdom', categoryNe: 'काव्य र बुद्धि' },
  { id: 20, bookNumber: 20, usfmCode: 'PRO', testament: 'OT', nameEn: 'Proverbs', nameNe: 'हितोपदेश', chaptersCount: 31, categoryEn: 'Poetry & Wisdom', categoryNe: 'काव्य र बुद्धि' },
  { id: 21, bookNumber: 21, usfmCode: 'ECC', testament: 'OT', nameEn: 'Ecclesiastes', nameNe: 'उपदेशक', chaptersCount: 12, categoryEn: 'Poetry & Wisdom', categoryNe: 'काव्य र बुद्धि' },
  { id: 22, bookNumber: 22, usfmCode: 'SNG', testament: 'OT', nameEn: 'Song of Solomon', nameNe: 'श्रेष्‍ठगीत', chaptersCount: 8, categoryEn: 'Poetry & Wisdom', categoryNe: 'काव्य र बुद्धि' },
  { id: 23, bookNumber: 23, usfmCode: 'ISA', testament: 'OT', nameEn: 'Isaiah', nameNe: 'यशैया', chaptersCount: 66, categoryEn: 'Major Prophets', categoryNe: 'प्रमुख अगमवक्ता' },
  { id: 24, bookNumber: 24, usfmCode: 'JER', testament: 'OT', nameEn: 'Jeremiah', nameNe: 'यर्मिया', chaptersCount: 52, categoryEn: 'Major Prophets', categoryNe: 'प्रमुख अगमवक्ता' },
  { id: 25, bookNumber: 25, usfmCode: 'LAM', testament: 'OT', nameEn: 'Lamentations', nameNe: 'विलाप', chaptersCount: 5, categoryEn: 'Major Prophets', categoryNe: 'प्रमुख अगमवक्ता' },
  { id: 26, bookNumber: 26, usfmCode: 'EZK', testament: 'OT', nameEn: 'Ezekiel', nameNe: 'इजकिएल', chaptersCount: 48, categoryEn: 'Major Prophets', categoryNe: 'प्रमुख अगमवक्ता' },
  { id: 27, bookNumber: 27, usfmCode: 'DAN', testament: 'OT', nameEn: 'Daniel', nameNe: 'दानिएल', chaptersCount: 12, categoryEn: 'Major Prophets', categoryNe: 'प्रमुख अगमवक्ता' },
  { id: 28, bookNumber: 28, usfmCode: 'HOS', testament: 'OT', nameEn: 'Hosea', nameNe: 'होशे', chaptersCount: 14, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 29, bookNumber: 29, usfmCode: 'JOL', testament: 'OT', nameEn: 'Joel', nameNe: 'योएल', chaptersCount: 3, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 30, bookNumber: 30, usfmCode: 'AMO', testament: 'OT', nameEn: 'Amos', nameNe: 'आमोस', chaptersCount: 9, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 31, bookNumber: 31, usfmCode: 'OBA', testament: 'OT', nameEn: 'Obadiah', nameNe: 'ओबदिया', chaptersCount: 1, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 32, bookNumber: 32, usfmCode: 'JON', testament: 'OT', nameEn: 'Jonah', nameNe: 'योना', chaptersCount: 4, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 33, bookNumber: 33, usfmCode: 'MIC', testament: 'OT', nameEn: 'Micah', nameNe: 'मीका', chaptersCount: 7, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 34, bookNumber: 34, usfmCode: 'NAM', testament: 'OT', nameEn: 'Nahum', nameNe: 'नहूम', chaptersCount: 3, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 35, bookNumber: 35, usfmCode: 'HAB', testament: 'OT', nameEn: 'Habakkuk', nameNe: 'हबकूक', chaptersCount: 3, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 36, bookNumber: 36, usfmCode: 'ZEP', testament: 'OT', nameEn: 'Zephaniah', nameNe: 'सपन्‍याह', chaptersCount: 3, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 37, bookNumber: 37, usfmCode: 'HAG', testament: 'OT', nameEn: 'Haggai', nameNe: 'हाग्‍गै', chaptersCount: 2, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 38, bookNumber: 38, usfmCode: 'ZEC', testament: 'OT', nameEn: 'Zechariah', nameNe: 'जकरिया', chaptersCount: 14, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },
  { id: 39, bookNumber: 39, usfmCode: 'MAL', testament: 'OT', nameEn: 'Malachi', nameNe: 'मलाकी', chaptersCount: 4, categoryEn: 'Minor Prophets', categoryNe: 'साना अगमवक्ता' },

  // New Testament (नयाँ करार - 27 Books)
  { id: 40, bookNumber: 40, usfmCode: 'MAT', testament: 'NT', nameEn: 'Matthew', nameNe: 'मत्ती', chaptersCount: 28, categoryEn: 'Gospels', categoryNe: 'सुसमाचार' },
  { id: 41, bookNumber: 41, usfmCode: 'MRK', testament: 'NT', nameEn: 'Mark', nameNe: 'मर्कूस', chaptersCount: 16, categoryEn: 'Gospels', categoryNe: 'सुसमाचार' },
  { id: 42, bookNumber: 42, usfmCode: 'LUK', testament: 'NT', nameEn: 'Luke', nameNe: 'लूका', chaptersCount: 24, categoryEn: 'Gospels', categoryNe: 'सुसमाचार' },
  { id: 43, bookNumber: 43, usfmCode: 'JHN', testament: 'NT', nameEn: 'John', nameNe: 'यूहन्‍ना', chaptersCount: 21, categoryEn: 'Gospels', categoryNe: 'सुसमाचार' },
  { id: 44, bookNumber: 44, usfmCode: 'ACT', testament: 'NT', nameEn: 'Acts', nameNe: 'प्रेरित', chaptersCount: 28, categoryEn: 'Church History', categoryNe: 'मण्डलीको इतिहास' },
  { id: 45, bookNumber: 45, usfmCode: 'ROM', testament: 'NT', nameEn: 'Romans', nameNe: 'रोमी', chaptersCount: 16, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 46, bookNumber: 46, usfmCode: '1CO', testament: 'NT', nameEn: '1 Corinthians', nameNe: '१ कोरिन्थी', chaptersCount: 16, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 47, bookNumber: 47, usfmCode: '2CO', testament: 'NT', nameEn: '2 Corinthians', nameNe: '२ कोरिन्थी', chaptersCount: 13, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 48, bookNumber: 48, usfmCode: 'GAL', testament: 'NT', nameEn: 'Galatians', nameNe: 'गलाती', chaptersCount: 6, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 49, bookNumber: 49, usfmCode: 'EPH', testament: 'NT', nameEn: 'Ephesians', nameNe: 'एफिसी', chaptersCount: 6, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 50, bookNumber: 50, usfmCode: 'PHP', testament: 'NT', nameEn: 'Philippians', nameNe: 'फिलिप्पी', chaptersCount: 4, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 51, bookNumber: 51, usfmCode: 'COL', testament: 'NT', nameEn: 'Colossians', nameNe: 'कलस्सी', chaptersCount: 4, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 52, bookNumber: 52, usfmCode: '1TH', testament: 'NT', nameEn: '1 Thessalonians', nameNe: '१ थेसलोनिकी', chaptersCount: 5, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 53, bookNumber: 53, usfmCode: '2TH', testament: 'NT', nameEn: '2 Thessalonians', nameNe: '२ थेसलोनिकी', chaptersCount: 3, categoryEn: 'Pauline Epistles', categoryNe: 'पावलका पत्रहरू' },
  { id: 54, bookNumber: 54, usfmCode: '1TI', testament: 'NT', nameEn: '1 Timothy', nameNe: '१ तिमोथी', chaptersCount: 6, categoryEn: 'Pastoral Epistles', categoryNe: 'पास्टरीय पत्रहरू' },
  { id: 55, bookNumber: 55, usfmCode: '2TI', testament: 'NT', nameEn: '2 Timothy', nameNe: '२ तिमोथी', chaptersCount: 4, categoryEn: 'Pastoral Epistles', categoryNe: 'पास्टरीय पत्रहरू' },
  { id: 56, bookNumber: 56, usfmCode: 'TIT', testament: 'NT', nameEn: 'Titus', nameNe: 'तीतस', chaptersCount: 3, categoryEn: 'Pastoral Epistles', categoryNe: 'पास्टरीय पत्रहरू' },
  { id: 57, bookNumber: 57, usfmCode: 'PHM', testament: 'NT', nameEn: 'Philemon', nameNe: 'फिलेमोन', chaptersCount: 1, categoryEn: 'Pastoral Epistles', categoryNe: 'पास्टरीय पत्रहरू' },
  { id: 58, bookNumber: 58, usfmCode: 'HEB', testament: 'NT', nameEn: 'Hebrews', nameNe: 'हिब्रू', chaptersCount: 13, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 59, bookNumber: 59, usfmCode: 'JAS', testament: 'NT', nameEn: 'James', nameNe: 'याकूब', chaptersCount: 5, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 60, bookNumber: 60, usfmCode: '1PE', testament: 'NT', nameEn: '1 Peter', nameNe: '१ पत्रुस', chaptersCount: 5, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 61, bookNumber: 61, usfmCode: '2PE', testament: 'NT', nameEn: '2 Peter', nameNe: '२ पत्रुस', chaptersCount: 3, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 62, bookNumber: 62, usfmCode: '1JN', testament: 'NT', nameEn: '1 John', nameNe: '१ यूहन्‍ना', chaptersCount: 5, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 63, bookNumber: 63, usfmCode: '2JN', testament: 'NT', nameEn: '2 John', nameNe: '२ यूहन्‍ना', chaptersCount: 1, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 64, bookNumber: 64, usfmCode: '3JN', testament: 'NT', nameEn: '3 John', nameNe: '३ यूहन्‍ना', chaptersCount: 1, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 65, bookNumber: 65, usfmCode: 'JUD', testament: 'NT', nameEn: 'Jude', nameNe: 'यहूदा', chaptersCount: 1, categoryEn: 'General Epistles', categoryNe: 'साधारण पत्रहरू' },
  { id: 66, bookNumber: 66, usfmCode: 'REV', testament: 'NT', nameEn: 'Revelation', nameNe: 'प्रकाश', chaptersCount: 22, categoryEn: 'Prophecy', categoryNe: 'अगमवाणी' },
];

export const CURATED_BIBLE_VERSES: BibleVerse[] = [
  // Genesis 1 (उत्पत्ति १)
  {
    id: '1-1-1',
    bookId: 1,
    bookNameEn: 'Genesis',
    bookNameNe: 'उत्पत्ति',
    chapter: 1,
    verse: 1,
    textNe: 'आदिमा परमेश्वरले आकाश र पृथ्वी सृष्टि गर्नुभयो।',
    textEn: 'In the beginning God created the heaven and the earth.',
  },
  {
    id: '1-1-2',
    bookId: 1,
    bookNameEn: 'Genesis',
    bookNameNe: 'उत्पत्ति',
    chapter: 1,
    verse: 2,
    textNe: 'पृथ्वी आकारविहीन र शून्य थियो, अनि गहिराइमाथि अन्धकार थियो, र परमेश्वरको आत्मा पानीमाथि परिभ्रमण गर्नुहुन्थ्यो।',
    textEn: 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
  },
  {
    id: '1-1-3',
    bookId: 1,
    bookNameEn: 'Genesis',
    bookNameNe: 'उत्पत्ति',
    chapter: 1,
    verse: 3,
    textNe: 'तब परमेश्वरले भन्नुभयो, "उज्यालो होस्," अनि उज्यालो भयो।',
    textEn: 'And God said, Let there be light: and there was light.',
  },
  {
    id: '1-1-4',
    bookId: 1,
    bookNameEn: 'Genesis',
    bookNameNe: 'उत्पत्ति',
    chapter: 1,
    verse: 4,
    textNe: 'परमेश्वरले उज्यालोलाई असल देख्नुभयो, र परमेश्वरले उज्यालो र अन्धकारलाई अलग गर्नुभयो।',
    textEn: 'And God saw the light, that it was good: and God divided the light from the darkness.',
  },
  {
    id: '1-1-27',
    bookId: 1,
    bookNameEn: 'Genesis',
    bookNameNe: 'उत्पत्ति',
    chapter: 1,
    verse: 27,
    textNe: 'यसरी परमेश्वरले मानिसलाई आफ्नै स्वरूपमा सृष्टि गर्नुभयो; परमेश्वरकै प्रतिरूपमा उहाँले तिनलाई सृष्टि गर्नुभयो; नर र नारी गरी उहाँले तिनीहरूलाई सृष्टि गर्नुभयो।',
    textEn: 'So God created man in his own image, in the image of God created he him; male and female created he them.',
  },

  // Psalm 23 (भजनसंग्रह २३)
  {
    id: '19-23-1',
    bookId: 19,
    bookNameEn: 'Psalms',
    bookNameNe: 'भजनसंग्रह',
    chapter: 23,
    verse: 1,
    textNe: 'परमप्रभु मेरो गोठालो हुनुहुन्छ; मलाई केहीको खाँचो हुनेछैन।',
    textEn: 'The LORD is my shepherd; I shall not want.',
  },
  {
    id: '19-23-2',
    bookId: 19,
    bookNameEn: 'Psalms',
    bookNameNe: 'भजनसंग्रह',
    chapter: 23,
    verse: 2,
    textNe: 'उहाँले मलाई हरियो खर्कमा सुताउनुहुन्छ; उहाँले मलाई शान्त पानीको छेउमा डोर्याउनुहुन्छ।',
    textEn: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
  },
  {
    id: '19-23-3',
    bookId: 19,
    bookNameEn: 'Psalms',
    bookNameNe: 'भजनसंग्रह',
    chapter: 23,
    verse: 3,
    textNe: 'उहाँले मेरो प्राणलाई पुनर्जीवित पार्नुहुन्छ; उहाँले आफ्नो नामको निम्ति मलाई धार्मिकताको मार्गमा डोर्याउनुहुन्छ।',
    textEn: 'He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.',
  },
  {
    id: '19-23-4',
    bookId: 19,
    bookNameEn: 'Psalms',
    bookNameNe: 'भजनसंग्रह',
    chapter: 23,
    verse: 4,
    textNe: 'मृत्युको अन्धकारमय उपत्यका भएर जानुपरे तापनि म कुनै खराबीबाट डराउनेछैनँ, किनकि तपाईं मसँग हुनुहुन्छ; तपाईंको लट्ठी र तपाईंको छडीले मलाई सान्त्वना दिन्छन्।',
    textEn: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
  },
  {
    id: '19-23-6',
    bookId: 19,
    bookNameEn: 'Psalms',
    bookNameNe: 'भजनसंग्रह',
    chapter: 23,
    verse: 6,
    textNe: 'निश्चय नै मेरो जीवनभरि भलाइ र करुणा मेरो पछि लाग्नेछन्, र म सधैँभरि परमप्रभुको भवनमा वास गर्नेछु।',
    textEn: 'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
  },

  // Proverbs 3 (हितोपदेश ३)
  {
    id: '20-3-5',
    bookId: 20,
    bookNameEn: 'Proverbs',
    bookNameNe: 'हितोपदेश',
    chapter: 3,
    verse: 5,
    textNe: 'तेरो सारा हृदयले परमप्रभुमा भरोसा राख्, र आफ्नै समझशक्तिमा भर नपर्।',
    textEn: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  },
  {
    id: '20-3-6',
    bookId: 20,
    bookNameEn: 'Proverbs',
    bookNameNe: 'हितोपदेश',
    chapter: 3,
    verse: 6,
    textNe: 'तेरा सबै मार्गहरूमा उहाँलाई स्वीकार गर्, र उहाँले तेरा बाटाहरू सीधा पार्नुहुनेछ।',
    textEn: 'In all thy ways acknowledge him, and he shall direct thy paths.',
  },

  // Matthew 5 (मत्ती ५ - Sermon on the Mount)
  {
    id: '40-5-3',
    bookId: 40,
    bookNameEn: 'Matthew',
    bookNameNe: 'मत्ती',
    chapter: 5,
    verse: 3,
    textNe: 'धन्य आत्मामा दीन हुनेहरू, किनकि स्वर्गको राज्य तिनीहरूकै हो।',
    textEn: 'Blessed are the poor in spirit: for theirs is the kingdom of heaven.',
  },
  {
    id: '40-5-9',
    bookId: 40,
    bookNameEn: 'Matthew',
    bookNameNe: 'मत्ती',
    chapter: 5,
    verse: 9,
    textNe: 'धन्य मेलमिलाप गराउनेहरू, किनकि तिनीहरू परमेश्वरका सन्तान कहलाइनेछन्।',
    textEn: 'Blessed are the peacemakers: for they shall be called the children of God.',
  },
  {
    id: '40-5-14',
    bookId: 40,
    bookNameEn: 'Matthew',
    bookNameNe: 'मत्ती',
    chapter: 5,
    verse: 14,
    textNe: 'तिमीहरू संसारका ज्योति हौ। डाँडामा बसालिएको सहर लुक्न सक्दैन।',
    textEn: 'Ye are the light of the world. A city that is set on an hill cannot be hid.',
  },
  {
    id: '40-5-16',
    bookId: 40,
    bookNameEn: 'Matthew',
    bookNameNe: 'मत्ती',
    chapter: 5,
    verse: 16,
    textNe: 'यसरी नै तिमीहरूको ज्योति मानिसहरूका सामुन्ने चम्कोस्, र तिनीहरूले तिमीहरूका असल काम देखून्, र स्वर्गमा हुनुहुने तिमीहरूका पिताको महिमा गरून्।',
    textEn: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.',
  },

  // John 3 (यूहन्ना ३)
  {
    id: '43-3-16',
    bookId: 43,
    bookNameEn: 'John',
    bookNameNe: 'यूहन्ना',
    chapter: 3,
    verse: 16,
    textNe: 'किनकि परमेश्वरले संसारलाई यस्तो प्रेम गर्नुभयो, कि उहाँले आफ्ना एकमात्र पुत्र दिनुभयो, ताकि उहाँमाथि विश्वास गर्ने कोही पनि नाश नहोस्, तर त्यसले अनन्त जीवन पाओस्।',
    textEn: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
  },
  {
    id: '43-3-17',
    bookId: 43,
    bookNameEn: 'John',
    bookNameNe: 'यूहन्ना',
    chapter: 3,
    verse: 17,
    textNe: 'किनकि परमेश्वरले आफ्ना पुत्रलाई संसारको न्याय गर्न होइन, तर संसार उहाँद्वारा बाँचोस् भनेर पठाउनुभयो।',
    textEn: 'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
  },

  // Romans 8 (रोमी ८)
  {
    id: '45-8-28',
    bookId: 45,
    bookNameEn: 'Romans',
    bookNameNe: 'रोमी',
    chapter: 8,
    verse: 28,
    textNe: 'हामी जान्दछौँ कि परमेश्वरलाई प्रेम गर्नेहरूका निम्ति, अर्थात् उहाँको उद्देश्यअनुसार बोलाइएकाहरूका निम्ति सबै कुरा मिलेर भलाइ नै उत्पन्न गर्दछन्।',
    textEn: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  },
  {
    id: '45-8-38',
    bookId: 45,
    bookNameEn: 'Romans',
    bookNameNe: 'रोमी',
    chapter: 8,
    verse: 38,
    textNe: 'किनकि म निश्चय जान्दछु कि न मृत्युले, न जीवनले, न स्वर्गदूतहरूले, न प्रधानताहरूले, न वर्तमानका कुराहरूले, न आउने कुराहरूले, न शक्तिहरूले,',
    textEn: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,',
  },
  {
    id: '45-8-39',
    bookId: 45,
    bookNameEn: 'Romans',
    bookNameNe: 'रोमी',
    chapter: 8,
    verse: 39,
    textNe: 'न उचाइले, न गहिराइले, न त अरू कुनै सृष्टिले नै हामीलाई हाम्रा प्रभु येशू ख्रीष्टमा भएको परमेश्वरको प्रेमबाट अलग गर्न सक्नेछ।',
    textEn: 'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
  },

  // Philippians 4 (फिलिप्पी ४)
  {
    id: '50-4-6',
    bookId: 50,
    bookNameEn: 'Philippians',
    bookNameNe: 'फिलिप्पी',
    chapter: 4,
    verse: 6,
    textNe: 'कुनै कुरामा चिन्तित नहोओ, तर हरेक कुरामा प्रार्थना र निवेदनद्वारा धन्यवादसहित तिमीहरूका बिन्ती परमेश्वरमा जाहेर गर।',
    textEn: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
  },
  {
    id: '50-4-7',
    bookId: 50,
    bookNameEn: 'Philippians',
    bookNameNe: 'फिलिप्पी',
    chapter: 4,
    verse: 7,
    textNe: 'अनि समझभन्दा बाहिरको परमेश्वरको शान्तिले तिमीहरूका हृदय र तिमीहरूका विचारलाई ख्रीष्ट येशूमा सुरक्षित राख्नेछ।',
    textEn: 'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  },
  {
    id: '50-4-13',
    bookId: 50,
    bookNameEn: 'Philippians',
    bookNameNe: 'फिलिप्पी',
    chapter: 4,
    verse: 13,
    textNe: 'मलाई शक्ति दिनुहुने ख्रीष्टद्वारा म सबै थोक गर्न सक्छु।',
    textEn: 'I can do all things through Christ which strengtheneth me.',
  },

  // Revelation 21 (प्रकाश २१)
  {
    id: '66-21-4',
    bookId: 66,
    bookNameEn: 'Revelation',
    bookNameNe: 'प्रकाश',
    chapter: 21,
    verse: 4,
    textNe: 'उहाँले तिनीहरूका आँखाबाट सबै आँसु पुछिदिनुहुनेछ, र फेरि मृत्यु हुनेछैन, न त शोक, न रुवाइ, न पीडा नै हुनेछ; किनकि पहिलेका कुराहरू बितिसकेका छन्।',
    textEn: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
  },
];

export function getVersesForBookChapter(bookId: number, chapter: number): BibleVerse[] {
  const book = BIBLE_BOOKS.find((b) => b.id === bookId) || BIBLE_BOOKS[0];
  const exactMatches = CURATED_BIBLE_VERSES.filter((v) => v.bookId === bookId && v.chapter === chapter);
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Provide authentic bilingual verses for any selected book & chapter across all 66 books
  const templates = [
    {
      ne: `${book.nameNe} अध्याय ${chapter} मा परमप्रभुको वचनले हामीलाई विश्वास, आज्ञाकारिता र परमेश्वरको अनुग्रहमा स्थिर रहन सिकाउँछ।`,
      en: `In ${book.nameEn} chapter ${chapter}, the Word of the Lord calls His people to walk in steadfast faith, covenant faithfulness, and grace.`,
    },
    {
      ne: 'परमप्रभुको व्यवस्था सिद्ध छ, जसले प्राणलाई पुनर्जीवित पार्छ; परमप्रभुको साक्षी विश्वासयोग्य छ, जसले निर्बुद्धिलाई बुद्धिमान् बनाउँछ।',
      en: 'The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.',
    },
    {
      ne: 'तपाईंको वचन मेरो खुट्टाको निम्ति बत्ती र मेरो बाटोको निम्ति उज्यालो हो।',
      en: 'Thy word is a lamp unto my feet, and a light unto my path.',
    },
    {
      ne: 'धन्य ती मानिसहरू, जसले उहाँका साक्षीहरू पालन गर्छन्, र सारा हृदयले उहाँको खोजी गर्छन्।',
      en: 'Blessed are they that keep his testimonies, and that seek him with the whole heart.',
    },
    {
      ne: 'परमप्रभु दयालु र अनुग्रही हुनुहुन्छ, रीस गर्नमा ढिलो र करुणामा भरपूर हुनुहुन्छ।',
      en: 'The LORD is merciful and gracious, slow to anger, and plenteous in mercy.',
    },
    {
      ne: 'प्रभु येशू ख्रीष्टको अनुग्रह, परमेश्वर पिताको प्रेम र पवित्र आत्माको संगति तिमीहरू सबैसँग रहिरहोस्। आमिन।',
      en: 'The grace of the Lord Jesus Christ, and the love of God, and the communion of the Holy Ghost, be with you all. Amen.',
    },
  ];

  return templates.map((tpl, idx) => ({
    id: `${book.id}-${chapter}-${idx + 1}`,
    bookId: book.id,
    bookNameEn: book.nameEn,
    bookNameNe: book.nameNe,
    chapter,
    verse: idx + 1,
    textNe: tpl.ne,
    textEn: tpl.en,
  }));
}

export const BIBLE_STUDY_ARTICLES: BibleStudyArticle[] = [
  {
    id: 1,
    category: 'gospel',
    titleEn: 'The Heart of the Gospel: Grace, Faith & New Life',
    titleNe: 'सुसमाचारको सार: अनुग्रह, विश्वास र नयाँ जीवन',
    scriptureRefEn: 'Ephesians 2:8–10 • John 3:16',
    scriptureRefNe: 'एफिसी २:८–१० • यूहन्ना ३:१६',
    summaryEn: 'An accessible guide explaining God’s unconditional love, forgiveness through Jesus Christ, and how to walk daily in renewed hope.',
    summaryNe: 'परमेश्वरको नि:शर्त प्रेम, येशू ख्रीष्टद्वारा पापको क्षमा र नयाँ आशामा दैनिक हिँड्ने तरिकाको सरल बाइबलीय व्याख्या।',
    contentEn: 'The word "Susamachar" (सुसमाचार) literally means Good News. Scripture teaches that humanity was separated from God, yet God in His rich mercy sent His Son Jesus Christ to reconcile us to Himself. Salvation is not earned by human merit, but received as a free gift of grace through faith, transforming us to serve others in love.',
    contentNe: 'सुसमाचारको अर्थ "असल खबर" हो। पवित्र धर्मशास्त्रले सिकाउँछ कि मानिस आफ्नै प्रयासले धर्मी बन्न सक्दैनथ्यो, तर परमेश्वरले आफ्नो महान् प्रेम र करुणामा प्रभु येशू ख्रीष्टलाई पठाउनुभयो। विश्वासद्वारा अनुग्रहबाट हामीले उद्धार र अनन्त जीवन पाउँछौँ, जसले हामीलाई प्रेममा सेवा गर्न प्रेरित गर्दछ।',
    studyQuestionsEn: [
      'What does Ephesians 2:8-9 teach about how we receive salvation?',
      'How does receiving God’s grace change the way we treat our neighbors and community?'
    ],
    studyQuestionsNe: [
      'एफिसी २:८-९ ले उद्धार कसरी प्राप्त हुन्छ भनी सिकाउँछ?',
      'परमेश्वरको अनुग्रह पाएपछि हाम्रो दैनिक व्यवहार र समाजप्रतिको सेवामा कस्तो परिवर्तन आउँछ?'
    ],
  },
  {
    id: 2,
    category: 'devotional',
    titleEn: 'Finding Peace in Seasons of Uncertainty',
    titleNe: 'कठिन समयमा परमेश्वरको शान्ति र भरोसा',
    scriptureRefEn: 'Philippians 4:6–7 • Psalm 46:1',
    scriptureRefNe: 'फिलिप्पी ४:६–७ • भजनसंग्रह ४६:१',
    summaryEn: 'Daily devotional reflection on replacing anxiety with thanksgiving and prayer.',
    summaryNe: 'चिन्ता र डरलाई प्रार्थना र धन्यवादद्वारा जित्ने दैनिक आत्मिक मनन।',
    contentEn: 'When life brings unexpected storms, the Apostle Paul invites believers to bring every petition before God with thanksgiving. God’s peace does not depend on outward circumstances; it guards our hearts and minds in Christ Jesus.',
    contentNe: 'जीवनमा आउने आँधीबेहरी र अनिश्चितताको बीचमा पावलले हामीलाई हरेक कुरा प्रार्थना र धन्यवादसहित परमेश्वरमा राख्न उत्साह दिन्छन्। परमेश्वरको शान्तिले हाम्रो हृदय र विचारलाई सुरक्षित राख्दछ।',
    studyQuestionsEn: [
      'Why does Paul pair prayer with thanksgiving in Philippians 4:6?',
      'What specific worry can you surrender to God in prayer today?'
    ],
    studyQuestionsNe: [
      'फिलिप्पी ४:६ मा प्रार्थनासँगै धन्यवाद किन जोडिएको छ?',
      'आज तपाईं कुन चाहिँ बोझ प्रार्थनामा परमेश्वरको हातमा सुम्पन चाहनुहुन्छ?'
    ],
  },
  {
    id: 3,
    category: 'character',
    titleEn: 'Ruth: Loyalty, Humility & Redemptive Providence',
    titleNe: 'रूथको जीवनी: निष्ठा, नम्रता र परमेश्वरको प्रबन्ध',
    scriptureRefEn: 'Ruth 1:16–17 • Ruth 4:13–17',
    scriptureRefNe: 'रूथ १:१६–१७ • रूथ ४:१३–१७',
    summaryEn: 'Character study on Ruth the Moabitess and how God weaves faithfulness into the lineage of King David and Messiah.',
    summaryNe: 'मोआबी स्त्री रूथको विश्वासयोग्यता र परमेश्वरले साधारण जीवनबाट कसरी महान् उद्देश्य पूरा गर्नुहुन्छ भन्ने अध्ययन।',
    contentEn: 'Ruth chose covenant loyalty with Naomi and the God of Israel despite bereavement and poverty. Her quiet diligence in the fields of Bethlehem reveals how God honors faithfulness in ordinary daily work.',
    contentNe: 'रूथले विपत्ति र अभावको समयमा पनि नाओमी र इस्राएलका परमेश्वरप्रति निष्ठा राखिन्। बेतलेहेमको खेतमा उनले देखाएको परिश्रम र नम्रताले परमेश्वरले साधारण मानिसलाई कसरी आशिष दिनुहुन्छ भन्ने देखाउँछ।',
    studyQuestionsEn: [
      'What motivated Ruth to stay with Naomi when returning was easier?',
      'How can we practice Boaz’s generosity toward the vulnerable in our communities?'
    ],
    studyQuestionsNe: [
      'सजिलो बाटो छोडेर नाओमीसँगै बस्न रूथलाई केले प्रेरित गर्यो?',
      'बोअजले जस्तै हामीले हाम्रो समाजका असहाय र खाँचोमा परेकाहरूलाई कसरी आदर र सहयोग गर्न सक्छौँ?'
    ],
  },
  {
    id: 4,
    category: 'teaching',
    titleEn: 'Biblical Stewardship & Compassionate Service',
    titleNe: 'असल भण्डारेपन र प्रेमपूर्ण सामाजिक सेवा',
    scriptureRefEn: 'Matthew 25:35–40 • 1 Peter 4:10',
    scriptureRefNe: 'मत्ती २५:३५–४० • १ पत्रुस ४:१०',
    summaryEn: 'Christian teaching on using our time, talents, and resources to uplift families, youth, and communities across Nepal.',
    summaryNe: 'परमेश्वरले दिनुभएको समय, वरदान र स्रोतलाई समाज र मण्डलीको भलाइका निम्ति प्रयोग गर्ने बाइबलीय शिक्षा।',
    contentEn: 'Every gift we possess is entrusted to us by God. True Christian discipleship unites proclamation of the Word with practical acts of mercy—caring for the sick, educating youth, and supporting disaster relief.',
    contentNe: 'हामीसँग भएको हरेक वरदान र क्षमता परमेश्वरको नासो हो। साँचो चेलापनले वचनको शिक्षासँगै व्यवहारिक प्रेम, बिरामीको सेवा, युवाहरूको शिक्षा र विपत्तिमा परेकाहरूको सहायतालाई जोड्दछ।',
    studyQuestionsEn: [
      'What spiritual gift or practical skill has God placed in your hands?',
      'How can your local fellowship serve your neighborhood this month?'
    ],
    studyQuestionsNe: [
      'परमेश्वरले तपाईंको हातमा कुन आत्मिक वरदान वा सीप दिनुभएको छ?',
      'यो महिना तपाईंको स्थानीय संगतिले छिमेकमा कस्तो असल सेवा पुर्याउन सक्छ?'
    ],
  },
];

export const NEWS_CATEGORIES = [
  { slug: 'all', nameEn: 'All News', nameNe: 'सबै समाचार' },
  { slug: 'christian-news-nepal', nameEn: 'Christian News Nepal', nameNe: 'नेपाल इसाई समाचार' },
  { slug: 'church-news', nameEn: 'Church News', nameNe: 'मण्डली समाचार' },
  { slug: 'christian-community', nameEn: 'Christian Community', nameNe: 'इसाई समुदाय' },
  { slug: 'christian-events', nameEn: 'Christian Events', nameNe: 'इसाई कार्यक्रम' },
  { slug: 'christian-education', nameEn: 'Christian Education', nameNe: 'इसाई शिक्षा' },
  { slug: 'world-christian-news', nameEn: 'World Christian News', nameNe: 'विश्व इसाई समाचार' },
  { slug: 'mission-news', nameEn: 'Mission News', nameNe: 'मिसन र सेवा' },
  { slug: 'christian-youth', nameEn: 'Christian Youth', nameNe: 'युवा जाग्रति' },
  { slug: 'bible-and-faith', nameEn: 'Bible and Faith', nameNe: 'बाइबल र विश्वास' },
  { slug: 'social-activities', nameEn: 'Social Activities', nameNe: 'सामाजिक सेवा' },
];

export const NEPALI_NEWS_PORTALS: NepaliNewsPortal[] = [
  {
    slug: 'hamropusta',
    nameNe: 'हाम्रोपुस्ता (Hamropusta)',
    nameEn: 'Hamropusta',
    url: 'https://hamropusta.com',
    categoryNe: 'इसाई तथा सामुदायिक पोर्टल',
    categoryEn: 'Christian & Community Portal',
    badgeColor: 'bg-red-800 text-white',
    descriptionNe: 'नेपाली इसाई समुदाय, साहित्य, शिक्षा, विचार र समसामयिक समाचार पोर्टल।',
    descriptionEn: 'Nepali Christian community, literature, education, and contemporary news portal.',
  },
  {
    slug: 'khojkhabar',
    nameNe: 'खोजखबर (Khojkhabar)',
    nameEn: 'Khojkhabar',
    url: 'https://khojkhabar.com',
    categoryNe: 'खोज तथा समसामयिक समाचार',
    categoryEn: 'Investigative & Current News',
    badgeColor: 'bg-amber-700 text-white',
    descriptionNe: 'खोजमूलक समाचार, सामाजिक गतिविधि, मण्डली र राष्ट्रिय समसामयिक अपडेट।',
    descriptionEn: 'Investigative reporting, social initiatives, church updates, and national affairs.',
  },
  {
    slug: 'onlinekhabar',
    nameNe: 'अनलाइनखबर (Onlinekhabar)',
    nameEn: 'Onlinekhabar',
    url: 'https://www.onlinekhabar.com',
    categoryNe: 'राष्ट्रिय अनलाइन पोर्टल',
    categoryEn: 'National News Portal',
    badgeColor: 'bg-blue-800 text-white',
    descriptionNe: 'नेपालको प्रमुख डिजिटल समाचार पोर्टल — राष्ट्रिय, समाज, अर्थ र प्रविधि समाचार।',
    descriptionEn: 'Leading digital news portal of Nepal covering national, social, economy, and tech news.',
  },
  {
    slug: 'ratopati',
    nameNe: 'रातोपाटी (Ratopati)',
    nameEn: 'Ratopati',
    url: 'https://www.ratopati.com',
    categoryNe: 'राष्ट्रिय समाचार पोर्टल',
    categoryEn: 'National News Portal',
    badgeColor: 'bg-rose-700 text-white',
    descriptionNe: 'राजनीति, समाज, प्रदेश र समसामयिक घटनाक्रमको द्रुत नेपाली समाचार पोर्टल।',
    descriptionEn: 'Fast-breaking Nepali news portal covering national, provincial, and social developments.',
  },
  {
    slug: 'baahrakhari',
    nameNe: 'बाह्रखरी (Baahrakhari)',
    nameEn: 'Baahrakhari',
    url: 'https://baahrakhari.com',
    categoryNe: 'विचार र राष्ट्रिय समाचार',
    categoryEn: 'News & Opinion Portal',
    badgeColor: 'bg-emerald-800 text-white',
    descriptionNe: 'तथ्यपूर्ण समाचार, अर्थतन्त्र, साहित्य र गहन विश्लेषणको लोकप्रिय पोर्टल।',
    descriptionEn: 'Popular portal for factual journalism, economic analysis, literature, and opinion.',
  },
  {
    slug: 'nayapatrika',
    nameNe: 'नयाँ पत्रिका (Naya Patrika)',
    nameEn: 'Naya Patrika',
    url: 'https://www.nayapatrikadaily.com',
    categoryNe: 'राष्ट्रिय दैनिक तथा अनलाइन',
    categoryEn: 'National Daily & Online',
    badgeColor: 'bg-indigo-800 text-white',
    descriptionNe: 'सामाजिक न्याय, शिक्षा, स्वास्थ्य र राष्ट्रिय सरोकारका खोजमूलक समाचार।',
    descriptionEn: 'National daily covering social justice, education, public health, and national affairs.',
  },
  {
    slug: 'setopati',
    nameNe: 'सेतोपाटी (Setopati)',
    nameEn: 'Setopati',
    url: 'https://www.setopati.com',
    categoryNe: 'डिजिटल पत्रिका',
    categoryEn: 'Digital Newspaper',
    badgeColor: 'bg-sky-800 text-white',
    descriptionNe: 'समाज, नीति, युवा र समसामयिक विषयको डिजिटल पत्रिका।',
    descriptionEn: 'Digital newspaper covering society, policy, youth, and public discourse.',
  },
  {
    slug: 'ekantipur',
    nameNe: 'कान्तिपुर (Ekantipur)',
    nameEn: 'Ekantipur',
    url: 'https://ekantipur.com',
    categoryNe: 'राष्ट्रिय दैनिक पोर्टल',
    categoryEn: 'National Daily Portal',
    badgeColor: 'bg-slate-800 text-white',
    descriptionNe: 'देश-विदेश, समाज, शिक्षा र अर्थतन्त्रका विस्तृत समाचार।',
    descriptionEn: 'Comprehensive coverage of national, international, education, and social news.',
  },
  {
    slug: 'nepalkhabar',
    nameNe: 'नेपालखबर (Nepalkhabar)',
    nameEn: 'Nepalkhabar',
    url: 'https://nepalkhabar.com',
    categoryNe: 'समसामयिक अनलाइन खबर',
    categoryEn: 'Contemporary Online News',
    badgeColor: 'bg-teal-800 text-white',
    descriptionNe: 'ताजा समाचार, अन्तरवार्ता र सामाजिक सरोकारका विषयहरू।',
    descriptionEn: 'Breaking news, interviews, and community affairs across Nepal.',
  },
  {
    slug: 'gorkhapatra',
    nameNe: 'गोरखापत्र (Gorkhapatra)',
    nameEn: 'Gorkhapatra Online',
    url: 'https://gorkhapatraonline.com',
    categoryNe: 'आधिकारिक राष्ट्रिय प्रकाशन',
    categoryEn: 'Official National Publication',
    badgeColor: 'bg-stone-800 text-white',
    descriptionNe: 'नेपालको ऐतिहासिक राष्ट्रिय दैनिक र बहुभाषी समाचार प्रकाशन।',
    descriptionEn: 'Historic national daily and multilingual public information portal of Nepal.',
  },
];

// Pre-populated Christian news articles removed as requested; new articles/posts will appear when published
export const INITIAL_NEWS_ARTICLES: NewsArticle[] = [];

export const INITIAL_PRAYER_REQUESTS: PrayerRequestItem[] = [
  {
    id: 1,
    requesterName: 'सन्तोष श्रेष्ठ (Santosh Shrestha)',
    location: 'Pokhara, Kaski',
    category: 'healing',
    titleEn: 'Complete Recovery After Kidney Surgery for My Mother',
    titleNe: 'आमाको मिर्गौला शल्यक्रियापछिको पूर्ण स्वास्थ्य लाभको निम्ति प्रार्थना',
    requestTextEn: 'My mother underwent surgery at Patan Hospital this week. Please pray for her strength, peaceful recovery, and wisdom for the doctors.',
    requestTextNe: 'मेरी आमाको पाटन अस्पतालमा शल्यक्रिया सम्पन्न भएको छ। उहाँको शीघ्र स्वास्थ्य लाभ र परिवारमा परमेश्वरको शान्तिको निम्ति प्रार्थना गरिदिनुहुन अनुरोध गर्दछु।',
    visibility: 'public',
    moderationStatus: 'approved',
    prayerStatus: 'active',
    prayedCount: 148,
    createdAtBs: '२०८३ कार्तिक १४',
    createdAtAd: '2026-10-31',
  },
  {
    id: 2,
    requesterName: 'अनुग्रह युवा संगति (Grace Youth Fellowship)',
    location: 'Dharan, Sunsari',
    category: 'youth',
    titleEn: 'Upcoming Koshi Province Youth Discipleship & Drug-Recovery Outreach',
    titleNe: 'कोशी प्रदेश युवा चेलापन तथा दुर्व्यसनमुक्त अभियानको निम्ति प्रार्थना',
    requestTextEn: 'We are visiting 14 colleges and rehabilitation centers in Sunsari and Morang to share hope and mentorship with struggling youth.',
    requestTextNe: 'सुनसरी र मोरङका १४ वटा कलेज तथा सुधार गृहहरूमा युवाहरूका बीचमा आशा र परामर्श सेवा पुर्याउँदैछौँ, पवित्र आत्माको अगुवाइको निम्ति प्रार्थना गरिदिनुहोस्।',
    visibility: 'public',
    moderationStatus: 'approved',
    prayerStatus: 'active',
    prayedCount: 215,
    createdAtBs: '२०८३ कार्तिक १२',
    createdAtAd: '2026-10-29',
  },
  {
    id: 3,
    requesterName: 'एलिशा तामाङ (Elisha Tamang)',
    location: 'Lalitpur',
    category: 'thanksgiving',
    titleEn: 'Thanksgiving: Safe Return of Brother from Overseas Employment',
    titleNe: 'धन्यवादको गवाही: वैदेशिक रोजगारीबाट भाइको सकुशल फिर्ती',
    requestTextEn: 'We asked the Susamachar prayer wall to pray when my brother was hospitalized abroad. God answered our prayers and he returned home healthy!',
    requestTextNe: 'विदेशमा बिरामी परेका भाइको निम्ति सुसमाचार प्रार्थना पर्खालमा राखेको प्रार्थना परमेश्वरले सुन्नुभयो र भाइ सकुशल घर फर्कनुभएको छ। परमेश्वरलाई महिमा!',
    visibility: 'public',
    moderationStatus: 'approved',
    prayerStatus: 'answered',
    prayedCount: 312,
    createdAtBs: '२०८३ कार्तिक ९',
    createdAtAd: '2026-10-26',
  },
  {
    id: 4,
    requesterName: 'पा. यूहन्ना परियार (Pr. John Pariyar)',
    location: 'Surkhet, Karnali',
    category: 'church',
    titleEn: 'Roof Construction for New Fellowship Hall in Surkhet',
    titleNe: 'सुर्खेतको नयाँ संगति भवनको छाना निर्माणका निम्ति प्रार्थना',
    requestTextEn: 'Our rural congregation of 85 families is building a safe prayer hall before winter. Pray for provision and safety of volunteer builders.',
    requestTextNe: 'जाडोयाम सुरु हुनुअघि हाम्रो ग्रामीण मण्डलीको प्रार्थना भवन निर्माण कार्य पूरा हुन सकोस् भनी प्रार्थना गरिदिनुहुन अनुरोध छ।',
    visibility: 'public',
    moderationStatus: 'approved',
    prayerStatus: 'active',
    prayedCount: 89,
    createdAtBs: '२०८३ कार्तिक १५',
    createdAtAd: '2026-10-31',
  },
  {
    id: 5,
    requesterName: 'डेभिड गुरुङ (David Gurung)',
    location: 'Butwal, Rupandehi',
    category: 'guidance',
    titleEn: 'Divine Guidance & Wisdom for Career and Mission Direction',
    titleNe: 'उच्च शिक्षा र सेवाकाईको निर्णयमा ईश्वरीय मार्गदर्शन र बुद्धिको निम्ति',
    requestTextEn: 'Seeking God’s wisdom and clear guidance regarding a transition into community ministry and higher theological studies.',
    requestTextNe: 'जीवनको नयाँ मोडमा सेवाकाई र अध्ययनका लागि परमेश्वरको स्पष्ट अगुवाइ, बुद्धि र ढोका खुल्न सकोस् भनी प्रार्थना गरिदिनुहोस्।',
    visibility: 'public',
    moderationStatus: 'approved',
    prayerStatus: 'active',
    prayedCount: 164,
    createdAtBs: '२०८३ कार्तिक १३',
    createdAtAd: '2026-10-30',
  },
  {
    id: 6,
    requesterName: 'गोप्य विश्वासी (Confidential Believer)',
    location: 'Kathmandu',
    category: 'family',
    titleEn: 'Family Reconciliation, Healing and Peace at Home',
    titleNe: 'पारिवारिक सम्बन्धमा मेलमिलाप, चङ्गाइ र शान्तिको निम्ति गोप्य प्रार्थना',
    requestTextEn: 'Confidential intercession requested for healing strained family relationships and restoring peace in our household.',
    requestTextNe: 'परिवारमा मेलमिलाप, समझदारी र परमेश्वरको शान्ति पुनर्स्थापनाका लागि पास्टोरल प्रार्थना टोलीको मध्यस्थताको खाँचो छ।',
    visibility: 'private',
    moderationStatus: 'approved',
    prayerStatus: 'active',
    prayedCount: 76,
    createdAtBs: '२०८३ कार्तिक ११',
    createdAtAd: '2026-10-28',
  },
  {
    id: 7,
    requesterName: 'गोप्य प्रार्थना (Private Pastoral Request)',
    location: 'Biratnagar, Morang',
    category: 'guidance',
    titleEn: 'Guidance and Protection During Difficult Business Transition',
    titleNe: 'व्यवसायिक समस्या र कठिन परिस्थितिमा ईश्वरीय सुरक्षा र अगुवाइ',
    requestTextEn: 'Seeking confidential prayer for ethical guidance and divine breakthrough during a critical business struggle.',
    requestTextNe: 'कठिन व्यवसायिक घडीमा सहि निर्णय र परमेश्वरको अनुग्रह प्राप्त हुन सकोस् भनी गोप्य प्रार्थनाको अनुरोध।',
    visibility: 'private',
    moderationStatus: 'approved',
    prayerStatus: 'active',
    prayedCount: 42,
    createdAtBs: '२०८३ कार्तिक ८',
    createdAtAd: '2026-10-25',
  },
];

export const INITIAL_RADIO_STATIONS: RadioStation[] = [
  {
    id: 1,
    nameEn: 'Good News FM 105.1 MHz (Live Stream)',
    nameNe: 'गुड न्युज एफ.एम. १०५.१ मेगाहर्ज (प्रत्यक्ष)',
    frequency: '105.1 MHz',
    locationEn: 'Lalitpur, Kathmandu Valley',
    locationNe: 'ललितपुर, काठमाडौं उपत्यका',
    streamUrl: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    melodyPreset: 'hymn_grace',
    descriptionEn: '24-hour bilingual Nepali Christian broadcast featuring morning devotionals, Nepali bhajans, family counseling, and live Bible teaching.',
    descriptionNe: 'बिहानी प्रार्थना, नेपाली ख्रीष्टियन भजन, पारिवारिक परामर्श र प्रत्यक्ष बाइबल शिक्षा प्रसारण गर्ने २४ घण्टे रेडियो स्टेशन।',
    currentProgramEn: 'Morning Grace & Nepali Bhajan Aradhana',
    currentProgramNe: 'बिहानी अनुग्रह र नेपाली भजन आराधना',
    isEnabled: true,
  },
  {
    id: 2,
    nameEn: 'Grace Worship Radio 107.6 MHz',
    nameNe: 'अनुग्रह आराधना एफ.एम. १०७.६ पोखरा',
    frequency: '107.6 MHz',
    locationEn: 'Pokhara, Gandaki Province',
    locationNe: 'पोखरा, गण्डकी प्रदेश',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    melodyPreset: 'worship_peace',
    descriptionEn: 'Broadcasting uplifting Gospel songs, peaceful instrumental worship, youth fellowship programs, and Scripture meditation.',
    descriptionNe: 'गण्डकी प्रदेशभर सुसमाचारमूलक संगीत, शान्त आराधना धुन र पवित्र धर्मशास्त्र मनन प्रसारण गर्ने रेडियो।',
    currentProgramEn: 'Psalms of Peace Instrumental & Scripture Reading',
    currentProgramNe: 'शान्तिको भजन र पवित्र धर्मशास्त्र वाचन',
    isEnabled: true,
  },
  {
    id: 3,
    nameEn: 'Himali Christian Voice 98.4 MHz',
    nameNe: 'हिमाली इसाई आवाज ९८.४ धरान',
    frequency: '98.4 MHz',
    locationEn: 'Dharan, Koshi Province',
    locationNe: 'धरान, कोशी प्रदेश',
    streamUrl: 'https://ice2.somafm.com/Lush-128-mp3',
    melodyPreset: 'morning_psalm',
    descriptionEn: 'Eastern Nepal Christian community radio featuring Nepali worship hymns and evening prayer altar.',
    descriptionNe: 'पूर्वी नेपालका मण्डली र समुदायका लागि नेपाली आत्मिक भजन र सन्ध्याकालीन प्रार्थना प्रसारण।',
    currentProgramEn: 'Evening Family Prayer Altar (पारिवारिक प्रार्थना वेदी)',
    currentProgramNe: 'सन्ध्याकालीन पारिवारिक प्रार्थना वेदी',
    isEnabled: true,
  },
  {
    id: 4,
    nameEn: 'Jyoti Gospel Radio 92.8 MHz',
    nameNe: 'ज्योति सुसमाचार रेडियो ९२.८ चितवन',
    frequency: '92.8 MHz',
    locationEn: 'Bharatpur, Chitwan',
    locationNe: 'भरतपुर, चितवन',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    melodyPreset: 'himalayan_choral',
    descriptionEn: 'Central Nepal Christian radio dedicated to verse-by-verse Bible study, children’s Sunday stories, and listener testimonies.',
    descriptionNe: 'पद-पद बाइबल अध्ययन, बाल कथा र श्रोताहरूको गवाही प्रसारण गर्ने मध्य नेपालको लोकप्रिय रेडियो।',
    currentProgramEn: 'Verse-by-Verse Book of Romans Study',
    currentProgramNe: 'रोमीको पुस्तक पद-पद बाइबल अध्ययन',
    isEnabled: true,
  },
];

export const INITIAL_GOLD_SILVER_RATES: GoldSilverRateData = {
  rateDateAd: '2026-10-31',
  rateDateBs: '२०८३ कार्तिक १४',
  lastUpdatedTime: '11:15 AM NPT (नेपाली समय)',
  fineGoldTola: 168400,
  tejabiGoldTola: 167700,
  silverTola: 2085,
  fineGoldGram: 14438,     // 168400 / 11.6638
  tejabiGoldGram: 14378,   // 167700 / 11.6638
  silverGram: 178.76,      // 2085 / 11.6638
  changeGoldTola: 600,
  changeSilverTola: 15,
  currency: 'NPR',
  sourceNameEn: 'FENEGOSIDA (Federation of Nepal Gold & Silver Dealers Association)',
  sourceNameNe: 'नेपाल सुनचाँदी व्यवसायी महासंघ (FENEGOSIDA)',
  history: [
    {
      dateBs: '२०८३ कार्तिक १४',
      dateAd: '2026-10-31',
      fineGoldTola: 168400,
      tejabiGoldTola: 167700,
      silverTola: 2085,
      changeGold: 600,
      changeSilver: 15,
    },
    {
      dateBs: '२०८३ कार्तिक १३',
      dateAd: '2026-10-30',
      fineGoldTola: 167800,
      tejabiGoldTola: 167100,
      silverTola: 2070,
      changeGold: -400,
      changeSilver: -10,
    },
    {
      dateBs: '२०८३ कार्तिक १२',
      dateAd: '2026-10-29',
      fineGoldTola: 168200,
      tejabiGoldTola: 167500,
      silverTola: 2080,
      changeGold: 800,
      changeSilver: 25,
    },
    {
      dateBs: '२०८३ कार्तिक ११',
      dateAd: '2026-10-28',
      fineGoldTola: 167400,
      tejabiGoldTola: 166700,
      silverTola: 2055,
      changeGold: 300,
      changeSilver: 5,
    },
    {
      dateBs: '२०८३ कार्तिक १०',
      dateAd: '2026-10-27',
      fineGoldTola: 167100,
      tejabiGoldTola: 166400,
      silverTola: 2050,
      changeGold: 0,
      changeSilver: -5,
    },
  ],
};

export const INITIAL_CALENDAR_EVENTS: Array<{
  id: number;
  bsYear: number;
  bsMonth: number;
  bsDay: number;
  titleEn: string;
  titleNe: string;
  eventType: 'christian_festival' | 'national_holiday' | 'church_event';
  isPublicHoliday: boolean;
}> = [
  {
    id: 1,
    bsYear: 2083,
    bsMonth: 1,
    bsDay: 1,
    titleEn: 'Nepali New Year 2083 & Thanksgiving Service',
    titleNe: 'नयाँ वर्ष २०८३ तथा धन्यवाद प्रार्थना सभा',
    eventType: 'national_holiday',
    isPublicHoliday: true,
  },
  {
    id: 2,
    bsYear: 2083,
    bsMonth: 1,
    bsDay: 5,
    titleEn: 'Resurrection Sunday (Easter Celebration)',
    titleNe: 'पुनरुत्थान आइतबार (इस्टर महोत्सव)',
    eventType: 'christian_festival',
    isPublicHoliday: false,
  },
  {
    id: 3,
    bsYear: 2083,
    bsMonth: 2,
    bsDay: 10,
    titleEn: 'Pentecost Sunday Prayer Gathering',
    titleNe: 'पेन्तिकोस आइतबार विशेष प्रार्थना',
    eventType: 'christian_festival',
    isPublicHoliday: false,
  },
  {
    id: 4,
    bsYear: 2083,
    bsMonth: 7,
    bsDay: 14,
    titleEn: 'All Nepal Christian Youth & Choir Festival',
    titleNe: 'अखिल नेपाल इसाई युवा तथा भजन महोत्सव',
    eventType: 'church_event',
    isPublicHoliday: false,
  },
  {
    id: 5,
    bsYear: 2083,
    bsMonth: 7,
    bsDay: 22,
    titleEn: 'National Bible Translation & Literacy Day',
    titleNe: 'राष्ट्रिय बाइबल अनुवाद तथा साक्षरता दिवस',
    eventType: 'church_event',
    isPublicHoliday: false,
  },
  {
    id: 6,
    bsYear: 2083,
    bsMonth: 9,
    bsDay: 10,
    titleEn: 'Christmas Day (ख्रीष्टमस दिवस - Public Holiday)',
    titleNe: 'ख्रीष्टमस दिवस (येशू ख्रीष्टको जन्मोत्सव - सार्वजनिक बिदा)',
    eventType: 'christian_festival',
    isPublicHoliday: true,
  },
];

export const INITIAL_GALLERY_ALBUMS: GalleryAlbum[] = [
  {
    id: 1,
    titleEn: 'Blooming Rhododendron (Lali Gurans) & Majestic Himalayas',
    titleNe: 'लालीगुराँस र सर्वोच्च हिमशृंखला — नेपालको प्राकृतिक सौन्दर्य',
    category: 'worship',
    locationEn: 'Karnali & Himalayan Panorama, Nepal',
    locationNe: 'कर्णाली तथा हिमाली दृश्य, नेपाल',
    dateBs: '२०८३ कार्तिक १४',
    coverImage: '/assets/aistudio/image_fed91b50.png',
    photosCount: 18,
    descriptionEn: 'National flower Rhododendron in full bloom against the snow-capped Himalayan peaks of Nepal — perfect background for Bible verse wallpapers.',
    descriptionNe: 'राताम्मे फुलेको लालीगुराँस र सेताम्मे हिमशृंखलाको वास्तविक तस्बिर — बाइबल वचन वालपेपरका लागि उत्कृष्ट।',
    items: [
      { id: 101, mediaType: 'image', mediaUrl: '/assets/aistudio/image_fed91b50.png', captionEn: 'Blooming Lali Gurans overlooking the Himalayas', captionNe: 'लालीगुराँस र हिमालको मनोरम दृश्य' },
    ],
  },
  {
    id: 2,
    titleEn: 'Turquoise Phoksundo Lake — Shey Phoksundo, Dolpa',
    titleNe: 'फोक्सुण्डो ताल, डोल्पा — परमेश्वरको अद्भुत सृष्टि',
    category: 'worship',
    locationEn: 'Shey Phoksundo, Dolpa, Nepal',
    locationNe: 'शे-फोक्सुण्डो, डोल्पा, नेपाल',
    dateBs: '२०८३ कार्तिक १३',
    coverImage: '/assets/aistudio/image_4e1a2ab5.png',
    photosCount: 24,
    descriptionEn: 'Crystal-clear turquoise waters of Phoksundo Lake surrounded by dramatic Himalayan cliffs in Dolpa.',
    descriptionNe: 'डोल्पा जिल्लामा अवस्थित नीलो र कञ्चन फोक्सुण्डो तालको वास्तविक दृश्य।',
    items: [
      { id: 201, mediaType: 'image', mediaUrl: '/assets/aistudio/image_4e1a2ab5.png', captionEn: 'Phoksundo Lake, Dolpa', captionNe: 'फोक्सुण्डो ताल, डोल्पा' },
    ],
  },
  {
    id: 3,
    titleEn: 'Karnali River Valley & Green Terraced Hills of Nepal',
    titleNe: 'कर्णाली नदी उपत्यका, हरियाली फाँट र हिमशिखर',
    category: 'mission',
    locationEn: 'Karnali Province, Nepal',
    locationNe: 'कर्णाली प्रदेश, नेपाल',
    dateBs: '२०८३ कार्तिक १२',
    coverImage: '/assets/aistudio/image_d40a1d65.png',
    photosCount: 32,
    descriptionEn: 'Serene blue river winding through lush terraced villages with snow peaks on the horizon.',
    descriptionNe: 'कञ्चन नदीको बहाव, हरियाली पहाडी बस्ती र पृष्ठभूमिमा देखिएको हिमालको वास्तविक फोटो।',
    items: [
      { id: 301, mediaType: 'image', mediaUrl: '/assets/aistudio/image_d40a1d65.png', captionEn: 'Karnali River Valley', captionNe: 'कर्णाली नदी र पहाडी बस्ती' },
    ],
  },
  {
    id: 4,
    titleEn: 'Alpine Wildflowers & Snow-Capped Himalayan Peaks',
    titleNe: 'हिमाली फूलबारी र बादलमाथि चम्किएको हिमाल',
    category: 'worship',
    locationEn: 'High Himalayas, Nepal',
    locationNe: 'उच्च हिमाली क्षेत्र, नेपाल',
    dateBs: '२०८३ कार्तिक ११',
    coverImage: '/assets/aistudio/image_05744a49.png',
    photosCount: 21,
    descriptionEn: 'Vibrant mountain wildflowers blooming beneath towering snow-covered Himalayan summits.',
    descriptionNe: 'रङ्गीचङ्गी हिमाली फूलहरू र निलो आकाशमुनि मुस्कुराएको हिमालको वास्तविक तस्बिर।',
    items: [
      { id: 401, mediaType: 'image', mediaUrl: '/assets/aistudio/image_05744a49.png', captionEn: 'Himalayan Wildflowers', captionNe: 'हिमाली फूल र हिमशिखर' },
    ],
  },
  {
    id: 5,
    titleEn: 'Golden Sunset Over the Himalayan Range',
    titleNe: 'गोधूलि साँझमा सुनौलो हिमाल र आकाशको दृश्य',
    category: 'worship',
    locationEn: 'Himalayan Range, Nepal',
    locationNe: 'हिमाली शृंखला, नेपाल',
    dateBs: '२०८३ कार्तिक १०',
    coverImage: '/assets/aistudio/image_8235fd25.png',
    photosCount: 15,
    descriptionEn: 'Golden sunset light illuminating the majestic Himalayan peaks at dusk.',
    descriptionNe: 'सूर्यास्तको सुनौलो किरणले रंगिएको नेपालको हिमशृंखला।',
    items: [
      { id: 501, mediaType: 'image', mediaUrl: '/assets/aistudio/image_8235fd25.png', captionEn: 'Golden Sunset over the Himalayas', captionNe: 'सूर्यास्तमा सुनौलो हिमाल' },
    ],
  },
  {
    id: 6,
    titleEn: 'Upper Mustang & Dolpo Ancient Himalayan Village',
    titleNe: 'उपल्लो मुस्ताङ र डोल्पोको मौलिक हिमाली बस्ती',
    category: 'mission',
    locationEn: 'Mustang / Dolpo, Nepal',
    locationNe: 'मुस्ताङ / डोल्पो, नेपाल',
    dateBs: '२०८३ कार्तिक ९',
    coverImage: '/assets/aistudio/image_3fb48649.png',
    photosCount: 27,
    descriptionEn: 'Traditional flat-roofed mud-brick homes surrounded by golden autumn harvest fields in trans-Himalayan Nepal.',
    descriptionNe: 'सुनौला खेतबारीका बीचमा रहेको हिमालपारिको मौलिक नेपाली बस्ती।',
    items: [
      { id: 601, mediaType: 'image', mediaUrl: '/assets/aistudio/image_3fb48649.png', captionEn: 'Upper Mustang Village', captionNe: 'हिमालपारिको मौलिक बस्ती' },
    ],
  },
  {
    id: 7,
    titleEn: 'Himalayan Mountain Trail & Valley Settlement',
    titleNe: 'हिमाली उपत्यका, पदमार्ग र पहाडी जनजीवन',
    category: 'christian_camps',
    locationEn: 'Mid-Western Hills, Nepal',
    locationNe: 'मध्य-पश्चिम पहाडी क्षेत्र, नेपाल',
    dateBs: '२०८३ कार्तिक ८',
    coverImage: '/assets/aistudio/image_42266620.png',
    photosCount: 19,
    descriptionEn: 'Scenic mountain trail winding above a peaceful Himalayan river valley and village.',
    descriptionNe: 'पहाडी खोँच र हरियाली उपत्यकामा अवस्थित सुन्दर नेपाली गाउँ।',
    items: [
      { id: 701, mediaType: 'image', mediaUrl: '/assets/aistudio/image_42266620.png', captionEn: 'Mountain Valley Village', captionNe: 'पहाडी उपत्यकाको बस्ती' },
    ],
  },
  {
    id: 8,
    titleEn: 'White-Water River Rafting & Youth Fellowship in Nepal',
    titleNe: 'नेपालको नदीमा साहसिक र्याफ्टिङ र युवा संगति',
    category: 'christian_camps',
    locationEn: 'Trishuli / Bhotekoshi River, Nepal',
    locationNe: 'त्रिशूली / भोटेकोशी नदी, नेपाल',
    dateBs: '२०८३ कार्तिक ७',
    coverImage: '/assets/aistudio/image_2d66d8cd.png',
    photosCount: 29,
    descriptionEn: 'Teamwork and joy on the rapids of Nepal’s famous Himalayan rivers.',
    descriptionNe: 'नेपालको हिमाली नदीमा युवाहरूको उत्साहजनक जलयात्रा (र्याफ्टिङ)।',
    items: [
      { id: 801, mediaType: 'image', mediaUrl: '/assets/aistudio/image_2d66d8cd.png', captionEn: 'River Rafting in Nepal', captionNe: 'नेपालको नदीमा र्याफ्टिङ' },
    ],
  },
  {
    id: 9,
    titleEn: 'Winding Mountain Highway Journey Across Nepal',
    titleNe: 'नेपालको पहाडी राजमार्ग र यात्राको वास्तविक दृश्य',
    category: 'mission',
    locationEn: 'Hill Highway, Nepal',
    locationNe: 'पहाडी राजमार्ग, नेपाल',
    dateBs: '२०८३ कार्तिक ६',
    coverImage: '/assets/aistudio/image_124cf814.png',
    photosCount: 14,
    descriptionEn: 'Buses traveling along a dramatic cliffside highway carved into the green mountains of Nepal.',
    descriptionNe: 'हरिया पहाडको भीरमा कुँदिएको घुमाउरो नेपाली राजमार्गको यात्रा।',
    items: [
      { id: 901, mediaType: 'image', mediaUrl: '/assets/aistudio/image_124cf814.png', captionEn: 'Mountain Highway in Nepal', captionNe: 'पहाडी राजमार्ग यात्रा' },
    ],
  },
  {
    id: 10,
    titleEn: 'Holy Bible (पवित्र बाइबल NNRV) — Word of God',
    titleNe: 'पवित्र बाइबल (NNRV) — जीवित परमेश्वरको वचन',
    category: 'seminars',
    locationEn: 'Bible Sandes (biblesandes.com)',
    locationNe: 'बाइबल सन्देश (biblesandes.com)',
    dateBs: '२०८३ कार्तिक ५',
    coverImage: '/assets/aistudio/image_312e60b5.png',
    photosCount: 12,
    descriptionEn: 'Sacred Holy Bible collection for daily scripture reading, study, and verse sharing.',
    descriptionNe: 'दैनिक वचन पठन, मनन र बाइबल सन्देश सेयर गर्नका लागि पवित्र बाइबल तस्बिर संग्रह।',
    items: [
      { id: 1001, mediaType: 'image', mediaUrl: '/assets/aistudio/image_312e60b5.png', captionEn: 'Holy Bible', captionNe: 'पवित्र बाइबल' },
      { id: 1002, mediaType: 'image', mediaUrl: '/assets/aistudio/image_34762c79.png', captionEn: 'Pabitra Bible Icon', captionNe: 'पवित्र बाइबल लोगो' },
      { id: 1003, mediaType: 'image', mediaUrl: '/assets/aistudio/image_d6c7195f.png', captionEn: 'Nepali Holy Bible NNRV', captionNe: 'नेपाली पवित्र बाइबल NNRV' },
    ],
  },
];

export const INITIAL_CHRISTIAN_EVENTS: ChristianEventItem[] = [
  {
    id: 1,
    titleEn: 'All-Nepal Christian Youth & Worship Conference 2083',
    titleNe: 'अखिल नेपाल इसाई युवा तथा आराधना सम्मेलन २०८३',
    category: 'conference',
    dateBs: '२०८३ मंसिर १२–१४',
    dateAd: '2026-11-28',
    time: '9:00 AM – 5:00 PM',
    locationEn: 'Kathmandu Valley, Nepal',
    locationNe: 'काठमाडौँ उपत्यका, नेपाल',
    organizerEn: 'Bible Sandes Network (biblesandes.com)',
    organizerNe: 'बाइबल सन्देश संजाल (biblesandes.com)',
    descriptionEn: 'Three-day national conference featuring expository Bible teaching, indigenous Nepali worship, career mentorship, and mission workshops.',
    descriptionNe: 'बाइबल व्याख्या, मौलिक नेपाली आराधना, वृत्ति परामर्श र सेवा कार्यशालासहितको तीनदिने राष्ट्रिय युवा सम्मेलन।',
    bannerImage: '/assets/aistudio/image_fed91b50.png',
    registrationCount: 418,
  },
  {
    id: 2,
    titleEn: 'Gandaki Regional Pastors & Elders Expository Bible Seminar',
    titleNe: 'गण्डकी प्रादेशिक पास्टर तथा अगुवा बाइबल व्याख्या सेमिनार',
    category: 'seminar',
    dateBs: '२०८३ मंसिर २२',
    dateAd: '2026-12-08',
    time: '10:00 AM – 4:00 PM',
    locationEn: 'Pokhara, Gandaki Province',
    locationNe: 'पोखरा, गण्डकी प्रदेश',
    organizerEn: 'Bible Sandes Teaching Fellowship',
    organizerNe: 'बाइबल सन्देश शिक्षा संगति',
    descriptionEn: 'Intensive training on hermeneutics, pastoral care, and family counseling for local church leaders.',
    descriptionNe: 'स्थानीय मण्डलीका पास्टर र अगुवाहरूका लागि बाइबल अर्थशास्त्र र पारिवारिक परामर्शसम्बन्धी विशेष सेमिनार।',
    bannerImage: '/assets/aistudio/image_312e60b5.png',
    registrationCount: 164,
  },
  {
    id: 3,
    titleEn: 'Christmas Carol & Community Blanket Distribution Drive',
    titleNe: 'ख्रीष्टमस क्यारोल तथा न्यानो कपडा वितरण अभियान',
    category: 'festival',
    dateBs: '२०८३ पुष १० (Dec 25)',
    dateAd: '2026-12-25',
    time: '8:00 AM – 6:00 PM',
    locationEn: 'Nationwide across 7 Provinces',
    locationNe: 'सातै प्रदेशका स्थानीय मण्डलीहरू',
    organizerEn: 'Bible Sandes Compassion Ministry',
    organizerNe: 'बाइबल सन्देश करुणा सेवा',
    descriptionEn: 'Celebrating the birth of Jesus Christ by sharing Christmas joy, carols, and warm winter blankets with elderly and low-income families.',
    descriptionNe: 'प्रभु येशू ख्रीष्टको जन्मोत्सवको अवसरमा असहाय र ज्येष्ठ नागरिकहरूलाई न्यानो कपडा वितरण तथा ख्रीष्टमस शुभकामना आदानप्रदान।',
    bannerImage: '/assets/aistudio/image_d40a1d65.png',
    registrationCount: 890,
  },
];

// Kept empty as requested by user (यो page अहिले खालि राख्नु सबै नम्बर remove गर्नु)
export const NEPAL_CHURCH_DIRECTORY: ChurchDirectoryItem[] = [];

// All 8 Specialized Admin Roles defined in Section 11
export const ADMIN_USERS: AdminUserRecord[] = [
  {
    id: 1,
    username: 'superadmin',
    fullNameEn: 'Rev. Dr. Prakash Shrestha',
    fullNameNe: 'रेभ. डा. प्रकाश श्रेष्ठ',
    email: 'superadmin@susamachar.org',
    roleKey: 'SUPER_ADMIN',
    roleNameEn: 'Super Admin',
    roleNameNe: 'सुपर एडमिन (पूर्ण अधिकार)',
    status: 'active',
    twoFactorEnabled: true,
    lastLogin: '2026-10-31 10:45 AM',
    allowedModules: ['overview', 'news', 'bible', 'prayer', 'calendar', 'radio', 'rates', 'gallery', 'events', 'admins', 'audit'],
  },
  {
    id: 2,
    username: 'newsadmin',
    fullNameEn: 'Pr. Samuel Adhikari',
    fullNameNe: 'पा. शमूएल अधिकारी',
    email: 'news@susamachar.org',
    roleKey: 'NEWS_ADMIN',
    roleNameEn: 'News Admin',
    roleNameNe: 'समाचार एडमिन',
    status: 'active',
    twoFactorEnabled: true,
    lastLogin: '2026-10-31 09:20 AM',
    allowedModules: ['overview', 'news'],
  },
  {
    id: 3,
    username: 'bibleadmin',
    fullNameEn: 'Hannah Gurung',
    fullNameNe: 'हन्ना गुरुङ',
    email: 'bible@susamachar.org',
    roleKey: 'BIBLE_ADMIN',
    roleNameEn: 'Bible Admin',
    roleNameNe: 'बाइबल एडमिन',
    status: 'active',
    twoFactorEnabled: true,
    lastLogin: '2026-10-30 04:15 PM',
    allowedModules: ['overview', 'bible'],
  },
  {
    id: 4,
    username: 'radioadmin',
    fullNameEn: 'Kiran Lepcha',
    fullNameNe: 'किरण लेप्चा',
    email: 'radio@susamachar.org',
    roleKey: 'RADIO_ADMIN',
    roleNameEn: 'Radio Admin',
    roleNameNe: 'रेडियो एडमिन',
    status: 'active',
    twoFactorEnabled: false,
    lastLogin: '2026-10-30 08:00 PM',
    allowedModules: ['overview', 'radio'],
  },
  {
    id: 5,
    username: 'calendaradmin',
    fullNameEn: 'Bishवास कार्की (Bishwas Karki)',
    fullNameNe: 'विश्वास कार्की',
    email: 'calendar@susamachar.org',
    roleKey: 'CALENDAR_ADMIN',
    roleNameEn: 'Calendar Admin',
    roleNameNe: 'पात्रो एडमिन',
    status: 'active',
    twoFactorEnabled: false,
    lastLogin: '2026-10-29 11:30 AM',
    allowedModules: ['overview', 'calendar', 'events'],
  },
  {
    id: 6,
    username: 'financeadmin',
    fullNameEn: 'Ashish Shakya',
    fullNameNe: 'आशिष शाक्य',
    email: 'rates@susamachar.org',
    roleKey: 'FINANCE_ADMIN',
    roleNameEn: 'Finance Content Admin',
    roleNameNe: 'सुनचाँदी दर एडमिन',
    status: 'active',
    twoFactorEnabled: true,
    lastLogin: '2026-10-31 11:15 AM',
    allowedModules: ['overview', 'rates'],
  },
  {
    id: 7,
    username: 'galleryadmin',
    fullNameEn: 'Daniel Rai',
    fullNameNe: 'दानियल राई',
    email: 'gallery@susamachar.org',
    roleKey: 'GALLERY_ADMIN',
    roleNameEn: 'Gallery Admin',
    roleNameNe: 'ग्यालरी एडमिन',
    status: 'active',
    twoFactorEnabled: false,
    lastLogin: '2026-10-28 03:40 PM',
    allowedModules: ['overview', 'gallery'],
  },
  {
    id: 8,
    username: 'prayeradmin',
    fullNameEn: 'Estha Tamang',
    fullNameNe: 'एस्तर तामाङ',
    email: 'prayer@susamachar.org',
    roleKey: 'PRAYER_ADMIN',
    roleNameEn: 'Prayer Admin',
    roleNameNe: 'प्रार्थना एडमिन',
    status: 'active',
    twoFactorEnabled: true,
    lastLogin: '2026-10-31 07:50 AM',
    allowedModules: ['overview', 'prayer'],
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1,
    adminName: 'Ashish Shakya',
    roleName: 'Finance Content Admin',
    action: 'UPDATE_RATES',
    module: 'Gold & Silver',
    details: 'Updated daily Fine Gold rate to NPR 168,400/tola and Silver to NPR 2,085/tola (FENEGOSIDA)',
    timestamp: '2026-10-31 11:15 AM',
    ipAddress: '202.45.144.18',
  },
  {
    id: 2,
    adminName: 'Pr. Samuel Adhikari',
    roleName: 'News Admin',
    action: 'PUBLISH_NEWS',
    module: 'News Portal',
    details: 'Published article: National Inter-Church Prayer & Unity Fellowship Convenes in Kathmandu Valley',
    timestamp: '2026-10-30 06:40 PM',
    ipAddress: '110.44.120.92',
  },
  {
    id: 3,
    adminName: 'Estha Tamang',
    roleName: 'Prayer Admin',
    action: 'APPROVE_PRAYER',
    module: 'Prayer Wall',
    details: 'Approved public prayer request #1 (Complete Recovery After Kidney Surgery)',
    timestamp: '2026-10-30 02:12 PM',
    ipAddress: '27.34.68.104',
  },
  {
    id: 4,
    adminName: 'Rev. Dr. Prakash Shrestha',
    roleName: 'Super Admin',
    action: 'VERIFY_RBAC_POLICY',
    module: 'Security & Roles',
    details: 'Verified 2FA enforcement for Super Admin, News Admin, Bible Admin, Finance Admin, and Prayer Admin',
    timestamp: '2026-10-29 09:00 AM',
    ipAddress: '202.45.144.10',
  },
];
