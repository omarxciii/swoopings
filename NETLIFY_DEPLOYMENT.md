# Netlify Deployment Guide

## Prerequisites
- GitHub account with your repo pushed
- Netlify account (free tier is fine for testing)
- Supabase project URL and anon key
- Stripe public key

---

## Step 1: Prepare Your Git Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Phase 5.5b: Calendar UX improvements with brand colors"
git push origin main
```

---

## Step 2: Connect GitHub to Netlify

1. Go to https://netlify.com
2. Click **"Sign up"** or **"Log in"**
3. Click **"Connect to Git"**
4. Choose **"GitHub"**
5. Authorize Netlify to access your GitHub account
6. Select your repository (`yeahrent`)

---

## Step 3: Configure Build Settings

Netlify should auto-detect:
- **Build command**: `npm run build`
- **Publish directory**: `.next`

If not, set them manually:
1. Under **Build & deploy** → **Build settings**
2. Set:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

---

## Step 4: Add Environment Variables

Netlify needs the same env variables as local:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Click **"Edit variables"**
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-supabase-anon-key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your-stripe-public-key]
STRIPE_SECRET_KEY=[your-stripe-secret-key]
```

**Where to get these**:
- Supabase: Project Settings → API → URL and anon key
- Stripe: Developers → API keys → Publishable and Secret keys

---

## Step 5: Deploy

1. Click **"Deploy site"** button
2. Netlify will:
   - Clone your repo
   - Install dependencies
   - Run `npm run build`
   - Deploy to Netlify CDN

3. Wait for build to complete (usually 2-3 minutes)

---

## Step 6: Verify Deployment

Once deployed:
1. You'll get a Netlify URL like: `https://xxxx-xxxxx.netlify.app`
2. Click the link to open your live site
3. Test functionality:
   - Sign in
   - Browse listings
   - View calendar with availability
   - Try booking flow (payment will be in test mode with Stripe keys)

---

## Troubleshooting

### Build Fails
**Check build logs**:
1. Go to **Deploys** tab
2. Click failed deploy
3. Click **"Deploy log"** to see errors
4. Common issues:
   - Missing environment variables → Add to Netlify
   - TypeScript errors → Fix locally and push
   - Missing dependencies → Check package.json

### Environment Variables Not Working
- Make sure variables don't have quotes around values
- Netlify shows them as `****` for security (this is normal)
- Redeploy after adding variables

### Database Connection Issues
- Verify Supabase URL is correct (no trailing slash)
- Check anon key is for correct project
- Make sure RLS policies allow public reads where needed

---

## Testing Payment Flow on Netlify

Use Stripe test card:
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

This won't charge anything - it's test mode.

---

## Continuous Deployment

After first deploy, Netlify automatically redeploys when you push to `main`:

1. Make code changes locally
2. Test with `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Feature: [description]"
   git push origin main
   ```
4. Netlify automatically builds and deploys
5. Check **Deploys** tab to see build progress

---

## Custom Domain (Optional)

After testing:
1. Go to **Site settings** → **Domain management**
2. Add custom domain
3. Follow Netlify's DNS instructions

---

## Next Steps After Deploying

Once live:
1. ✅ Test entire booking flow on mobile
2. ✅ Test calendar with different availability settings
3. ✅ Create test bookings and verify conflict detection
4. ✅ Test blackout dates UI (Phase 5.5c)
5. ✅ Test QR handover (Phase 5.6) when ready

---

## Important Notes

**Free Tier Limits**:
- 300 minutes of build time/month (plenty for dev)
- Unlimited deploys
- Automatic SSL certificate
- No cold starts for serverless functions

**Production Checklist** (when ready):
- [ ] Test all features thoroughly
- [ ] Enable password login security
- [ ] Set up Stripe live keys (not test)
- [ ] Configure backup database
- [ ] Set up monitoring/error tracking
- [ ] Create privacy policy and terms
- [ ] Test on multiple browsers/devices

---

## Rollback (If Needed)

If deployment breaks:
1. Go to **Deploys** tab
2. Click a previous working deploy
3. Click **"Publish deploy"**
4. Reverts to that version immediately

No need to rebuild or push - just restore!

---

## Useful Netlify Links

- Dashboard: https://app.netlify.com
- Docs: https://docs.netlify.com
- Build troubleshooting: https://docs.netlify.com/configure-builds/common-configurations/
- Next.js + Netlify: https://docs.netlify.com/integrations/frameworks/next-js/
