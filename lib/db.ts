import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface ConsentForm {
  id: string;
  doctor_name: string;
  procedure_name: string;
  pdf_text: string;
  created_at?: string;
}

export interface Explainer {
  id: string;
  form_id: string;
  key_points: string;
  medical_terms: string;
  risk_data: string;
  questions: string;
  reading_level: string;
  created_at?: string;
}

export interface PatientSession {
  id: string;
  form_id: string;
  patient_name: string | null;
  started_at?: string;
  completed_at?: string | null;
  ip_address: string | null;
}

export interface VerificationRecord {
  id: string;
  session_id: string;
  answers: string;
  score: number;
  passed: number;
  re_education_topics?: string | null;
  verified_at?: string;
  ip_address: string | null;
}

export async function insertConsentForm(form: ConsentForm) {
  const { error } = await supabase.from('consent_forms').insert(form);
  if (error) throw error;
}

export async function getConsentForm(
  id: string,
): Promise<ConsentForm | undefined> {
  const { data, error } = await supabase
    .from('consent_forms')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

export async function insertExplainer(explainer: Explainer) {
  const { error } = await supabase.from('explainers').insert(explainer);
  if (error) throw error;
}

export async function getExplainerByFormId(
  formId: string,
): Promise<Explainer | undefined> {
  const { data, error } = await supabase
    .from('explainers')
    .select('*')
    .eq('form_id', formId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

export async function insertPatientSession(session: PatientSession) {
  const { error } = await supabase.from('patient_sessions').insert(session);
  if (error) throw error;
}

export async function getPatientSession(
  id: string,
): Promise<PatientSession | undefined> {
  const { data, error } = await supabase
    .from('patient_sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

export async function updatePatientName(sessionId: string, name: string) {
  const { error } = await supabase
    .from('patient_sessions')
    .update({ patient_name: name })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function completeSession(sessionId: string) {
  const { error } = await supabase
    .from('patient_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function insertVerification(record: VerificationRecord) {
  const { error } = await supabase.from('verification_records').insert(record);
  if (error) throw error;
}

export async function getVerificationBySession(
  sessionId: string,
): Promise<VerificationRecord | undefined> {
  const { data, error } = await supabase
    .from('verification_records')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

export async function getVerificationById(
  id: string,
): Promise<VerificationRecord | undefined> {
  const { data, error } = await supabase
    .from('verification_records')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || undefined;
}

export async function getDb() {
  return null;
}
