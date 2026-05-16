# DeepVision - Complete Setup Guide

For anyone who wants to run this project from scratch.
Follow every step in order and you will have a fully working DeepVision deepfake-detection platform running locally.

---

## Table of Contents

1. [What Is DeepVision?](#1-what-is-deepvision)
2. [Prerequisites](#2-prerequisites)
3. [Clone the Repository](#3-clone-the-repository)
4. [Supabase Project Setup](#4-supabase-project-setup)
5. [Database Setup - Run the SQL Script](#5-database-setup---run-the-sql-script)
6. [Supabase Storage Setup](#6-supabase-storage-setup)
7. [Supabase Auth Setup](#7-supabase-auth-setup)
8. [Backend Setup](#8-backend-setup)
9. [Frontend Setup](#9-frontend-setup)
10. [Running the Application](#10-running-the-application)
11. [Setting Up the Admin Account](#11-setting-up-the-admin-account)
12. [Environment Variables Reference](#12-environment-variables-reference)
13. [Project Structure](#13-project-structure)
14. [API Documentation](#14-api-documentation)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. What Is DeepVision?

DeepVision is a full-stack AI-powered deepfake detection platform. Users upload images or videos and the system returns a REAL / FAKE verdict with a confidence score.

What it includes:
- User Dashboard - upload media, view history, analytics, settings, feedback
- Admin Dashboard - user management, AI model management, feedback review, platform analytics
- AI Detection Engine - hybrid approach using CLIP + face-swap detection + artifact analysis
- Authentication - email/password + Google OAuth via Supabase
- Storage - media files stored in Supabase Storage

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React 19 + Vite + TailwindCSS + Framer Motion       |
| Backend  | FastAPI (Python 3.9+)                               |
| Database | PostgreSQL via Supabase                             |
| Auth     | Supabase Auth (email + Google OAuth)                |
| Storage  | Supabase Storage                                    |
| AI/ML    | PyTorch, CLIP (openai/clip-vit-base-patch32), MTCNN |

---

## 2. Prerequisites

Install these tools before starting:

| Tool    | Minimum Version | Download                  |
|---------|----------------|---------------------------|
| Node.js | 18.x           | https://nodejs.org        |
| Python  | 3.9            | https://python.org        |
| Git     | Any            | https://git-scm.com       |

Verify your installations:

```bash
node --version    # v18.x.x or higher
npm --version     # 9.x.x or higher
python --version  # 3.9.x or higher
git --version     # any version
```

You also need a free Supabase account: https://supabase.com

---

## 3. Clone the Repository

```bash
git clone https://github.com/yourusername/deepvision.git
cd deepvision
```

---

## 4. Supabase Project Setup

### 4.1 Create a New Project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Fill in:
   - Name: deepvision
   - Database Password: choose a strong password - save it, you will need it
   - Region: pick the closest to you
4. Click **Create new project** and wait ~2 minutes for provisioning

### 4.2 Collect Your Credentials

Once the project is ready, go to **Project Settings -> API**. You need these four values:

| Variable                  | Where to find it                                              |
|---------------------------|---------------------------------------------------------------|
| SUPABASE_URL              | Project URL (e.g. https://xxxx.supabase.co)                  |
| SUPABASE_ANON_KEY         | anon public key                                               |
| SUPABASE_SERVICE_ROLE_KEY | service_role key - keep this secret, never put in frontend    |
| SUPABASE_JWT_SECRET       | Project Settings -> API -> JWT Settings -> JWT Secret         |

---

## 5. Database Setup - Run the SQL Script

This is the most critical step. Run the complete SQL script to create all tables, triggers, RLS policies, and seed data.

### 5.1 Open the SQL Editor

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**

### 5.2 Run the Script

Copy the entire contents of **database/complete_setup.sql** (included in this repo), paste it into the SQL editor, and click **Run**.

The script creates these tables:

| Table                | Purpose                                                        |
|----------------------|----------------------------------------------------------------|
| profiles             | User profiles linked to Supabase Auth                         |
| detections           | All detection results (verdict, confidence, file info)        |
| detection_analytics  | Detailed per-detection analytics (faces, artifacts)           |
| user_statistics      | Aggregated stats per user - auto-updated by triggers          |
| user_settings        | User preferences (theme, notifications, timezone)             |
| feedback             | User feedback submissions                                     |
| notifications        | In-app notifications                                          |
| ai_models            | AI model registry for admin management                        |

It also creates:
- Row Level Security (RLS) policies on every table
- Indexes for performance
- handle_new_user trigger - auto-creates a profile when a user signs up
- update_user_statistics trigger - keeps stats in sync after every detection
- 4 default AI model entries visible in the admin Model Management panel

---

## 6. Supabase Storage Setup

### 6.1 Create the Storage Bucket

1. In Supabase, go to **Storage** in the left sidebar
2. Click **New bucket**
3. Set:
   - Name: detection-media (must match exactly)
   - Public bucket: YES (check the box)
4. Click **Create bucket**

### 6.2 Set Storage Policies

In the Supabase **SQL Editor**, run:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'detection-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'detection-media');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'detection-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 7. Supabase Auth Setup

### 7.1 Enable Email Auth

1. Go to **Authentication -> Providers**
2. Make sure **Email** is enabled
3. For local development, you can disable **Confirm email** to skip email verification

### 7.2 Set Site URL

1. Go to **Authentication -> URL Configuration**
2. Set **Site URL** to http://localhost:5173
3. Add http://localhost:5173/** to **Redirect URLs**

### 7.3 Enable Google OAuth (Optional)

1. Go to https://console.cloud.google.com and create a project
2. Go to **APIs & Services -> Credentials -> Create Credentials -> OAuth 2.0 Client IDs**
3. Set **Authorized redirect URIs** to:
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
4. Copy the **Client ID** and **Client Secret**
5. In Supabase -> **Authentication -> Providers -> Google**, enable it and paste your credentials

---

## 8. Backend Setup

### 8.1 Create a Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate on Windows:
venv\Scripts\activate

# Activate on macOS/Linux:
source venv/bin/activate
```

You should see (venv) in your terminal prompt.

### 8.2 Install Dependencies

```bash
pip install -r requirements.txt
```

NOTE - PyTorch: The requirements file installs the CPU version. For GPU inference (NVIDIA),
install the CUDA build from https://pytorch.org/get-started/locally/ before running pip install.

NOTE - Windows: If you get a python-magic error, run:
```bash
pip install python-magic-bin
```

### 8.3 Configure Backend Environment

```bash
cp .env.example .env
```

Open backend/.env and fill in your values:

```
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
SUPABASE_STORAGE_BUCKET=detection-media
USE_SUPABASE_STORAGE=true
DATABASE_URL=postgresql://postgres:YOUR-DB-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres
dB_password=YOUR-DB-PASSWORD
FRONTEND_URL=http://localhost:5173
SIGHTENGINE_API_USER=
SIGHTENGINE_API_SECRET=
```

Where to find DATABASE_URL:
Supabase -> Project Settings -> Database -> Connection string -> URI
Replace [YOUR-PASSWORD] with your database password.

### 8.4 Verify the Backend Starts

```bash
python main.py
```

Expected output:
  INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
  INFO:     Started reloader process

Visit http://localhost:8000 - you should see:
  {"status": "ok", "app": "DeepVision API", "version": "1.0.0"}

---

## 9. Frontend Setup

### 9.1 Install Dependencies

```bash
cd frontend
npm install
```

### 9.2 Configure Frontend Environment

```bash
cp .env.example .env
```

Open frontend/.env and fill in:

```
VITE_API_URL=http://localhost:8000
VITE_ENABLE_MOCKS=false
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_ADMIN_EMAIL=admin@yourdomain.com
```

VITE_ADMIN_EMAIL is the email address that will have admin access.
Set it to the email you will use to sign up as admin.

---

## 10. Running the Application

You need **two terminals** running simultaneously.

### Terminal 1 - Backend

```bash
cd backend

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Open your browser:

| URL                          | What it is                      |
|------------------------------|---------------------------------|
| http://localhost:5173        | Frontend application            |
| http://localhost:8000        | Backend API                     |
| http://localhost:8000/docs   | Swagger UI (interactive docs)   |
| http://localhost:8000/redoc  | ReDoc API docs                  |

---

## 11. Setting Up the Admin Account

### Step 1 - Sign Up

Go to http://localhost:5173 and sign up with the email you set as VITE_ADMIN_EMAIL.

### Step 2 - Promote to Admin

In Supabase -> SQL Editor, run:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

### Step 3 - Sign Back In

Sign out and sign back in. You will now see the Admin Dashboard at http://localhost:5173/admin-dashboard.

---

## 12. Environment Variables Reference

### Backend (backend/.env)

| Variable                  | Required | Description                                      |
|---------------------------|----------|--------------------------------------------------|
| SUPABASE_URL              | YES      | Your Supabase project URL                        |
| SUPABASE_ANON_KEY         | YES      | Supabase anonymous/public key                    |
| SUPABASE_SERVICE_ROLE_KEY | YES      | Supabase service role key (full DB access)       |
| SUPABASE_JWT_SECRET       | YES      | JWT secret for token verification                |
| SUPABASE_STORAGE_BUCKET   | YES      | Storage bucket name (detection-media)            |
| USE_SUPABASE_STORAGE      | YES      | Set to true                                      |
| DATABASE_URL              | YES      | PostgreSQL connection string                     |
| dB_password               | YES      | Database password                                |
| FRONTEND_URL              | YES      | Frontend URL for CORS (http://localhost:5173)    |
| SIGHTENGINE_API_USER      | NO       | Optional: Sightengine API user                   |
| SIGHTENGINE_API_SECRET    | NO       | Optional: Sightengine API secret                 |
| MODEL_PATH                | NO       | Path to custom AI model file                     |

### Frontend (frontend/.env)

| Variable              | Required | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| VITE_API_URL          | YES      | Backend API URL (http://localhost:8000)          |
| VITE_SUPABASE_URL     | YES      | Your Supabase project URL                        |
| VITE_SUPABASE_ANON_KEY| YES      | Supabase anonymous/public key                    |
| VITE_ADMIN_EMAIL      | YES      | Email address that gets admin access             |
| VITE_ENABLE_MOCKS     | NO       | Set to false for real API calls                  |

---

## 13. Project Structure

```
deepvision/
|-- frontend/                        React 19 + Vite frontend
|   |-- src/
|   |   |-- components/
|   |   |   |-- admin/               Admin dashboard components
|   |   |   |   |-- EnhancedDashboard.jsx
|   |   |   |   |-- UserManagement.jsx
|   |   |   |   |-- ModelManagement.jsx
|   |   |   |   |-- FeedbackEnhanced.jsx
|   |   |   |   +-- Sidebar.jsx
|   |   |   |-- user/                User dashboard components
|   |   |   |   |-- Dashboard.jsx
|   |   |   |   |-- UploadMedia.jsx
|   |   |   |   |-- DetectionResult.jsx
|   |   |   |   |-- DetectionHistory.jsx
|   |   |   |   |-- Settings.jsx
|   |   |   |   +-- Sidebar.jsx
|   |   |   |-- common/              Shared components
|   |   |   |   |-- Navbar.jsx
|   |   |   |   |-- ErrorBoundary.jsx
|   |   |   |   |-- LoadingSpinner.jsx
|   |   |   |   +-- OfflineDetector.jsx
|   |   |   +-- ui/                  Generic UI components
|   |   |-- pages/                   Page-level components
|   |   |-- context/
|   |   |   |-- AuthContext.jsx      Auth state + Supabase auth methods
|   |   |   +-- ThemeContext.jsx     Dark/light theme
|   |   |-- hooks/                   Custom React hooks
|   |   |-- services/                API service layer (axios calls)
|   |   |-- utils/                   Utility functions
|   |   +-- lib/
|   |       +-- supabase.js          Supabase client
|   |-- .env                         Frontend environment variables
|   +-- package.json
|
|-- backend/                         FastAPI Python backend
|   |-- app/
|   |   |-- api/v1/
|   |   |   |-- detection.py         POST /analyze, GET /history, etc.
|   |   |   |-- user.py              Profile, settings, analytics, feedback
|   |   |   +-- admin.py             Admin-only endpoints
|   |   |-- ai/
|   |   |   |-- detector.py          Main detection engine orchestrator
|   |   |   |-- improved_hybrid_detector.py  CLIP + face-swap + artifact
|   |   |   +-- validators.py        File format/size/quality validation
|   |   |-- core/
|   |   |   |-- config.py            Settings via pydantic-settings
|   |   |   |-- dependencies.py      JWT auth dependency
|   |   |   |-- exceptions.py        Custom exception handlers
|   |   |   +-- supabase_client.py   Supabase client singleton
|   |   |-- models/
|   |   |   +-- schemas.py           All Pydantic request/response models
|   |   +-- services/
|   |       +-- detection_service.py Detection business logic
|   |-- main.py                      FastAPI app entry point
|   |-- requirements.txt
|   +-- .env                         Backend environment variables
|
+-- database/
    +-- complete_setup.sql           Complete database setup script (run in Supabase)
```

---

## 14. API Documentation

Once the backend is running, the full interactive API docs are at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint                          | Auth  | Description                    |
|--------|-----------------------------------|-------|--------------------------------|
| GET    | /                                 | None  | Health check                   |
| POST   | /api/v1/detection/analyze         | User  | Upload and analyze media       |
| GET    | /api/v1/detection/history         | User  | Paginated detection history    |
| GET    | /api/v1/detection/{id}            | User  | Single detection result        |
| DELETE | /api/v1/detection/{id}            | User  | Delete a detection             |
| GET    | /api/v1/user/me                   | User  | Get current user profile       |
| PUT    | /api/v1/user/me                   | User  | Update user profile            |
| GET    | /api/v1/user/me/stats             | User  | User statistics                |
| GET    | /api/v1/user/analytics/overview   | User  | Analytics overview             |
| GET    | /api/v1/user/analytics/chart      | User  | Chart data (last N days)       |
| GET    | /api/v1/user/settings             | User  | Get user settings              |
| PUT    | /api/v1/user/settings             | User  | Update user settings           |
| POST   | /api/v1/user/feedback             | User  | Submit feedback                |
| GET    | /api/v1/admin/stats               | Admin | Platform-wide stats            |
| GET    | /api/v1/admin/users               | Admin | List all users                 |
| PUT    | /api/v1/admin/users/{id}          | Admin | Update user                    |
| DELETE | /api/v1/admin/users/{id}          | Admin | Delete user                    |
| GET    | /api/v1/admin/feedback            | Admin | List all feedback              |
| GET    | /api/v1/admin/models              | Admin | List AI models                 |
| GET    | /api/v1/admin/ai-status           | Admin | AI engine status               |

All protected endpoints require Authorization: Bearer <token> - handled automatically by the frontend.

---

## 15. Troubleshooting

### Backend won't start - missing env variable
Make sure backend/.env exists and has valid Supabase credentials.
The app crashes on startup if SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY are missing.

### python-magic error on Windows
```bash
pip install python-magic-bin
```

### PyTorch install is very slow or fails
Install PyTorch separately first using the official installer at https://pytorch.org/get-started/locally/,
then run pip install -r requirements.txt.

### Frontend shows Network Error or API calls fail
- Make sure the backend is running on port 8000
- Check VITE_API_URL=http://localhost:8000 in frontend/.env
- Check the browser console for CORS errors
- Make sure FRONTEND_URL=http://localhost:5173 is in backend/.env

### 401 Unauthorized errors from the API
Verify SUPABASE_JWT_SECRET in backend/.env matches the JWT secret in:
Supabase -> Project Settings -> API -> JWT Settings

### User profile not found after sign up
The handle_new_user trigger auto-creates a profile row. If it does not work, manually insert:
```sql
INSERT INTO profiles (id, email, full_name, role)
VALUES ('user-uuid-here', 'user@email.com', 'Full Name', 'user');
```

### Admin dashboard not accessible
Make sure the profiles row for your admin user has role = admin:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### Detection fails with Unsupported file type
Supported formats: JPEG, PNG, WebP (images) and MP4, WebM, MOV (videos). Max file size: 50 MB.

### Storage upload fails
- Make sure the detection-media bucket exists in Supabase Storage
- Verify the storage policies are created (see Section 6)
- Ensure USE_SUPABASE_STORAGE=true in backend/.env

### npm install fails
```bash
cd frontend
npm cache clean --force
# Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

If you run into issues not covered here, check the interactive API docs at http://localhost:8000/docs
or open an issue on GitHub.
