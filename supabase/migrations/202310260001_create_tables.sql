-- Migration: 202310260001_create_tables.sql
-- Create admin allowlist table
create table public.admins (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Residents table
create table public.residents (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  phone text not null unique,
  guardian_name text,
  guardian_phone text,
  room_number integer,
  roommates text[],
  college text,
  course text,
  monthly_rent integer not null, -- stored in paise
  joining_date date not null,
  status text not null default 'active',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Rooms table
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  room_number integer not null unique,
  capacity integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Room assignments (many-to-many)
create table public.room_assignments (
  resident_id uuid references public.residents(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  primary key (resident_id, room_id)
);

-- Rent charges (monthly per resident)
create table public.rent_charges (
  id uuid default uuid_generate_v4() primary key,
  resident_id uuid references public.residents(id) on delete cascade,
  month date not null,
  amount integer not null, -- paise
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Rent payments
create table public.rent_payments (
  id uuid default uuid_generate_v4() primary key,
  resident_id uuid references public.residents(id) on delete cascade,
  charge_id uuid references public.rent_charges(id) on delete set null,
  amount integer not null,
  payment_date timestamp with time zone not null default timezone('utc'::text, now()),
  method text,
  reference text,
  notes text
);

-- Electricity bills (shared or individual)
create table public.electricity_bills (
  id uuid default uuid_generate_v4() primary key,
  period_start date not null,
  period_end date not null,
  total_amount integer not null,
  allocation_method text not null, -- 'individual' or 'shared'
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Electricity allocations (share per resident)
create table public.electricity_allocations (
  bill_id uuid references public.electricity_bills(id) on delete cascade,
  resident_id uuid references public.residents(id) on delete cascade,
  share integer not null, -- paise
  primary key (bill_id, resident_id)
);

-- Electricity payments
create table public.electricity_payments (
  id uuid default uuid_generate_v4() primary key,
  allocation_id uuid references public.electricity_allocations(bill_id) on delete cascade,
  amount integer not null,
  payment_date timestamp with time zone not null default timezone('utc'::text, now()),
  method text,
  reference text,
  notes text
);

-- Audit logs
create table public.audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_email text not null,
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security
alter table public.admins enable row level security;
alter table public.residents enable row level security;
alter table public.rooms enable row level security;
alter table public.room_assignments enable row level security;
alter table public.rent_charges enable row level security;
alter table public.rent_payments enable row level security;
alter table public.electricity_bills enable row level security;
alter table public.electricity_allocations enable row level security;
alter table public.electricity_payments enable row level security;
alter table public.audit_logs enable row level security;

-- RLS policies for admins only
create policy "admin_access" on public.admins for all using (auth.uid() is not null);
create policy "admin_access" on public.residents for all using (auth.uid() is not null);
create policy "admin_access" on public.rooms for all using (auth.uid() is not null);
create policy "admin_access" on public.room_assignments for all using (auth.uid() is not null);
create policy "admin_access" on public.rent_charges for all using (auth.uid() is not null);
create policy "admin_access" on public.rent_payments for all using (auth.uid() is not null);
create policy "admin_access" on public.electricity_bills for all using (auth.uid() is not null);
create policy "admin_access" on public.electricity_allocations for all using (auth.uid() is not null);
create policy "admin_access" on public.electricity_payments for all using (auth.uid() is not null);
create policy "admin_access" on public.audit_logs for all using (auth.uid() is not null);

-- Insert a default admin (replace with real email later)
insert into public.admins (email) values ('admin@floralhome.com');
