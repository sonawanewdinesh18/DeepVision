# DeepVision

AI-powered deepfake detection platform. Upload an image or video and get a REAL / FAKE verdict with a confidence score.

---

## Quick Setup

### What you need
- Node.js 18+
- Python 3.9+
- A free [Supabase](https://supabase.com) account

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/yourusername/deepvision.git
cd deepvision
```

---

### Step 2 — Create a Supabase project

1. Go to https://supabase.com and create a new project
2. From **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` key
   - JWT Secret (under **JWT Settings**)
3. Go to **SQL Editor**, paste the contents of `database/complete_setup.sql`, and click **Run**
4. Go to **Storage**, create a bucket named `detection-media` and set it to **Public**
5. Go to **Authentication → URL Configuration**, set Site URL to `http://localhost:5173`

---

### Step 3 — Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_STORAGE_BUCKET=detection-media
USE_SUPABASE_STORAGE=true
DATABASE_URL=postgresql://postgres:YOUR-PASSWORD@db.your-project.supabase.co:5432/postgres
dB_password=YOUR-PASSWORD
FRONTEND_URL=http://localhost:5173
```

---

### Step 4 — Frontend

```bash
cd frontend

npm install

cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ADMIN_EMAIL=your-admin@email.com
```

> Set `VITE_ADMIN_EMAIL` to the email you will sign up with as admin.

---

### Step 5 — Run

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate   # Windows / source venv/bin/activate on macOS/Linux
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173

---

### Step 6 — Create admin account

1. Sign up at http://localhost:5173 using the email you set as `VITE_ADMIN_EMAIL`
2. In Supabase **SQL Editor**, run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
```

3. Sign out and sign back in — the Admin Dashboard will now be accessible

---

## URLs

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Frontend |
| http://localhost:8000 | Backend API |
| http://localhost:8000/docs | API docs (Swagger) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| AI/ML | PyTorch + CLIP + MTCNN + OpenCV |

---

## Troubleshooting

**`python-magic` error on Windows** — run `pip install python-magic-bin`

**API calls fail / CORS error** — make sure both servers are running and `FRONTEND_URL=http://localhost:5173` is set in `backend/.env`

**401 errors** — check that `SUPABASE_JWT_SECRET` in `backend/.env` matches the one in Supabase → Project Settings → API → JWT Settings

**Admin dashboard not showing** — run the SQL above to set `role = 'admin'` and sign back in

For the full detailed guide see [SETUP_GUIDE.md](SETUP_GUIDE.md).
