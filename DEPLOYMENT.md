# Deployment Guide for Vercel

## Prerequisites

1. A Vercel account (free tier works)
2. Your Supabase project set up with the database migration run
3. Git repository with your code

## Step 1: Prepare Your Repository

1. Push your code to GitHub, GitLab, or Bitbucket
2. Make sure these files are in your repository:
   - `vercel.json` (already present)
   - `.env.example` (already present)
   - All application code

## Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Vercel will auto-detect it's a Next.js project

## Step 3: Configure Environment Variables

In the Vercel project settings, add these environment variables:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
CRON_SECRET=generate-a-random-string-here
```

### How to Get Supabase Keys:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY`

### Generate CRON_SECRET:

Run this command or use any random string generator:
```bash
openssl rand -base64 32
```

## Step 4: Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy your application
3. Wait for deployment to complete (2-5 minutes)
4. You'll get a URL like: `https://your-app-name.vercel.app`

## Step 5: Update Environment Variable

1. Go back to Vercel project settings → Environment Variables
2. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
3. Redeploy (Vercel → Deployments → Click "..." → Redeploy)

## Step 6: Configure Supabase Allowed URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to:
   - **Site URL**: `https://your-app-name.vercel.app`
   - **Redirect URLs**: Add `https://your-app-name.vercel.app/**`

## Step 7: Test Your Deployment

1. Visit your Vercel URL
2. You should be redirected to the login page
3. Log in with your credentials
4. Test all features:
   - Dashboard loads
   - Companies page works
   - Sales calls can be logged
   - Tasks can be created

## Cron Jobs (Automatic)

The `vercel.json` file already configures a cron job:
- Runs every 30 minutes
- Checks for pending reminders
- Sends in-app notifications

No additional setup needed!

## Custom Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Update Supabase allowed URLs

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Make sure all environment variables are set
- Verify Node.js version (should be 18+)

### Authentication Not Working
- Verify Supabase URL configuration
- Check that redirect URLs are properly set in Supabase
- Make sure `NEXT_PUBLIC_APP_URL` matches your actual URL

### Database Connection Issues
- Verify Supabase keys are correct
- Check that the database migration was run
- Ensure RLS policies are enabled

### Cron Job Not Running
- Cron jobs require a paid Vercel plan (Hobby or Pro)
- For free tier, reminders will only trigger when users access the app
- Alternative: Use Supabase Edge Functions with pg_cron

## Monitoring

- View deployment logs: Vercel Dashboard → Your Project → Deployments
- View runtime logs: Vercel Dashboard → Your Project → Logs
- View function invocations: Vercel Dashboard → Your Project → Analytics

## Updating Your App

1. Push changes to your Git repository
2. Vercel automatically deploys the new version
3. No manual intervention needed!

## Environment-Specific Deploys

- **Production**: Deploys from `main` branch
- **Preview**: Deploys from other branches (for testing)

You can configure different environment variables for each environment in Vercel settings.

---

**Need Help?** Check Vercel documentation: https://vercel.com/docs
