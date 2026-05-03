# DeepVision Database Setup Guide

## Choose Your Setup Path

### 🆕 Path 1: Fresh Start (No Payments) - RECOMMENDED

Use this if you're setting up the database for the first time or want a clean start without any payment functionality.

**File to use:** `database/migrations/001_complete_database_setup_no_payments.sql`

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `001_complete_database_setup_no_payments.sql`
3. **IMPORTANT:** Update the admin email on line ~140:
   ```sql
   admin_email TEXT := 'your-email@example.com';
   ```
4. Paste and run the script
5. You should see: "DeepVision database setup complete (without payments)!"

**What this creates:**
- ✅ User profiles (no subscription fields)
- ✅ Detections and analytics
- ✅ User statistics
- ✅ Feedback system
- ✅ AI models table
- ✅ All necessary triggers and policies
- ❌ NO payment tables
- ❌ NO subscription tables

---

### 🔄 Path 2: Migrate Existing Database

Use this if you already ran `001_complete_database_setup.sql` and want to remove payment functionality.

**File to use:** `database/migrations/003_remove_payment_subscription.sql`

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `003_remove_payment_subscription.sql`
3. Paste and run the script
4. You should see: "Payment and subscription functionality removed successfully!"

**What this does:**
- ✅ Drops payment_history table
- ✅ Drops subscriptions table
- ✅ Drops subscription_plans table
- ✅ Removes subscription_plan column from profiles
- ✅ Removes subscription_status column from profiles
- ✅ Updates trigger function to not use subscription fields
- ✅ Removes all related policies and indexes

---

## Verification

After running either script, verify your setup:

### Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected tables (Path 1 or after Path 2):**
- ai_models
- detection_analytics
- detections
- feedback
- profiles
- system_analytics
- user_statistics

**Should NOT see:**
- payment_history ❌
- subscriptions ❌
- subscription_plans ❌

### Check Profiles Structure
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public';
```

**Expected columns:**
- id (uuid)
- email (text)
- full_name (text)
- avatar_url (text)
- role (text)
- is_active (boolean)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

**Should NOT see:**
- subscription_plan ❌
- subscription_status ❌

### Test User Creation
```sql
-- This should work without errors
SELECT * FROM public.profiles LIMIT 1;
```

---

## Troubleshooting

### Error: "relation does not exist"
- **If using Path 1:** Make sure you haven't run any other migration scripts first
- **If using Path 2:** This is normal if tables don't exist - the script handles this gracefully

### Error: "column does not exist"
- The migration script checks for column existence before dropping
- If you see this error, the column was already removed - this is fine

### Error: "permission denied"
- Make sure you're running the script as a Supabase admin
- Check that you're in the correct project

### Need to Start Over?
If something went wrong and you want to completely reset:

```sql
-- ⚠️ WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run Path 1 script again.

---

## Next Steps

After database setup:

1. ✅ Update backend `.env` file with database credentials
2. ✅ Start backend server: `cd backend && python main.py`
3. ✅ Start frontend: `cd frontend && npm run dev`
4. ✅ Test user registration and login
5. ✅ Verify no payment/subscription UI appears

---

## Support

If you encounter issues:
1. Check the error message in Supabase SQL Editor
2. Verify you're using the correct script for your situation
3. Check that all previous migrations completed successfully
4. Review the `PAYMENT_REMOVAL_SUMMARY.md` for detailed changes
