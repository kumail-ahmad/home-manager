-- ==============================================================================
-- Floral Home Manager — Complete Supabase PostgreSQL Schema
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if re-running
drop table if exists public.activity_logs cascade;
drop table if exists public.meter_readings cascade;
drop table if exists public.electricity_payments cascade;
drop table if exists public.electricity_allocations cascade;
drop table if exists public.electricity_bills cascade;
drop table if exists public.rent_payments cascade;
drop table if exists public.rent_charges cascade;
drop table if exists public.room_assignments cascade;
drop table if exists public.residents cascade;
drop table if exists public.rooms cascade;
drop table if exists public.admins cascade;

-- 1. Admins & Access Control Table
create table public.admins (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  full_name text default '',
  role text not null default 'admin', -- 'super_admin' | 'admin'
  status text not null default 'pending', -- 'approved' | 'pending' | 'rejected'
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 2. Rooms Table
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  room_number text not null unique,
  capacity integer not null default 3,
  notes text default '',
  created_at timestamptz default timezone('utc'::text, now())
);

-- 3. Residents Table
create table public.residents (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null unique,
  guardian_name text default '',
  guardian_phone text default '',
  room_number text,
  college text default '',
  course text default '',
  monthly_rent integer not null, -- stored in paise (e.g. 800000 = ₹8,000)
  joining_date date not null default current_date,
  status text not null default 'active', -- 'active' | 'inactive'
  notes text default '',
  created_at timestamptz default timezone('utc'::text, now())
);

