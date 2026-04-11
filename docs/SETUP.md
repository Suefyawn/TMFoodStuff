# 🛠️ Local Development Setup Guide

> **Note (2026):** The production app uses **Supabase (Postgres)** and the **custom `/dashboard` admin**, not Payload or MongoDB. For current env vars and commands, start with the root [README.md](../README.md). The sections below are **legacy** and kept only for historical reference.

This guide walks you through setting up TMFoodStuff on your local machine from scratch. Follow each step carefully.

---

## Prerequisites

### 1. Node.js (v18 or higher)

TMFoodStuff requires Node.js 18+. To check your current version:

```bash
node --version
```

If you're below v18 or don't have Node installed, download it from [https://nodejs.org](https://nodejs.org). Choose the **LTS** version. On Windows, run the installer. On macOS/Linux, use `nvm` (Node Version Manager) for easier version management:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Git

Make sure Git is installed. Check with:

```bash
git --version
```

Download from [https://git-scm.com](https://git-scm.com) if needed.

### 3. MongoDB Atlas Account (Free Tier)

TMFoodStuff uses MongoDB Atlas as its database. Here's how to set it up:

**Step 1:** Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and click **Try Free**.

**Step 2:** Create your account with email/Google. Verify your email.

**Step 3:** Once logged in, click **Build a Database**.

**Step 4:** Choose **M0 (Free)** tier. Select your preferred cloud provider (AWS recommended) and a region close to you (e.g., `eu-west-1` for UAE/Middle East).

**Step 5:** Give your cluster a name (e.g., `tmfoodstuff-cluster`) and click **Create Cluster**. This takes 1–3 minutes.

**Step 6:** You'll be prompted to create a **database user**:
- Username: `tmfoodstuff`
- Password: Generate a secure password and **save it** — you'll need it in your `.env`
- Click **Create User**

**Step 7:** Under **Where would you like to connect from?**, select **My Local Environment**. Add your current IP address by clicking **Add My Current IP Address**, then click **Finish and Close**.

**Step 8:** On the cluster overview page, click **Connect** → **Drivers** → select **Node.js** as the driver.

**Step 9:** Copy the connection string. It will look like:
```
mongodb+srv://tmfoodstuff:<password>@tmfoodstuff-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual password and add the database name before `?`:
```
mongodb+srv://tmfoodstuff:yourpassword@tmfoodstuff-cluster.xxxxx.mongodb.net/tmfoodstuff?retryWrites=true&w=majority
```

This is your `MONGODB_URI`.

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Suefyawn/TMFoodStuff.git
cd TMFoodStuff
```

### 2. Install Dependencies

Navigate to the `app` directory and install all packages:

```bash
cd app
npm install
```

This installs Next.js 14, Payload CMS 2.x, Tailwind CSS, and all other dependencies. It may take 2–5 minutes.

---

## Environment Configuration

### 1. Copy the Example .env File

```bash
cp .env.example .env
```

### 2. Edit Your .env File

Open `.env` in your editor and fill in the values:

```env
MONGODB_URI=mongodb+srv://tmfoodstuff:yourpassword@cluster.mongodb.net/tmfoodstuff?retryWrites=true&w=majority
PAYLOAD_SECRET=your-super-secret-key-here
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

### 3. Generate a Secure PAYLOAD_SECRET

The `PAYLOAD_SECRET` must be at least 32 characters. Generate one using Node.js:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `PAYLOAD_SECRET`. This key is used to sign JWTs and encrypt sensitive data — **never commit it to Git** and **never share it**.

---

## Running the Development Server

From the `app` directory:

```bash
npm run dev
```

You should see output like:

```
▲ Next.js 14.2.5
- Local: http://localhost:3000
- Network: http://192.168.x.x:3000
✓ Ready in 3.2s
```

Open your browser and visit:

- **Storefront:** [http://localhost:3000](http://localhost:3000)
- **Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Setting Up the Admin Panel

### 1. Create Your First Admin User

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin).

On first visit, Payload CMS will prompt you to create the first admin user (this is a Customers collection user with admin access):

- **Email:** your@email.com
- **Password:** choose a strong password
- **Name:** Your Name

Click **Create** and you'll be taken to the admin dashboard.

### 2. Explore the Admin Dashboard

The left sidebar shows all your collections:
- **Products** — where you manage your product catalog
- **Categories** — product categories (Fruits, Vegetables, etc.)
- **Orders** — customer orders
- **Customers** — registered customer accounts
- **Media** — uploaded images

---

## Adding Your First Category

1. In the admin panel, click **Categories** in the sidebar
2. Click **Create New**
3. Fill in:
   - **Name:** Fruits
   - **Name (Arabic):** فواكه
   - **Slug:** fruits
   - **Emoji:** 🍎
4. Click **Save**

Repeat for other categories: Vegetables (🥦), Organic (🌱), Exotic (🥭), Juices (🧃), Gift Baskets (🧺).

---

## Adding Your First Product

1. In the admin panel, click **Products** in the sidebar
2. Click **Create New**
3. Fill in:
   - **Name:** Red Apple
   - **Slug:** red-apple
   - **Category:** Select "Fruits" from the dropdown
   - **Price (AED):** 12
   - **Unit:** kg
   - **Stock:** 100
   - **Is Active:** ✓ checked
4. Optionally upload an image via the **Images** array field
5. Click **Save**

The product will now appear in your storefront's shop page once you wire up the API calls from Payload to your Next.js pages.

---

## Common Issues

**Port 3000 already in use:**
```bash
# Find what's using port 3000
npx kill-port 3000
npm run dev
```

**MongoDB connection error:**
- Double-check your `MONGODB_URI` in `.env`
- Ensure your IP is whitelisted in Atlas Network Access
- Make sure the Atlas cluster is running (not paused)

**Payload admin not loading:**
- Clear your browser cache
- Check that `PAYLOAD_SECRET` is set and at least 32 chars
- Check terminal logs for specific errors

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```
