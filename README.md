# 🚗 Car Wash Management System

A production-ready web application for tracking car wash entries, payments, workers, and generating Excel reports.

## Features

- ✅ **Real-time Dashboard**: Track today's car washes with live stats
- ✅ **Car Wash Tracking**: Record plate numbers, car types, wash types, payments, tips
- ✅ **Worker Management**: Add, edit, and manage workers
- ✅ **Worker Statistics**: Daily/Weekly/Monthly performance reports per worker
- ✅ **Payment Tracking**: Cash and Instapay with InstaPay tips tracking
- ✅ **Excel Reports**: Daily and monthly exports with detailed summaries
- ✅ **Password Protection**: Secure login system
- ✅ **Cairo Timezone**: All timestamps use Africa/Cairo timezone
- ✅ **Fixed Prices**: Inner (90 EGP), Outer (90 EGP), Full (170 EGP)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM
- **Styling**: Tailwind CSS
- **Excel Export**: ExcelJS
- **Validation**: Zod
- **Icons**: Lucide React

---

## 🚀 Deploy to Vercel (Recommended)

### Step 1: Get a Free PostgreSQL Database

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project
3. Copy the connection string (looks like `postgresql://...`)

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Go to Settings → Database → Connection string
4. Copy the URI (use "Transaction" mode)

### Step 2: Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add these environment variables:
   - `DATABASE_URL` = your PostgreSQL connection string
   - `ADMIN_PASSWORD` = your secure password for login
4. Deploy!

### Step 3: Initialize Database

After deployment, run the Prisma migration:
```bash
npx prisma migrate deploy
```

Or in Vercel, you can add a build command that runs migrations automatically.

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud)

### Setup

1. **Clone and install**
```bash
cd carwash-app
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```
Edit `.env` with your database URL and password:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/carwash"
ADMIN_PASSWORD="your-secure-password"
TZ="Africa/Cairo"
```

3. **Setup database**
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed  # Optional: adds sample workers
```

4. **Run development server**
```bash
npm run dev
```

5. **Open browser**
   - Go to http://localhost:3000
   - Login with your ADMIN_PASSWORD

---

## 📁 Project Structure

```
carwash-app/
├── middleware.ts         # Auth protection
├── prisma/
│   ├── schema.prisma     # Database schema (PostgreSQL)
│   └── seed.ts           # Initial data seeder
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   │   ├── auth/     # Login/logout endpoints
│   │   │   ├── workers/  # Worker CRUD
│   │   │   ├── wash-records/  # Wash record endpoints
│   │   │   ├── worker-stats/  # Worker statistics
│   │   │   └── export/   # Excel export
│   │   ├── login/        # Login page
│   │   ├── reports/      # Monthly reports
│   │   ├── worker-stats/ # Worker statistics page
│   │   ├── workers/      # Workers management
│   │   └── page.tsx      # Dashboard (home)
│   ├── components/       # React components
│   └── lib/              # Utilities
├── .env.example          # Environment template
└── package.json
```

---

## 📊 Pages

| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | Password authentication |
| Dashboard | `/` | Today's cars, stats, add/edit/finish |
| Reports | `/reports` | Monthly reports with Excel export |
| Worker Stats | `/worker-stats` | Daily/Weekly/Monthly worker performance |
| Workers | `/workers` | Manage workers (add/activate/deactivate) |

---

## 🔒 Security

- All routes are protected except `/login`
- Session stored in HTTP-only cookie (7 days)
- Password stored in environment variable (never in code)
- API routes return 401 if not authenticated

---

## 📈 Worker Stats Explained

| Metric | Description |
|--------|-------------|
| Revenue | Total amount paid for washes |
| Cash Tips | Tips paid in cash (worker keeps) |
| InstaPay Tips | Tips paid via InstaPay (give to worker) |
| Net Revenue | Revenue - InstaPay Tips (business keeps) |

---

## 🔧 Useful Commands

```bash
# Development
npm run dev           # Start dev server

# Database
npx prisma studio     # Open database GUI
npx prisma migrate dev # Create migration
npx prisma db push    # Push schema changes

# Production
npm run build         # Build for production
npm start             # Start production server
```

---

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `ADMIN_PASSWORD` | Login password | ✅ |
| `TZ` | Timezone (default: Africa/Cairo) | ❌ |

---

## License

MIT
