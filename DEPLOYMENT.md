# YeahRent Deployment Guide

## Deployment Platforms

This guide covers deploying to Netlify (recommended for Next.js).

## Pre-Deployment Checklist

- [ ] Environment variables configured in platform
- [ ] Database schema created in Supabase
- [ ] Stripe account configured with webhook
- [ ] All tests passing
- [ ] Build succeeds locally with `npm run build`

## Netlify Deployment (Recommended)

### Option 1: Connect Git Repository (Automatic Deploys)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Deploy site"

3. **Set Environment Variables**
   - Go to Site Settings → Environment
   - Add all variables from `.env.local`:
     - NEXT_PUBLIC_SUPABASE_URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
     - STRIPE_SECRET_KEY
     - STRIPE_WEBHOOK_SECRET
     - NEXT_PUBLIC_API_URL (use your Netlify domain)

4. **Redeploy**
   - After adding env vars, redeploy the site
   - Any future git push will auto-deploy

### Option 2: Deploy from CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build locally**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Environment Variables

### Production Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

NEXT_PUBLIC_API_URL=https://your-netlify-domain.netlify.app
```

⚠️ **Never commit `.env.local` to git!** Use platform environment variables only.

## Stripe Webhook Configuration

1. **Get Netlify Domain**
   - After first deploy, Netlify provides a domain (e.g., `https://yeahrent-123abc.netlify.app`)

2. **Configure Stripe Webhook**
   - Go to Stripe Dashboard → Webhooks
   - Click "Add endpoint"
   - URL: `https://your-netlify-domain/api/webhooks/stripe`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
   - Click "Add endpoint"
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Update Environment Variables**
   - Add webhook secret to Netlify environment
   - Redeploy site

## Database Backups

### Supabase Automatic Backups

- Free tier: Automatic backups (7 days retention)
- Pro tier: Configurable retention (30+ days)
- Always enable backups in Supabase settings

### Manual Backup

```bash
# Export database from Supabase CLI
supabase db pull

# This creates local schema and seed files
```

## Performance Optimization

### Next.js Build Optimization

- Automatic code splitting
- Image optimization via Netlify
- CSS minification
- JavaScript compression

### Supabase Query Optimization

- Indexes created in `DATABASE_SCHEMA.sql`
- RLS policies optimize for common queries
- Consider caching with SWR

## Monitoring & Debugging

### Netlify Dashboard

- Site analytics
- Build logs (Site settings → Build history)
- Function logs (Netlify Functions)
- Network logs (Deploy log)

### Supabase Dashboard

- Query performance (SQL Editor → Analyze)
- Auth logs (Authentication → Logs)
- Real-time activity (Monitoring)

### Error Tracking

Add error tracking service (optional):
- Sentry (https://sentry.io)
- LogRocket (https://logrocket.com)
- Vercel Analytics (if using Vercel)

## Rolling Back a Deployment

### Netlify

1. Go to Deploy history
2. Find the working deployment
3. Click "Publish deploy"

## Troubleshooting

### Build fails with "Cannot find module"

- Check `.env` variables are set in Netlify
- Ensure `package.json` has all dependencies
- Run `npm install` locally to test

### Database connection errors

- Verify `NEXT_PUBLIC_SUPABASE_URL` and keys
- Check Supabase project is active
- Test connection in local .env first

### Stripe webhook not working

- Verify webhook URL in Stripe dashboard
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe
- Review Netlify function logs for errors

### Images not loading

- Verify Supabase Storage bucket is public
- Check image URLs in database
- Test storage credentials

## Scaling Considerations (Future)

### When to upgrade

- Supabase: Pro tier when exceeding 200 concurrent connections
- Stripe: Already handles scaling automatically
- Netlify: Pro tier for custom domain + better build times

### Database optimization

- Add more indexes as query patterns emerge
- Archive old bookings/messages to separate table
- Consider read replicas for heavy traffic

## Security Checklist

- [ ] Environment variables not in git
- [ ] SUPABASE_SERVICE_ROLE_KEY only on server
- [ ] Stripe secret key never in client code
- [ ] CORS properly configured
- [ ] RLS policies enabled on all tables
- [ ] Webhook signing verified
- [ ] HTTPS only (Netlify enforces this)

## Domain Setup

### Add Custom Domain (Optional)

1. Buy domain (GoDaddy, Namecheap, etc.)
2. In Netlify: Domain management → Add custom domain
3. Update DNS records:
   - Point A record to Netlify IP
   - Or use CNAME pointing to Netlify domain
4. Wait for DNS propagation (can take 24-48 hours)

### Update API URLs

After setting custom domain:

```
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

Redeploy with new URL.

## Getting Help

- **Netlify Support**: https://app.netlify.com/support
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Support**: https://support.stripe.com
- **Next.js Docs**: https://nextjs.org/docs

---

**Deployment Date**: [Your date]  
**Status**: [Development/Staging/Production]
