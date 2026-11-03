import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  Copy,
  Download,
  Eraser,
  FileText,
  Keyboard,
  Sparkles,
  StickyNote,
  Type,
} from 'lucide-react';

interface NepaliUnicodeViewProps {
  lang: 'ne' | 'en';
  onNotify: (msg: string) => void;
  onSaveToNotes?: (unicodeText: string) => void;
}

// Curated dictionary of common Nepali & Biblical words for 100% accurate Romanized typing
const ROMAN_WORD_DICTIONARY: Record<string, string> = {
  yeshu: 'येशू',
  yesu: 'येशू',
  jesus: 'येशू',
  khrishta: 'ख्रीष्ट',
  khrista: 'ख्रीष्ट',
  khrist: 'ख्रीष्ट',
  christ: 'ख्रीष्ट',
  parmeshwar: 'परमेश्वर',
  parmeshwor: 'परमेश्वर',
  prabhu: 'प्रभु',
  pabitra: 'पवित्र',
  pavitra: 'पवित्र',
  aatma: 'आत्मा',
  atma: 'आत्मा',
  mukti: 'मुक्ति',
  muktiko: 'मुक्तिको',
  prarthana: 'प्रार्थना',
  bhajan: 'भजन',
  mandali: 'मण्डली',
  susamachar: 'सुसमाचार',
  baibal: 'बाइबल',
  bible: 'बाइबल',
  sandesh: 'सन्देश',
  sandes: 'सन्देश',
  anugrah: 'अनुग्रह',
  anugraha: 'अनुग्रह',
  bishwas: 'विश्वास',
  vishwas: 'विश्वास',
  biswas: 'विश्वास',
  jay: 'जय',
  jai: 'जय',
  masih: 'मसीह',
  masiha: 'मसीह',
  amen: 'आमेन',
  aamen: 'आमेन',
  hallelujah: 'हल्लेलूयाह',
  halleluiah: 'हल्लेलूयाह',
  stuti: 'स्तुति',
  aaradhana: 'आराधना',
  aradhana: 'आराधना',
  mahima: 'महिमा',
  shanti: 'शान्ति',
  prem: 'प्रेम',
  kshama: 'क्षमा',
  uddhar: 'उद्धार',
  udhar: 'उद्धार',
  bachan: 'वचन',
  vachan: 'वचन',
  swarga: 'स्वर्ग',
  krus: 'क्रूस',
  balidan: 'बलिदान',
  punarutthan: 'पुनरुत्थान',
  ashish: 'आशिष्',
  aashish: 'आशिष्',
  dhanyabad: 'धन्यवाद',
  dhanyawad: 'धन्यवाद',
  namaste: 'नमस्ते',
  namaskar: 'नमस्कार',
  nepal: 'नेपाल',
  nepali: 'नेपाली',
  kathmandu: 'काठमाडौँ',
  pokhara: 'पोखरा',
  hamro: 'हाम्रो',
  tapai: 'तपाईं',
  tapaiko: 'तपाईंको',
  mero: 'मेरो',
  hami: 'हामी',
  hunuhunchha: 'हुनुहुन्छ',
  hunuhuncha: 'हुनुहुन्छ',
  hunchha: 'हुन्छ',
  huncha: 'हुन्छ',
  chha: 'छ',
  chhan: 'छन्',
  chaina: 'छैन',
  chhaina: 'छैन',
  garnuhos: 'गर्नुहोस्',
  padhnuhos: 'पढ्नुहोस्',
  sunnuhos: 'सुन्नुहोस्',
  lekhnuhos: 'लेख्नुहोस्',
  jiwan: 'जीवन',
  jivan: 'जीवन',
  satya: 'सत्य',
  bato: 'बाटो',
  jyoti: 'ज्योति',
  pita: 'पिता',
  putra: 'पुत्र',
  dharmashastra: 'धर्मशास्त्र',
  yuhanna: 'यूहन्ना',
  utpatti: 'उत्पत्ति',
  bhajansangrah: 'भजनसंग्रह',
  matti: 'मत्ती',
  luka: 'लूका',
  markus: 'मर्कूस',
   प्रेरित: 'प्रेरित',
  prerit: 'प्रेरित',
  romi: 'रोमी',
  प्रकाश: 'प्रकाश',
  prakash: 'प्रकाश',
};

