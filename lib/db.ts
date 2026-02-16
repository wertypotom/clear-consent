import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'clearconsent.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS consent_forms (
      id TEXT PRIMARY KEY,
      doctor_name TEXT NOT NULL,
      procedure_name TEXT NOT NULL,
      pdf_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS explainers (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES consent_forms(id),
      key_points TEXT NOT NULL,       -- JSON array of plain-language points
      medical_terms TEXT NOT NULL,    -- JSON array of {term, definition}
      risk_data TEXT NOT NULL,        -- JSON for chart data
      questions TEXT NOT NULL,        -- JSON array of interactive questions
      reading_level TEXT DEFAULT '6th grade',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS patient_sessions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL REFERENCES consent_forms(id),
      patient_name TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      ip_address TEXT
    );

    CREATE TABLE IF NOT EXISTS verification_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES patient_sessions(id),
      answers TEXT NOT NULL,          -- JSON of patient answers
      score INTEGER NOT NULL,
      passed INTEGER NOT NULL,
      re_education_topics TEXT,       -- JSON array of topics that needed review
      verified_at TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address TEXT
    );
  `);
}

// --- Data Access ---

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

export interface PatientSession {
  id: string;
  form_id: string;
  patient_name: string | null;
  started_at: string;
  completed_at: string | null;
  ip_address: string | null;
}

export interface VerificationRecord {
  id: string;
  session_id: string;
  answers: string;
  score: number;
  passed: number;
  re_education_topics?: string | null;
  verified_at: string;
  ip_address: string | null;
}

export function insertConsentForm(form: ConsentForm) {
  const db = getDb();
  db.prepare(
    `INSERT INTO consent_forms (id, doctor_name, procedure_name, pdf_text, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  ).run(form.id, form.doctor_name, form.procedure_name, form.pdf_text);
}

export function getConsentForm(id: string): ConsentForm | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM consent_forms WHERE id = ?').get(id) as
    | ConsentForm
    | undefined;
}

export function insertExplainer(explainer: Explainer) {
  const db = getDb();
  db.prepare(
    `INSERT INTO explainers (id, form_id, key_points, medical_terms, risk_data, questions, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  ).run(
    explainer.id,
    explainer.form_id,
    explainer.key_points,
    explainer.medical_terms,
    explainer.risk_data,
    explainer.questions,
  );
}

export function getExplainerByFormId(formId: string): Explainer | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM explainers WHERE form_id = ?')
    .get(formId) as Explainer | undefined;
}

export function insertPatientSession(session: PatientSession) {
  const db = getDb();
  db.prepare(
    `INSERT INTO patient_sessions (id, form_id, patient_name, started_at, ip_address)
     VALUES (?, ?, ?, datetime('now'), ?)`,
  ).run(session.id, session.form_id, session.patient_name, session.ip_address);
}

export function getPatientSession(id: string): PatientSession | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM patient_sessions WHERE id = ?').get(id) as
    | PatientSession
    | undefined;
}

export function updatePatientName(sessionId: string, name: string) {
  const db = getDb();
  db.prepare('UPDATE patient_sessions SET patient_name = ? WHERE id = ?').run(
    name,
    sessionId,
  );
}

export function completeSession(sessionId: string) {
  const db = getDb();
  db.prepare(
    "UPDATE patient_sessions SET completed_at = datetime('now') WHERE id = ?",
  ).run(sessionId);
}

export function insertVerification(record: VerificationRecord) {
  const db = getDb();
  db.prepare(
    `INSERT INTO verification_records (id, session_id, answers, score, passed, re_education_topics, verified_at, ip_address)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
  ).run(
    record.id,
    record.session_id,
    record.answers,
    record.score,
    record.passed,
    record.re_education_topics || null,
    record.ip_address,
  );
}

export function getVerificationBySession(
  sessionId: string,
): VerificationRecord | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM verification_records WHERE session_id = ?')
    .get(sessionId) as VerificationRecord | undefined;
}
