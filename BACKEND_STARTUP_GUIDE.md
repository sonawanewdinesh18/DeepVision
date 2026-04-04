# Backend Server Startup Guide

## Issue: API Timeout Errors

You're seeing timeout errors because the backend server is either:
1. Not running
2. Running on a different port
3. Not connected to Supabase properly

## Quick Fix Steps

### Step 1: Check Backend Environment Variables

Make sure your `backend/.env` file has the correct Supabase credentials:

```bash
cd backend
cat .env
```

You should see:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
JWT_SECRET=your-jwt-secret
```

If missing, copy from `.env.example` and fill in your values:
```bash
cp .env.example .env
# Then edit .env with your actual values
```

### Step 2: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or if using a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 4: Test Backend is Running

Open a new terminal and test:

```bash
curl http://localhost:8000/
```

Or open in browser: http://localhost:8000

You should see a response (not a timeout).

### Step 5: Test Admin Endpoints

Test if the admin endpoints work:

```bash
# This should return 401 Unauthorized (which is good - means server is working)
curl http://localhost:8000/api/v1/admin/stats
```

### Step 6: Check Frontend API Configuration

Make sure your frontend is pointing to the correct backend URL.

Check `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 7: Restart Frontend

```bash
cd frontend
npm run dev
```

## Common Issues and Solutions

### Issue 1: "Module not found" errors

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Issue 2: "Port 8000 already in use"

**Solution:**
```bash
# Find and kill the process using port 8000
# On Linux/Mac:
lsof -ti:8000 | xargs kill -9

# On Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use a different port:
uvicorn main:app --reload --host 0.0.0.0 --port 8001
# Then update frontend/.env: VITE_API_URL=http://localhost:8001
```

### Issue 3: Supabase connection errors

**Solution:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → SUPABASE_URL
   - anon/public key → SUPABASE_KEY
   - service_role key → SUPABASE_SERVICE_KEY
5. Update backend/.env with these values
6. Restart backend server

### Issue 4: CORS errors

**Solution:**
The backend is already configured for CORS. Make sure:
1. Backend is running on port 8000
2. Frontend is running on port 5173
3. Both are using http://localhost (not 127.0.0.1)

## Verify Everything is Working

### 1. Backend Health Check

```bash
curl http://localhost:8000/
```

Expected: Some response (not timeout)

### 2. Check Admin Stats (requires login)

1. Log in to your app as admin
2. Open browser DevTools (F12)
3. Go to Network tab
4. Navigate to Admin Dashboard
5. Look for requests to `/api/v1/admin/stats`
6. Should see 200 OK (or 401 if not logged in)

### 3. Check User Management

1. Log in as admin
2. Go to Admin Dashboard → User Management
3. Should see your users listed
4. No timeout errors in console

## Running Both Servers Together

### Terminal 1 - Backend:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Terminal 3 - Database Migration (if needed):
```bash
# Connect to Supabase and run the migration SQL
# Or use Supabase Dashboard → SQL Editor
```

## Expected Console Output

### Backend (Terminal 1):
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Frontend (Terminal 2):
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Still Having Issues?

### Check Backend Logs

Look at the terminal where backend is running. You should see:
- Incoming requests
- Any errors
- Database queries

### Check Frontend Console

Open browser DevTools (F12) → Console tab:
- Should NOT see timeout errors
- Should see successful API calls
- Check Network tab for failed requests

### Verify Database Connection

Run this in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM profiles;
```

Should return the number of users.

### Test API Directly

Use Postman or curl to test endpoints:

```bash
# Get users (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/admin/users
```

## Quick Start Script

Create a file `start.sh` in your project root:

```bash
#!/bin/bash

# Start backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend running on: http://localhost:8000"
echo "Frontend running on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

Make it executable and run:
```bash
chmod +x start.sh
./start.sh
```

## Success Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend server running on port 5173
- [ ] No timeout errors in browser console
- [ ] Can access http://localhost:8000 (backend)
- [ ] Can access http://localhost:5173 (frontend)
- [ ] Supabase credentials in backend/.env
- [ ] Database migration completed
- [ ] Can log in as admin
- [ ] User Management page loads without errors
- [ ] Can see users in the table
- [ ] Statistics cards show correct numbers

Once all checkboxes are checked, your User Management system is fully operational! ✅