const CONSONANTS: Record<string, string> = {
  ksh: 'क्ष',
  chh: 'छ',
  gy: 'ज्ञ',
  tr: 'त्र',
  kh: 'ख',
  gh: 'घ',
  ng: 'ङ',
  ch: 'च',
  jh: 'झ',
  ny: 'ञ',
  Th: 'ठ',
  Dh: 'ढ',
  th: 'थ',
  dh: 'ध',
  ph: 'फ',
  bh: 'भ',
  sh: 'श',
  Sh: 'ष',
  ri: 'ऋ',
  k: 'क',
  g: 'ग',
  c: 'च',
  j: 'ज',
  T: 'ट',
  D: 'ड',
  N: 'ण',
  t: 'त',
  d: 'द',
  n: 'न',
  p: 'प',
  f: 'फ',
  b: 'ब',
  m: 'म',
  y: 'य',
  r: 'र',
  l: 'ल',
  w: 'व',
  v: 'व',
  s: 'स',
  h: 'ह',
  x: 'क्ष',
  z: 'ज',
  q: 'क',
};

const VOWELS_STANDALONE: Record<string, string> = {
  aa: 'आ',
  ai: 'ऐ',
  au: 'औ',
  ii: 'ई',
  ee: 'ई',
  uu: 'ऊ',
  oo: 'ऊ',
  ri: 'ऋ',
  A: 'आ',
  I: 'ई',
  U: 'ऊ',
  E: 'ऐ',
  O: 'औ',
  a: 'अ',
  i: 'इ',
  u: 'उ',
  e: 'ए',
  o: 'ओ',
};

const VOWEL_MATRAS: Record<string, string> = {
  aa: 'ा',
  ai: 'ै',
  au: 'ौ',
  ii: 'ी',
  ee: 'ी',
  uu: 'ू',
  oo: 'ू',
  ri: 'ृ',
  A: 'ा',
  I: 'ी',
  U: 'ू',
  E: 'ै',
  O: 'ौ',
  a: '',
  i: 'ि',
  u: 'ु',
  e: 'े',
  o: 'ो',
};

const NEPALI_DIGITS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

function transliterateSingleWord(word: string): string {
  if (!word) return '';

  // Separate leading/trailing punctuation
  const match = word.match(/^([^a-zA-Z0-9*./]+)?([a-zA-Z0-9*./]+)([^a-zA-Z0-9*./]+)?$/);
  if (!match) {
    return word.replace(/\./g, '।');
  }

  const leading = match[1] || '';
  const core = match[2] || '';
  const trailing = (match[3] || '').replace(/\./g, '।');

  // Check exact dictionary match (case-insensitive)
  const lowerCore = core.toLowerCase();
  if (ROMAN_WORD_DICTIONARY[lowerCore]) {
    return leading + ROMAN_WORD_DICTIONARY[lowerCore] + trailing;
  }

  // Phonetic parser
  let result = '';
  let i = 0;
  const len = core.length;

  const matchKey = (map: Record<string, string>, pos: number): [string, string] | null => {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      if (core.startsWith(k, pos)) {
        return [k, map[k]];
      }
    }
    return null;
  };

  while (i < len) {
    const ch = core[i];

    // Digits
    if (NEPALI_DIGITS[ch]) {
      result += NEPALI_DIGITS[ch];
      i++;
      continue;
    }

    // Special modifiers: ** -> ँ, * or M -> ं, / -> ्, . -> ।
    if (core.startsWith('**', i)) {
      result += 'ँ';
      i += 2;
      continue;
    }
    if (ch === '*' || ch === 'M') {
      result += 'ं';
      i++;
      continue;
    }
    if (ch === 'H') {
      result += 'ः';
      i++;
      continue;
    }
    if (ch === '/') {
      result += '्';
      i++;
      continue;
    }
    if (ch === '.') {
      result += '।';
      i++;
      continue;
    }

    // Try matching consonant
    const consMatch = matchKey(CONSONANTS, i);
    if (consMatch) {
      const [consKey, consVal] = consMatch;
      i += consKey.length;

      // Check if followed by a vowel matra
      const vowelMatch = matchKey(VOWEL_MATRAS, i);
      if (vowelMatch) {
        const [vKey, vMatra] = vowelMatch;
        result += consVal + vMatra;
        i += vKey.length;
      } else if (i < len && matchKey(CONSONANTS, i)) {
        // Consonant cluster -> add halanta (virama) unless 'n' before consonant becomes anusvara or half-letter
        result += consVal + '्';
      } else {
        // End of word consonant: inherent 'a' in Nepali
        result += consVal;
      }
      continue;
    }

    // Try matching standalone vowel
    const standaloneVowel = matchKey(VOWELS_STANDALONE, i);
    if (standaloneVowel) {
      const [vKey, vVal] = standaloneVowel;
      result += vVal;
      i += vKey.length;
      continue;
    }

    // Fallback character
    result += ch;
    i++;
  }

  return leading + result + trailing;
}

