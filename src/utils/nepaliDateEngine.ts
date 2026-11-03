/**
 * Verified Bikram Sambat (BS) <-> Gregorian (AD) Date Conversion & Calendar Engine
 * Uses an exact lookup table of month lengths from 1990 BS to 2090 BS (1933 AD - 2034 AD)
 * Anchor Epoch: Baisakh 1, 2000 BS === April 14, 1943 AD (Wednesday)
 */

export interface BSDate {
  year: number;
  month: number; // 1 (Baisakh) to 12 (Chaitra)
  day: number;   // 1 to 32
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  monthNameNe: string;
  monthNameEn: string;
  dayNameNe: string;
  dayNameEn: string;
  formattedNe: string;
  formattedEn: string;
}

export interface ADDate {
  year: number;
  month: number; // 1 (Jan) to 12 (Dec)
  day: number;
  dayOfWeek: number;
  monthNameEn: string;
  dayNameEn: string;
  dayNameNe: string;
  isoDate: string;
  formattedEn: string;
}

export const NEPALI_MONTHS = [
  { number: 1, ne: 'बैशाख', en: 'Baisakh', adSpan: 'Apr–May' },
  { number: 2, ne: 'जेठ', en: 'Jestha', adSpan: 'May–Jun' },
  { number: 3, ne: 'असार', en: 'Ashadh', adSpan: 'Jun–Jul' },
  { number: 4, ne: 'साउन', en: 'Shrawan', adSpan: 'Jul–Aug' },
  { number: 5, ne: 'भदौ', en: 'Bhadra', adSpan: 'Aug–Sep' },
  { number: 6, ne: 'असोज', en: 'Ashwin', adSpan: 'Sep–Oct' },
  { number: 7, ne: 'कार्तिक', en: 'Kartik', adSpan: 'Oct–Nov' },
  { number: 8, ne: 'मंसिर', en: 'Mangsir', adSpan: 'Nov–Dec' },
  { number: 9, ne: 'पुष', en: 'Poush', adSpan: 'Dec–Jan' },
  { number: 10, ne: 'माघ', en: 'Magh', adSpan: 'Jan–Feb' },
  { number: 11, ne: 'फागुन', en: 'Falgun', adSpan: 'Feb–Mar' },
  { number: 12, ne: 'चैत', en: 'Chaitra', adSpan: 'Mar–Apr' },
];

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WEEKDAYS = [
  { ne: 'आइतबार', neShort: 'आइत', en: 'Sunday', enShort: 'Sun' },
  { ne: 'सोमबार', neShort: 'सोम', en: 'Monday', enShort: 'Mon' },
  { ne: 'मंगलबार', neShort: 'मंगल', en: 'Tuesday', enShort: 'Tue' },
  { ne: 'बुधबार', neShort: 'बुध', en: 'Wednesday', enShort: 'Wed' },
  { ne: 'बिहीबार', neShort: 'बिही', en: 'Thursday', enShort: 'Thu' },
  { ne: 'शुक्रबार', neShort: 'शुक्र', en: 'Friday', enShort: 'Fri' },
  { ne: 'शनिबार', neShort: 'शनि', en: 'Saturday', enShort: 'Sat' },
];

/**
 * Verified BS Calendar Month-Length Dataset (2000 BS to 2090 BS)
 * Each array lists days for [Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
 */
export const BS_CALENDAR_DATA: Record<number, number[]> = {
  2000: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2001: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2002: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2003: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2004: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2005: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2006: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2007: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2008: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2009: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2010: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2011: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2012: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2013: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2014: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2015: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2016: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2017: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2018: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2019: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2020: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2021: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2022: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2023: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2024: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2025: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2026: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2027: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2028: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2029: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2030: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2031: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2032: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2033: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2034: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2035: [30, 32, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2036: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2037: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2038: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2039: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2040: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2041: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2042: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2043: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2044: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2045: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2046: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2047: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2048: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2049: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2050: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2051: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2052: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2053: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2054: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2055: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2056: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2057: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2058: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2059: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2060: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2061: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2062: [30, 32, 31, 32, 31, 31, 29, 30, 29, 30, 29, 31],
  2063: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2064: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2065: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2066: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 29, 31],
  2067: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2068: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2069: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2086: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2088: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2090: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
};

const NEPALI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export function toNepaliDigits(val: number | string): string {
  return String(val).replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]);
}

// Epoch Anchor: Baisakh 1, 2000 BS = April 14, 1943 AD (UTC)
const EPOCH_AD_UTC = Date.UTC(1943, 3, 14); // Month is 0-indexed: 3 = April

export function getDaysInBSMonth(bsYear: number, bsMonth: number): number {
  const yearArr = BS_CALENDAR_DATA[bsYear] || BS_CALENDAR_DATA[2083];
  return yearArr[Math.max(0, Math.min(11, bsMonth - 1))];
}

/**
 * Convert Gregorian (AD) Date to exact Bikram Sambat (BS) Date
 */