-- 4. Room Assignments Table (for explicit relation if needed)
create table public.room_assignments (
  resident_id uuid references public.residents(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  assigned_at timestamptz default timezone('utc'::text, now()),
  primary key (resident_id, room_id)
);

-- 5. Rent Charges Table
create table public.rent_charges (
  id uuid default uuid_generate_v4() primary key,
  resident_id uuid references public.residents(id) on delete cascade,
  month text not null, -- format 'YYYY-MM'
  amount_paise integer not null, -- stored in paise
  created_at timestamptz default timezone('utc'::text, now()),
  unique (resident_id, month)
);

-- 6. Rent Payments Table
create table public.rent_payments (
  id uuid default uuid_generate_v4() primary key,
  resident_id uuid references public.residents(id) on delete cascade,
  charge_id uuid references public.rent_charges(id) on delete set null,
  billing_period text not null, -- format 'YYYY-MM'
  amount_paise integer not null,
  payment_date timestamptz not null default timezone('utc'::text, now()),
  method text not null default 'upi', -- 'cash', 'upi', 'bank_transfer', 'cheque', 'other'
  reference text default '',
  notes text default '',
  voided_at timestamptz,
  void_reason text
);

-- 7. Electricity Bills Table
create table public.electricity_bills (
  id uuid default uuid_generate_v4() primary key,
  period_label text not null,
  period_start date not null,
  period_end date not null,
  total_amount_paise integer not null,
  allocation_method text not null default 'shared', -- 'individual' | 'shared'
  resident_ids text[] default '{}',
  due_date date,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 8. Electricity Allocations Table
create table public.electricity_allocations (
  id uuid default uuid_generate_v4() primary key,
  bill_id uuid references public.electricity_bills(id) on delete cascade,
  resident_id uuid references public.residents(id) on delete cascade,
  share_paise integer not null,
  created_at timestamptz default timezone('utc'::text, now())
);

-- 9. Electricity Payments Table
create table public.electricity_payments (
  id uuid default uuid_generate_v4() primary key,
  allocation_id uuid references public.electricity_allocations(id) on delete cascade,
  resident_id uuid references public.residents(id) on delete cascade,
  amount_paise integer not null,
  payment_date timestamptz not null default timezone('utc'::text, now()),
  method text not null default 'upi',
  reference text default '',
  notes text default '',
  voided_at timestamptz,
  void_reason text
);

-- 10. Meter Readings Table
create table public.meter_readings (
  id uuid default uuid_generate_v4() primary key,
  room_number text not null,
  reading_date date not null default current_date,
  units numeric not null,
  notes text default '',
  created_at timestamptz default timezone('utc'::text, now())
);

-- 11. Activity Logs Table
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  timestamp timestamptz not null default timezone('utc'::text, now()),
  action text not null,
  entity_type text not null,
  entity_label text not null,
  details text default ''
);

-- Indexes for performance
create index if not exists idx_admins_email on public.admins(email);
create index if not exists idx_admins_status on public.admins(status);
create index if not exists idx_residents_status on public.residents(status);
create index if not exists idx_residents_room on public.residents(room_number);
create index if not exists idx_rent_charges_resident on public.rent_charges(resident_id);
create index if not exists idx_rent_charges_month on public.rent_charges(month);
create index if not exists idx_rent_payments_resident on public.rent_payments(resident_id);
create index if not exists idx_electricity_allocations_bill on public.electricity_allocations(bill_id);
create index if not exists idx_activity_logs_time on public.activity_logs(timestamp desc);

-- Enable Row Level Security (RLS)
alter table public.admins enable row level security;
alter table public.rooms enable row level security;
alter table public.residents enable row level security;
alter table public.room_assignments enable row level security;
alter table public.rent_charges enable row level security;
alter table public.rent_payments enable row level security;
alter table public.electricity_bills enable row level security;
alter table public.electricity_allocations enable row level security;
alter table public.electricity_payments enable row level security;
alter table public.meter_readings enable row level security;
alter table public.activity_logs enable row level security;

-- Policies: allow authenticated users and anon read/write (customizable for strict auth)
create policy "allow_authenticated_all_admins" on public.admins for all using (true) with check (true);
create policy "allow_authenticated_all_rooms" on public.rooms for all using (true) with check (true);
create policy "allow_authenticated_all_residents" on public.residents for all using (true) with check (true);
create policy "allow_authenticated_all_room_assignments" on public.room_assignments for all using (true) with check (true);
create policy "allow_authenticated_all_rent_charges" on public.rent_charges for all using (true) with check (true);
create policy "allow_authenticated_all_rent_payments" on public.rent_payments for all using (true) with check (true);
create policy "allow_authenticated_all_electricity_bills" on public.electricity_bills for all using (true) with check (true);
create policy "allow_authenticated_all_electricity_allocations" on public.electricity_allocations for all using (true) with check (true);
create policy "allow_authenticated_all_electricity_payments" on public.electricity_payments for all using (true) with check (true);
create policy "allow_authenticated_all_meter_readings" on public.meter_readings for all using (true) with check (true);
create policy "allow_authenticated_all_activity_logs" on public.activity_logs for all using (true) with check (true);

-- ==============================================================================
-- Initial Seed Data
-- ==============================================================================

-- Default Primary Admin (Approved Super Admin)
insert into public.admins (email, full_name, role, status, approved_by, approved_at) values
  ('admin@floralhome.com', 'Primary Administrator', 'super_admin', 'approved', 'system', timezone('utc'::text, now()))
on conflict (email) do nothing;

insert into public.rooms (room_number, capacity, notes) values
  ('101', 3, 'North wing'),
  ('102', 3, 'North wing'),
  ('201', 4, 'Garden-facing'),
  ('202', 4, 'Garden-facing'),
  ('301', 4, 'Quiet floor'),
  ('302', 4, 'Quiet floor'),
  ('401', 4, 'Available')
on conflict (room_number) do nothing;

insert into public.residents (full_name, phone, guardian_name, guardian_phone, college, course, room_number, monthly_rent, joining_date, status, notes) values
  ('Ananya Rao', '9876501001', 'Meera Rao', '9876502001', 'BMS College of Engineering', 'B.Tech CSE', '101', 780000, '2025-01-05', 'active', ''),
  ('Diya Nair', '9876501002', 'Suresh Nair', '9876502002', 'Mount Carmel College', 'B.Com', '101', 800000, '2025-02-05', 'active', ''),
  ('Ishita Menon', '9876501003', 'Kavita Menon', '9876502003', 'Christ University', 'BBA', '101', 820000, '2025-03-05', 'active', ''),
  ('Kavya Shah', '9876501004', 'Rakesh Shah', '9876502004', 'PES University', 'B.Arch', '102', 780000, '2025-04-05', 'active', ''),
  ('Megha Iyer', '9876501005', 'Latha Iyer', '9876502005', 'RV College of Engineering', 'B.Tech ECE', '102', 800000, '2025-05-05', 'active', 'Prefers UPI for payments.'),
  ('Nandini Das', '9876501006', 'Anil Das', '9876502006', 'St. Joseph''s University', 'BA Economics', '201', 820000, '2025-06-05', 'active', ''),
  ('Pooja Kulkarni', '9876501007', 'Sunita Kulkarni', '9876502007', 'Bangalore University', 'MCA', '201', 780000, '2025-07-05', 'active', ''),
  ('Riya Thomas', '9876501008', 'Mathew Thomas', '9876502008', 'Christ University', 'M.Sc Psychology', '202', 800000, '2025-08-05', 'active', ''),
  ('Saanvi Gupta', '9876501009', 'Nitin Gupta', '9876502009', 'Jain University', 'B.Des', '202', 820000, '2025-01-05', 'active', ''),
  ('Tanvi Bhat', '9876501010', 'Shobha Bhat', '9876502010', 'BMS College of Engineering', 'B.Tech IT', '301', 780000, '2025-02-05', 'active', ''),
  ('Vaishnavi Joshi', '9876501011', 'Amit Joshi', '9876502011', 'Mount Carmel College', 'B.Sc', '301', 800000, '2025-03-05', 'active', ''),
  ('Zoya Khan', '9876501012', 'Farah Khan', '9876502012', 'PES University', 'BCA', '302', 820000, '2025-04-05', 'active', ''),
  ('Aditi Sen', '9876501013', 'Madhuri Sen', '9876502013', 'Jain University', 'MBA', null, 780000, '2025-05-05', 'active', ''),
  ('Bhavana Shetty', '9876501014', 'Ramesh Shetty', '9876502014', 'Bangalore University', 'M.Com', null, 800000, '2025-06-05', 'active', '')
on conflict (phone) do nothing;

insert into public.activity_logs (action, entity_type, entity_label, details) values
  ('Initialized', 'System', 'Floral Home Manager', 'Database schema created with initial admin, room and resident records');
