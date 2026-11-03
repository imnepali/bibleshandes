# Susamachar REST API Documentation

Base URL: `/api`

## Authentication & User Account
- `POST /api/auth/register` — Register a new user account (`fullName`, `email`, `password`, `preferredLanguage`, `churchName`)
- `POST /api/auth/login` — Authenticate user or admin (`email`, `password`) and return JWT session token + role permissions
- `POST /api/auth/logout` — Invalidate current session
- `POST /api/auth/forgot-password` — Initiate password reset verification

## Holy Bible Module
- `GET /api/bible/books` — List all Old Testament & New Testament books in Nepali and English
- `GET /api/bible/books/:bookId/chapters/:chapter` — Retrieve bilingual Nepali & English verses for a specific book & chapter
- `GET /api/bible/search?q=:query` — Search across Nepali and English Bible verses, topics, and study articles
- `GET /api/bible/study` — Retrieve Bible Study articles, devotionals, biblical characters, and teachings

## Prayer Wall & Moderation
- `GET /api/prayers` — List approved public prayer requests (plus private requests for the authenticated owner/admin)
- `POST /api/prayers` — Submit a new prayer request (`requesterName`, `category`, `title`, `requestText`, `visibility`)
- `POST /api/prayers/:id/pray` — Increment "I Prayed" (`प्रार्थना गरें`) intercession count
- `PUT /api/admin/prayers/:id/moderate` — Approve, reject, or mark a prayer request as answered (Requires `PRAYER_ADMIN` or `SUPER_ADMIN`)

## Nepali Calendar & BS/AD Date Converter
- `GET /api/calendar?bsYear=2083&bsMonth=7` — Retrieve Bikram Sambat month metadata, holidays, Christian festivals, and church events
- `POST /api/date-converter/convert` — Convert exact dates (`direction: 'BS_TO_AD' | 'AD_TO_BS'`, `year`, `month`, `day`)
- `POST /api/admin/calendar/events` — Add a new calendar holiday or church festival (Requires `CALENDAR_ADMIN` or `SUPER_ADMIN`)

## Christian News Portal
- `GET /api/news?category=:slug&q=:search` — Retrieve published news articles with category & search filtering
- `GET /api/news/:slug` — Retrieve full bilingual news article, author bio, and related stories
- `POST /api/admin/news` — Create news article (Requires `NEWS_ADMIN` or `SUPER_ADMIN`)
- `PUT /api/admin/news/:id` — Edit or publish news article
- `DELETE /api/admin/news/:id` — Delete news article

## Christian FM Radio
- `GET /api/radio` — List active Nepali Christian FM radio stations with streaming URLs and frequencies
- `POST /api/admin/radio` — Add or update an FM radio station (Requires `RADIO_ADMIN` or `SUPER_ADMIN`)

## Gold & Silver Rates (NPR)
- `GET /api/rates` — Retrieve current daily Gold & Silver prices per tola and per gram in NPR + historical rate records
- `POST /api/admin/rates` — Update daily Gold & Silver prices and record history (Requires `FINANCE_ADMIN` or `SUPER_ADMIN`)

## Photo Gallery, Events & Church Directory
- `GET /api/gallery` — List approved Christian photo & video albums
- `POST /api/admin/gallery` — Create new photo/video album (Requires `GALLERY_ADMIN` or `SUPER_ADMIN`)
- `GET /api/events` — List upcoming Christian conferences, youth camps, and worship seminars
- `POST /api/admin/events` — Create new Christian event

## Multi-Admin Dashboard & RBAC
- `GET /api/admin/dashboard` — Retrieve real-time statistics, role permissions matrix, audit logs, and user list
- `POST /api/admin/users` — Create new admin account with specific role (`SUPER_ADMIN` only)
- `PUT /api/admin/users/:id/role` — Update admin role or account status (`SUPER_ADMIN` only)