export function convertRomanToNepaliUnicode(input: string): string {
  if (!input) return '';

  // Support {english} blocks kept as-is
  const segments = input.split(/(\{[^}]*\})/g);
  return segments
    .map((segment) => {
      if (segment.startsWith('{') && segment.endsWith('}')) {
        return segment.slice(1, -1);
      }
      // Split preserving whitespace and newlines
      return segment
        .split(/(\s+)/)
        .map((token) => (/^\s+$/.test(token) ? token : transliterateSingleWord(token)))
        .join('');
    })
    .join('');
}

// Preeti to Nepali Unicode Converter
const PREETI_MAP: Record<string, string> = {
  a: 'ब',
  b: 'द',
  c: 'अ',
  d: 'म',
  e: 'भ',
  f: 'ा',
  g: 'न',
  h: 'ज',
  i: 'ष्',
  j: 'व',
  k: 'प',
  l: 'ि',
  m: 'ः',
  n: 'ल',
  o: 'य',
  p: 'उ',
  q: 'त्र',
  r: 'च',
  s: 'क',
  t: 'त',
  u: 'ग',
  v: 'ख',
  w: 'ध',
  x: 'ह',
  y: 'थ',
  z: 'श',
  A: 'ब्',
  B: 'द्य',
  C: 'ऋ',
  D: 'म्',
  E: 'भ्',
  F: 'ँ',
  G: 'न्',
  H: 'ज्',
  I: 'क्ष्',
  J: 'व्',
  K: 'प्',
  L: 'ी',
  M: 'ड्ड',
  N: 'ल्',
  O: 'इ',
  P: 'ए',
  Q: 'त्त',
  R: 'च्',
  S: 'क्',
  T: 'त्',
  U: 'ग्',
  V: 'ख्',
  W: 'ध्',
  X: 'ह्',
  Y: 'थ्',
  Z: 'श्',
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
  '`': 'ञ',
  '~': 'ञ्',
  '!': 'ज्ञ',
  '@': 'द्द',
  '#': 'घ',
  $: 'द्ध',
  '%': 'छ',
  '^': 'ट',
  '&': 'ठ',
  '*': 'ड',
  '(': 'ढ',
  ')': 'ण',
  '-': '(',
  _: ')',
  '+': 'ं',
  '=': '.',
  '[': 'ृ',
  '{': 'र्',
  ']': 'े',
  '}': 'ै',
  '\\': '्',
  '|': '्र',
  ';': 'स',
  ':': 'स्',
  "'": 'ु',
  '"': 'ू',
  ',': ',',
  '<': '?',
  '.': '।',
  '>': 'श्र',
  '/': 'र',
  '?': 'रु',
};

export function convertPreetiToNepaliUnicode(preeti: string): string {
  if (!preeti) return '';
  let out = '';
  for (let i = 0; i < preeti.length; i++) {
    const ch = preeti[i];
    out += PREETI_MAP[ch] !== undefined ? PREETI_MAP[ch] : ch;
  }
  // Fix common Preeti combinations (अ + ा -> आ, ए + े -> ऐ, अ + ो -> ओ, इ + ि rearrangement)
  out = out
    .replace(/अा/g, 'आ')
    .replace(/अै/g, 'ऐ')
    .replace(/अो/g, 'ओ')
    .replace(/अौ/g, 'औ')
    .replace(/एे/g, 'ऐ')
    .replace(/ाे/g, 'ो')
    .replace(/ाै/g, 'ौ')
    .replace(/्ा/g, '')
    .replace(/ि((?:[क-ह]्)*[क-ह])/g, '$1ि');
  return out;
}

