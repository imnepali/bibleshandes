# Susamachar Christian App (सुसमाचार – इसाई संजाल) — Installation & cPanel Deployment Guide

## 1. Local Installation (Web + Backend API)

### Prerequisites
- Node.js 20.x LTS or newer
- MySQL 8.0+ (for production MySQL deployment) or built-in persistent JSON/SQLite storage (auto-configured out of the box)

### Step-by-Step Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Database Provisioning (MySQL)**:
   Import `/database/schema.sql` into your MySQL database:
   ```bash
   mysql -u your_db_user -p your_db_name < database/schema.sql
   ```
3. **Environment Configuration**:
   Copy `.env.example` to `.env` and configure your database & JWT credentials:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=susamachar_user
   DB_PASSWORD=your_secure_password
   DB_NAME=susamachar_db
   JWT_SECRET=replace_with_64_char_random_secret
   ```
4. **Start the Full-Stack Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 2. cPanel Deployment (Node.js Application Manager)

1. **Create MySQL Database & User**:
   - Log into **cPanel** → **MySQL® Database Wizard**.
   - Create database `cpaneluser_susamachar` and user `cpaneluser_admin` with `ALL PRIVILEGES`.
   - Open **phpMyAdmin**, select `cpaneluser_susamachar`, and import `/database/schema.sql`.

2. **Upload Application Files**:
   - Run `npm run build` locally to generate the production `dist/` frontend bundle.
   - Upload the project files (`server.ts`, `package.json`, `dist/`, `public/`, `database/`) to `/home/cpaneluser/susamachar` using cPanel File Manager or Git Version Control.

3. **Configure cPanel Setup Node.js App**:
   - Open **cPanel** → **Software** → **Setup Node.js App**.
   - Click **Create Application**:
     - **Node.js version**: `20.x`
     - **Application mode**: `Production`
     - **Application root**: `susamachar`
     - **Application URL**: Select your domain (e.g. `susamachar.org`)
     - **Application startup file**: `server.ts` (or compiled `server.js`)
   - Add Environment Variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`).
   - Click **Run NPM Install** and **Restart Application**.

---

## 3. Android APK Generation (Android Studio + Capacitor / Native Compose)

1. Open Android Studio (Ladybug 2024.2+ or newer).
2. Open the `/android` directory as an existing Gradle project.
3. In `MainActivity.kt`, update `https://your-cpanel-domain.com/api/` to point to your live domain.
4. Go to **Build** → **Generate Signed Bundle / APK** → **APK**.
5. Select your keystore and build the `release` variant (`app-release.apk`).
