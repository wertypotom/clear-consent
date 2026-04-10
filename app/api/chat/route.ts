import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { searchDocumentSections, getConsentForm, insertChatMessage } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

const MAX_INPUT_LENGTH = 1200;

const HARMFUL_PATTERNS = [
  /\b(how to|ways to|help me)\s+(kill|murder|hurt|poison)\b/i,
  /\b(make|build|create)\s+(a\s+)?(bomb|explosive|weapon)\b/i,
  /\bself[-\s]?harm\b/i,
  /\bsuicide\b/i,
  /\boverdose\b/i,
];

const JAILBREAK_PATTERNS = [
  /\bignore\b.{0,30}\b(instruction|prompt|rule|policy)\b/i,
  /\b(system prompt|developer message)\b/i,
  /\bpretend you are\b/i,
  /\bjailbreak\b/i,
];

const OFF_TOPIC_KEYWORDS = [
  'crypto',
  'bitcoin',
  'stocks',
  'trading',
  'sports',
  'football',
  'nba',
  'movie',
  'movies',
  'gaming',
  'politics',
  'election',
  'weather',
  'recipe',
  'travel',
  'dating',
  'celebrity',
];

const MEDICAL_CONTEXT_KEYWORDS = [
  'consent',
  'procedure',
  'surgery',
  'operation',
  'risk',
  'doctor',
  'patient',
  'recovery',
  'symptom',
  'medicine',
  'medication',
  'anesthesia',
  'treatment',
  'infection',
  'pain',
  'bleeding',
  'complication',
  'hospital',
];

function containsPattern(input: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(input));
}

function containsKeyword(input: string, keywords: string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

function getGuardrailResponse(message: string) {
  const normalized = message.trim().toLowerCase();

  if (!normalized) {
    return {
      blocked: true,
      status: 400,
      reply: 'Please type a question so I can help.',
    };
  }

  if (normalized.length > MAX_INPUT_LENGTH) {
    return {
      blocked: true,
      status: 400,
      reply:
        'Your message is too long. Please shorten it to one specific question about your procedure or consent form.',
    };
  }

  if (containsPattern(normalized, HARMFUL_PATTERNS)) {
    return {
      blocked: true,
      status: 200,
      reply:
        'I cannot help with harmful requests. If this is an emergency or you might hurt yourself or others, call emergency services immediately and contact a trusted professional right now.',
    };
  }

  if (containsPattern(normalized, JAILBREAK_PATTERNS)) {
    return {
      blocked: true,
      status: 200,
      reply:
        'I can only help with questions about your medical consent and procedure. Please ask a consent-related question.',
    };
  }

  const hasOffTopicSignal = containsKeyword(normalized, OFF_TOPIC_KEYWORDS);
  const hasMedicalSignal = containsKeyword(normalized, MEDICAL_CONTEXT_KEYWORDS);
  if (hasOffTopicSignal && !hasMedicalSignal) {
    return {
      blocked: true,
      status: 200,
      reply:
        'I am focused on your consent form and procedure. Please ask about your risks, recovery, alternatives, or medical terms in your document.',
    };
  }

  return { blocked: false, status: 200, reply: '' };
}

export async function POST(req: NextRequest) {
  try {
    const { messages, formId, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages', { status: 400 });
    }

    const lastMessage = messages[messages.length - 1]?.content;
    if (typeof lastMessage !== 'string') {
      return new Response('Invalid message format', { status: 400 });
    }

    const guardrail = getGuardrailResponse(lastMessage);
    if (guardrail.blocked) {
      if (sessionId) {
        await insertChatMessage({
          session_id: sessionId,
          role: 'assistant',
          content: guardrail.reply,
        }).catch((err) =>
          console.error('Failed to log guardrail assistant message:', err),
        );
      }

      return new Response(guardrail.reply, {
        status: guardrail.status,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    if (sessionId) {
      await insertChatMessage({
        session_id: sessionId,
        role: 'user',
        content: lastMessage,
      }).catch((err) => console.error('Failed to log user message:', err));
    }

    let context = '';
    let procedureName = 'the procedure';

    if (formId) {
      try {
        const form = await getConsentForm(formId);
        if (form) procedureName = form.procedure_name;

        const queryEmbedding = await generateEmbedding(lastMessage);
        const matchedSections = await searchDocumentSections(
          formId,
          queryEmbedding,
          0.3, 
        );

        console.log(`[RAG Debug] Found ${matchedSections?.length || 0} sections for form ${formId}`);

        if (matchedSections && matchedSections.length > 0) {
          context = matchedSections.map((s) => s.content).join('\n\n---\n\n');
        } else {
          console.log(`[RAG Debug] No context found for query: "${lastMessage}"`);
        }
      } catch (err) {
        console.error('RAG Error:', err);
      }
    }

    
    const systemPrompt = `You are a helpful, professional medical assistant for ClearConsent. 
Your goal is to help patients understand their medical consent forms for "${procedureName}".

${context ? `RELEVANT DOCUMENT CONTEXT:
${context}

Use the context above to answer the patient's questions accurately. If the information is not in the context, be honest and advise them to speak with their doctor. 

IMPORTANT: If you use the context, briefly mention where in the document you found it (e.g. "According to the risks section...").` : 'Advise the patient to speak with their doctor for specific medical questions.'}

Tone: Calming, 6th-grade reading level. No formal medical advice or diagnoses. 
Keep answers concise and helpful.`;

    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      temperature: 0.7,
    });

    
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let assistantContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            assistantContent += content;
            controller.enqueue(encoder.encode(content));
          }
        }
        
   
        if (sessionId && assistantContent) {
          insertChatMessage({
            session_id: sessionId,
            role: 'assistant',
            content: assistantContent,
          }).catch((err) => console.error('Failed to log assistant message:', err));
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