const VOWEL_KEYS = ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ऋ', 'ए', 'ऐ', 'ओ', 'औ', 'अं', 'अः'];
const MATRA_KEYS = ['ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', '्', 'ं', 'ँ', 'ः', '।', 'ॐ'];
const CONSONANT_KEYS = [
  'क', 'ख', 'ग', 'घ', 'ङ',
  'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व', 'श',
  'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ',
];
const DIGIT_KEYS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

const QUICK_BIBLICAL_PHRASES = [
  {
    roman: 'prabhu yeshu khrishtako anugrah tapaiharu sabaisanga rahos.',
    unicode: 'प्रभु येशू ख्रीष्टको अनुग्रह तपाईंहरू सबैसँग रहोस्।',
  },
  {
    roman: 'parmeshwar prem hunuhunchha.',
    unicode: 'परमेश्वर प्रेम हुनुहुन्छ।',
  },
  {
    roman: 'jay masih! tapailai susamachar parivarama swagat chha.',
    unicode: 'जय मसीह! तपाईंलाई सुसमाचार परिवारमा स्वागत छ।',
  },
  {
    roman: 'bato, satya ra jiwan ma nai hu — yuhanna 14:6',
    unicode: 'बाटो, सत्य र जीवन म नै हुँ — यूहन्ना १४:६',
  },
];

