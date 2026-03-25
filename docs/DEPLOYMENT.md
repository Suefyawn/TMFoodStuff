# 🚀 Vercel Deployment Guide

This guide covers deploying TMFoodStuff to Vercel with a production MongoDB Atlas cluster.

---

## Step 1: Prepare MongoDB Atlas for Production

### 1. Create a Production Cluster

For production, upgrade from M0 (free) or create a new cluster:

1. Log into [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **Create** → choose **M10** (dedicated, ~$57/month) or stay on **M0** for initial launch
3. Select region closest to UAE: **eu-west-1 (Ireland)** or **me-south-1 (Bahrain)** if available
4. Name it: `tmfoodstuff-prod`

### 2. Create a Production Database User

1. Go to **Database Access** → **Add New Database User**
2. Username: `tmfoodstuff-prod`
3. Password: Generate with **Autogenerate Secure Password** — copy it
4. Database User Privileges: **Atlas Admin** (or **Read and write to any database**)
5. Click **Add User**

### 3. Whitelist Vercel IPs

Vercel uses dynamic IPs, so you need to allow all traffic:

1. Go to **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
3. Click **Confirm**

> ⚠️ For stricter security on paid plans, use Vercel's static IP feature and whitelist only those.

### 4. Get Your Production Connection String

1. Click **Connect** on your cluster → **Drivers** → Node.js
2. Copy the URI and format it:
```
mongodb+srv://tmfoodstuff-prod:YOURPASSWORD@tmfoodstuff-prod.xxxxx.mongodb.net/tmfoodstuff?retryWrites=true&w=majority&appName=tmfoodstuff-prod
```

---

## Step 2: Set Up Vercel

### 1. Install Vercel CLI (optional but useful)

```bash
npm install -g vercel
vercel login
```

### 2. Connect GitHub Repository

1. Go to [https://vercel.com](https://vercel.com) and log in (or sign up)
2. Click **Add New Project**
3. Click **Import Git Repository**
4. Select **GitHub** and authorize Vercel
5. Find `Suefyawn/TMFoodStuff` and click **Import**

### 3. Configure Build Settings

On the import screen, set:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Root Directory** | `app` |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (auto-detected) |
| **Install Command** | `npm install` |

Click **Root Directory** → type `app` → click **Continue**.

---

## Step 3: Set Environment Variables

On the Vercel project settings, go to **Settings** → **Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview, Development |
| `PAYLOAD_SECRET` | 64-char random hex string | Production, Preview, Development |
| `NEXT_PUBLIC_SERVER_URL` | `https://yourdomain.com` | Production |
| `NEXT_PUBLIC_SERVER_URL` | `https://tmfoodstuff.vercel.app` | Preview |

**Generate a production-strength PAYLOAD_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> ⚠️ Use a **different** `PAYLOAD_SECRET` in production than in development. Never reuse secrets across environments.

Click **Deploy** to trigger the first deployment.

---

## Step 4: Custom Domain Setup

### 1. Add Your Domain in Vercel

1. Go to your project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain: `tmfoodstuff.ae` or `www.tmfoodstuff.com`
4. Click **Add**

### 2. Update Your DNS

Vercel will show you DNS records to add. Depending on your domain registrar:

**For apex domain (tmfoodstuff.ae):**
- Add an **A record**: `@` → `76.76.21.21`

**For www subdomain:**
- Add a **CNAME record**: `www` → `cname.vercel-dns.com`

DNS propagation takes 5 minutes to 48 hours.

### 3. Update NEXT_PUBLIC_SERVER_URL

Once your custom domain is live, update the production environment variable:
```
NEXT_PUBLIC_SERVER_URL=https://www.tmfoodstuff.ae
```

Redeploy after updating env vars (Vercel → Deployments → Redeploy latest).

---

## Step 5: Post-Deploy Checklist

After your first successful deployment:

- [ ] Visit `https://yourdomain.com` — storefront loads
- [ ] Visit `https://yourdomain.com/admin` — Payload admin loads
- [ ] Create first admin user in production
- [ ] Add test category and product
- [ ] Test checkout form renders
- [ ] Test cart page renders
- [ ] Verify MongoDB Atlas shows connections under **Metrics** tab
- [ ] Set up Atlas **Database Triggers** for order email notifications (optional)
- [ ] Enable **Atlas Backup** for production data safety

---

## Redeployments

Every push to the `main` branch on GitHub automatically triggers a Vercel deployment. Preview branches get their own URL for testing.

To manually redeploy:
```bash
vercel --prod
```

Or trigger from the Vercel dashboard: **Deployments** → **...** → **Redeploy**.

---

## Monitoring

- **Vercel Analytics:** Enable in project settings for Core Web Vitals
- **MongoDB Atlas Monitoring:** Charts available under your cluster's **Metrics** tab
- **Error tracking:** Consider adding Sentry (`npm install @sentry/nextjs`) for production error monitoring
