import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Monitor,
  Share2,
  Sliders,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { BibleVerse } from '../data/susamacharDatabase';
import { toNepaliDigits } from '../utils/nepaliDateEngine';

interface VerseImageShareModalProps {
  verse: BibleVerse | null;
  lang: 'ne' | 'en';
  initialBgImageUrl?: string | null;
  galleryPhotos?: Array<{ id: number; titleNe: string; titleEn: string; coverImage: string }>;
  onUploadPhotoToWebsite?: (photoDataUrl: string, title: string) => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
}

type CardThemeId = 'crimson_gold' | 'himalayan_dawn' | 'parchment_classic' | 'emerald_sanctuary';
type CardLanguageMode = 'bilingual' | 'ne' | 'en';
type CardAspect = 'square' | 'portrait' | 'landscape';

interface ThemeConfig {
  id: CardThemeId;
  nameNe: string;
  nameEn: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accentGold: string;
  accentLight: string;
  primaryText: string;
  secondaryText: string;
  mountainFill: string;
  cardBorder: string;
}

const CARD_THEMES: ThemeConfig[] = [
  {
    id: 'crimson_gold',
    nameNe: 'हिमाली सिम्रिक र सुनौलो',
    nameEn: 'Himalayan Crimson & Gold',
    bgStart: '#7F1D1D',
    bgMid: '#450A0A',
    bgEnd: '#1E1B4B',
    accentGold: '#FBBF24',
    accentLight: '#FDE68A',
    primaryText: '#FFFFFF',
    secondaryText: '#FDE68A',
    mountainFill: 'rgba(30, 58, 138, 0.35)',
    cardBorder: 'rgba(251, 191, 36, 0.45)',
  },
  {
    id: 'himalayan_dawn',
    nameNe: 'अन्नपूर्ण प्रभात (निलो)',
    nameEn: 'Annapurna Dawn Navy',
    bgStart: '#0F172A',
    bgMid: '#1E3A8A',
    bgEnd: '#312E81',
    accentGold: '#F59E0B',
    accentLight: '#FEF08A',
    primaryText: '#F8FAFC',
    secondaryText: '#CBD5E1',
    mountainFill: 'rgba(254, 240, 138, 0.12)',
    cardBorder: 'rgba(245, 158, 11, 0.45)',
  },
  {
    id: 'parchment_classic',
    nameNe: 'क्लासिक चर्मपत्र (उज्यालो)',
    nameEn: 'Sacred Parchment Light',
    bgStart: '#FFFBEB',
    bgMid: '#FEF3C7',
    bgEnd: '#F5F5F4',
    accentGold: '#991B1B',
    accentLight: '#B45309',
    primaryText: '#1C1917',
    secondaryText: '#57534E',
    mountainFill: 'rgba(153, 27, 27, 0.07)',
    cardBorder: 'rgba(153, 27, 27, 0.35)',
  },
  {
    id: 'emerald_sanctuary',
    nameNe: 'हरियो खर्क (भजनसंग्रह २३)',
    nameEn: 'Still Waters Emerald',
    bgStart: '#064E3B',
    bgMid: '#022C22',
    bgEnd: '#0F172A',
    accentGold: '#FBBF24',
    accentLight: '#A7F3D0',
    primaryText: '#ECFDF5',
    secondaryText: '#D1FAE5',
    mountainFill: 'rgba(16, 185, 129, 0.16)',
    cardBorder: 'rgba(251, 191, 36, 0.4)',
  },
];

