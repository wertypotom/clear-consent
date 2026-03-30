import axios from 'axios';
import { shuffleQuizOptions } from './shuffleQuiz';

const apiKey = process.env.ABACUS_API_KEY;
const apiUrl = process.env.ABACUS_API_URL;

if (!apiKey || !apiUrl) {
  throw new Error(
    'ABACUS_API_KEY and ABACUS_API_URL environment variables are required',
  );
}

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
  relatedKeyPoint: number;
}

export interface ExplainerContent {
  keyPoints: KeyPoint[];
  medicalTerms: MedicalTerm[];
  risks: RiskItem[];
  questions: QuizQuestion[];
}

export async function generateExplainer(
  procedureName: string,
  pdfText: string,
): Promise<ExplainerContent> {
  const systemPrompt = `You are a medical education AI. Your job is to help patients TRULY UNDERSTAND their surgical consent form.

CRITICAL RULES:
1. Write at a 6th-grade reading level (age 11-12)
2. Use simple analogies from everyday life
3. Be empathetic and reassuring (but honest about risks)
4. NO medical jargon unless absolutely necessary (and then explain it)
5. Make it interactive but SERIOUS - this is about their health decision
6. **EXTRACT EVERYTHING** - Do not summarize or filter. Include ALL risks mentioned.
7. **NO FABRICATED DATA** - Only use percentages/statistics if they appear in the source PDF. If not stated, use "rare/uncommon/common" based on the PDF's language.
8. **ALL MEDICAL TERMS** - Extract every medical/technical term from the PDF that a 6th grader wouldn't know (rectum, polyps, cauterization, sedation, biopsy, etc.)

CRITICAL: Generate exactly 7 COMPREHENSIVE questions that test real understanding of:
1. Why they need this procedure
2. What the procedure will actually do
3. The biggest/most common risk
4. What alternatives exist
5. What recovery will be like
6. Warning signs after surgery
7. That they understand they're making an informed choice

Each question must be scenario-based (not textbook), use simple language, but be completely serious.

You MUST respond with valid JSON in this exact structure:

{
  "keyPoints": [ 
    // 5-7 key points covering: what's being done, why it's needed, how it works, what to expect, recovery
    {
      "title": "What's Being Done?",
      "explanation": "Simple 2-3 sentence explanation using ONLY words a 6th grader knows",
      "analogy": "Like using aspirin to make a headache go away, but for your [body part]",
      "icon": "🏥"
    }
  ],
  "medicalTerms": [
    // EVERY medical/technical term from the PDF that appears in keyPoints or risks
    // Only include terms if they're actually used in the content you generated
    {
      "term": "Sedation",
      "definition": "Medicine that makes you relaxed and sleepy during the procedure",
      "simpleAnalogy": "Like taking a nap while someone fixes your car"
    }
  ],
  "risks": [
    // **EVERY SINGLE RISK** mentioned in the PDF, no matter how rare
    // Use likelihood exactly as described in PDF, or infer from words like "rare", "uncommon", "possible"
    {
      "name": "Infection",
      "likelihood": "rare",  // ONLY use rare/uncommon/common - DO NOT fabricate percentages
      "likelihoodPercent": 2,  // ONLY include if PDF states the percentage explicitly
      "severity": "medium",  // low/medium/high based on PDF description
      "description": "Germs can get into your body and make you sick, but this doesn't happen often"
    }
  ],
  "questions": [
    {
      "id": 1,
      "scenario": "You're explaining to your family why you decided to get this procedure...",
      "question": "What's the main reason you chose to go ahead with this?",
      "options": [
        { "id": "a", "text": "Plausible but incorrect answer" },
        { "id": "b", "text": "Correct answer based on procedure purpose" },
        { "id": "c", "text": "Plausible but incorrect" },
        { "id": "d", "text": "Clearly wrong answer" }
      ],
      "correctId": "b",
      "explanation": "Clear explanation of why B is correct and why it matters",
      "relatedKeyPoint": 0  // index of the key point this tests
    }
  ]
}

IMPORTANT: 
- If PDF doesn't give percentages for risks, DO NOT include "likelihoodPercent" field
- Include EVERY risk mentioned, even very rare ones
- Medical terms should ONLY be ones that appear in your generated content`;

  const userPrompt = `PROCEDURE: ${procedureName}

CONSENT FORM TEXT:
${pdfText.substring(0, 8000)}

Generate comprehensive patient education content with exactly 7 questions that thoroughly test understanding of all critical aspects: procedure purpose, risks, alternatives, recovery, and informed decision-making. 

CRITICAL REQUIREMENTS:
1. Extract EVERY risk listed in the document above
2. ONLY include percentage numbers if they appear in the text above
3. Extract ALL medical/technical terms that a 6th grader wouldn't understand
4. Make questions serious but use simple language
5. Do not summarize or filter - be comprehensive`;

  try {
    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const content = response.data.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from Abacus API');
    }

    const parsed = JSON.parse(content);

    // Shuffle quiz options to prevent pattern-matching (correct answer always being B)
    if (parsed.questions) {
      parsed.questions = shuffleQuizOptions(parsed.questions);
    }

    return parsed;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Abacus API error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
}

export async function explainTerm(
  term: string,
  procedureContext: string,
): Promise<string> {
  const systemPrompt = `You are a medical educator. Explain medical terms in simple, 6th-grade language with helpful analogies. Be reassuring and clear. Keep explanations to 2-3 sentences.`;

  const userPrompt = `Explain this medical term:

Term: "${term}"
Context: ${procedureContext}

Provide a simple definition and a real-world analogy.`;

  try {
    const response = await axios.post(
      `${apiUrl}/chat/completions`,
      {
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const content = response.data.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from Abacus API');
    }

    return content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Abacus API error:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw error;
  }
}
