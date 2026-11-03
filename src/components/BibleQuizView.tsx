import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  HelpCircle,
  Layers,
  ListChecks,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Volume2,
  X,
  XCircle,
} from 'lucide-react';
import { toNepaliDigits } from '../utils/nepaliDateEngine';

export interface BibleQuizQuestion {
  id: number | string;
  book: string;
  bookNe?: string;
  chapter: number;
  question: string;
  questionNe?: string;
  answer: string;
  answerNe?: string;
  optionsNe?: string[];
  optionsEn?: string[];
  explanation: string;
  explanationNe?: string;
  reference: string;
  referenceNe?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  isCustom?: boolean;
}

interface BookIndexEntry {
  file: string;
  book: string;
  count: number;
  chapters: number[];
  difficulty: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
}

interface QuizIndexManifest {
  totalQuestions: number;
  totalBooks: number;
  difficultyCounts: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
  books: BookIndexEntry[];
}

interface QuizAttemptRecord {
  id: string;
  dateBs: string;
  dateAd: string;
  quizSource: 'nepali_bilingual' | '66_books_repo';
  bookFilter: string;
  chapterFilter: string;
  difficultyFilter: string;
  score: number;
  total: number;
  percent: number;
  answersLog: Array<{
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    reference: string;
    explanation: string;
    isCorrect: boolean;
  }>;
}

const BOOK_NAME_NE_MAP: Record<string, { ne: string; testament: 'OT' | 'NT'; order: number }> = {
  Genesis: { ne: 'उत्पत्ति', testament: 'OT', order: 1 },
  Exodus: { ne: 'प्रस्थान', testament: 'OT', order: 2 },
  Leviticus: { ne: 'लेवी', testament: 'OT', order: 3 },
  Numbers: { ne: 'गन्ती', testament: 'OT', order: 4 },
  Deuteronomy: { ne: 'व्यवस्था', testament: 'OT', order: 5 },
  Joshua: { ne: 'यहोशू', testament: 'OT', order: 6 },
  Judges: { ne: 'न्यायकर्ता', testament: 'OT', order: 7 },
  Ruth: { ne: 'रूथ', testament: 'OT', order: 8 },
  '1 Samuel': { ne: '१ शमूएल', testament: 'OT', order: 9 },
  '2 Samuel': { ne: '२ शमूएल', testament: 'OT', order: 10 },
  '1 Kings': { ne: '१ राजा', testament: 'OT', order: 11 },
  '2 Kings': { ne: '२ राजा', testament: 'OT', order: 12 },
  '1 Chronicles': { ne: '१ इतिहास', testament: 'OT', order: 13 },
  '2 Chronicles': { ne: '२ इतिहास', testament: 'OT', order: 14 },
  Ezra: { ne: 'एज्रा', testament: 'OT', order: 15 },
  Nehemiah: { ne: 'नहेम्याह', testament: 'OT', order: 16 },
  Esther: { ne: 'एस्तर', testament: 'OT', order: 17 },
  Job: { ne: 'अय्यूब', testament: 'OT', order: 18 },
  Psalms: { ne: 'भजनसंग्रह', testament: 'OT', order: 19 },
  Proverbs: { ne: 'हितोपदेश', testament: 'OT', order: 20 },
  Ecclesiastes: { ne: 'उपदेशक', testament: 'OT', order: 21 },
  'Song of Solomon': { ne: 'श्रेष्ठगीत', testament: 'OT', order: 22 },
  Isaiah: { ne: 'यशैया', testament: 'OT', order: 23 },
  Jeremiah: { ne: 'यर्मिया', testament: 'OT', order: 24 },
  Lamentations: { ne: 'विलाप', testament: 'OT', order: 25 },
  Ezekiel: { ne: 'इजकिएल', testament: 'OT', order: 26 },
  Daniel: { ne: 'दानिएल', testament: 'OT', order: 27 },
  Hosea: { ne: 'होशे', testament: 'OT', order: 28 },
  Joel: { ne: 'योएल', testament: 'OT', order: 29 },
  Amos: { ne: 'आमोस', testament: 'OT', order: 30 },
  Obadiah: { ne: 'ओबद्याह', testament: 'OT', order: 31 },
  Jonah: { ne: 'योना', testament: 'OT', order: 32 },
  Micah: { ne: 'मीका', testament: 'OT', order: 33 },
  Nahum: { ne: 'नहूम', testament: 'OT', order: 34 },
  Habakkuk: { ne: 'हबक्कूक', testament: 'OT', order: 35 },
  Zephaniah: { ne: 'सपन्याह', testament: 'OT', order: 36 },
  Haggai: { ne: 'हाग्गै', testament: 'OT', order: 37 },
  Zechariah: { ne: 'जकर्याह', testament: 'OT', order: 38 },
  Malachi: { ne: 'मलाकी', testament: 'OT', order: 39 },
  Matthew: { ne: 'मत्ती', testament: 'NT', order: 40 },
  Mark: { ne: 'मर्कूस', testament: 'NT', order: 41 },
  Luke: { ne: 'लूका', testament: 'NT', order: 42 },
  John: { ne: 'यूहन्ना', testament: 'NT', order: 43 },
  Acts: { ne: 'प्रेरित', testament: 'NT', order: 44 },
  Romans: { ne: 'रोमी', testament: 'NT', order: 45 },
  '1 Corinthians': { ne: '१ कोरिन्थी', testament: 'NT', order: 46 },
  '2 Corinthians': { ne: '२ कोरिन्थी', testament: 'NT', order: 47 },
  Galatians: { ne: 'गलाती', testament: 'NT', order: 48 },
  Ephesians: { ne: 'एफिसी', testament: 'NT', order: 49 },
  Philippians: { ne: 'फिलिप्पी', testament: 'NT', order: 50 },
  Colossians: { ne: 'कलस्सी', testament: 'NT', order: 51 },
  '1 Thessalonians': { ne: '१ थेसलोनिकी', testament: 'NT', order: 52 },
  '2 Thessalonians': { ne: '२ थेसलोनिकी', testament: 'NT', order: 53 },
  '1 Timothy': { ne: '१ तिमोथी', testament: 'NT', order: 54 },
  '2 Timothy': { ne: '२ तिमोथी', testament: 'NT', order: 55 },
  Titus: { ne: 'तीतस', testament: 'NT', order: 56 },
  Philemon: { ne: 'फिलेमोन', testament: 'NT', order: 57 },
  Hebrews: { ne: 'हिब्रू', testament: 'NT', order: 58 },
  James: { ne: 'याकूब', testament: 'NT', order: 59 },
  '1 Peter': { ne: '१ पत्रुस', testament: 'NT', order: 60 },
  '2 Peter': { ne: '२ पत्रुस', testament: 'NT', order: 61 },
  '1 John': { ne: '१ यूहन्ना', testament: 'NT', order: 62 },
  '2 John': { ne: '२ यूहन्ना', testament: 'NT', order: 63 },
  '3 John': { ne: '३ यूहन्ना', testament: 'NT', order: 64 },
  Jude: { ne: 'यहूदा', testament: 'NT', order: 65 },
  Revelation: { ne: 'प्रकाश', testament: 'NT', order: 66 },
};

