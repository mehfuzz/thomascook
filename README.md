# Thomas Cook Sales Command Center

A comprehensive, production-ready sales management system built for Corporate Travel Sales General Managers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- A Supabase account (free tier works fine)
- Vercel account for deployment (optional)

### Setup Instructions

#### 1. Create Supabase Project

1. Go to [database.new](https://database.new) and create a new project
2. Wait for the project to initialize (takes ~2 minutes)
3. Note down your project URL and keys

#### 2. Run Database Migration

1. In your Supabase project dashboard, go to the SQL Editor
2. Click "New query"
3. Copy the entire content of `/supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL Editor and click "Run"
5. Wait for the migration to complete (creates all tables, indexes, RLS policies, and triggers)

#### 3. Configure Environment Variables

Update the `.env` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
CRON_SECRET=your-random-secret-string
```

You can find these values in your Supabase project:
- Go to Settings > API
- Copy the Project URL
- Copy the `anon` public key
- Copy the `service_role` secret key (keep this secret!)

#### 4. Install Dependencies

```bash
yarn install
```

#### 5. Run Development Server

```bash
yarn dev
```

The app will be available at http://localhost:3000

### First Time Setup

1. **Create Your First User**:
   - Go to http://localhost:3000/login
   - Click "Sign up" (if public signup is enabled) OR
   - Use Supabase Dashboard > Authentication > Add User manually

2. **Add User Profile**:
   After creating an auth user, you need to insert a corresponding row in the `users` table:
   
   ```sql
   -- Get your user ID from auth.users table first
   SELECT id, email FROM auth.users;
   
   -- Then insert into public.users table
   INSERT INTO public.users (id, email, full_name, phone_number, designation)
   VALUES (
     'paste-your-user-id-here',
     'youremail@thomascook.in',
     'Your Full Name',
     '+919876543210',
     'General Manager - Corporate Travel Sales'
   );
   ```

3. **Start Using the App**:
   - Log in with your credentials
   - You'll be redirected to the Dashboard
   - Start by adding companies from the Companies page
   - Log your sales calls, create appointments, and set targets

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime (for notifications)
- **Charts**: Recharts
- **Excel Export**: exceljs
- **PDF Export**: @react-pdf/renderer
- **Deployment**: Vercel

### Project Structure

```
/app
├── /app                    # Next.js app directory
│   ├── /api               # API routes
│   │   ├── /auth          # Auth endpoints
│   │   ├── /companies     # Company CRUD
│   │   ├── /sales-calls   # Sales calls CRUD
│   │   ├── /appointments  # Appointments CRUD
│   │   ├── /proposals     # Proposals CRUD
│   │   ├── /tasks         # Tasks CRUD
│   │   ├── /reminders     # Reminders CRUD
│   │   ├── /export        # MIS export (Excel/PDF)
│   │   └── /cron          # Scheduled jobs
│   ├── /dashboard         # Dashboard page
│   ├── /login             # Login page
│   ├── /sales-calls       # Sales calls page
│   ├── /appointments      # Appointments page
│   ├── /companies         # Companies CRM page
│   ├── /targets           # Targets & performance page
│   ├── /tasks             # Task manager page
│   ├── /proposals         # Proposals tracker page
│   ├── /reminders         # Notifications center page
│   ├── /export            # MIS export page
│   ├── /settings          # Settings page
│   ├── layout.js          # Root layout
│   └── globals.css        # Global styles
├── /components            # React components
│   └── /ui               # shadcn/ui components
├── /lib                   # Utility libraries
│   ├── /supabase         # Supabase clients
│   └── /utils            # Helper functions
├── /supabase
│   └── /migrations       # Database migrations
├── middleware.js          # Next.js middleware (auth)
├── package.json
└── README.md
```

## 📱 Features

### Core Features
- ✅ **Dashboard**: Complete sales overview with KPIs, targets, and upcoming activities
- ✅ **Sales Calls Logging**: Comprehensive call tracking with outcomes and revisit scheduling
- ✅ **Appointments Management**: Calendar and list views with automatic reminders
- ✅ **Company CRM**: Full pipeline management with health scores and drag-and-drop Kanban
- ✅ **Targets & Performance**: Daily, weekly, and monthly target tracking with progress visualization
- ✅ **Task Management**: Priority-based task tracking with company linking
- ✅ **Proposals Tracker**: Deal pipeline with win/loss analysis
- ✅ **Real-time Notifications**: In-app notification system with snooze functionality
- ✅ **MIS Reports**: Excel and PDF export with comprehensive data
- ✅ **Mobile Responsive**: Optimized for field use
- ✅ **Dark Mode**: Full dark mode support
- ✅ **Row Level Security**: Secure data isolation per user

### Smart Features
- 🧠 **Auto Health Score Calculation**: Companies get scored based on activity and outcomes
- 🔔 **Automatic Reminders**: Reminders created when revisit dates are set
- 📊 **Pipeline Visualization**: Funnel charts, progress bars, and trend analysis
- 🎯 **Smart Filters**: Pre-built filters for "Companies to Visit This Week", overdue tasks, etc.
- ⏱️ **Call Timer**: Built-in timer to track call duration
- 📝 **Scratch Notes**: Quick note-taking widget with company linking
- 🔄 **Duplicate Detection**: Warns about similar company names
- 📈 **Outcome Trends**: Visual indicators showing if relationships are warming or cooling

## 🔐 Security

- **Row Level Security (RLS)**: Every table has RLS policies ensuring users only access their own data
- **Authentication**: Supabase Auth with secure session management
- **Service Role Key**: Used only in server-side API routes, never exposed to client
- **Environment Variables**: All secrets stored securely
- **HTTPS**: Enforced in production
- **CORS**: Properly configured for API routes

## 📊 Database Schema

See `/supabase/migrations/001_initial_schema.sql` for the complete schema with:
- 12 tables with full relationships
- Indexes on all frequently queried columns
- Foreign key constraints
- Check constraints for data integrity
- Automatic timestamp updates via triggers
- Row Level Security policies on every table
- Realtime publication for notifications

## 🚀 Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables from `.env`
4. Deploy

### Cron Jobs

The reminder system requires a cron job. In `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "*/30 * * * *"
  }]
}
```

This runs every 30 minutes to check and dispatch reminders.

## 🎨 Design System

- **Primary Color**: Deep Navy Blue (#0F2B5B) - Thomas Cook brand color
- **Accent Color**: Gold (#F5A623) - For highlights and CTAs
- **Success**: Green (#22C55E)
- **Warning**: Amber (#F59E0B)
- **Danger**: Red (#EF4444)
- **Font**: Inter
- **Components**: shadcn/ui throughout
- **Responsive**: Mobile-first design

## 📞 Support

For issues or questions:
1. Check this README
2. Review the SQL migration file for schema details
3. Check Supabase Dashboard > Logs for errors
4. Verify RLS policies are applied correctly

## 🔄 Development Workflow

1. Make changes to code
2. Test locally at http://localhost:3000
3. Check Next.js console for any errors
4. If adding database columns, update the migration file
5. Test API routes using the app or browser devtools
6. Commit and push to trigger Vercel deployment

## 📝 License

Proprietary - Thomas Cook India

## 🙏 Credits

Built with Next.js, Supabase, shadcn/ui, and modern React patterns.
