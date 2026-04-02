# Vercel Postgres Setup Instructions

## Step 1: Create Postgres Database in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (ClearConsent)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name (e.g., "clearconsent-db")
7. Select your region (closest to users)
8. Click **Create**

## Step 2: Get Connection String

1. After creation, go to the **Settings** tab of your database
2. Copy the **Connection String** (starts with `postgres://...`)
3. Go to your project → **Settings** → **Environment Variables**
4. Add these variables:
   - `POSTGRES_URL` = (paste full connection string)
   - `POSTGRES_PRISMA_URL` = (Vercel provides this)
   - `POSTGRES_URL_NON_POOLING` = (Vercel provides this)

## Step 3: Run Database Schema

1. In Vercel Dashboard, go to your Postgres database
2. Click **Query** tab
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS consent_forms (
  id TEXT PRIMARY KEY,
  doctor_name TEXT NOT NULL,
  procedure_name TEXT NOT NULL,
  pdf_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS explainers (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  key_points TEXT NOT NULL,
  medical_terms TEXT NOT NULL,
  risk_data TEXT NOT NULL,
  questions TEXT NOT NULL,
  reading_level TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES consent_forms(id)
);

CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  passed INTEGER NOT NULL,
  score REAL NOT NULL,
  re_education_topics TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES consent_forms(id)
);
```

4. Click **Run Query**

## Step 4: Deploy

```bash
git add .
git commit -m "Add Vercel Postgres support"
git push
```

Vercel will automatically detect the environment variables and connect to your database!

## Verify It Works

1. Go to your deployed site
2. Upload a Word document (.docx)
3. Check Vercel logs - should see no database errors
4. In Vercel Dashboard → Database → Data, you should see records

## Local Development

Local development still uses SQLite (`clearconsent.db`). This keeps your local testing separate from production data.

To test with Postgres locally (optional):

1. Create `.env.local` file
2. Add: `POSTGRES_URL="your-connection-string"`
3. Add: `NODE_ENV="production"`