// Curated Bilingual Nepali + English Bible Quiz Questions for Nepali Believers & Youth Fellowships
const NEPALI_BILINGUAL_QUESTIONS: BibleQuizQuestion[] = [
  {
    id: 'ne-1',
    book: 'Genesis',
    bookNe: 'उत्पत्ति',
    chapter: 1,
    questionNe: 'आदिमा परमेश्वरले पहिलो दिनमा के सृष्टि गर्नुभयो?',
    question: 'What did God create on the first day in the beginning?',
    answerNe: 'उज्यालो (Light)',
    answer: 'Light',
    optionsNe: ['उज्यालो (Light)', 'आकाश र समुद्र', 'सूर्य र चन्द्रमा', 'मानिस र पशुहरू'],
    optionsEn: ['Light', 'Sky and Seas', 'Sun and Moon', 'Humans and Animals'],
    explanationNe: 'परमेश्वरले "उज्यालो होस्" भन्नुभयो र उज्यालो भयो। उहाँले उज्यालोलाई दिन र अँध्यारोलाई रात भन्नुभयो।',
    explanation: 'God separated light from darkness, calling the light Day and the darkness Night.',
    referenceNe: 'उत्पत्ति १:३-५',
    reference: 'Genesis 1:3-5',
    difficulty: 'basic',
  },
  {
    id: 'ne-2',
    book: 'Genesis',
    bookNe: 'उत्पत्ति',
    chapter: 1,
    questionNe: 'परमेश्वरले कुन दिनमा मानिसलाई आफ्नै स्वरूपमा सृष्टि गर्नुभयो?',
    question: 'On which day did God create human beings in His own image?',
    answerNe: 'छैटौँ दिन (The Sixth Day)',
    answer: 'The Sixth Day',
    optionsNe: ['तेस्रो दिन', 'पाँचौँ दिन', 'छैटौँ दिन (The Sixth Day)', 'सातौँ दिन'],
    optionsEn: ['The Third Day', 'The Fifth Day', 'The Sixth Day', 'The Seventh Day'],
    explanationNe: 'परमेश्वरले छैटौँ दिनमा मानिसलाई आफ्नै स्वरूपमा, नर र नारी गरी सृष्टि गर्नुभयो।',
    explanation: 'God created humanity in His own image, male and female, on the sixth day.',
    referenceNe: 'उत्पत्ति १:२६-३१',
    reference: 'Genesis 1:26-31',
    difficulty: 'basic',
  },
  {
    id: 'ne-3',
    book: 'Genesis',
    bookNe: 'उत्पत्ति',
    chapter: 6,
    questionNe: 'जलप्रलयबाट बच्न परमेश्वरले कसलाई जहाज (Ark) बनाउन आज्ञा दिनुभयो?',
    question: 'Whom did God command to build an Ark to survive the great flood?',
    answerNe: 'नोआ (Noah)',
    answer: 'Noah',
    optionsNe: ['अब्राहाम (Abraham)', 'नोआ (Noah)', 'मोशा (Moses)', 'दाऊद (David)'],
    optionsEn: ['Abraham', 'Noah', 'Moses', 'David'],
    explanationNe: 'नोआ धर्मी र निर्दोष व्यक्ति थिए, र परमेश्वरले उनलाई गोफर काठको जहाज बनाउन आज्ञा दिनुभयो।',
    explanation: 'Noah walked with God and was commanded to build an ark of gopher wood.',
    referenceNe: 'उत्पत्ति ६:१३-१४',
    reference: 'Genesis 6:13-14',
    difficulty: 'basic',
  },
  {
    id: 'ne-4',
    book: 'Exodus',
    bookNe: 'प्रस्थान',
    chapter: 20,
    questionNe: 'परमेश्वरले मोशालाई दश आज्ञा (Ten Commandments) कुन पर्वतमा दिनुभयो?',
    question: 'On which mountain did God give Moses the Ten Commandments?',
    answerNe: 'सीनै पर्वत (Mount Sinai)',
    answer: 'Mount Sinai',
    optionsNe: ['कर्मेल पर्वत', 'सीनै पर्वत (Mount Sinai)', 'जैतून पर्वत', 'मोरीयाह पर्वत'],
    optionsEn: ['Mount Carmel', 'Mount Sinai', 'Mount of Olives', 'Mount Moriah'],
    explanationNe: 'इस्राएलीहरू मिश्रबाट निस्केपछि सीनै पर्वतमा परमेश्वरले मोशालाई दश आज्ञा दिनुभयो।',
    explanation: 'God spoke the Ten Commandments and gave Moses the tablets of stone on Mount Sinai.',
    referenceNe: 'प्रस्थान १९:२०, २०:१-१७',
    reference: 'Exodus 19:20, 20:1-17',
    difficulty: 'basic',
  },
  {
    id: 'ne-5',
    book: '1 Samuel',
    bookNe: '१ शमूएल',
    chapter: 17,
    questionNe: 'जवान दाऊदले गोल्यतलाई के प्रहार गरेर लडाए?',
    question: 'What did young David use to strike down the giant Goliath?',
    answerNe: 'घुयेँत्रो र चिल्लो ढुङ्गा (Sling and a smooth stone)',
    answer: 'Sling and a smooth stone',
    optionsNe: ['तरवार र भाला', 'धनु र बाण', 'घुयेँत्रो र चिल्लो ढुङ्गा (Sling and a smooth stone)', 'ढाल र बन्चरो'],
    optionsEn: ['Sword and spear', 'Bow and arrow', 'Sling and a smooth stone', 'Shield and axe'],
    explanationNe: 'दाऊदले खोलाबाट पाँचवटा चिल्ला ढुङ्गा टिपे र परमप्रभुको नाउँमा घुयेँत्रोले हिर्काएर गोल्यतलाई जिते।',
    explanation: 'David trusted in the name of the LORD of hosts and struck Goliath with a stone from his sling.',
    referenceNe: '१ शमूएल १७:४०-५०',
    reference: '1 Samuel 17:40-50',
    difficulty: 'basic',
  },
  {
    id: 'ne-6',
    book: 'Psalms',
    bookNe: 'भजनसंग्रह',
    chapter: 23,
    questionNe: '“परमप्रभु मेरो गोठाला हुनुहुन्छ; मलाई केहीको खाँचो हुँदैन” — यो कुन भजनमा लेखिएको छ?',
    question: '“The LORD is my shepherd; I shall not want” is found in which Psalm?',
    answerNe: 'भजनसंग्रह २३:१ (Psalm 23:1)',
    answer: 'Psalm 23:1',
    optionsNe: ['भजनसंग्रह १:१', 'भजनसंग्रह २३:१ (Psalm 23:1)', 'भजनसंग्रह ९१:१', 'भजनसंग्रह ११९:१०५'],
    optionsEn: ['Psalm 1:1', 'Psalm 23:1', 'Psalm 91:1', 'Psalm 119:105'],
    explanationNe: 'राजा दाऊदद्वारा रचित भजनसंग्रह २३ बाइबलको सबैभन्दा प्रिय भजनमध्ये एक हो।',
    explanation: 'A Psalm of David declaring the Lord’s faithful care and guidance.',
    referenceNe: 'भजनसंग्रह २३:१',
    reference: 'Psalm 23:1',
    difficulty: 'basic',
  },
  {
    id: 'ne-7',
    book: 'Psalms',
    bookNe: 'भजनसंग्रह',
    chapter: 119,
    questionNe: 'पूरा बाइबलमा सबैभन्दा लामो अध्याय कुन हो?',
    question: 'Which is the longest chapter in the entire Bible?',
    answerNe: 'भजनसंग्रह ११९ (Psalm 119 — १७६ पद)',
    answer: 'Psalm 119 (176 verses)',
    optionsNe: ['भजनसंग्रह ११७', 'भजनसंग्रह ११९ (Psalm 119 — १७६ पद)', 'यशैया ५३', 'उत्पत्ति १'],
    optionsEn: ['Psalm 117', 'Psalm 119 (176 verses)', 'Isaiah 53', 'Genesis 1'],
    explanationNe: 'भजनसंग्रह ११९ मा १७६ पदहरू छन् र यसले परमेश्वरको वचनको महिमा गर्दछ।',
    explanation: 'Psalm 119 is an acrostic Hebrew poem with 22 stanzas and 176 verses celebrating God’s Word.',
    referenceNe: 'भजनसंग्रह ११९:१-१७६',
    reference: 'Psalm 119:1-176',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-8',
    book: 'Daniel',
    bookNe: 'दानिएल',
    chapter: 6,
    questionNe: 'प्रार्थना गर्न नछोडेको कारण कसलाई सिंहको खोरमा फालिएको थियो?',
    question: 'Who was thrown into the lions’ den for refusing to stop praying to God?',
    answerNe: 'दानिएल (Daniel)',
    answer: 'Daniel',
    optionsNe: ['दानिएल (Daniel)', 'योना (Jonah)', 'यर्मिया (Jeremiah)', 'एलिया (Elijah)'],
    optionsEn: ['Daniel', 'Jonah', 'Jeremiah', 'Elijah'],
    explanationNe: 'परमेश्वरले आफ्ना स्वर्गदूत पठाएर सिंहहरूको मुख बन्द गरिदिनुभयो र दानिएल सुरक्षित रहे।',
    explanation: 'God sent His angel and shut the lions’ mouths so they did not hurt Daniel.',
    referenceNe: 'दानिएल ६:१६-२२',
    reference: 'Daniel 6:16-22',
    difficulty: 'basic',
  },
  {
    id: 'ne-9',
    book: 'Matthew',
    bookNe: 'मत्ती',
    chapter: 2,
    questionNe: 'प्रभु येशू ख्रीष्टको जन्म कुन सहरमा भएको थियो?',
    question: 'In which town was Lord Jesus Christ born?',
    answerNe: 'यहूदियाको बेथलेहेम (Bethlehem of Judea)',
    answer: 'Bethlehem of Judea',
    optionsNe: ['नासरत (Nazareth)', 'यहूदियाको बेथलेहेम (Bethlehem of Judea)', 'यरूशलेम (Jerusalem)', 'कफर्नहुम (Capernaum)'],
    optionsEn: ['Nazareth', 'Bethlehem of Judea', 'Jerusalem', 'Capernaum'],
    explanationNe: 'भविष्यवक्ता मीकाद्वारा अगमवाणी गरिएझैँ येशूको जन्म यहूदियाको बेथलेहेममा भएको थियो।',
    explanation: 'Jesus was born in Bethlehem of Judea in the days of Herod the king, fulfilling Micah 5:2.',
    referenceNe: 'मत्ती २:१, लूका २:४-७',
    reference: 'Matthew 2:1, Luke 2:4-7',
    difficulty: 'basic',
  },
  {
    id: 'ne-10',
    book: 'John',
    bookNe: 'यूहन्ना',
    chapter: 2,
    questionNe: 'प्रभु येशूले आफ्नो पहिलो आश्चर्यकर्म (पानीलाई दाखमद्यमा बद्लने) कहाँ गर्नुभएको थियो?',
    question: 'Where did Jesus perform His first miracle of turning water into wine?',
    answerNe: 'गालीलको काना (Cana of Galilee)',
    answer: 'Cana of Galilee',
    optionsNe: ['बेथानिया (Bethany)', 'गालीलको काना (Cana of Galilee)', 'यरिहो (Jericho)', 'समारिया (Samaria)'],
    optionsEn: ['Bethany', 'Cana of Galilee', 'Jericho', 'Samaria'],
    explanationNe: 'गालीलको कानामा भएको विवाह भोजमा येशूले पानीलाई उत्तम दाखमद्यमा परिणत गरी आफ्नो महिमा प्रकट गर्नुभयो।',
    explanation: 'This beginning of miracles Jesus did in Cana of Galilee, and manifested forth His glory.',
    referenceNe: 'यूहन्ना २:१-११',
    reference: 'John 2:1-11',
    difficulty: 'basic',
  },
  {
    id: 'ne-11',
    book: 'John',
    bookNe: 'यूहन्ना',
    chapter: 3,
    questionNe: 'राती येशूकहाँ आएर “नयाँ गरी जन्मनु” को विषयमा सोध्ने फरिसी अगुवा को थिए?',
    question: 'Which Pharisee and Jewish leader came to Jesus by night and heard about being born again?',
    answerNe: 'निकोदेमस (Nicodemus)',
    answer: 'Nicodemus',
    optionsNe: ['गमालिएल (Gamaliel)', 'निकोदेमस (Nicodemus)', 'अरिमथियाका जोसेफ (Joseph of Arimathea)', 'जक्कै (Zacchaeus)'],
    optionsEn: ['Gamaliel', 'Nicodemus', 'Joseph of Arimathea', 'Zacchaeus'],
    explanationNe: 'येशूले निकोदेमसलाई भन्नुभयो: “कोही पानी र आत्माबाट जन्मेन भने ऊ परमेश्वरको राज्यमा पस्न सक्दैन।”',
    explanation: 'Jesus explained to Nicodemus that one must be born of water and the Spirit (John 3:1-16).',
    referenceNe: 'यूहन्ना ३:१-१६',
    reference: 'John 3:1-16',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-12',
    book: 'John',
    bookNe: 'यूहन्ना',
    chapter: 14,
    questionNe: '“बाटो, सत्य र जीवन म नै हुँ” — यो वचन येशूले कुन चेलाको प्रश्नको जवाफमा भन्नुभएको थियो?',
    question: '“I am the way, the truth, and the life” was spoken by Jesus in answer to which disciple?',
    answerNe: 'थोमा (Thomas)',
    answer: 'Thomas',
    optionsNe: ['पत्रुस (Peter)', 'थोमा (Thomas)', 'फिलिप (Philip)', 'यूहन्ना (John)'],
    optionsEn: ['Peter', 'Thomas', 'Philip', 'John'],
    explanationNe: 'थोमाले “प्रभु, हामी बाटो कसरी जान्न सक्छौँ?” भनी सोध्दा येशूले यूहन्ना १४:६ को वचन भन्नुभयो।',
    explanation: 'Thomas asked how they could know the way, and Jesus declared He is the Way, the Truth, and the Life.',
    referenceNe: 'यूहन्ना १४:५-६',
    reference: 'John 14:5-6',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-13',
    book: 'Acts',
    bookNe: 'प्रेरित',
    chapter: 2,
    questionNe: 'पेन्तिकोसको दिनमा पवित्र आत्मा उत्रनुभएपछि पत्रुसको प्रचार सुनेर कति जनाले बप्तिस्मा लिए?',
    question: 'How many people were baptized on the Day of Pentecost after Peter’s sermon?',
    answerNe: 'करिब ३,००० जना (About 3,000 souls)',
    answer: 'About 3,000 souls',
    optionsNe: ['१२० जना', '५०० जना', 'करिब ३,००० जना (About 3,000 souls)', '५,००० जना'],
    optionsEn: ['120 souls', '500 souls', 'About 3,000 souls', '5,000 souls'],
    explanationNe: 'पत्रुसको वचन ग्रहण गर्नेहरूले बप्तिस्मा लिए र त्यस दिन मण्डलीमा करिब तीन हजार जना थपिए।',
    explanation: 'Those who gladly received his word were baptized, and about three thousand souls were added.',
    referenceNe: 'प्रेरित २:४१',
    reference: 'Acts 2:41',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-14',
    book: 'Acts',
    bookNe: 'प्रेरित',
    chapter: 9,
    questionNe: 'शाऊल (पावल) कुन सहरको बाटोमा जाँदै गर्दा स्वर्गबाट तेजिलो ज्योति चम्कियो र उनले प्रभु येशूको आवाज सुने?',
    question: 'On the road to which city did a light from heaven shine around Saul (Paul)?',
    answerNe: 'दमस्कस (Damascus)',
    answer: 'Damascus',
    optionsNe: ['एन्टिओखिया (Antioch)', 'दमस्कस (Damascus)', 'तार्सस (Tarsus)', 'रोम (Rome)'],
    optionsEn: ['Antioch', 'Damascus', 'Tarsus', 'Rome'],
    explanationNe: 'दमस्कसको बाटोमा प्रभु येशूको दर्शन पाएपछि शाऊलको जीवन परिवर्तन भयो र उनी अन्यजातिहरूका प्रेरित बने।',
    explanation: 'Saul encountered the risen Lord Jesus on the road to Damascus.',
    referenceNe: 'प्रेरित ९:३-६',
    reference: 'Acts 9:3-6',
    difficulty: 'basic',
  },
  {
    id: 'ne-15',
    book: 'Galatians',
    bookNe: 'गलाती',
    chapter: 5,
    questionNe: 'गलाती ५:२२-२३ अनुसार पवित्र आत्माका फलमा कतिवटा गुणहरू उल्लेख गरिएका छन्?',
    question: 'How many attributes of the Fruit of the Spirit are listed in Galatians 5:22-23?',
    answerNe: '९ वटा (Nine — प्रेम, आनन्द, शान्ति, धैर्य, दया, भलाइ, विश्वासयोग्यता, नम्रता, संयम)',
    answer: 'Nine (Love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance)',
    optionsNe: [
      '७ वटा',
      '९ वटा (Nine — प्रेम, आनन्द, शान्ति, धैर्य, दया, भलाइ, विश्वासयोग्यता, नम्रता, संयम)',
      '१० वटा',
      '१२ वटा',
    ],
    optionsEn: [
      'Seven',
      'Nine (Love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance)',
      'Ten',
      'Twelve',
    ],
    explanationNe: 'आत्माको फल प्रेम, आनन्द, शान्ति, धैर्य, दया, भलाइ, विश्वासयोग्यता, नम्रता र संयम हो।',
    explanation: 'Paul lists nine virtues that make up the Fruit of the Holy Spirit.',
    referenceNe: 'गलाती ५:२२-२३',
    reference: 'Galatians 5:22-23',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-16',
    book: 'Ephesians',
    bookNe: 'एफिसी',
    chapter: 6,
    questionNe: 'एफिसी ६ अध्यायमा परमेश्वरका सारा हातहतियारमध्ये “आत्माको तरवार” केलाई भनिएको छ?',
    question: 'In Ephesians 6 (the Armor of God), what is the “Sword of the Spirit”?',
    answerNe: 'परमेश्वरको वचन (The Word of God)',
    answer: 'The Word of God',
    optionsNe: ['विश्वास (Faith)', 'प्रार्थना (Prayer)', 'परमेश्वरको वचन (The Word of God)', 'उद्धारको टोप (Salvation)'],
    optionsEn: ['Faith', 'Prayer', 'The Word of God', 'Salvation'],
    explanationNe: '“उद्धारको टोप र आत्माको तरवार लेओ, जो चाहिँ परमेश्वरको वचन हो।” (एफिसी ६:१७)',
    explanation: 'Ephesians 6:17 identifies the sword of the Spirit as the Word of God.',
    referenceNe: 'एफिसी ६:१७',
    reference: 'Ephesians 6:17',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-17',
    book: 'Hebrews',
    bookNe: 'हिब्रू',
    chapter: 11,
    questionNe: 'पुरातन समयका विश्वासका वीरहरूको वर्णन गरिएको हिब्रूको प्रसिद्ध अध्याय कुन हो?',
    question: 'Which famous chapter of Hebrews is known as the “Hall of Faith”?',
    answerNe: 'हिब्रू ११ अध्याय (Hebrews Chapter 11)',
    answer: 'Hebrews Chapter 11',
    optionsNe: ['हिब्रू १ अध्याय', 'हिब्रू ४ अध्याय', 'हिब्रू ११ अध्याय (Hebrews Chapter 11)', 'हिब्रू १३ अध्याय'],
    optionsEn: ['Hebrews Chapter 1', 'Hebrews Chapter 4', 'Hebrews Chapter 11', 'Hebrews Chapter 13'],
    explanationNe: 'हिब्रू ११:१ ले भन्छ: “अब विश्वासचाहिँ आशा राखिएका कुराहरूको निश्चयता र नदेखिएका कुराहरूको प्रमाण हो।”',
    explanation: 'Hebrews 11 defines faith and recounts the faithfulness of Abel, Enoch, Noah, Abraham, and Moses.',
    referenceNe: 'हिब्रू ११:१-४०',
    reference: 'Hebrews 11:1-40',
    difficulty: 'intermediate',
  },
  {
    id: 'ne-18',
    book: 'Revelation',
    bookNe: 'प्रकाश',
    chapter: 1,
    questionNe: 'प्रेरित यूहन्नाले कुन टापुमा हुँदा प्रकाश (Revelation) को दर्शन प्राप्त गरेर लेखे?',
    question: 'On which island was the Apostle John exiled when he received the book of Revelation?',
    answerNe: 'पत्मोस टापु (Island of Patmos)',
    answer: 'Island of Patmos',
    optionsNe: ['साइप्रस (Cyprus)', 'क्रीट (Crete)', 'पत्मोस टापु (Island of Patmos)', 'माल्टा (Malta)'],
    optionsEn: ['Cyprus', 'Crete', 'Island of Patmos', 'Malta'],
    explanationNe: 'परमेश्वरको वचन र येशूको गवाहीको निम्ति यूहन्ना पत्मोस भनिने टापुमा थिए।',
    explanation: 'John was on the island called Patmos for the word of God and for the testimony of Jesus Christ.',
    referenceNe: 'प्रकाश १:९',
    reference: 'Revelation 1:9',
    difficulty: 'basic',
  },
  {
    id: 'ne-19',
    book: 'Genesis',
    bookNe: 'उत्पत्ति',
    chapter: 5,
    questionNe: 'बाइबलमा सबैभन्दा धेरै वर्ष (९६९ वर्ष) बाँचेका व्यक्ति को थिए?',
    question: 'Who was the oldest person recorded in the Bible, living 969 years?',
    answerNe: 'मथूशेलह (Methuselah)',
    answer: 'Methuselah',
    optionsNe: ['आदम (Adam)', 'हनोक (Enoch)', 'मथूशेलह (Methuselah)', 'नोआ (Noah)'],
    optionsEn: ['Adam', 'Enoch', 'Methuselah', 'Noah'],
    explanationNe: 'हनोकका छोरा मथूशेलह जम्मा ९६९ वर्ष बाँचे।',
    explanation: 'All the days of Methuselah were nine hundred sixty and nine years.',
    referenceNe: 'उत्पत्ति ५:२७',
    reference: 'Genesis 5:27',
    difficulty: 'advanced',
  },
  {
    id: 'ne-20',
    book: 'Matthew',
    bookNe: 'मत्ती',
    chapter: 28,
    questionNe: 'मत्ती २८:१९-२० मा प्रभु येशूले आफ्ना चेलाहरूलाई दिनुभएको अन्तिम आज्ञालाई के भनिन्छ?',
    question: 'What is Jesus’ final command in Matthew 28:19-20 commonly called?',
    answerNe: 'महान आज्ञा (The Great Commission)',
    answer: 'The Great Commission',
    optionsNe: ['धन्यका वचन (Beatitudes)', 'महान आज्ञा (The Great Commission)', 'स्वर्ण नियम (Golden Rule)', 'प्रभुको प्रार्थना (Lord’s Prayer)'],
    optionsEn: ['The Beatitudes', 'The Great Commission', 'The Golden Rule', 'The Lord’s Prayer'],
    explanationNe: '“यसकारण जाओ र सबै देशका जातिहरूलाई चेला बनाओ...” (मत्ती २८:१९-२०)',
    explanation: 'Jesus commissioned His disciples to go and make disciples of all nations.',
    referenceNe: 'मत्ती २८:१९-२०',
    reference: 'Matthew 28:19-20',
    difficulty: 'basic',
  },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface BibleQuizViewProps {
  lang: 'ne' | 'en';
  onNotify: (msg: string) => void;
  onOpenBible?: () => void;
}

export const BibleQuizView: React.FC<BibleQuizViewProps> = ({ lang, onNotify, onOpenBible }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'bank' | 'review' | 'reports'>('play');

  // Manifest of 66 books from /bible-quiz/index.json
  const [manifest, setManifest] = useState<QuizIndexManifest | null>(null);
  const [loadedBookCache, setLoadedBookCache] = useState<Record<string, BibleQuizQuestion[]>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);

  // Custom user-added questions (stored in localStorage)
  const [customQuestions, setCustomQuestions] = useState<BibleQuizQuestion[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('biblesandes_custom_quiz_questions') || '[]');
    } catch {
      return [];
    }
  });

  // Quiz Setup Filters (matching QuizSetup.jsx in sojipariola/bible_quiz_app)
  const [quizSource, setQuizSource] = useState<'nepali_bilingual' | '66_books_repo'>(
    lang === 'ne' ? 'nepali_bilingual' : '66_books_repo'
  );
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [questionLimit, setQuestionLimit] = useState<number>(10);
  const [timerSeconds, setTimerSeconds] = useState<number>(30); // Default 30s per question timer

  // Active Quiz Runner State (matching Quiz.jsx in sojipariola/bible_quiz_app)
  const [quizStarted, setQuizStarted] = useState<boolean>(false);
  const [activeQuestions, setActiveQuestions] = useState<BibleQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [elapsedTotalSeconds, setElapsedTotalSeconds] = useState<number>(0);
  const [answersLog, setAnswersLog] = useState<QuizAttemptRecord['answersLog']>([]);

  // Question Bank Explorer State (matching BibleQuanes.jsx)
  const [bankBook, setBankBook] = useState<string>('Genesis');
  const [bankChapter, setBankChapter] = useState<string>('');
  const [bankDifficulty, setBankDifficulty] = useState<string>('');
  const [bankSearch, setBankSearch] = useState<string>('');
  const [bankPage, setBankPage] = useState<number>(1);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [newQuestionForm, setNewQuestionForm] = useState({
    book: 'Genesis',
    chapter: '1',
    question: '',
    answer: '',
    explanation: '',
    reference: '',
    difficulty: 'basic' as 'basic' | 'intermediate' | 'advanced',
  });

  // Quiz Reports & History (matching Reports.jsx)
  const [quizHistory, setQuizHistory] = useState<QuizAttemptRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('biblesandes_quiz_reports') || '[]');
    } catch {
      return [];
    }
  });

  // Load 66-book index manifest on mount
  useEffect(() => {
    fetch('/bible-quiz/index.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: QuizIndexManifest | null) => {
        if (data) setManifest(data);
      })
      .catch(() => {});
  }, []);

  // Helper to fetch a specific book's JSON file from /bible-quiz/
  const ensureBookLoaded = async (bookName: string): Promise<BibleQuizQuestion[]> => {
    if (loadedBookCache[bookName]) return loadedBookCache[bookName];
    const entry = manifest?.books.find((b) => b.book === bookName);
    if (!entry) return [];
    try {
      const res = await fetch(`/bible-quiz/${entry.file}`);
      if (!res.ok) return [];
      const arr: BibleQuizQuestion[] = await res.json();
      setLoadedBookCache((prev) => ({ ...prev, [bookName]: arr }));
      return arr;
    } catch {
      return [];
    }
  };

  // Preload Genesis by default for Question Bank Explorer
  useEffect(() => {
    if (manifest && bankBook) {
      ensureBookLoaded(bankBook);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest, bankBook]);

  // Countdown timer effect during active quiz + Total elapsed timer
  useEffect(() => {
    if (!quizStarted || currentIndex >= activeQuestions.length) {
      return;
    }
    const elapsedInterval = setInterval(() => {
      if (!revealed) {
        setElapsedTotalSeconds((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(elapsedInterval);
  }, [quizStarted, revealed, currentIndex, activeQuestions.length]);

  useEffect(() => {
    if (!quizStarted || revealed || timerSeconds <= 0 || currentIndex >= activeQuestions.length) {
      return;
    }
    if (timeLeft <= 0) {
      // Time up -> reveal answer as unanswered
      handleSelectChoice('__TIME_UP__');
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, revealed, timeLeft, timerSeconds, currentIndex, activeQuestions.length]);

  // Available chapters for selected book in Setup
  const availableChaptersForSetup = useMemo(() => {
    if (quizSource === 'nepali_bilingual') {
      const pool = [...NEPALI_BILINGUAL_QUESTIONS, ...customQuestions];
      const filtered = selectedBook ? pool.filter((q) => q.book === selectedBook) : pool;
      return [...new Set(filtered.map((q) => q.chapter))].sort((a, b) => a - b);
    }
    if (!selectedBook || !manifest) return [];
    const entry = manifest.books.find((b) => b.book === selectedBook);
    return entry ? entry.chapters : [];
  }, [quizSource, selectedBook, manifest, customQuestions]);

  // Build 4 multiple choice options for current question
  const generateChoicesForQuestion = (q: BibleQuizQuestion, pool: BibleQuizQuestion[]) => {
    if (quizSource === 'nepali_bilingual') {
      if (lang === 'ne' && q.optionsNe && q.optionsNe.length >= 2) {
        return shuffleArray(q.optionsNe);
      }
      if (lang === 'en' && q.optionsEn && q.optionsEn.length >= 2) {
        return shuffleArray(q.optionsEn);
      }
    }
    const correctAns =
      quizSource === 'nepali_bilingual' && lang === 'ne' && q.answerNe ? q.answerNe : q.answer;
    const otherAnswers = pool
      .filter((x) => x.id !== q.id)
      .map((x) => (quizSource === 'nepali_bilingual' && lang === 'ne' && x.answerNe ? x.answerNe : x.answer))
      .filter((a) => a && a !== correctAns);
    const uniqueDistractors = shuffleArray([...new Set(otherAnswers)]).slice(0, 3);
    // Fallback distractors if pool is very small
    while (uniqueDistractors.length < 3) {
      const fallbacks = ['Moses', 'David', 'Jerusalem', 'The seventh day', 'Paul', 'Peter'];
      const pick = fallbacks.find((f) => f !== correctAns && !uniqueDistractors.includes(f));
      if (pick) uniqueDistractors.push(pick);
      else break;
    }
    return shuffleArray([correctAns, ...uniqueDistractors]);
  };

  // Start Quiz handler
  const handleStartQuiz = async () => {
    setLoadingQuestions(true);
    try {
      let candidatePool: BibleQuizQuestion[] = [];

      if (quizSource === 'nepali_bilingual') {
        candidatePool = [...NEPALI_BILINGUAL_QUESTIONS, ...customQuestions];
      } else {
        // Load from 66-book repository
        if (selectedBook) {
          const bookQs = await ensureBookLoaded(selectedBook);
          candidatePool = [...bookQs, ...customQuestions.filter((c) => c.book === selectedBook)];
        } else {
          // Pick 4 random books from manifest to assemble a diverse cross-Bible pool quickly
          const booksList = manifest?.books || [];
          const sampledBooks =
            booksList.length > 0
              ? shuffleArray(booksList).slice(0, 5).map((b) => b.book)
              : ['Genesis', 'Psalms', 'Matthew', 'John', 'Acts'];
          const results = await Promise.all(sampledBooks.map((b) => ensureBookLoaded(b)));
          candidatePool = [...results.flat(), ...customQuestions];
        }
      }

      // Apply filters
      if (selectedBook) {
        candidatePool = candidatePool.filter((q) => q.book === selectedBook);
      }
      if (selectedChapter) {
        const chNum = Number(selectedChapter);
        candidatePool = candidatePool.filter((q) => q.chapter === chNum);
      }
      if (selectedDifficulty) {
        candidatePool = candidatePool.filter((q) => q.difficulty === selectedDifficulty);
      }

      if (candidatePool.length === 0) {
        onNotify(
          lang === 'ne'
            ? 'यो फिल्टरमा कुनै प्रश्न भेटिएन। कृपया अर्को पुस्तक वा कठिनाइ रोज्नुहोस्।'
            : 'No questions matched your filters. Please try different selections.'
        );
        setLoadingQuestions(false);
        return;
      }

      const picked = shuffleArray(candidatePool).slice(0, Math.min(questionLimit, candidatePool.length));
      setActiveQuestions(picked);
      setCurrentIndex(0);
      setCurrentChoices(generateChoicesForQuestion(picked[0], candidatePool));
      setEliminatedChoices([]);
      setShowHint(false);
      setSelectedChoice(null);
      setRevealed(false);
      setScore(0);
      setStreak(0);
      setBestStreak(0);
      setElapsedTotalSeconds(0);
      setAnswersLog([]);
      if (timerSeconds > 0) setTimeLeft(timerSeconds);
      setQuizStarted(true);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const currentQuestion = activeQuestions[currentIndex];

  const getQuestionPrompt = (q: BibleQuizQuestion) => {
    if (quizSource === 'nepali_bilingual' && lang === 'ne' && q.questionNe) {
      return q.questionNe;
    }
    return q.question;
  };

  const getCorrectAnswer = (q: BibleQuizQuestion) => {
    if (quizSource === 'nepali_bilingual' && lang === 'ne' && q.answerNe) {
      return q.answerNe;
    }
    return q.answer;
  };

  const getExplanation = (q: BibleQuizQuestion) => {
    if (quizSource === 'nepali_bilingual' && lang === 'ne' && q.explanationNe) {
      return q.explanationNe;
    }
    return q.explanation;
  };

  const getReference = (q: BibleQuizQuestion) => {
    if (quizSource === 'nepali_bilingual' && lang === 'ne' && q.referenceNe) {
      return q.referenceNe;
    }
    return q.reference || `${q.book} ${q.chapter}`;
  };

  const formatBookDisplay = (bookEn: string) => {
    const info = BOOK_NAME_NE_MAP[bookEn];
    if (!info) return bookEn;
    return lang === 'ne' ? `${info.ne} (${bookEn})` : `${bookEn} (${info.ne})`;
  };

  const handleSelectChoice = (choice: string) => {
    if (revealed || !currentQuestion) return;
    const correctAns = getCorrectAnswer(currentQuestion);
    const isCorrect = choice === correctAns;
    setSelectedChoice(choice);
    setRevealed(true);

    const nextScore = isCorrect ? score + 1 : score;
    const nextStreak = isCorrect ? streak + 1 : 0;
    if (isCorrect) setScore(nextScore);
    setStreak(nextStreak);
    if (nextStreak > bestStreak) setBestStreak(nextStreak);

    const updatedLog: QuizAttemptRecord['answersLog'] = [
      ...answersLog,
      {
        question: getQuestionPrompt(currentQuestion),
        selectedAnswer: choice === '__TIME_UP__' ? (lang === 'ne' ? 'समय सकियो (Time Up)' : 'Time Up') : choice,
        correctAnswer: correctAns,
        reference: getReference(currentQuestion),
        explanation: getExplanation(currentQuestion),
        isCorrect,
      },
    ];
    setAnswersLog(updatedLog);

    // If this was the last question, save report to localStorage
    if (currentIndex + 1 === activeQuestions.length) {
      const percent = Math.round((nextScore / activeQuestions.length) * 100);
      const newReport: QuizAttemptRecord = {
        id: `quiz-${Date.now()}`,
        dateBs: '२०८३ कार्तिक १४',
        dateAd: 'Oct 31, 2026',
        quizSource,
        bookFilter: selectedBook || (lang === 'ne' ? 'सबै पुस्तक' : 'All Books'),
        chapterFilter: selectedChapter || 'All',
        difficultyFilter: selectedDifficulty || 'All',
        score: nextScore,
        total: activeQuestions.length,
        percent,
        answersLog: updatedLog,
      };
      setQuizHistory((prev) => {
        const next = [newReport, ...prev].slice(0, 30);
        try {
          localStorage.setItem('biblesandes_quiz_reports', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < activeQuestions.length) {
      setCurrentIndex(nextIdx);
      setCurrentChoices(generateChoicesForQuestion(activeQuestions[nextIdx], activeQuestions));
      setEliminatedChoices([]);
      setShowHint(false);
      setSelectedChoice(null);
      setRevealed(false);
      if (timerSeconds > 0) setTimeLeft(timerSeconds);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  // 50/50 Lifeline
  const handleFiftyFifty = () => {
    if (!currentQuestion || revealed || eliminatedChoices.length > 0) return;
    const correctAns = getCorrectAnswer(currentQuestion);
    const wrongChoices = currentChoices.filter((c) => c !== correctAns);
    const toEliminate = shuffleArray(wrongChoices).slice(0, 2);
    setEliminatedChoices(toEliminate);
  };

  // Text-to-Speech Read Aloud (matching ttsController in sojipariola/bible_quiz_app)
  const handleSpeakQuestion = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onNotify(lang === 'ne' ? 'तपाईंको ब्राउजरमा आवाज सुविधा उपलब्ध छैन।' : 'Speech synthesis not supported.');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = quizSource === 'nepali_bilingual' && lang === 'ne' ? 'ne-NP' : 'en-US';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  };

  // Filtered Question Bank rows for Tab 2 (BibleQuanes.jsx)
  const bankQuestions = useMemo(() => {
    const repoRows = loadedBookCache[bankBook] || [];
    const customForBook = customQuestions.filter((q) => !bankBook || q.book === bankBook);
    let combined = [...customForBook, ...repoRows];

    if (bankChapter) {
      combined = combined.filter((q) => q.chapter === Number(bankChapter));
    }
    if (bankDifficulty) {
      combined = combined.filter((q) => q.difficulty === bankDifficulty);
    }
    if (bankSearch.trim()) {
      const qLower = bankSearch.trim().toLowerCase();
      combined = combined.filter(
        (q) =>
          q.question.toLowerCase().includes(qLower) ||
          q.answer.toLowerCase().includes(qLower) ||
          q.reference.toLowerCase().includes(qLower)
      );
    }
    return combined;
  }, [loadedBookCache, bankBook, bankChapter, bankDifficulty, bankSearch, customQuestions]);

  const bankPageSize = 10;
  const bankTotalPages = Math.max(1, Math.ceil(bankQuestions.length / bankPageSize));
  const paginatedBankQuestions = bankQuestions.slice(
    (bankPage - 1) * bankPageSize,
    bankPage * bankPageSize
  );

  // Add Custom Question handler
  const handleCreateCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionForm.question.trim() || !newQuestionForm.answer.trim()) return;

    const bookInfo = BOOK_NAME_NE_MAP[newQuestionForm.book];
    const created: BibleQuizQuestion = {
      id: `custom-${Date.now()}`,
      book: newQuestionForm.book,
      bookNe: bookInfo?.ne || newQuestionForm.book,
      chapter: Number(newQuestionForm.chapter) || 1,
      question: newQuestionForm.question.trim(),
      questionNe: newQuestionForm.question.trim(),
      answer: newQuestionForm.answer.trim(),
      answerNe: newQuestionForm.answer.trim(),
      explanation: newQuestionForm.explanation.trim(),
      explanationNe: newQuestionForm.explanation.trim(),
      reference:
        newQuestionForm.reference.trim() || `${newQuestionForm.book} ${newQuestionForm.chapter}`,
      referenceNe:
        newQuestionForm.reference.trim() || `${bookInfo?.ne || newQuestionForm.book} ${newQuestionForm.chapter}`,
      difficulty: newQuestionForm.difficulty,
      isCustom: true,
    };

    setCustomQuestions((prev) => {
      const updated = [created, ...prev];
      try {
        localStorage.setItem('biblesandes_custom_quiz_questions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setShowAddQuestionModal(false);
    setNewQuestionForm({
      book: bankBook || 'Genesis',
      chapter: '1',
      question: '',
      answer: '',
      explanation: '',
      reference: '',
      difficulty: 'basic',
    });
    onNotify(
      lang === 'ne'
        ? 'नयाँ बाइबल क्विज प्रश्न सफलतापूर्वक थपियो!'
        : 'New Bible quiz question added to Question Bank!'
    );
  };

  const handleDeleteCustomQuestion = (id: string | number) => {
    setCustomQuestions((prev) => {
      const updated = prev.filter((q) => q.id !== id);
      try {
        localStorage.setItem('biblesandes_custom_quiz_questions', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    onNotify(lang === 'ne' ? 'प्रश्न हटाइयो।' : 'Question removed.');
  };

  const totalQuestionsCount = (manifest?.totalQuestions || 11982) + NEPALI_BILINGUAL_QUESTIONS.length + customQuestions.length;

  return (
    <div className="space-y-6">
      {/* =====================================================================
          HERO HEADER FOR BIBLE QUIZ MODULE (sojipariola/bible_quiz_app)
         ===================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950 via-red-900 to-slate-900 text-white p-6 sm:p-8 border border-red-800/40 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>
                {lang === 'ne'
                  ? `पवित्र बाइबल क्विज र प्रश्नोत्तरी • ६६ पुस्तक • ${toNepaliDigits(totalQuestionsCount)} प्रश्नहरू`
                  : `Interactive Bible Quiz & Question Bank • 66 Books • ${totalQuestionsCount.toLocaleString()} Questions`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
              {lang === 'ne'
                ? 'बाइबल सन्देश बाइबल क्विज (Bible Quiz & Scripture Trivia)'
                : 'Bible Sandes Interactive Bible Quiz & 66-Book Question Bank'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              {lang === 'ne'
                ? 'पुरानो र नयाँ करारका ६६ वटै पुस्तक र अध्यायअनुसार बाइबल हाजिरीजवाफ खेल्नुहोस्। आधारभूत (Basic), मध्यम (Intermediate) र गहन (Advanced) तहका प्रश्नहरू, वचन सन्दर्भ र व्याख्यासहित।'
                : 'Test and grow your Scripture knowledge across all 66 Books and 1,189 Chapters of the Bible. Filter by Book, Chapter, Difficulty (Basic, Intermediate, Advanced), listen via TTS, and review full verse explanations.'}
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <p className="text-[11px] text-amber-300 font-semibold">
                {lang === 'ne' ? 'कुल पुस्तक' : 'Bible Books'}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-0.5">
                {lang === 'ne' ? '६६' : '66'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <p className="text-[11px] text-amber-300 font-semibold">
                {lang === 'ne' ? 'प्रश्न बैंक' : 'Total Questions'}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-0.5">
                {lang === 'ne' ? '१२,००२+' : '12,002+'}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <p className="text-[11px] text-amber-300 font-semibold">
                {lang === 'ne' ? 'खेलिएको क्विज' : 'Quizzes Taken'}
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-0.5">
                {lang === 'ne' ? toNepaliDigits(quizHistory.length) : quizHistory.length}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-navigation Tabs matching sojipariola/bible_quiz_app */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center gap-2">
          {[
            {
              id: 'play',
              ne: 'क्विज खेल्नुहोस् (Play Quiz)',
              en: 'Play Bible Quiz',
              icon: Play,
            },
            {
              id: 'bank',
              ne: '६६ पुस्तक प्रश्न बैंक (Question Bank)',
              en: '66-Book Question Bank (11,982)',
              icon: Layers,
            },
            {
              id: 'review',
              ne: 'समीक्षा र उत्तरहरू (Answer Review)',
              en: 'Answer Review Queue',
              icon: ListChecks,
            },
            {
              id: 'reports',
              ne: 'नतिजा र रिपोर्ट (Score Reports)',
              en: 'Reports & History',
              icon: BarChart3,
            },
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{lang === 'ne' ? tab.ne : tab.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: PLAY QUIZ (QuizSetup + Interactive Quiz Runner)
         ===================================================================== */}
      {activeTab === 'play' && (
        <div>
          {!quizStarted ? (
            /* QUIZ SETUP SCREEN (QuizSetup.jsx) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-red-800 dark:text-amber-400">
                      {lang === 'ne' ? 'क्विज सेटअप (Start a Bible Quiz)' : 'Configure Your Bible Quiz'}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      {lang === 'ne'
                        ? 'पुस्तक, अध्याय र कठिनाइ तह छान्नुहोस्'
                        : 'Select Language Mode, Bible Book, Chapter & Difficulty'}
                    </h2>
                  </div>
                  <Filter className="w-5 h-5 text-red-800 dark:text-amber-400" />
                </div>

                {/* 1. Quiz Dataset / Language Mode Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'ne'
                      ? '१. प्रश्नोत्तरी भाषा र स्रोत (Select Quiz Mode & Language):'
                      : '1. Select Quiz Mode & Dataset:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setQuizSource('nepali_bilingual');
                        setSelectedBook('');
                        setSelectedChapter('');
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        quizSource === 'nepali_bilingual'
                          ? 'border-red-800 bg-red-800/5 dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-stone-200 dark:border-slate-800 hover:border-red-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-red-800 text-white">
                          नेपाली / Bilingual
                        </span>
                        {quizSource === 'nepali_bilingual' && (
                          <CheckCircle2 className="w-4 h-4 text-red-800 dark:text-amber-400" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {lang === 'ne'
                          ? 'नेपाली बाइबल प्रश्नोत्तरी (Nepali & English)'
                          : 'Nepali & English Bilingual Bible Quiz'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'ne'
                          ? 'मण्डली, युवा संगति र सन्डे स्कूलका लागि नेपाली र अंग्रेजीमा विशेष प्रश्नहरू'
                          : 'Curated bilingual Nepali & English Scripture questions for church & youth quiz'}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setQuizSource('66_books_repo');
                        setSelectedBook('Genesis');
                        setSelectedChapter('');
                      }}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        quizSource === '66_books_repo'
                          ? 'border-red-800 bg-red-800/5 dark:border-amber-400 dark:bg-amber-400/10'
                          : 'border-stone-200 dark:border-slate-800 hover:border-red-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-900 text-white">
                          66 Books · 11,982 Qs
                        </span>
                        {quizSource === '66_books_repo' && (
                          <CheckCircle2 className="w-4 h-4 text-red-800 dark:text-amber-400" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {lang === 'ne'
                          ? '६६ पुस्तक पूर्ण अध्यायगत क्विज (11,982 Questions)'
                          : 'Complete 66-Book Chapter-by-Chapter Quiz (KJV)'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {lang === 'ne'
                          ? 'उत्पत्तिदेखि प्रकाशसम्मका ६६ वटै पुस्तक र १,१८९ अध्यायका ११,९८२ प्रश्नहरू'
                          : 'Full 11,982-question dataset covering every book and chapter from Genesis to Revelation'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Book & Chapter Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ne' ? '२. बाइबलको पुस्तक (Book of the Bible):' : '2. Book of the Bible:'}
                    </label>
                    <select
                      value={selectedBook}
                      onChange={(e) => {
                        setSelectedBook(e.target.value);
                        setSelectedChapter('');
                      }}
                      className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="">
                        {lang === 'ne' ? 'सबै पुस्तकहरू (All Books)' : 'All Books (Random Mix)'}
                      </option>
                      {(manifest?.books || []).map((b) => {
                        const info = BOOK_NAME_NE_MAP[b.book];
                        return (
                          <option key={b.book} value={b.book}>
                            {info ? `${info.ne} · ${b.book}` : b.book} ({b.count} Qs)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ne' ? '३. अध्याय छान्नुहोस् (Chapter):' : '3. Chapter (Optional):'}
                    </label>
                    <select
                      value={selectedChapter}
                      onChange={(e) => setSelectedChapter(e.target.value)}
                      disabled={!selectedBook}
                      className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="">
                        {selectedBook
                          ? lang === 'ne'
                            ? 'सबै अध्याय (All Chapters)'
                            : 'All Chapters'
                          : lang === 'ne'
                          ? 'पहिले पुस्तक छान्नुहोस्'
                          : 'Select a book first'}
                      </option>
                      {availableChaptersForSetup.map((ch) => (
                        <option key={ch} value={String(ch)}>
                          {lang === 'ne' ? `अध्याय ${toNepaliDigits(ch)} (Chapter ${ch})` : `Chapter ${ch}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Difficulty, Question Count & Timer */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ne' ? '४. कठिनाइ तह (Difficulty):' : '4. Difficulty Level:'}
                    </label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      <option value="">{lang === 'ne' ? 'सबै तह (Any Difficulty)' : 'Any Difficulty'}</option>
                      <option value="basic">{lang === 'ne' ? 'आधारभूत (Basic — ४,७७३)' : 'Basic (4,773)'}</option>
                      <option value="intermediate">
                        {lang === 'ne' ? 'मध्यम (Intermediate — ४,७८५)' : 'Intermediate (4,785)'}
                      </option>
                      <option value="advanced">
                        {lang === 'ne' ? 'गहन (Advanced — २,४२४)' : 'Advanced (2,424)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ne' ? '५. प्रश्न संख्या (Number of Questions):' : '5. Number of Questions:'}
                    </label>
                    <select
                      value={questionLimit}
                      onChange={(e) => setQuestionLimit(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      {[5, 10, 20, 30, 50, 100].map((cnt) => (
                        <option key={cnt} value={cnt}>
                          {lang === 'ne' ? `${toNepaliDigits(cnt)} प्रश्नहरू (${cnt} Questions)` : `${cnt} Questions`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      {lang === 'ne' ? '६. समय सीमा (Timer per Question):' : '6. Countdown Timer:'}
                    </label>
                    <select
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                    >
                      <option value={15}>{lang === 'ne' ? '१५ सेकेन्ड (15 Seconds — तीव्र)' : '15 Seconds / Question'}</option>
                      <option value={30}>{lang === 'ne' ? '३० सेकेन्ड (30 Seconds — मानक)' : '30 Seconds / Question (Default)'}</option>
                      <option value={45}>{lang === 'ne' ? '४५ सेकेन्ड (45 Seconds)' : '45 Seconds / Question'}</option>
                      <option value={60}>{lang === 'ne' ? '६० सेकेन्ड (60 Seconds)' : '60 Seconds / Question'}</option>
                      <option value={0}>{lang === 'ne' ? 'खुला समय (Stopwatch Only)' : 'Stopwatch Only (No Limit)'}</option>
                    </select>
                  </div>
                </div>

                {/* Quick Preset Topic Buttons */}
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {lang === 'ne'
                      ? 'लोकप्रिय बाइबल क्विज विषयहरू (Quick Start Topics):'
                      : 'Quick Start Bible Quiz Topics:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { labelNe: 'नेपाली विशेष प्रश्नोत्तरी', labelEn: 'Nepali Youth Quiz', source: 'nepali_bilingual' as const, book: '' },
                      { labelNe: 'उत्पत्ति (Genesis)', labelEn: 'Genesis (510 Qs)', source: '66_books_repo' as const, book: 'Genesis' },
                      { labelNe: 'भजनसंग्रह (Psalms)', labelEn: 'Psalms (755 Qs)', source: '66_books_repo' as const, book: 'Psalms' },
                      { labelNe: 'मत्ती (Matthew)', labelEn: 'Matthew (284 Qs)', source: '66_books_repo' as const, book: 'Matthew' },
                      { labelNe: 'यूहन्ना (John)', labelEn: 'John (213 Qs)', source: '66_books_repo' as const, book: 'John' },
                      { labelNe: 'प्रेरित (Acts)', labelEn: 'Acts (280 Qs)', source: '66_books_repo' as const, book: 'Acts' },
                      { labelNe: 'प्रकाश (Revelation)', labelEn: 'Revelation (221 Qs)', source: '66_books_repo' as const, book: 'Revelation' },
                    ].map((preset) => (
                      <button
                        key={preset.labelEn}
                        type="button"
                        onClick={() => {
                          setQuizSource(preset.source);
                          setSelectedBook(preset.book);
                          setSelectedChapter('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-red-800 hover:text-white dark:hover:bg-amber-400 dark:hover:text-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {lang === 'ne' ? preset.labelNe : preset.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {quizSource === 'nepali_bilingual'
                      ? lang === 'ne'
                        ? 'द्वि-भाषी नेपाली र अंग्रेजी बाइबल क्विज मोड सक्रिय छ।'
                        : 'Bilingual Nepali & English Quiz mode active.'
                      : lang === 'ne'
                      ? `चयन गरिएको पुस्तक: ${selectedBook ? formatBookDisplay(selectedBook) : 'सबै ६६ पुस्तक'}`
                      : `Selected Book: ${selectedBook || 'All 66 Books'}`}
                  </div>

                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    disabled={loadingQuestions}
                    className="h-12 px-8 rounded-xl bg-red-800 hover:bg-red-900 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>
                      {loadingQuestions
                        ? lang === 'ne'
                          ? 'प्रश्न लोड हुँदैछ...'
                          : 'Loading Questions...'
                        : lang === 'ne'
                        ? 'बाइबल क्विज सुरु गर्नुहोस् (Start Quiz)'
                        : 'Start Bible Quiz Now'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Right 4 Columns: How it Works & Recent High Scores */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-800 dark:text-amber-400" />
                    <span>{lang === 'ne' ? 'क्विजका विशेषताहरू (Quiz Features)' : 'Bible Quiz Features'}</span>
                  </h3>
                  <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === 'ne'
                          ? '६६ वटै पुस्तक र १,१८९ अध्यायका ११,९८२+ प्रामाणिक प्रश्नहरू'
                          : '11,982+ questions covering all 66 Books and 1,189 Chapters'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === 'ne'
                          ? '५०/५० लाइफलाइन (50/50 Lifeline) र बाइबल पद संकेत (Verse Hint)'
                          : '50/50 Lifeline & Scripture Reference Hints during gameplay'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === 'ne'
                          ? 'प्रश्न र उत्तर आवाजमा सुन्ने सुविधा (TTS Read-Aloud)'
                          : 'Text-to-Speech (TTS) Read-Aloud for questions and explanations'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === 'ne'
                          ? 'आफ्नै मण्डली वा युवा संगतिको प्रश्न थप्न मिल्ने सुविधा'
                          : 'Add custom church or youth fellowship quiz questions'}
                      </span>
                    </li>
                  </ul>
                </div>

                {quizHistory.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{lang === 'ne' ? 'हालैका नतिजाहरू (Recent Scores)' : 'Recent Quiz Scores'}</span>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="text-xs text-red-800 dark:text-amber-400 hover:underline"
                      >
                        {lang === 'ne' ? 'सबै हेर्नुहोस् →' : 'View All →'}
                      </button>
                    </h3>
                    <div className="space-y-2">
                      {quizHistory.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.bookFilter}</p>
                            <p className="text-[11px] text-slate-500">{item.dateBs}</p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                            {item.score}/{item.total} ({item.percent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : currentIndex >= activeQuestions.length ? (
            /* QUIZ COMPLETE SCORECARD SCREEN (matching Quiz.jsx done state) */
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 max-w-3xl mx-auto text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Award className="w-9 h-9" />
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-bold text-red-800 dark:text-amber-400">
                  {lang === 'ne' ? 'बाइबल क्विज सम्पन्न भयो (Quiz Complete)' : 'Bible Quiz Complete'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  {Math.round((score / activeQuestions.length) * 100) === 100
                    ? lang === 'ne'
                      ? 'उत्कृष्ट! १००% सही जवाफ! 🎉'
                      : 'Perfect Score! 100% Correct! 🎉'
                    : Math.round((score / activeQuestions.length) * 100) >= 70
                    ? lang === 'ne'
                      ? 'धेरै राम्रो प्रयास! परमेश्वरको वचनमा बढ्दै जानुहोस्!'
                      : 'Great Job! Keep growing in the Word!'
                    : lang === 'ne'
                    ? 'राम्रो प्रयास! निरन्तर बाइबल अध्ययन जारी राख्नुहोस्।'
                    : 'Good effort! Keep reading and studying Scripture.'}
                </h2>
              </div>

              <div className="py-4 flex flex-wrap items-center justify-center gap-6">
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 min-w-[130px]">
                  <span className="text-xs text-slate-500 block">
                    {lang === 'ne' ? 'कुल प्राप्ताङ्क' : 'Final Score'}
                  </span>
                  <span className="text-3xl font-bold font-mono text-red-800 dark:text-amber-400 mt-1 block">
                    {score} / {activeQuestions.length}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 min-w-[130px]">
                  <span className="text-xs text-slate-500 block">
                    {lang === 'ne' ? 'प्रतिशत (Accuracy)' : 'Accuracy'}
                  </span>
                  <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {Math.round((score / activeQuestions.length) * 100)}%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 min-w-[130px]">
                  <span className="text-xs text-slate-500 block">
                    {lang === 'ne' ? 'उत्कृष्ट स्ट्रिक' : 'Best Streak'}
                  </span>
                  <span className="text-3xl font-bold font-mono text-blue-600 dark:text-sky-400 mt-1 block">
                    {bestStreak} 🔥
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleStartQuiz}
                  className="h-11 px-6 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'फेरि खेल्नुहोस् (Retake Quiz)' : 'Retake Same Filters'}</span>
                </button>

                <button
                  onClick={() => setQuizStarted(false)}
                  className="h-11 px-6 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-slate-800 dark:text-slate-200 text-xs font-bold"
                >
                  {lang === 'ne' ? 'फिल्टर परिवर्तन गर्नुहोस् (Change Filters)' : 'Change Filters'}
                </button>

                <button
                  onClick={() => setActiveTab('review')}
                  className="h-11 px-6 rounded-xl border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-stone-50 dark:hover:bg-slate-800"
                >
                  <ListChecks className="w-4 h-4 text-red-800 dark:text-amber-400" />
                  <span>{lang === 'ne' ? 'उत्तर समीक्षा हेर्नुहोस् (Review Answers)' : 'Review All Answers'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUIZ QUESTION RUNNER (matching Quiz.jsx) */
            <div className="max-w-3xl mx-auto space-y-5">
              {/* Top Bar: Filter Summary, Progress, Score & Timer */}
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-800 dark:text-amber-400">
                      {lang === 'ne'
                        ? `प्रश्न ${toNepaliDigits(currentIndex + 1)} / ${toNepaliDigits(activeQuestions.length)}`
                        : `Question ${currentIndex + 1} of ${activeQuestions.length}`}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">
                      {formatBookDisplay(currentQuestion.book)} ·{' '}
                      {lang === 'ne'
                        ? `अध्याय ${toNepaliDigits(currentQuestion.chapter)}`
                        : `Chapter ${currentQuestion.chapter}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {timerSeconds > 0 && (
                      <span
                        className={`px-3 py-1 rounded-xl font-mono font-bold flex items-center gap-1.5 shadow-2xs ${
                          timeLeft <= 10
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ne' ? `बाँकी समय: ${timeLeft}s` : `Time Left: ${timeLeft}s`}
                        </span>
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-red-800 dark:text-amber-400" />
                      <span>
                        {Math.floor(elapsedTotalSeconds / 60)
                          .toString()
                          .padStart(2, '0')}
                        :{(elapsedTotalSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      {lang === 'ne' ? `अङ्क: ${toNepaliDigits(score)}` : `Score: ${score}`}
                    </span>
                    <button
                      onClick={() => setQuizStarted(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-red-800 dark:hover:text-amber-400"
                    >
                      {lang === 'ne' ? 'बन्द गर्नुहोस् ✕' : 'Exit Quiz ✕'}
                    </button>
                  </div>
                </div>

                {/* Progress Bar + Timer Countdown Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-stone-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-800 dark:bg-amber-400 transition-all duration-300"
                      style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
                    />
                  </div>
                  {timerSeconds > 0 && (
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          timeLeft <= 10 ? 'bg-red-600' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(0, (timeLeft / timerSeconds) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold capitalize ${
                        currentQuestion.difficulty === 'advanced'
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300'
                          : currentQuestion.difficulty === 'intermediate'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {currentQuestion.difficulty}
                    </span>
                    {streak > 1 && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/20 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                        🔥 {streak} Streak
                      </span>
                    )}
                  </div>

                  {/* Lifelines & TTS Read Aloud */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(getQuestionPrompt(currentQuestion))}
                      className="h-8 px-3 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 hover:bg-red-800 hover:text-white transition-colors"
                      title="Read Question Aloud (TTS)"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{lang === 'ne' ? 'सुन्नुहोस्' : 'Listen'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFiftyFifty}
                      disabled={revealed || eliminatedChoices.length > 0}
                      className="h-8 px-3 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 disabled:opacity-40 transition-colors"
                    >
                      50 / 50
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      disabled={revealed || showHint}
                      className="h-8 px-3 rounded-lg bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-blue-700 hover:text-white disabled:opacity-40 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'ne' ? 'संकेत (Hint)' : 'Verse Hint'}</span>
                    </button>
                  </div>
                </div>

                {/* Question Text (Bilingual display when in Nepali mode) */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    {getQuestionPrompt(currentQuestion)}
                  </h2>
                  {quizSource === 'nepali_bilingual' && currentQuestion.questionNe && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {lang === 'ne' ? currentQuestion.question : currentQuestion.questionNe}
                    </p>
                  )}
                </div>

                {/* Hint Banner */}
                {showHint && !revealed && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span>
                      📖{' '}
                      <strong>
                        {lang === 'ne' ? 'बाइबल सन्दर्भ संकेत (Scripture Reference):' : 'Scripture Reference Hint:'}
                      </strong>{' '}
                      {getReference(currentQuestion)}
                    </span>
                  </div>
                )}

                {/* Multiple Choice Options */}
                <div className="space-y-3">
                  {currentChoices.map((choice, idx) => {
                    const correctAns = getCorrectAnswer(currentQuestion);
                    const isCorrect = choice === correctAns;
                    const isSelected = choice === selectedChoice;
                    const isEliminated = eliminatedChoices.includes(choice);

                    let btnStyle =
                      'border-stone-200 dark:border-slate-800 hover:border-red-800 dark:hover:border-amber-400 bg-stone-50/70 dark:bg-slate-950/60';
                    if (revealed && isCorrect) {
                      btnStyle =
                        'border-emerald-600 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 font-bold';
                    } else if (revealed && isSelected && !isCorrect) {
                      btnStyle = 'border-red-600 bg-red-500/15 text-red-950 dark:text-red-200';
                    } else if (revealed || isEliminated) {
                      btnStyle = 'border-stone-200 dark:border-slate-800 opacity-45';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={revealed || isEliminated}
                        onClick={() => handleSelectChoice(choice)}
                        className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-sm sm:text-base text-slate-900 dark:text-white">
                            {choice}
                          </span>
                        </div>
                        {revealed && isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {revealed && isSelected && !isCorrect && (
                          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Scripture Reference Box upon Answer Reveal */}
                {revealed && (
                  <div
                    className={`p-5 rounded-2xl border space-y-3 ${
                      selectedChoice === getCorrectAnswer(currentQuestion)
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {selectedChoice === getCorrectAnswer(currentQuestion)
                          ? lang === 'ne'
                            ? '✓ सही जवाफ! (Correct Answer!)'
                            : '✓ Correct Answer!'
                          : lang === 'ne'
                          ? `✗ सही उत्तर: ${getCorrectAnswer(currentQuestion)}`
                          : `✗ Correct Answer: ${getCorrectAnswer(currentQuestion)}`}
                      </p>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-xs font-mono font-bold text-red-800 dark:text-amber-400">
                        📖 {getReference(currentQuestion)}
                      </span>
                    </div>

                    {getExplanation(currentQuestion) && (
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {getExplanation(currentQuestion)}
                      </p>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      {onOpenBible && (
                        <button
                          type="button"
                          onClick={onOpenBible}
                          className="text-xs font-bold text-red-800 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{lang === 'ne' ? 'यो अध्याय बाइबलमा पढ्नुहोस् →' : 'Read Chapter in Bible →'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="h-10 px-6 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center gap-2 ml-auto"
                      >
                        <span>
                          {currentIndex + 1 < activeQuestions.length
                            ? lang === 'ne'
                              ? 'अर्को प्रश्न (Next Question) →'
                              : 'Next Question →'
                            : lang === 'ne'
                            ? 'नतिजा हेर्नुहोस् (See Final Score) →'
                            : 'See Final Results →'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: 66-BOOK QUESTION BANK EXPLORER (matching BibleQuanes.jsx)
         ===================================================================== */}
      {activeTab === 'bank' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-red-800 dark:text-amber-400">
                {lang === 'ne'
                  ? '६६ पुस्तक बाइबल प्रश्न संग्रह (BibleQuanes Explorer)'
                  : '66-Book Bible Question Bank Explorer'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {lang === 'ne'
                  ? 'पुस्तक र अध्यायअनुसार प्रश्न तथा उत्तरहरू अध्ययन गर्नुहोस्'
                  : 'Browse, Search & Add Bible Quiz Questions by Book & Chapter'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowAddQuestionModal(true)}
              className="h-10 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ne' ? '+ नयाँ प्रश्न थप्नुहोस्' : '+ Add Question'}</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {lang === 'ne' ? 'पुस्तक (Book):' : 'Book of the Bible:'}
              </label>
              <select
                value={bankBook}
                onChange={(e) => {
                  setBankBook(e.target.value);
                  setBankChapter('');
                  setBankPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-semibold"
              >
                {(manifest?.books || []).map((b) => {
                  const info = BOOK_NAME_NE_MAP[b.book];
                  return (
                    <option key={b.book} value={b.book}>
                      {info ? `${info.ne} · ${b.book}` : b.book} ({b.count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {lang === 'ne' ? 'अध्याय (Chapter):' : 'Chapter:'}
              </label>
              <select
                value={bankChapter}
                onChange={(e) => {
                  setBankChapter(e.target.value);
                  setBankPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="">{lang === 'ne' ? 'सबै अध्याय (All)' : 'All Chapters'}</option>
                {(manifest?.books.find((b) => b.book === bankBook)?.chapters || []).map((ch) => (
                  <option key={ch} value={String(ch)}>
                    {lang === 'ne' ? `अध्याय ${toNepaliDigits(ch)}` : `Chapter ${ch}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {lang === 'ne' ? 'कठिनाइ (Difficulty):' : 'Difficulty:'}
              </label>
              <select
                value={bankDifficulty}
                onChange={(e) => {
                  setBankDifficulty(e.target.value);
                  setBankPage(1);
                }}
                className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-semibold"
              >
                <option value="">{lang === 'ne' ? 'सबै तह (All)' : 'All Difficulties'}</option>
                <option value="basic">Basic</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {lang === 'ne' ? 'खोज्नुहोस् (Search):' : 'Search Question/Answer:'}
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => {
                    setBankSearch(e.target.value);
                    setBankPage(1);
                  }}
                  placeholder={lang === 'ne' ? 'शब्द वा पद खोज्नुहोस्...' : 'Search keyword or verse...'}
                  className="w-full h-10 pl-8 pr-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {paginatedBankQuestions.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-stone-50/80 dark:bg-slate-950/70 border border-stone-200/80 dark:border-slate-800 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-800 dark:text-amber-400">
                      {formatBookDisplay(item.book)} · Ch. {item.chapter}
                    </span>
                    <span className="font-mono text-slate-500">({item.reference})</span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-slate-800 text-[10px] font-bold capitalize">
                      {item.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSpeakQuestion(`${item.question}. Answer: ${item.answer}`)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-slate-600 hover:text-red-800"
                      title="Listen"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomQuestion(item.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20"
                        title="Delete Custom Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.question}</p>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  ✓ {lang === 'ne' ? 'उत्तर (Answer):' : 'Answer:'} {item.answer}
                </p>
                {item.explanation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.explanation}</p>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {lang === 'ne'
                ? `पृष्ठ ${toNepaliDigits(bankPage)} / ${toNepaliDigits(bankTotalPages)} (कुल ${toNepaliDigits(bankQuestions.length)} प्रश्नहरू)`
                : `Page ${bankPage} of ${bankTotalPages} (${bankQuestions.length} matching questions)`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={bankPage <= 1}
                onClick={() => setBankPage((p) => Math.max(1, p - 1))}
                className="h-9 px-3 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{lang === 'ne' ? 'अघिल्लो' : 'Prev'}</span>
              </button>
              <button
                type="button"
                disabled={bankPage >= bankTotalPages}
                onClick={() => setBankPage((p) => Math.min(bankTotalPages, p + 1))}
                className="h-9 px-3 rounded-xl border border-stone-200 dark:border-slate-700 flex items-center gap-1 disabled:opacity-40"
              >
                <span>{lang === 'ne' ? 'अर्को' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: ANSWER REVIEW QUEUE (matching Review.jsx)
         ===================================================================== */}
      {activeTab === 'review' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="pb-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-800 dark:text-amber-400">
                {lang === 'ne' ? 'प्रश्न र उत्तर समीक्षा (Quiz Review)' : 'Detailed Answer Review'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {lang === 'ne'
                  ? 'तपाईंले दिनुभएका जवाफ र बाइबल सन्दर्भहरूको समीक्षा'
                  : 'Review Your Latest Quiz Answers & Scripture Explanations'}
              </h2>
            </div>
          </div>

          {answersLog.length === 0 && (quizHistory[0]?.answersLog || []).length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ListChecks className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {lang === 'ne'
                  ? 'अहिलेसम्म कुनै क्विज खेलिएको छैन। पहिले क्विज खेल्नुहोस्!'
                  : 'No quiz answers to review yet. Play a quiz first!'}
              </p>
              <button
                onClick={() => setActiveTab('play')}
                className="h-10 px-5 rounded-xl bg-red-800 text-white text-xs font-bold"
              >
                {lang === 'ne' ? 'क्विज खेल्नुहोस्' : 'Play Quiz Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {(answersLog.length > 0 ? answersLog : quizHistory[0]?.answersLog || []).map(
                (entry, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border space-y-2 ${
                      entry.isCorrect
                        ? 'bg-emerald-500/5 border-emerald-500/25'
                        : 'bg-red-500/5 border-red-500/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-500">#{idx + 1}</span>
                      <span className="font-mono font-bold text-red-800 dark:text-amber-400">
                        📖 {entry.reference}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {entry.question}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span
                        className={
                          entry.isCorrect
                            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                            : 'text-red-600 dark:text-red-400 font-bold'
                        }
                      >
                        {lang === 'ne' ? 'तपाईंको उत्तर:' : 'Your Answer:'} {entry.selectedAnswer}
                      </span>
                      {!entry.isCorrect && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                          {lang === 'ne' ? 'सही उत्तर:' : 'Correct Answer:'} {entry.correctAnswer}
                        </span>
                      )}
                    </div>
                    {entry.explanation && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {entry.explanation}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 4: REPORTS & ANALYTICS (matching Reports.jsx)
         ===================================================================== */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-red-800 dark:text-amber-400">
                {lang === 'ne' ? 'क्विज नतिजा र तथ्याङ्क (Reports & Analytics)' : 'Bible Quiz Reports & Summary'}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {lang === 'ne'
                  ? 'तपाईंको बाइबल अध्ययन प्रगति र स्कोर इतिहास'
                  : 'Your Scripture Quiz Performance & Question Bank Summary'}
              </h2>
            </div>
            {quizHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuizHistory([]);
                  localStorage.removeItem('biblesandes_quiz_reports');
                  onNotify(lang === 'ne' ? 'इतिहास खाली गरियो।' : 'Quiz history cleared.');
                }}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                {lang === 'ne' ? 'इतिहास रिसेट गर्नुहोस्' : 'Clear History'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                {lang === 'ne' ? 'कुल प्रश्न संख्या (Total Bank)' : 'Total Bible Quanes'}
              </p>
              <p className="text-2xl font-bold font-mono text-red-800 dark:text-amber-400 mt-1">
                {totalQuestionsCount.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                {lang === 'ne' ? 'सम्पन्न क्विज (Completed)' : 'Quizzes Completed'}
              </p>
              <p className="text-2xl font-bold font-mono text-blue-700 dark:text-sky-400 mt-1">
                {quizHistory.length}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                {lang === 'ne' ? 'औसत नतिजा (Avg Score)' : 'Average Accuracy'}
              </p>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {quizHistory.length > 0
                  ? `${Math.round(
                      quizHistory.reduce((acc, r) => acc + r.percent, 0) / quizHistory.length
                    )}%`
                  : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">
                {lang === 'ne' ? 'थपिएका प्रश्न (Custom Qs)' : 'Custom Questions'}
              </p>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {customQuestions.length}
              </p>
            </div>
          </div>

          {quizHistory.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-stone-200 dark:border-slate-800 text-slate-500">
                    <th className="py-3 px-3">{lang === 'ne' ? 'मिति (Date)' : 'Date'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'पुस्तक (Book)' : 'Book Filter'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'तह (Difficulty)' : 'Difficulty'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'प्राप्ताङ्क (Score)' : 'Score'}</th>
                    <th className="py-3 px-3">{lang === 'ne' ? 'प्रतिशत (%)' : 'Percentage'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70 dark:divide-slate-800">
                  {quizHistory.map((row) => (
                    <tr key={row.id}>
                      <td className="py-3 px-3 font-mono">
                        {row.dateBs} · {row.dateAd}
                      </td>
                      <td className="py-3 px-3 font-bold">{row.bookFilter}</td>
                      <td className="py-3 px-3 capitalize">{row.difficultyFilter}</td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {row.score} / {row.total}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                          {row.percent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD NEW CUSTOM BIBLE QUIZ QUESTION
         ===================================================================== */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'नयाँ बाइबल क्विज प्रश्न थप्नुहोस् (Add Bible Question)'
                  : 'Add Custom Bible Quiz Question'}
              </h3>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ne' ? 'पुस्तक (Book):' : 'Book:'}
                  </label>
                  <select
                    value={newQuestionForm.book}
                    onChange={(e) => setNewQuestionForm({ ...newQuestionForm, book: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                  >
                    {Object.keys(BOOK_NAME_NE_MAP).map((b) => (
                      <option key={b} value={b}>
                        {BOOK_NAME_NE_MAP[b].ne} ({b})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ne' ? 'अध्याय (Chapter):' : 'Chapter:'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newQuestionForm.chapter}
                    onChange={(e) =>
                      setNewQuestionForm({ ...newQuestionForm, chapter: e.target.value })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {lang === 'ne' ? 'प्रश्न (Question):' : 'Question:'}
                </label>
                <input
                  type="text"
                  required
                  value={newQuestionForm.question}
                  onChange={(e) =>
                    setNewQuestionForm({ ...newQuestionForm, question: e.target.value })
                  }
                  placeholder={
                    lang === 'ne'
                      ? 'उदा: येशूको जन्म कुन सहरमा भएको थियो?'
                      : 'e.g., Where was Jesus born?'
                  }
                  className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {lang === 'ne' ? 'सही उत्तर (Correct Answer):' : 'Correct Answer:'}
                </label>
                <input
                  type="text"
                  required
                  value={newQuestionForm.answer}
                  onChange={(e) =>
                    setNewQuestionForm({ ...newQuestionForm, answer: e.target.value })
                  }
                  placeholder={lang === 'ne' ? 'उदा: बेथलेहेम' : 'e.g., Bethlehem'}
                  className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ne' ? 'बाइबल पद सन्दर्भ (Reference):' : 'Scripture Reference:'}
                  </label>
                  <input
                    type="text"
                    value={newQuestionForm.reference}
                    onChange={(e) =>
                      setNewQuestionForm({ ...newQuestionForm, reference: e.target.value })
                    }
                    placeholder="Matthew 2:1"
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    {lang === 'ne' ? 'कठिनाइ (Difficulty):' : 'Difficulty:'}
                  </label>
                  <select
                    value={newQuestionForm.difficulty}
                    onChange={(e) =>
                      setNewQuestionForm({
                        ...newQuestionForm,
                        difficulty: e.target.value as 'basic' | 'intermediate' | 'advanced',
                      })
                    }
                    className="w-full h-10 px-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                  >
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {lang === 'ne' ? 'छोटो व्याख्या (Explanation):' : 'Explanation (Optional):'}
                </label>
                <textarea
                  rows={2}
                  value={newQuestionForm.explanation}
                  onChange={(e) =>
                    setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })
                  }
                  className="w-full p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="h-10 px-4 rounded-xl border border-stone-200 dark:border-slate-700 font-semibold"
                >
                  {lang === 'ne' ? 'रद्द गर्नुहोस्' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-red-800 text-white font-bold"
                >
                  {lang === 'ne' ? 'प्रश्न सुरक्षित गर्नुहोस्' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
