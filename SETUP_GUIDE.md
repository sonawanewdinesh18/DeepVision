# DeepVision Setup Guide

Complete step-by-step guide to set up DeepVision on your local machine.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup](#backend-setup)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/downloads/))
- **Git** ([Download](https://git-scm.com/downloads))
- **Code Editor** (VS Code recommended)

### Accounts Needed
- **Supabase Account** (Free tier available at [supabase.com](https://supabase.com))
- **Stripe Account** (Optional, for payments)

## Supabase Setup

### 1. Create a New Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: DeepVision
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait for setup to complete

### 2. Get Your API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 3. Set Up Database

1. Go to **SQL Editor** in Supabase
2. Run the following SQL files in order:

**Step 1: Complete Setup**
```sql
-- Copy and paste contents from: database/complete_setup.sql
```

**Step 2: Enable RLS**
```sql
-- Copy and paste contents from: database/migrations/001_enable_rls.sql
```

**Step 3: Pricing Plans**
```sql
-- Copy and paste contents from: database/migrations/002_pricing_plans.sql
```

**Step 4: Fix Profiles**
```sql
-- Copy and paste contents from: database/migrations/003_fix_profiles.sql
```

**Step 5: User Settings**
```sql
-- Copy and paste contents from: database/migrations/004_user_settings_notifications.sql
```

**Step 6: User Active Status**
```sql
-- Copy and paste contents from: database/migrations/005_add_user_active_status.sql
```

**Step 7: Auth Trigger**
```sql
-- Copy and paste contents from: database/triggers/auth_trigger.sql
```

### 4. Create Storage Bucket

1. Go to **Storage** in Supabase
2. Click "Create a new bucket"
3. Name it: `detection-media`
4. Make it **Public** (for user uploads)
5. Click "Create bucket"

### 5. Set Up Storage Policies

In SQL Editor, run:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'detection-media');

-- Allow users to read their own uploads
CREATE POLICY "Users can read own media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'detection-media');
```

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

```bash
cp .env.example .env
```

### 4. Configure Environment Variables

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_ENABLE_MOCKS=false
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_key  # Optional
VITE_ADMIN_EMAIL=admin@deepvision.com
```

Replace:
- `YOUR-PROJECT` with your Supabase project URL
- `your_anon_key_here` with your Supabase anon key

### 5. Verify Installation

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Virtual Environment

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create Environment File

```bash
cp .env.example .env
```

### 5. Configure Environment Variables

Edit `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_STORAGE_BUCKET=detection-media
USE_SUPABASE_STORAGE=true
SUPABASE_JWT_SECRET=your_jwt_secret_here

# Payment (optional)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# AI Model
MODEL_PATH=./models/deepvision_v1.pth

# Frontend
FRONTEND_URL=http://localhost:5173

# CORS
ALLOWED_ORIGINS=["http://localhost:5173"]
```

Replace with your actual Supabase credentials.

### 6. Verify Installation

```bash
uvicorn main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

## Running the Application

### Start Both Servers

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Create Your First User

1. Go to http://localhost:5173
2. Click "Sign Up"
3. Enter email and password
4. Check your email for verification link
5. Click the link to verify your account
6. Sign in with your credentials

### Create Admin User (Optional)

1. Go to Supabase → **SQL Editor**
2. Run:
```sql
-- Copy and paste contents from: database/seeds/admin_user.sql
-- Update the email to your email address
```

## Troubleshooting

### Frontend Issues

**Problem: `npm install` fails**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Problem: Port 5173 already in use**
```bash
# Kill the process using the port
# On macOS/Linux:
lsof -ti:5173 | xargs kill -9

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Problem: Supabase connection error**
- Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check if Supabase project is active
- Ensure you're using the correct project URL

### Backend Issues

**Problem: `pip install` fails**
```bash
# Upgrade pip
pip install --upgrade pip

# Install dependencies one by one
pip install fastapi uvicorn supabase python-dotenv
```

**Problem: Port 8000 already in use**
```bash
# Run on different port
uvicorn main:app --reload --port 8001

# Update frontend .env:
VITE_API_URL=http://localhost:8001
```

**Problem: Module not found errors**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall requirements
pip install -r requirements.txt
```

**Problem: Supabase authentication fails**
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check `SUPABASE_JWT_SECRET` matches your project
- Ensure RLS policies are set up correctly

### Database Issues

**Problem: Tables not created**
- Run all migration files in order
- Check SQL Editor for error messages
- Verify you have proper permissions

**Problem: RLS policies blocking access**
```sql
-- Temporarily disable RLS for testing (NOT for production!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

**Problem: Storage bucket not accessible**
- Verify bucket name matches `SUPABASE_STORAGE_BUCKET`
- Check storage policies are created
- Ensure bucket is set to public

### Common Errors

**CORS Error**
- Add your frontend URL to `ALLOWED_ORIGINS` in backend `.env`
- Restart backend server

**Authentication Error**
- Clear browser cookies and localStorage
- Sign out and sign in again
- Verify email is confirmed in Supabase Auth

**File Upload Error**
- Check storage bucket exists
- Verify storage policies
- Ensure `USE_SUPABASE_STORAGE=true` in backend `.env`

## Next Steps

1. **Customize Branding**: Update logo and colors in `frontend/src/assets/`
2. **Add AI Model**: Place your model file in `ai_models/` directory
3. **Configure Stripe**: Add Stripe keys for payment processing
4. **Set Up Email**: Configure email templates in Supabase
5. **Deploy**: Follow deployment guide for production setup

## Getting Help

- **Documentation**: Check `/docs` folder
- **API Docs**: http://localhost:8000/docs
- **Issues**: Open an issue on GitHub
- **Community**: Join our Discord/Slack

## Security Checklist

- [ ] Never commit `.env` files
- [ ] Use strong database passwords
- [ ] Enable RLS on all tables
- [ ] Keep service role key secret
- [ ] Use HTTPS in production
- [ ] Enable 2FA on Supabase account
- [ ] Regularly update dependencies
- [ ] Monitor Supabase logs

---

**Congratulations!** 🎉 You've successfully set up DeepVision. Happy coding!