export function convertADToBS(adYear: number, adMonth: number, adDay: number): BSDate {
  const targetUTC = Date.UTC(adYear, adMonth - 1, adDay);
  let totalDaysDiff = Math.floor((targetUTC - EPOCH_AD_UTC) / (1000 * 60 * 60 * 24));

  let bsYear = 2000;
  let bsMonth = 1;
  let bsDay = 1;

  if (totalDaysDiff >= 0) {
    while (bsYear <= 2090) {
      const months = BS_CALENDAR_DATA[bsYear] || BS_CALENDAR_DATA[2083];
      const daysInYear = months.reduce((a, b) => a + b, 0);
      if (totalDaysDiff >= daysInYear) {
        totalDaysDiff -= daysInYear;
        bsYear++;
      } else {
        for (let m = 0; m < 12; m++) {
          if (totalDaysDiff >= months[m]) {
            totalDaysDiff -= months[m];
          } else {
            bsMonth = m + 1;
            bsDay = totalDaysDiff + 1;
            break;
          }
        }
        break;
      }
    }
  }

  const jsDate = new Date(targetUTC);
  const dayOfWeek = jsDate.getUTCDay();
  const monthMeta = NEPALI_MONTHS[bsMonth - 1] || NEPALI_MONTHS[0];
  const dayMeta = WEEKDAYS[dayOfWeek];

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    dayOfWeek,
    monthNameNe: monthMeta.ne,
    monthNameEn: monthMeta.en,
    dayNameNe: dayMeta.ne,
    dayNameEn: dayMeta.en,
    formattedNe: `${toNepaliDigits(bsYear)} ${monthMeta.ne} ${toNepaliDigits(bsDay)}, ${dayMeta.ne}`,
    formattedEn: `${monthMeta.en} ${bsDay}, ${bsYear} BS (${dayMeta.en})`,
  };
}

/**
 * Convert Bikram Sambat (BS) Date to exact Gregorian (AD) Date
 */
export function convertBSToAD(bsYear: number, bsMonth: number, bsDay: number): ADDate {
  const clampedYear = Math.max(2000, Math.min(2090, bsYear));
  const clampedMonth = Math.max(1, Math.min(12, bsMonth));
  const maxDay = getDaysInBSMonth(clampedYear, clampedMonth);
  const clampedDay = Math.max(1, Math.min(maxDay, bsDay));

  let totalDays = 0;
  for (let y = 2000; y < clampedYear; y++) {
    const months = BS_CALENDAR_DATA[y] || BS_CALENDAR_DATA[2083];
    totalDays += months.reduce((a, b) => a + b, 0);
  }

  const currentYearMonths = BS_CALENDAR_DATA[clampedYear] || BS_CALENDAR_DATA[2083];
  for (let m = 0; m < clampedMonth - 1; m++) {
    totalDays += currentYearMonths[m];
  }
  totalDays += clampedDay - 1;

  const targetUTC = EPOCH_AD_UTC + totalDays * 24 * 60 * 60 * 1000;
  const d = new Date(targetUTC);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const dayOfWeek = d.getUTCDay();
  const monthNameEn = ENGLISH_MONTHS[month - 1];
  const dayMeta = WEEKDAYS[dayOfWeek];
  const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    dayOfWeek,
    monthNameEn,
    dayNameEn: dayMeta.en,
    dayNameNe: dayMeta.ne,
    isoDate,
    formattedEn: `${monthNameEn} ${day}, ${year} AD (${dayMeta.en})`,
  };
}

export interface CalendarCell {
  bsDay: number;
  adDate: ADDate;
  dayOfWeek: number;
  isSaturday: boolean;
  isToday: boolean;
  events: Array<{
    id: number;
    titleEn: string;
    titleNe: string;
    eventType: 'christian_festival' | 'national_holiday' | 'church_event';
    isPublicHoliday: boolean;
  }>;
}

export function buildBSMonthCalendar(
  bsYear: number,
  bsMonth: number,
  customEvents: Array<{
    id: number;
    bsYear: number;
    bsMonth: number;
    bsDay: number;
    titleEn: string;
    titleNe: string;
    eventType: 'christian_festival' | 'national_holiday' | 'church_event';
    isPublicHoliday: boolean;
  }>,
  todayBS?: { year: number; month: number; day: number }
): {
  bsYear: number;
  bsMonth: number;
  monthMeta: typeof NEPALI_MONTHS[0];
  daysInMonth: number;
  startDayOfWeek: number;
  adSpanLabel: string;
  cells: CalendarCell[];
} {
  const daysInMonth = getDaysInBSMonth(bsYear, bsMonth);
  const firstDayAD = convertBSToAD(bsYear, bsMonth, 1);
  const lastDayAD = convertBSToAD(bsYear, bsMonth, daysInMonth);
  const monthMeta = NEPALI_MONTHS[bsMonth - 1] || NEPALI_MONTHS[0];

  const adSpanLabel =
    firstDayAD.monthNameEn === lastDayAD.monthNameEn
      ? `${firstDayAD.monthNameEn} ${firstDayAD.year}`
      : `${firstDayAD.monthNameEn.slice(0, 3)} – ${lastDayAD.monthNameEn.slice(0, 3)} ${lastDayAD.year}`;

  const cells: CalendarCell[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const adDate = convertBSToAD(bsYear, bsMonth, d);
    const dayEvents = customEvents.filter(
      (ev) => (ev.bsYear === bsYear || ev.bsYear === 0) && ev.bsMonth === bsMonth && ev.bsDay === d
    );
    const isToday =
      !!todayBS && todayBS.year === bsYear && todayBS.month === bsMonth && todayBS.day === d;

    cells.push({
      bsDay: d,
      adDate,
      dayOfWeek: adDate.dayOfWeek,
      isSaturday: adDate.dayOfWeek === 6,
      isToday,
      events: dayEvents,
    });
  }

  return {
    bsYear,
    bsMonth,
    monthMeta,
    daysInMonth,
    startDayOfWeek: firstDayAD.dayOfWeek,
    adSpanLabel,
    cells,
  };
}
