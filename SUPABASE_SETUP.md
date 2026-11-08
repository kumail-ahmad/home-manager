# Floral Home Manager — Backend & Database Setup Guide

Floral Home Manager now has full backend support integrated with **Supabase (PostgreSQL + Auth)**.

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create a Free Supabase Project
1. Visit [https://supabase.com](https://supabase.com) and create or log in to your account.
2. Click **New Project**, choose a project name (e.g. `floral-manager`), and set a secure database password.
3. Select your preferred region (e.g., *South Asia (Mumbai)* or nearest).

### Step 2: Run the Database Schema Migration
1. In your Supabase project dashboard, open the **SQL Editor** from the left navigation.
2. Open the file `supabase/schema.sql` from this repository.
3. Copy its entire contents, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates all 11 required tables (`rooms`, `residents`, `rent_charges`, `rent_payments`, `electricity_bills`, `electricity_allocations`, `electricity_payments`, `meter_readings`, `activity_logs`, `admins`, `room_assignments`).
   - It sets up indexes, Row-Level-Security (RLS), and seeds demo rooms and residents.

### Step 3: Configure Environment Variables
1. In your Supabase dashboard, go to **Project Settings** (gear icon) → **API**.
2. Find:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys** → `anon` / `public` key
3. Update `.env.local` inside `floral-manager/`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Restart the development server:
   ```bash
   npm run dev
   ```

---

## 🔐 Administrator Authentication
- Go to `/login` to sign in.
- Click **Create Account** to register your primary admin user.
- Alternatively, you can use **Continue to Dashboard** to use the local demo store.

---

## 📊 Features & Database Tables

| Feature | Tables Used | Description |
|---|---|---|
| **Rooms** | `rooms`, `room_assignments` | Room numbers, capacities, occupancy |
| **Residents** | `residents` | Profile, guardian contacts, college/course, rent amount |
| **Rent Tracking** | `rent_charges`, `rent_payments` | Monthly charge generation, payment tracking, balance calculation |
| **Electricity** | `electricity_bills`, `electricity_allocations`, `electricity_payments` | Shared/individual bills, member allocation, payment recording |
| **Meter Readings** | `meter_readings` | Room-wise electric meter units over time |
| **Audit Log** | `activity_logs` | Operations log for all actions |
