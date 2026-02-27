/**
 * Database adapter for Vercel Postgres
 * Use this in production instead of SQLite
 *
 * Setup instructions:
 * 1. Go to Vercel Dashboard → Storage → Create Database → Postgres
 * 2. Copy connection string to .env: POSTGRES_URL="..."
 * 3. Run migrations (see schema below)
 * 4. Update lib/db.ts to use this in production
 */

import { sql } from '@vercel/postgres';

export interface ConsentForm {
  id: string;
  doctor_name: string;
  procedure_name: string;
  pdf_text: string;
  created_at: string;
}

export interface Explainer {
  id: string;
  form_id: string;
  key_points: string;
  medical_terms: string;
  risk_data: string;
  questions: string;
  reading_level: string;
  created_at: string;
}

export interface Verification {
  id: string;
  form_id: string;
  patient_name: string;
  passed: number;
  score: number;
  re_education_topics: string | null;
  created_at: string;
}

// Create tables (run once in Vercel Postgres SQL editor)
export const SCHEMA = `
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
`;

export async function insertConsentForm(data: ConsentForm) {
  await sql`
    INSERT INTO consent_forms (id, doctor_name, procedure_name, pdf_text, created_at)
    VALUES (${data.id}, ${data.doctor_name}, ${data.procedure_name}, ${data.pdf_text}, ${data.created_at})
  `;
}

export async function insertExplainer(data: Explainer) {
  await sql`
    INSERT INTO explainers (id, form_id, key_points, medical_terms, risk_data, questions, reading_level, created_at)
    VALUES (${data.id}, ${data.form_id}, ${data.key_points}, ${data.medical_terms}, ${data.risk_data}, ${data.questions}, ${data.reading_level}, ${data.created_at})
  `;
}

export async function getExplainerByFormId(
  formId: string,
): Promise<Explainer | null> {
  const result = await sql`
    SELECT * FROM explainers WHERE form_id = ${formId} LIMIT 1
  `;
  return (result.rows[0] as Explainer) || null;
}

export async function insertVerification(data: Verification) {
  await sql`
    INSERT INTO verifications (id, form_id, patient_name, passed, score, re_education_topics, created_at)
    VALUES (${data.id}, ${data.form_id}, ${data.patient_name}, ${data.passed}, ${data.score}, ${data.re_education_topics}, ${data.created_at})
  `;
}

export async function getVerificationById(
  id: string,
): Promise<Verification | null> {
  const result = await sql`
    SELECT * FROM verifications WHERE id = ${id} LIMIT 1
  `;
  return (result.rows[0] as Verification) || null;
}
