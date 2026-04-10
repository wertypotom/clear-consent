import OpenAI from 'openai';
import { shuffleQuizOptions } from './shuffleQuiz';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({ apiKey });

export interface KeyPoint {
  title: string;
  explanation: string;
  analogy: string;
  icon: string;
}

export interface MedicalTerm {
  term: string;
  definition: string;
  simpleAnalogy: string;
}

export interface RiskItem {
  name: string;
  likelihood: 'rare' | 'uncommon' | 'common';
  likelihoodPercent: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface QuizQuestion {
  id: number;
  scenario: string;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

export interface ExplainerContent {
  keyPoints: KeyPoint[];
  medicalTerms: MedicalTerm[];
  risks: RiskItem[];
  questions: QuizQuestion[];
}

const SHARED_RULES = `Write at a 6th-grade reading level (age 11-12).
Use simple analogies from everyday life.
Be empathetic and reassuring (but honest).
NO medical jargon unless absolutely necessary.
Only use data/percentages that appear explicitly in the source text.
Respond ONLY with valid JSON — no markdown, no explanation.`;

async function generateKeyPoints(
  procedureName: string,
  pdfText: string,
): Promise<KeyPoint[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a medical education AI. ${SHARED_RULES}
        
Generate 5-7 key points covering: what's being done, why it's needed, how it works, what to expect, recovery.

Respond with: { "keyPoints": [ { "title": string, "explanation": string, "analogy": string, "icon": string } ] }`,
      },
      {
        role: 'user',
        content: `PROCEDURE: ${procedureName}\n\nCONSENT FORM:\n${pdfText.substring(0, 8000)}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.keyPoints;
}

async function generateMedicalTerms(
  procedureName: string,
  pdfText: string,
): Promise<MedicalTerm[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a medical education AI. ${SHARED_RULES}

Extract EVERY medical or technical term from the consent form that a 6th grader wouldn't know.
Include terms like: sedation, biopsy, cauterization, polyps, etc.

Respond with: { "medicalTerms": [ { "term": string, "definition": string, "simpleAnalogy": string } ] }`,
      },
      {
        role: 'user',
        content: `PROCEDURE: ${procedureName}\n\nCONSENT FORM:\n${pdfText.substring(0, 8000)}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.medicalTerms;
}

async function generateRisks(
  procedureName: string,
  pdfText: string,
): Promise<RiskItem[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a medical education AI. ${SHARED_RULES}

Extract EVERY SINGLE risk mentioned in the consent form, no matter how rare.
- likelihood: ONLY use "rare" | "uncommon" | "common" based on the PDF's language
- likelihoodPercent: ONLY include if the PDF states the percentage explicitly
- severity: "low" | "medium" | "high" based on PDF description

Respond with: { "risks": [ { "name": string, "likelihood": string, "severity": string, "description": string } ] }
Omit "likelihoodPercent" if not stated in the source.`,
      },
      {
        role: 'user',
        content: `PROCEDURE: ${procedureName}\n\nCONSENT FORM:\n${pdfText.substring(0, 8000)}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.risks;
}

async function generateQuestions(
  procedureName: string,
  pdfText: string,
): Promise<QuizQuestion[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a medical education AI. ${SHARED_RULES}

Generate exactly 7 scenario-based questions that test REAL understanding of:
1. Why they need this procedure
2. What the procedure will actually do
3. The biggest/most common risk
4. What alternatives exist
5. What recovery will be like
6. Warning signs after surgery
7. That they understand they're making an informed choice

Each question must be scenario-based (not textbook), use simple language, be completely serious.
Each question must have exactly 4 options (a, b, c, d).

Respond with: { "questions": [ { "id": number, "scenario": string, "question": string, "options": [{"id": string, "text": string}], "correctId": string, "explanation": string } ] }`,
      },
      {
        role: 'user',
        content: `PROCEDURE: ${procedureName}\n\nCONSENT FORM:\n${pdfText.substring(0, 8000)}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.questions;
}

export async function generateExplainer(
  procedureName: string,
  pdfText: string,
): Promise<ExplainerContent> {
  const start = Date.now();

  const [keyPoints, medicalTerms, risks, questions] = await Promise.all([
    generateKeyPoints(procedureName, pdfText),
    generateMedicalTerms(procedureName, pdfText),
    generateRisks(procedureName, pdfText),
    generateQuestions(procedureName, pdfText),
  ]);

  console.log(
    `[generateExplainer] All agents completed in ${Date.now() - start}ms`,
  );

  return {
    keyPoints,
    medicalTerms,
    risks,
    questions: shuffleQuizOptions(questions),
  };
}

export async function explainTerm(
  term: string,
  procedureContext: string,
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a medical educator. Explain medical terms in simple, 6th-grade language with helpful analogies. Be reassuring and clear. Keep explanations to 2-3 sentences.`,
      },
      {
        role: 'user',
        content: `Term: "${term}"\nContext: ${procedureContext}\n\nProvide a simple definition and a real-world analogy.`,
      },
    ],
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI API');
  return content;
}
