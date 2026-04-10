# Fix Last Active Time Issue - Implementation Guide

## Problem
The `updated_at` column in the profiles table shows old dates (4 days ago) even when users sign in/out recently. The Supabase authentication system updates its own `last_sign_in_at` field, but the profiles table `updated_at` field remains unchanged.

## Solution Overview
1. **Database Triggers** - Automatically update `updated_at` when users sign in
2. **Backend API** - Endpoint to manually update last active time
3. **Frontend Hook** - Automatically track user activity and update timestamps

## Implementation Steps

### Step 1: Run Database Migration

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `database/migrations/002_fix_profile_updated_at.sql`
3. Click **Run** to execute the migration

This will:
- ✅ Create triggers to auto-update `updated_at` on profile changes
- ✅ Create trigger to update `updated_at` when users sign in
- ✅ Add helper functions for manual updates

### Step 2: Backend Changes (Already Done)

The following changes have been made to your backend:

**✅ Added new API endpoint in `backend/app/api/v1/user.py`:**
```
POST /api/v1/user/update-last-active
```

**✅ Updated admin API in `backend/app/api/v1/admin.py`:**
- Now uses `updated_at` field from profiles table for "Last Active" display
- Falls back to last detection date if `updated_at` is not available

### Step 3: Frontend Changes (Already Done)

**✅ Created `frontend/src/hooks/useLastActive.js`:**
- Automatically updates last active time when user interacts with the app
- Updates on page load, user activity, and tab visibility changes
- Throttled to update maximum once every 5 minutes

**✅ Updated `frontend/src/App.jsx`:**
- Integrated the `useLastActive` hook to track user activity

## How It Works

### Database Level
1. **Sign In Trigger**: When a user signs in, Supabase updates `auth.users.last_sign_in_at`
2. **Profile Update Trigger**: Our trigger detects this change and updates `profiles.updated_at`
3. **Manual Updates**: The backend API can also update `updated_at` manually

### Application Level
1. **Activity Tracking**: Frontend hook monitors user activity (clicks, scrolls, etc.)
2. **API Calls**: Periodically calls the backend to update `updated_at`
3. **Admin Dashboard**: Shows the updated `updated_at` timestamp as "Last Active"

## Testing

### Test Database Triggers
1. Sign in/out of your application
2. Check the profiles table in Supabase - `updated_at` should update
3. Check admin dashboard - "Last Active" should show recent time

### Test Frontend Hook
1. Use the application (click, scroll, navigate)
2. Check browser network tab - should see calls to `/api/v1/user/update-last-active`
3. Check admin dashboard - "Last Active" should update within 5 minutes

## Verification Queries

Run these in Supabase SQL Editor to verify:

```sql
-- Check if triggers were created
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'profiles';

-- Check current profile timestamps
SELECT id, email, created_at, updated_at 
FROM public.profiles 
ORDER BY updated_at DESC 
LIMIT 5;

-- Check auth.users last_sign_in_at vs profiles updated_at
SELECT 
    p.email,
    u.last_sign_in_at as auth_last_signin,
    p.updated_at as profile_updated_at
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
ORDER BY u.last_sign_in_at DESC
LIMIT 5;
```

## Expected Results

After implementation:
- ✅ **Profiles Table**: `updated_at` updates when users sign in
- ✅ **Admin Dashboard**: Shows recent "Last Active" times
- ✅ **Real-time Updates**: Activity tracking updates timestamps automatically
- ✅ **Accurate Data**: No more "4 days ago" for recently active users

## Troubleshooting

### If timestamps still don't update:
1. Check if the database migration ran successfully
2. Verify triggers exist in Supabase
3. Check browser console for API errors
4. Ensure backend API endpoint is working

### If admin dashboard still shows old data:
1. Refresh the admin dashboard
2. Check if the admin API is using the updated query
3. Verify the profiles table has recent `updated_at` values

## Files Modified/Created

### Database
- ✅ `database/migrations/002_fix_profile_updated_at.sql` (NEW)

### Backend
- ✅ `backend/app/api/v1/user.py` (UPDATED - added update-last-active endpoint)
- ✅ `backend/app/api/v1/admin.py` (UPDATED - fixed last_active calculation)

### Frontend
- ✅ `frontend/src/hooks/useLastActive.js` (NEW)
- ✅ `frontend/src/App.jsx` (UPDATED - added activity tracking)

The solution is now complete and ready for testing!