export const NepaliUnicodeView: React.FC<NepaliUnicodeViewProps> = ({
  lang,
  onNotify,
  onSaveToNotes,
}) => {
  const [converterMode, setConverterMode] = useState<'roman' | 'preeti'>('roman');
  const [sourceInput, setSourceInput] = useState<string>(
    'jay masih! parmeshwar prem hunuhunchha. prabhu yeshu khrishtama mukti ra shanti chha.'
  );
  const [customOutputOverride, setCustomOutputOverride] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [showKeyboard, setShowKeyboard] = useState<boolean>(true);

  const convertedText = useMemo(() => {
    if (customOutputOverride !== null) return customOutputOverride;
    return converterMode === 'roman'
      ? convertRomanToNepaliUnicode(sourceInput)
      : convertPreetiToNepaliUnicode(sourceInput);
  }, [sourceInput, converterMode, customOutputOverride]);

  const handleSourceChange = (val: string) => {
    setCustomOutputOverride(null);
    setSourceInput(val);
  };

  const handleInsertChar = (char: string) => {
    setCustomOutputOverride((prev) => (prev !== null ? prev : convertedText) + char);
  };

  const handleCopyUnicode = () => {
    if (!convertedText.trim()) return;
    navigator.clipboard?.writeText(convertedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onNotify(
      lang === 'ne'
        ? 'नेपाली युनिकोड अक्षर कपी गरियो!'
        : 'Nepali Unicode text copied to clipboard!'
    );
  };

  const handleDownloadTxt = () => {
    if (!convertedText.trim()) return;
    const blob = new Blob([convertedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `susamachar-nepali-unicode-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(
      lang === 'ne'
        ? 'नेपाली युनिकोड फाइल डाउनलोड गरियो!'
        : 'Nepali Unicode .txt file downloaded!'
    );
  };

  const handleSaveNote = () => {
    if (!convertedText.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('susamachar_personal_notes') || '[]');
      const newNote = {
        id: `note-${Date.now()}`,
        title: convertedText.slice(0, 42) + (convertedText.length > 42 ? '...' : ''),
        content: convertedText,
        scriptureRef: 'नेपाली युनिकोड नोट',
        category: 'devotion',
        reminderDateTime: '',
        reminderTriggered: false,
        pinned: false,
        createdAt: new Date().toLocaleDateString(),
      };
      localStorage.setItem('susamachar_personal_notes', JSON.stringify([newNote, ...existing]));
    } catch {
      // ignore storage error
    }
    if (onSaveToNotes) {
      onSaveToNotes(convertedText);
    } else {
      onNotify(
        lang === 'ne'
          ? 'तपाईंको युनिकोड पाठ "नोट र रिमाइन्डर" मा सुरक्षित गरियो!'
          : 'Saved to Personal Notes & Reminders!'
      );
    }
  };

  const wordCount = useMemo(() => {
    const trimmed = convertedText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [convertedText]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#659DBD] via-[#528cae] to-[#457991] rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-[#FBEEC1] text-xs font-bold">
              <Keyboard className="w-3.5 h-3.5" />
              <span>
                {lang === 'ne'
                  ? 'नेपाली युनिकोड टुल • nepali-unicode (Romanized & Preeti to Unicode)'
                  : 'Nepali Unicode Converter & Virtual Keyboard • nepali-unicode'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">
              {lang === 'ne'
                ? 'नेपाली युनिकोड (Nepali Unicode) रूपान्तरण र स्मार्ट टाइपिङ'
                : 'Nepali Unicode Transliteration, Preeti Converter & Virtual Keyboard'}
            </h1>
            <p className="text-xs sm:text-sm text-[#FBEEC1]/90 max-w-3xl leading-relaxed">
              {lang === 'ne'
                ? 'रोमनाइज्ड अंग्रेजीमा टाइप गर्दा स्वतः शुद्ध नेपाली युनिकोडमा बदलिनुका साथै प्रिती (Preeti) फन्टलाई युनिकोडमा रूपान्तरण गर्ने र नेपाली किबोर्डबाट सीधै लेखेर कपी वा नोटमा सेभ गर्ने सुविधा।'
                : 'Type phonetically in Roman English (e.g., "parmeshwar prem hunuhunchha") or paste Preeti font text to convert into standard Nepali Devanagari Unicode.'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setConverterMode('roman');
                setCustomOutputOverride(null);
              }}
              className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                converterMode === 'roman'
                  ? 'bg-[#FBEEC1] text-[#457991] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>
                {lang === 'ne'
                  ? 'Romanized → नेपाली युनिकोड'
                  : 'Romanized → Nepali Unicode'}
              </span>
            </button>
            <button
              onClick={() => {
                setConverterMode('preeti');
                setCustomOutputOverride(null);
                setSourceInput('k/d]Zj/ k|]d x\'g\'x\'G% .');
              }}
              className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                converterMode === 'preeti'
                  ? 'bg-[#FBEEC1] text-[#457991] shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>
                {lang === 'ne'
                  ? 'Preeti फन्ट → नेपाली युनिकोड'
                  : 'Preeti Font → Nepali Unicode'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Biblical & Nepali Sample Chips */}
      {converterMode === 'roman' && (
        <div className="bg-white dark:bg-slate-900 border border-[#BC986A]/20 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8D8741] dark:text-[#DAAD86]" />
              <span>
                {lang === 'ne'
                  ? 'उदाहरण वाक्यहरू (क्लिक गरेर परीक्षण गर्नुहोस्):'
                  : 'Quick Sample Phrases (Click to test):'}
              </span>
            </p>
            <span className="text-[11px] text-slate-500">
              {lang === 'ne'
                ? 'अंग्रेजी शब्द जस्ताको तस्तै राख्न {english} कोष्ठक प्रयोग गर्नुहोस्'
                : 'Wrap words in {curly braces} to keep English unconverted'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_BIBLICAL_PHRASES.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSourceChange(item.roman)}
                className="px-3 py-1.5 rounded-xl bg-[#FAF6EC] dark:bg-slate-800 border border-[#BC986A]/20 hover:bg-[#8D8741] hover:text-white text-xs text-slate-700 dark:text-slate-200 transition-colors text-left"
              >
                <span className="font-bold">{item.unicode}</span>
                <span className="ml-1.5 opacity-75 font-mono text-[11px]">({item.roman})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dual Editor Grid: Input & Nepali Unicode Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Romanized or Preeti Input Box */}
        <div className="bg-white dark:bg-slate-900 border border-[#BC986A]/20 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8D8741] dark:text-[#DAAD86]" />
                  <span>
                    {converterMode === 'roman'
                      ? lang === 'ne'
                        ? '१. रोमनाइज्ड नेपालीमा टाइप गर्नुहोस् (Type in Roman Nepali)'
                        : '1. Type Phonetic Romanized Nepali Here'
                      : lang === 'ne'
                      ? '१. प्रिती (Preeti) फन्टको पाठ यहाँ टाँस्नुहोस्'
                      : '1. Paste Preeti Font Text Here'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {converterMode === 'roman'
                    ? 'उदा: yeshu -> येशू | parmeshwar -> परमेश्वर | namaste -> नमस्ते | . -> ।'
                    : 'उदा: k/d]Zj/ -> परमेश्वर | o]z" -> येशू'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSourceInput('');
                  setCustomOutputOverride(null);
                }}
                className="h-8 px-3 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>{lang === 'ne' ? 'खाली गर्नुहोस्' : 'Clear'}</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={sourceInput}
              onChange={(e) => handleSourceChange(e.target.value)}
              placeholder={
                converterMode === 'roman'
                  ? 'यहाँ रोमनमा टाइप गर्नुहोस्... उदा: prabhu yeshu khrishtako prem...'
                  : 'प्रिती फन्टको अक्षर यहाँ पेस्ट गर्नुहोस्...'
              }
              className="w-full p-4 rounded-xl bg-[#FAF6EC]/50 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-800 text-sm sm:text-base text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-[#659DBD] font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {lang === 'ne' ? 'इनपुट अक्षर संख्या:' : 'Input characters:'} {sourceInput.length}
            </span>
            <span>
              {converterMode === 'roman'
                ? 'Smart Christian & Nepali Dictionary Active'
                : 'Preeti Legacy Font Mapper Active'}
            </span>
          </div>
        </div>

        {/* Right: Converted Nepali Unicode Output Box */}
        <div className="bg-white dark:bg-slate-900 border-2 border-[#659DBD]/30 dark:border-[#659DBD]/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-2xs">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-[#659DBD] dark:text-[#DAAD86] flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {lang === 'ne'
                      ? '२. नेपाली युनिकोड नतिजा (Nepali Unicode Output)'
                      : '2. Nepali Unicode Output (Editable)'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {lang === 'ne'
                    ? 'यहाँको युनिकोड सिधै सम्पादन गर्न, कपी गर्न वा नोटमा सेभ गर्न सकिन्छ'
                    : 'You can also edit directly or insert characters from the keyboard below'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleCopyUnicode}
                  className="h-8 px-3.5 rounded-xl bg-[#8D8741] hover:bg-[#787334] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>
                    {copied
                      ? lang === 'ne'
                        ? 'कपी भयो!'
                        : 'Copied!'
                      : lang === 'ne'
                      ? 'कपी (Copy)'
                      : 'Copy Unicode'}
                  </span>
                </button>

                <button
                  onClick={handleSaveNote}
                  className="h-8 px-3 rounded-xl bg-[#DAAD86] hover:bg-[#c99a73] text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Save to Personal Notes"
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>{lang === 'ne' ? 'नोटमा सेभ' : 'Save Note'}</span>
                </button>

                <button
                  onClick={handleDownloadTxt}
                  className="h-8 px-2.5 rounded-xl bg-[#FAF6EC] dark:bg-slate-800 hover:bg-[#BC986A]/20 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1"
                  title="Download as .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.TXT</span>
                </button>
              </div>
            </div>

            <textarea
              rows={8}
              value={convertedText}
              onChange={(e) => setCustomOutputOverride(e.target.value)}
              placeholder="नेपाली युनिकोड यहाँ देखिनेछ..."
              className="w-full p-4 rounded-xl bg-[#FAF6EC]/40 dark:bg-slate-950 border border-[#BC986A]/30 dark:border-slate-800 text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed focus:outline-none focus:border-[#659DBD]"
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              {lang === 'ne' ? 'शब्द संख्या (Words):' : 'Words:'} <strong>{wordCount}</strong> •{' '}
              {lang === 'ne' ? 'अक्षर (Chars):' : 'Characters:'}{' '}
              <strong>{convertedText.length}</strong>
            </span>
            <span className="text-[#8D8741] dark:text-[#DAAD86] font-semibold">
              UTF-8 Standard Devanagari Unicode
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Nepali Virtual Keyboard & Matra Pad */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-red-800 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'ne'
                ? 'नेपाली भर्चुअल किबोर्ड (Nepali Virtual Keyboard — क्लिक गरेर अक्षर थप्नुहोस्)'
                : 'Nepali Virtual Keyboard (Click any character to insert)'}
            </h3>
          </div>
          <button
            onClick={() => setShowKeyboard((prev) => !prev)}
            className="text-xs font-semibold text-red-800 dark:text-amber-400 hover:underline"
          >
            {showKeyboard
              ? lang === 'ne'
                ? 'किबोर्ड लुकाउनुहोस् ▲'
                : 'Hide Keyboard ▲'
              : lang === 'ne'
              ? 'किबोर्ड देखाउनुहोस् ▼'
              : 'Show Keyboard ▼'}
          </button>
        </div>

        {showKeyboard && (
          <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-slate-800">
            {/* Vowels & Matras Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500">
                  {lang === 'ne' ? 'स्वरवर्ण (Vowels):' : 'Vowels (स्वरवर्ण):'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {VOWEL_KEYS.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleInsertChar(k)}
                      className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-red-800 hover:text-white text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500">
                  {lang === 'ne'
                    ? 'मात्रा र चिन्हहरू (Matras & Symbols):'
                    : 'Matras & Modifiers (मात्रा):'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MATRA_KEYS.map((k) => (
                    <button
                      key={k}
                      onClick={() => handleInsertChar(k)}
                      className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 hover:bg-red-800 hover:text-white border border-amber-500/20 text-sm font-bold text-red-900 dark:text-amber-300 transition-colors"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Consonants */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500">
                {lang === 'ne' ? 'व्यञ्जनवर्ण (Consonants क - ज्ञ):' : 'Consonants (क - ज्ञ):'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CONSONANT_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => handleInsertChar(k)}
                    className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-slate-800 hover:bg-red-800 hover:text-white text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Digits & Space/Halanta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 mr-1">
                  {lang === 'ne' ? 'अंक:' : 'Digits:'}
                </span>
                {DIGIT_KEYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleInsertChar(d)}
                    className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-red-800 hover:text-white text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleInsertChar('्')}
                  className="h-8 px-3 rounded-lg bg-amber-500/15 text-red-900 dark:text-amber-300 text-xs font-bold hover:bg-amber-500/25"
                >
                  ् (हलन्त / आधी अक्षर)
                </button>
                <button
                  onClick={() => handleInsertChar(' ')}
                  className="h-8 px-5 rounded-lg bg-stone-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-stone-300"
                >
                  Space (खाली ठाउँ)
                </button>
                <button
                  onClick={() => handleInsertChar('। ')}
                  className="h-8 px-3 rounded-lg bg-stone-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-stone-300"
                >
                  । (पूर्णविराम)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Romanized Typing Cheat Sheet */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-amber-400">
          {lang === 'ne'
            ? 'रोमनाइज्ड नेपाली टाइपिङ संकेत तालिका (Romanized Typing Guide)'
            : 'Romanized Nepali Typing Reference Guide'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-xs">
          {[
            'a = अ, aa = आ',
            'i = इ, ii / ee = ई',
            'u = उ, uu / oo = ऊ',
            'e = ए, ai = ऐ',
            'o = ओ, au = औ',
            '* / M = ं , ** = ँ',
            'k = क, kh = ख',
            'g = ग, gh = घ',
            'ch = च, chh = छ',
            'j = ज, jh = झ',
            'T = ट, Th = ठ',
            'D = ड, Dh = ढ, N = ण',
            't = त, th = थ',
            'd = द, dh = ध, n = न',
            'p = प, ph / f = फ',
            'b = ब, bh = भ, m = म',
            'sh = श, Sh = ष, s = स',
            'ksh / x = क्ष, tr = त्र, gy = ज्ञ',
          ].map((rule) => (
            <div
              key={rule}
              className="px-2.5 py-1.5 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300"
            >
              {rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
