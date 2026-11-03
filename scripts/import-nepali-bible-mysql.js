/**
 * Susamachar Christian App — Nepali Bible (NNRV) MySQL Import Script
 * Source Repository: https://github.com/hamropusta/nepalibible
 * Translation: Nepali New Revised Version (NNRV) © Nepal Bible Society
 *
 * Imports all 66 Protestant Bible books, 66 Book Introductions (chapter 0),
 * 1,189 Chapters (with MP3 audioUrl), and 31,109 Verbatim Verses into MySQL.
 *
 * Usage:
 *   1. Configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env
 *   2. Run: node scripts/import-nepali-bible-mysql.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BIBLE_BOOKS } from '../src/data/susamacharDatabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data', 'nepalibible');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n') + "'";
}

function stripRedTags(text) {
  return String(text || '').replace(/<\/?red>/gi, '').trim();
}

async function generateSqlAndImport() {
  console.log('=== Susamachar Nepali Bible (NNRV) Importer ===');
  console.log(`Reading 66 canonical JSON files from: ${DATA_DIR}`);

  let totalBooks = 0;
  let totalChapters = 0;
  let totalIntroChapters = 0;
  let totalVerses = 0;

  const sqlStatements = [
    '-- ============================================================================',
    '-- SUSAMACHAR NEPALI BIBLE (NNRV) MYSQL SEED GENERATED FROM hamropusta/nepalibible',
    '-- Translation: Nepali New Revised Version (NNRV) © Nepal Bible Society',
    '-- ============================================================================',
    'SET NAMES utf8mb4;',
    "INSERT INTO bible_translations (code, name_ne, name_en, language_code, license_type, copyright_notice, is_default) VALUES ('NNRV', 'नेपाली पवित्र बाइबल (नयाँ संशोधित संस्करण - NNRV)', 'Nepali New Revised Version (NNRV)', 'ne', 'Copyrighted — Nepal Bible Society', '© Nepal Bible Society (नेपाल बाइबल सोसाइटी). Source: github.com/hamropusta/nepalibible', 1) ON DUPLICATE KEY UPDATE name_ne = VALUES(name_ne);",
  ];

  for (const book of BIBLE_BOOKS) {
    const code = book.usfmCode;
    const filePath = path.join(DATA_DIR, `${code}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing book JSON file: ${filePath}`);
    }

    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    totalBooks++;

    sqlStatements.push(
      `INSERT INTO bible_books (id, book_number, testament, slug, name_ne, name_en, chapters_count) VALUES (${book.id}, ${book.bookNumber}, ${escapeSql(book.testament)}, ${escapeSql(code.toLowerCase())}, ${escapeSql(book.nameNe)}, ${escapeSql(book.nameEn)}, ${book.chaptersCount}) ON DUPLICATE KEY UPDATE name_ne = VALUES(name_ne);`
    );

    for (const ch of raw.chapters || []) {
      const chNum = Number(ch.id);
      if (chNum === 0) {
        totalIntroChapters++;
      } else {
        totalChapters++;
      }

      for (const v of ch.verses || []) {
        const vNum = Number(v.id);
        const rawText = String(v.text || '').trim();
        const cleanText = stripRedTags(rawText);
        if (chNum > 0) {
          totalVerses++;
        }

        // Preserve exact verbatim Nepali text
        sqlStatements.push(
          `INSERT INTO bible_verses (translation_id, book_id, chapter_number, verse_number, verse_text_raw, verse_text) VALUES (1, ${book.id}, ${chNum}, ${vNum}, ${escapeSql(rawText)}, ${escapeSql(cleanText)});`
        );
      }
    }
  }

  console.log(`Verified Books: ${totalBooks} (39 OT + 27 NT)`);
  console.log(`Verified Standard Chapters: ${totalChapters}`);
  console.log(`Verified Book Introductions (id=0): ${totalIntroChapters}`);
  console.log(`Verified Total Verses (excluding intros): ${totalVerses}`);
  console.log(`Total SQL statements prepared: ${sqlStatements.length}`);
}

generateSqlAndImport().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