const PRESET_BACKGROUNDS = [
  {
    id: 'nepal-rhododendron',
    labelNe: 'लालीगुराँस र हिमाल (Lali Gurans)',
    labelEn: 'Rhododendron & Himalayas',
    url: '/assets/aistudio/image_fed91b50.png',
  },
  {
    id: 'phoksundo-lake',
    labelNe: 'फोक्सुण्डो ताल, डोल्पा (Phoksundo)',
    labelEn: 'Phoksundo Lake, Dolpa',
    url: '/assets/aistudio/image_4e1a2ab5.png',
  },
  {
    id: 'karnali-valley',
    labelNe: 'कर्णाली नदी र हिमाल (Karnali)',
    labelEn: 'Karnali River Valley',
    url: '/assets/aistudio/image_d40a1d65.png',
  },
  {
    id: 'himalayan-flowers',
    labelNe: 'हिमाली फूल र शिखर (Wildflowers)',
    labelEn: 'Alpine Wildflowers',
    url: '/assets/aistudio/image_05744a49.png',
  },
  {
    id: 'golden-himalaya',
    labelNe: 'सूर्यास्तमा सुनौलो हिमाल (Sunset)',
    labelEn: 'Golden Himalayan Sunset',
    url: '/assets/aistudio/image_8235fd25.png',
  },
  {
    id: 'mustang-village',
    labelNe: 'मुस्ताङ हिमाली बस्ती (Mustang)',
    labelEn: 'Upper Mustang Village',
    url: '/assets/aistudio/image_3fb48649.png',
  },
  {
    id: 'mountain-valley',
    labelNe: 'पहाडी उपत्यका (Mountain Trail)',
    labelEn: 'Himalayan Trail',
    url: '/assets/aistudio/image_42266620.png',
  },
  {
    id: 'holy-bible',
    labelNe: 'पवित्र बाइबल (Holy Bible)',
    labelEn: 'Holy Bible',
    url: '/assets/aistudio/image_312e60b5.png',
  },
];

