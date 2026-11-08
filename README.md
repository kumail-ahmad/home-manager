# Home Manager

A modern, full-stack hostel and rental property management platform built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

Designed for hostel owners, landlords, and property managers to effortlessly manage residents, room allocations, monthly rent billing, electricity sub-metering, invoices, payment history, and financial reporting across all devices with instant real-time database synchronization.

---

## 🌟 Key Features

- **Multi-Device Real-Time Sync**: Every change (resident added, rent payment recorded, meter reading logged) is immediately persisted to the Supabase PostgreSQL database and synchronized live across all active devices without page refreshes.
- **Role-Based Access & Security**: 
  - Direct authentication protected by credentials with approval safeguards.
  - Public visitors cannot view the dashboard, residents, or navigation until authenticated.
  - Multi-admin support with super-admin approval workflows for new administrative requests.
- **Residents & Occupancy Tracking**:
  - Full resident profiling (room assignment, contact, guardians, college/course details, monthly rent).
  - Real-time room occupancy and vacant bed monitoring.
  - One-click resident check-in, room reallocation, and safe deactivation/reactivation.
- **Rent Management & Invoicing**:
  - Automated batch generation of monthly rent charges for active residents.
  - Accurate tracking of paid amounts, outstanding balances, and advance payments.
  - Professional printable invoice generator with Indian Rupee formatting.
- **Electricity Sub-Metering & Splitting**:
  - Sub-meter reading logs per room with automatic consumption tracking.
  - Split utility bills either equally among residents or individually per room.
  - Dedicated electricity payment tracking with voiding capabilities and audit logs.
- **Audit & Financial Reports**:
  - Detailed payment ledger supporting UPI, Cash, Bank Transfer, and Cheque.
  - Export data to CSV at any time for accounting.
  - Immutable activity trail recording every administrative operation.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL 15+ with Realtime subscriptions)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/home-manager.git
cd home-manager
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory (refer to `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Credentials & Default Accounts

The platform includes two pre-configured administrative accounts with full control:

| Role | Username / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `kumail12` | Full Control (Residents, Billing, Settings, Admin Approvals) |
| **Admin** | `user` | `rameezahmad` | Full Control (Residents, Billing, Settings, Operations) |

> Additional accounts registered through the login interface are held in a **pending approval** queue until verified and approved by a primary administrator in the Settings page.

---

## 🗄️ Database Architecture

The application connects to a Supabase PostgreSQL instance with standard RFC 4122 UUID keys for data integrity:

- `admins`: Authorized administrator allowlist and approval statuses.
- `rooms`: Room inventory, bed capacities, and descriptions.
- `residents`: Resident records, contact information, monthly rent, and room assignments.
- `rent_charges`: Generated billing charges per resident and billing month.
- `rent_payments`: Recorded payments with payment method, reference, and void history.
- `electricity_bills`: Utility bills across specified date ranges.
- `electricity_allocations`: Resident-specific splits for each utility bill.
- `electricity_payments`: Payments toward allocated utility charges.
- `meter_readings`: Electric meter units logged by room and date.
- `activity_logs`: Timestamped system-wide activity audit trail.

---

## ☁️ Deployment & Hosting

### Deploy to Vercel (Recommended)

1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "Initial release: Home Manager"
   git push origin main
   ```
2. Import the repository into [Vercel](https://vercel.com/new).
3. In the project settings, add the Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build and host the application.

### Deploy to Netlify

1. Connect your GitHub repository in [Netlify](https://app.netlify.com/).
2. Set Build Command: `npm run build`.
3. Set Publish Directory: `.next`.
4. Configure the Supabase environment variables in Netlify Site Settings.

---

## 🧪 Build & Quality Verification

To verify production readiness before pushing:

```bash
# Type check and lint
npm run lint

# Production build
npm run build
```

---

## 📄 License

This project is licensed under the MIT License.