/**
 * Helper to wrap multi-line text onto an HTML5 Canvas context
 */
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export const VerseImageShareModal: React.FC<VerseImageShareModalProps> = ({
  verse,
  lang,
  initialBgImageUrl = null,
  galleryPhotos = [],
  onUploadPhotoToWebsite,
  onClose,
  onNotify,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('crimson_gold');
  const [languageMode, setLanguageMode] = useState<CardLanguageMode>('bilingual');
  const [aspect, setAspect] = useState<CardAspect>('square');
  const [copiedImage, setCopiedImage] = useState(false);

  // Custom Photo Background States
  const [bgImageSrc, setBgImageSrc] = useState<string | null>(initialBgImageUrl);
  const [loadedBgImage, setLoadedBgImage] = useState<HTMLImageElement | null>(null);
  const [overlayDarkness, setOverlayDarkness] = useState<number>(0.58);
  const [uploadedPhotoTitle, setUploadedPhotoTitle] = useState<string>('');
  const [savedToSite, setSavedToSite] = useState<boolean>(false);

  // Editable Verse Text for Custom Wallpaper Creation
  const [customTextNe, setCustomTextNe] = useState<string>(verse?.textNe || '');
  const [customTextEn, setCustomTextEn] = useState<string>(verse?.textEn || '');
  const [customRefNe, setCustomRefNe] = useState<string>(
    verse ? `${verse.bookNameNe} ${toNepaliDigits(verse.chapter)}:${toNepaliDigits(verse.verse)}` : ''
  );
  const [customRefEn, setCustomRefEn] = useState<string>(
    verse ? `${verse.bookNameEn} ${verse.chapter}:${verse.verse}` : ''
  );

  useEffect(() => {
    if (verse) {
      setCustomTextNe(verse.textNe);
      setCustomTextEn(verse.textEn);
      setCustomRefNe(`${verse.bookNameNe} ${toNepaliDigits(verse.chapter)}:${toNepaliDigits(verse.verse)}`);
      setCustomRefEn(`${verse.bookNameEn} ${verse.chapter}:${verse.verse}`);
    }
  }, [verse]);

  useEffect(() => {
    if (initialBgImageUrl) {
      setBgImageSrc(initialBgImageUrl);
    }
  }, [initialBgImageUrl]);

  // Load background image whenever bgImageSrc changes
  useEffect(() => {
    if (!bgImageSrc) {
      setLoadedBgImage(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setLoadedBgImage(img);
    };
    img.onerror = () => {
      setLoadedBgImage(null);
    };
    img.src = bgImageSrc;
  }, [bgImageSrc]);

  const theme = CARD_THEMES.find((t) => t.id === selectedTheme) || CARD_THEMES[0];

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBgImageSrc(reader.result);
        setSavedToSite(false);
        setUploadedPhotoTitle(file.name.replace(/\.[^/.]+$/, ''));
        onNotify(
          lang === 'ne'
            ? 'वालपेपरको लागि फोटो लोड भयो!'
            : 'Custom photo loaded for wallpaper!'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!verse || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = aspect === 'square' ? 1080 : aspect === 'portrait' ? 1080 : 1920;
    const height = aspect === 'square' ? 1080 : aspect === 'portrait' ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Background: Either Custom Photo (cover fit + dark overlay) OR Theme Gradient
    if (loadedBgImage) {
      const imgRatio = loadedBgImage.width / loadedBgImage.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        offsetX = (width - drawW) / 2;
      } else {
        drawW = width;
        drawH = width / imgRatio;
        offsetY = (height - drawH) / 2;
      }

      ctx.drawImage(loadedBgImage, offsetX, offsetY, drawW, drawH);

      // Smooth Vignette + Dark Overlay for Scripture Readability
      const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
      overlayGrad.addColorStop(0, `rgba(10, 12, 22, ${Math.min(0.92, overlayDarkness + 0.1)})`);
      overlayGrad.addColorStop(0.5, `rgba(10, 12, 22, ${overlayDarkness})`);
      overlayGrad.addColorStop(1, `rgba(10, 12, 22, ${Math.min(0.95, overlayDarkness + 0.18)})`);
      ctx.fillStyle = overlayGrad;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, theme.bgStart);
      bgGrad.addColorStop(0.55, theme.bgMid);
      bgGrad.addColorStop(1, theme.bgEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Radial Halo behind Header Logo
      const radial = ctx.createRadialGradient(width / 2, height * 0.16, 10, width / 2, height * 0.16, 400);
      radial.addColorStop(
        0,
        theme.id === 'parchment_classic' ? 'rgba(217, 119, 6, 0.14)' : 'rgba(251, 191, 36, 0.18)'
      );
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, width, height);

      // Himalayan Silhouette at Bottom
      ctx.save();
      ctx.fillStyle = theme.mountainFill;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height - 185);
      ctx.lineTo(width * 0.18, height - 280);
      ctx.lineTo(width * 0.33, height - 200);
      ctx.lineTo(width * 0.52, height - 325);
      ctx.lineTo(width * 0.71, height - 210);
      ctx.lineTo(width * 0.86, height - 290);
      ctx.lineTo(width, height - 195);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    const effectiveAccentGold = loadedBgImage ? '#FBBF24' : theme.accentGold;
    const effectivePrimaryText = loadedBgImage ? '#FFFFFF' : theme.primaryText;
    const effectiveSecondaryText = loadedBgImage ? '#FDE68A' : theme.secondaryText;
    const effectiveBorder = loadedBgImage ? 'rgba(251, 191, 36, 0.5)' : theme.cardBorder;

    // 4. Ornamental Outer & Inner Frame Border
    const pad = aspect === 'portrait' ? 54 : 44;
    ctx.strokeStyle = effectiveBorder;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

    ctx.strokeStyle = effectiveBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 10, pad + 10, width - (pad + 10) * 2, height - (pad + 10) * 2);

    // Corner Accents
    const cornerLen = 30;
    ctx.strokeStyle = effectiveAccentGold;
    ctx.lineWidth = 4;
    const corners = [
      [pad, pad, 1, 1],
      [width - pad, pad, -1, 1],
      [pad, height - pad, 1, -1],
      [width - pad, height - pad, -1, -1],
    ];
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cornerLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cornerLen, cy);
      ctx.stroke();
    });

    // 5. Draw Susamachar / biblesandes.com Logo Badge at Top Center
    const centerX = width / 2;
    const logoY = aspect === 'portrait' ? 210 : aspect === 'square' ? 132 : 125;
    const badgeRadius = aspect === 'portrait' ? 52 : 44;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, logoY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle =
      !loadedBgImage && theme.id === 'parchment_classic' ? '#991B1B' : 'rgba(153, 27, 27, 0.92)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#FBBF24';
    ctx.stroke();

    // Draw Gold Cross inside Logo Badge
    ctx.fillStyle = '#FDE68A';
    const crossW = badgeRadius * 0.22;
    const crossH = badgeRadius * 1.1;
    ctx.fillRect(centerX - crossW / 2, logoY - crossH * 0.52, crossW, crossH);
    const armW = badgeRadius * 0.78;
    ctx.fillRect(centerX - armW / 2, logoY - crossH * 0.22, armW, crossW);

    // Open Bible Base Arc inside Badge
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - badgeRadius * 0.5, logoY + badgeRadius * 0.52);
    ctx.quadraticCurveTo(
      centerX,
      logoY + badgeRadius * 0.35,
      centerX + badgeRadius * 0.5,
      logoY + badgeRadius * 0.52
    );
    ctx.stroke();
    ctx.restore();

    // Brand Name below Logo
    const brandY = logoY + badgeRadius + 34;
    ctx.fillStyle = effectiveAccentGold;
    ctx.textAlign = 'center';
    ctx.font = 'bold 25px "Plus Jakarta Sans", "Mukta", sans-serif';
    ctx.fillText('सुसमाचार • BIBLESANDES.COM', centerX, brandY);

    // 6. Verse Text Rendering (Auto-fit & Centered)
    const contentWidth = width - (aspect === 'landscape' ? 320 : 190);
    const nepaliRef = customRefNe || `${verse.bookNameNe} ${toNepaliDigits(verse.chapter)}:${toNepaliDigits(verse.verse)}`;
    const englishRef = customRefEn || `${verse.bookNameEn} ${verse.chapter}:${verse.verse}`;

    let currentY =
      aspect === 'portrait'
        ? brandY + 140
        : aspect === 'square'
        ? brandY + 75
        : brandY + 65;

    // Decorative Quote Mark
    ctx.font = 'italic bold 68px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = effectiveAccentGold;
    ctx.fillText('“', centerX, currentY);
    currentY += 24;

    // Add text shadow when rendered over a photo
    if (loadedBgImage) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
    }

    if (languageMode === 'bilingual' || languageMode === 'ne') {
      const neFontSize =
        languageMode === 'ne'
          ? aspect === 'portrait'
            ? 48
            : aspect === 'landscape'
            ? 44
            : 42
          : aspect === 'portrait'
          ? 40
          : aspect === 'landscape'
          ? 36
          : 35;
      ctx.font = `600 ${neFontSize}px "Mukta", "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = effectivePrimaryText;

      const neLines = wrapCanvasText(ctx, customTextNe || verse.textNe, contentWidth);
      const lineHeight = neFontSize * 1.48;
      neLines.forEach((line) => {
        ctx.fillText(line, centerX, currentY);
        currentY += lineHeight;
      });
    }

    if (languageMode === 'bilingual') {
      currentY += 10;
      ctx.strokeStyle = effectiveBorder;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 90, currentY);
      ctx.lineTo(centerX + 90, currentY);
      ctx.stroke();
      currentY += 40;
    }

    if (languageMode === 'bilingual' || languageMode === 'en') {
      const enFontSize =
        languageMode === 'en'
          ? aspect === 'portrait'
            ? 44
            : aspect === 'landscape'
            ? 40
            : 38
          : aspect === 'portrait'
          ? 32
          : aspect === 'landscape'
          ? 28
          : 27;
      ctx.font = `italic 600 ${enFontSize}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillStyle = languageMode === 'en' ? effectivePrimaryText : effectiveSecondaryText;

      const enLines = wrapCanvasText(ctx, `"${customTextEn || verse.textEn}"`, contentWidth);
      const lineHeight = enFontSize * 1.42;
      enLines.forEach((line) => {
        ctx.fillText(line, centerX, currentY);
        currentY += lineHeight;
      });
    }

    // 7. Book, Chapter & Verse Reference Pill / Banner
    const refY = Math.min(height - (aspect === 'portrait' ? 190 : 130), currentY + 42);
    ctx.font = 'bold 30px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = effectiveAccentGold;
    const referenceLabel =
      languageMode === 'ne'
        ? `— ${nepaliRef} (पवित्र बाइबल)`
        : languageMode === 'en'
        ? `— ${englishRef} (Holy Bible)`
        : `— ${nepaliRef}  |  ${englishRef}`;
    ctx.fillText(referenceLabel, centerX, refY);

    // Reset shadow for footer
    ctx.shadowBlur = 0;

    // 8. Footer Slogan & biblesandes.com Watermark
    const footerY = height - (aspect === 'portrait' ? 92 : 70);
    ctx.font = '600 20px "Mukta", "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = effectiveSecondaryText;
    ctx.fillText(
      'सुसमाचार • www.biblesandes.com  |  Share the Gospel • Grow in Faith • Serve with Love',
      centerX,
      footerY
    );
  }, [
    verse,
    selectedTheme,
    languageMode,
    aspect,
    theme,
    loadedBgImage,
    overlayDarkness,
    customTextNe,
    customTextEn,
    customRefNe,
    customRefEn,
  ]);

  if (!verse) return null;

  const getFilename = () =>
    `biblesandes-wallpaper-${verse.bookNameEn.toLowerCase().replace(/\s+/g, '-')}-${verse.chapter}-${verse.verse}-${aspect}.png`;

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = getFilename();
    a.click();
    onNotify(
      lang === 'ne'
        ? 'बाइबल वालपेपर तस्बिर डाउनलोड गरियो! (biblesandes.com)'
        : 'Bible wallpaper downloaded! (biblesandes.com)'
    );
  };

  const handleCopyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (
          navigator.clipboard &&
          'write' in navigator.clipboard &&
          typeof ClipboardItem !== 'undefined'
        ) {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          setCopiedImage(true);
          onNotify(
            lang === 'ne'
              ? 'बाइबल वालपेपर क्लिपबोर्डमा कपी गरियो!'
              : 'Wallpaper copied to clipboard!'
          );
          setTimeout(() => setCopiedImage(false), 2200);
          return;
        }
      } catch {
        // Fallback to download
      }
      handleDownloadImage();
    }, 'image/png');
  };

  const handleNativeShareImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], getFilename(), { type: 'image/png' });
      const shareData = {
        title: `${customRefNe} — biblesandes.com`,
        text: `"${customTextNe}" (${customRefNe})\n"${customTextEn}" (${customRefEn})\nhttps://biblesandes.com`,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share(shareData);
          return;
        } catch {
          // Fallback to download
        }
      }
      handleDownloadImage();
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl my-auto max-h-[94vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-800/10 dark:bg-amber-400/10 text-red-800 dark:text-amber-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'ne'
                  ? 'बाइबल वालपेपर र फोटो स्टुडियो (biblesandes.com Wallpaper Maker)'
                  : 'Bible Wallpaper & Custom Photo Studio (biblesandes.com)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ne'
                  ? 'आफ्नो फोटो अपलोड गर्नुहोस् वा थिम छानेर मोबाइल/कम्प्युटर वालपेपर बनाउनुहोस्'
                  : 'Upload your own photo or choose a theme to create mobile, desktop & social wallpapers'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl border border-stone-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Live Canvas Preview + Right Customization Controls */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-y-auto">
          {/* Canvas Preview Area */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-stone-100 dark:bg-slate-950 rounded-2xl p-4 border border-stone-200/80 dark:border-slate-800 space-y-3 sticky top-0">
            <canvas
              ref={canvasRef}
              className="w-full max-h-[440px] object-contain rounded-xl shadow-lg"
            />
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>
                {aspect === 'square'
                  ? 'Square (1080×1080px)'
                  : aspect === 'portrait'
                  ? 'Mobile Lockscreen Wallpaper (1080×1920px)'
                  : 'Desktop HD Wallpaper (1920×1080px)'}
              </span>
              <span className="font-mono font-bold text-red-800 dark:text-amber-400">
                www.biblesandes.com
              </span>
            </div>
          </div>

          {/* Customization & Action Controls */}
          <div className="lg:col-span-6 space-y-5">
            {/* 1. Custom Photo Upload for Wallpaper */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-red-800 dark:text-amber-400" />
                  <span>
                    {lang === 'ne'
                      ? '१. वालपेपरको लागि फोटो अपलोड गर्नुहोस् (Upload Background Photo)'
                      : '1. Upload Custom Photo for Wallpaper'}
                  </span>
                </label>
                {bgImageSrc && (
                  <button
                    onClick={() => setBgImageSrc(null)}
                    className="text-xs font-semibold text-red-700 hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'ne' ? 'फोटो हटाउनुहोस्' : 'Remove Photo'}</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {lang === 'ne'
                      ? 'डिभाइसबाट फोटो छान्नुहोस् (Choose Photo)'
                      : 'Upload Photo from Device'}
                  </span>
                </button>

                {/* Option to also publish this uploaded photo to the website gallery */}
                {bgImageSrc && bgImageSrc.startsWith('data:image') && onUploadPhotoToWebsite && (
                  <button
                    type="button"
                    disabled={savedToSite}
                    onClick={() => {
                      onUploadPhotoToWebsite(
                        bgImageSrc,
                        uploadedPhotoTitle || `${customRefNe} Wallpaper`
                      );
                      setSavedToSite(true);
                    }}
                    className={`h-10 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                      savedToSite
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {savedToSite
                        ? lang === 'ne'
                          ? 'वेबसाइटमा थपियो!'
                          : 'Added to Website!'
                        : lang === 'ne'
                        ? 'वेबसाइट ग्यालरीमा पनि राख्नुहोस्'
                        : 'Also Add Photo to Website'}
                    </span>
                  </button>
                )}
              </div>

              {/* Preset & Website Gallery Background Photos */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {lang === 'ne'
                    ? 'वा वेबसाइटका पृष्ठभूमि तस्बिरहरू छान्नुहोस्:'
                    : 'Or pick a preset / website background photo:'}
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_BACKGROUNDS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setBgImageSrc(p.url)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 transition ${
                        bgImageSrc === p.url
                          ? 'border-red-800 bg-red-800 text-white'
                          : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'ne' ? p.labelNe : p.labelEn}
                    </button>
                  ))}
                  {galleryPhotos.slice(0, 6).map((gp) => (
                    <button
                      key={gp.id}
                      type="button"
                      onClick={() => setBgImageSrc(gp.coverImage)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold whitespace-nowrap shrink-0 transition ${
                        bgImageSrc === gp.coverImage
                          ? 'border-red-800 bg-red-800 text-white'
                          : 'border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'ne' ? gp.titleNe : gp.titleEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Darkness Overlay Slider when photo is active */}
              {bgImageSrc && (
                <div className="pt-2 flex items-center gap-3">
                  <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {lang === 'ne' ? 'फोटो गाढापन (Overlay):' : 'Photo Darkness:'}
                  </span>
                  <input
                    type="range"
                    min={0.2}
                    max={0.88}
                    step={0.04}
                    value={overlayDarkness}
                    onChange={(e) => setOverlayDarkness(Number(e.target.value))}
                    className="flex-1 accent-red-800"
                  />
                  <span className="text-xs font-mono text-slate-500">
                    {Math.round(overlayDarkness * 100)}%
                  </span>
                </div>
              )}
            </div>

            {/* 2. Wallpaper Aspect Ratio (Square, Mobile 9:16 Wallpaper, Desktop 16:9 Wallpaper) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ne'
                  ? '२. वालपेपर र कार्डको साइज (Wallpaper Size)'
                  : '2. Wallpaper & Card Size'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setAspect('portrait')}
                  className={`py-2.5 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                    aspect === 'portrait'
                      ? 'border-red-800 dark:border-amber-400 bg-red-50/60 dark:bg-slate-800 text-red-900 dark:text-amber-300 font-bold'
                      : 'border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'मोबाइल वालपेपर (9:16)' : 'Mobile (9:16)'}</span>
                </button>
                <button
                  onClick={() => setAspect('square')}
                  className={`py-2.5 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                    aspect === 'square'
                      ? 'border-red-800 dark:border-amber-400 bg-red-50/60 dark:bg-slate-800 text-red-900 dark:text-amber-300 font-bold'
                      : 'border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'स्क्वायर पोस्ट (1:1)' : 'Square (1:1)'}</span>
                </button>
                <button
                  onClick={() => setAspect('landscape')}
                  className={`py-2.5 px-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-colors ${
                    aspect === 'landscape'
                      ? 'border-red-800 dark:border-amber-400 bg-red-50/60 dark:bg-slate-800 text-red-900 dark:text-amber-300 font-bold'
                      : 'border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'कम्प्युटर वालपेपर (16:9)' : 'Desktop (16:9)'}</span>
                </button>
              </div>
            </div>

            {/* 3. Theme Selector (When not using custom photo) */}
            {!bgImageSrc && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'ne' ? '३. कार्डको रङ र शैली (Color Theme)' : '3. Select Color Theme'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CARD_THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        selectedTheme === t.id
                          ? 'border-red-800 dark:border-amber-400 bg-red-50/50 dark:bg-slate-800 font-bold'
                          : 'border-stone-200 dark:border-slate-800 hover:border-stone-400'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-white/40"
                        style={{ background: `linear-gradient(135deg, ${t.bgStart}, ${t.bgEnd})` }}
                      />
                      <span className="text-xs text-slate-800 dark:text-slate-200 truncate">
                        {lang === 'ne' ? t.nameNe : t.nameEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Language Layout */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ne' ? '४. भाषा छनोट (Scripture Language)' : '4. Verse Language Layout'}
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-slate-800 rounded-xl">
                {[
                  { id: 'bilingual', ne: 'द्विभाषी (Both)', en: 'Bilingual' },
                  { id: 'ne', ne: 'नेपाली मात्र', en: 'Nepali Only' },
                  { id: 'en', ne: 'English Only', en: 'English Only' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setLanguageMode(m.id as CardLanguageMode)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      languageMode === m.id
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'ne' ? m.ne : m.en}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Editable Verse Text for Custom Wallpaper */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'ne'
                  ? '५. वालपेपरमा लेखिने बाइबल वचन (Customize Wallpaper Text)'
                  : '5. Customize Wallpaper Verse Text'}
              </label>
              <textarea
                rows={2}
                value={customTextNe}
                onChange={(e) => setCustomTextNe(e.target.value)}
                placeholder="नेपाली बाइबल वचन..."
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customRefNe}
                  onChange={(e) => setCustomRefNe(e.target.value)}
                  placeholder="सन्दर्भ (जस्तै: यूहन्ना ३:१६)"
                  className="h-8 px-3 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
                <input
                  type="text"
                  value={customRefEn}
                  onChange={(e) => setCustomRefEn(e.target.value)}
                  placeholder="Reference (e.g. John 3:16)"
                  className="h-8 px-3 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* Primary Download / Share Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={handleDownloadImage}
                className="w-full h-11 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>
                  {lang === 'ne'
                    ? 'वालपेपर डाउनलोड गर्नुहोस् (Download HD PNG)'
                    : 'Download HD Wallpaper (PNG)'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleCopyImageToClipboard}
                  className="h-10 rounded-xl border border-stone-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 hover:bg-stone-100 dark:hover:bg-slate-800"
                >
                  {copiedImage ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{lang === 'ne' ? 'तस्बिर कपी' : 'Copy Image'}</span>
                </button>

                <button
                  onClick={handleNativeShareImage}
                  className="h-10 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-500/25"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{lang === 'ne' ? 'सिधै सेयर (Share)' : 'Share Card'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
